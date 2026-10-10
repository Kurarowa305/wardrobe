import assert from "node:assert/strict";

// Only the expression subset used by these repositories is supported. Unknown syntax fails.
const tokensOf = (text) =>
  text.match(
    /attribute_not_exists|attribute_exists|if_not_exists|[#:A-Za-z_][\w:]*|>=|<=|<>|[()=,+<>-]/g,
  ) ?? [];
function expression(text, item, names = {}, values = {}) {
  const tokens = tokensOf(text);
  let position = 0;
  const take = (expected) => {
    assert.equal(tokens[position++], expected);
  };
  const atom = () => {
    const token = tokens[position++];
    if (token === "(") {
      const result = or();
      take(")");
      return result;
    }
    if (
      ["attribute_exists", "attribute_not_exists", "if_not_exists"].includes(
        token,
      )
    ) {
      take("(");
      const value = atom();
      if (token === "if_not_exists") {
        take(",");
        const fallback = atom();
        take(")");
        return value ?? fallback;
      }
      take(")");
      return token === "attribute_exists"
        ? value !== undefined
        : value === undefined;
    }
    assert.match(token, /^[#:A-Za-z_][\w:]*$/);
    return token.startsWith(":")
      ? values[token]
      : item?.[names[token] ?? token];
  };
  const sum = () => {
    let result = atom();
    while (["+", "-"].includes(tokens[position])) {
      const op = tokens[position++];
      const rhs = atom();
      result = op === "+" ? result + rhs : result - rhs;
    }
    return result;
  };
  const compare = () => {
    const lhs = sum();
    if (!["=", ">=", "<=", "<", ">", "<>"].includes(tokens[position]))
      return lhs;
    const op = tokens[position++];
    const rhs = sum();
    return {
      "=": () => lhs === rhs,
      ">=": () => lhs >= rhs,
      "<=": () => lhs <= rhs,
      "<": () => lhs < rhs,
      ">": () => lhs > rhs,
      "<>": () => lhs !== rhs,
    }[op]();
  };
  const and = () => {
    let result = compare();
    while (tokens[position] === "AND") {
      position++;
      const rhs = compare();
      result = result && rhs;
    }
    return result;
  };
  const or = () => {
    let result = and();
    while (tokens[position] === "OR") {
      position++;
      const rhs = and();
      result = result || rhs;
    }
    return result;
  };
  const result = or();
  assert.equal(position, tokens.length, `Unsupported expression: ${text}`);
  return result;
}
const keyOf = (item) => `${item.PK}|${item.SK}`;
export function createWearStatsStore() {
  let items = new Map();
  const calls = [];
  function apply(operation, input, state) {
    const key = keyOf(input.Key ?? input.Item);
    const old = state.get(key);
    if (
      input.ConditionExpression &&
      !expression(
        input.ConditionExpression,
        old,
        input.ExpressionAttributeNames,
        input.ExpressionAttributeValues,
      )
    ) {
      const error = new Error("ConditionalCheckFailed");
      error.name = "TransactionCanceledException";
      error.CancellationReasons = [{ Code: "ConditionalCheckFailed" }];
      throw error;
    }
    if (operation === "Put") state.set(key, structuredClone(input.Item));
    if (operation === "Delete") state.delete(key);
    if (operation === "Update") {
      assert.ok(input.UpdateExpression.startsWith("SET "));
      const next = { ...old, ...input.Key };
      const assignments =
        input.UpdateExpression.slice(4).split(/,(?![^()]*\))/);
      for (const assignment of assignments) {
        const [name, rhs] = assignment.split(" = ");
        next[input.ExpressionAttributeNames?.[name.trim()] ?? name.trim()] =
          expression(
            rhs,
            old,
            input.ExpressionAttributeNames,
            input.ExpressionAttributeValues,
          );
      }
      state.set(key, next);
    }
    return { Attributes: structuredClone(state.get(key)) };
  }
  return {
    calls,
    read: (key) => structuredClone(items.get(key)),
    seed: (item) => items.set(keyOf(item), structuredClone(item)),
    snapshot: () => structuredClone([...items.values()]),
    async send(command) {
      const input = command.input;
      calls.push(structuredClone(input));
      switch (command.constructor.name) {
        case "GetCommand":
          return { Item: structuredClone(items.get(keyOf(input.Key))) };
        case "BatchGetCommand":
          return {
            Responses: Object.fromEntries(
              Object.entries(input.RequestItems).map(([table, request]) => [
                table,
                request.Keys.map((key) =>
                  structuredClone(items.get(keyOf(key))),
                ).filter(Boolean),
              ]),
            ),
          };
        case "QueryCommand": {
          // Simulate an empty stale replica to catch missing strong consistency in recomputation.
          if (!input.ConsistentRead) return { Items: [] };
          const found = [...items.values()]
            .filter((item) =>
              expression(
                input.KeyConditionExpression,
                item,
                input.ExpressionAttributeNames,
                input.ExpressionAttributeValues,
              ),
            )
            .sort((a, b) => a.SK.localeCompare(b.SK));
          if (input.ScanIndexForward === false) found.reverse();
          return {
            Items: structuredClone(found.slice(0, input.Limit ?? found.length)),
          };
        }
        case "PutCommand":
          return apply("Put", input, items);
        case "UpdateCommand":
          return apply("Update", input, items);
        case "TransactWriteCommand": {
          const next = structuredClone(items);
          const keys = input.TransactItems.map((item) => {
            const op = Object.values(item)[0];
            return keyOf(op.Key ?? op.Item);
          });
          assert.equal(
            new Set(keys).size,
            keys.length,
            "Duplicate transaction key",
          );
          for (const [index, item] of input.TransactItems.entries()) {
            const [operation, value] = Object.entries(item)[0];
            try {
              apply(operation, value, next);
            } catch (error) {
              if (error.name === "TransactionCanceledException")
                error.CancellationReasons = input.TransactItems.map((_, i) => ({
                  Code: i === index ? "ConditionalCheckFailed" : "None",
                }));
              throw error;
            }
          }
          items = next;
          return {};
        }
        default:
          throw new Error(`Unsupported command: ${command.constructor.name}`);
      }
    },
  };
}
