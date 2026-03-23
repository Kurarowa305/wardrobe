import { createAppError, type AppError } from "../errors/index.js";

export type CursorDirection = "asc" | "desc";

export type CursorCriteria = Record<string, string | number | boolean | null>;

export type CursorPayload<TPosition extends CursorCriteria = CursorCriteria> = {
  version: 1;
  resource: string;
  order: CursorDirection;
  criteria: CursorCriteria;
  position: TPosition;
};

export type CursorEnvelope = {
  value: string;
};

export type EncodeCursorInput<TPosition extends CursorCriteria = CursorCriteria> = {
  resource: string;
  order: CursorDirection;
  criteria?: CursorCriteria | undefined;
  position: TPosition;
};

export type DecodeCursorExpected = {
  resource: string;
  order: CursorDirection;
  criteria?: CursorCriteria | undefined;
};

const CURSOR_VERSION = 1;

export function encodeCursor<TPosition extends CursorCriteria>(input: EncodeCursorInput<TPosition>): string {
  return Buffer.from(JSON.stringify(buildCursorPayload(input)), "utf8").toString("base64url");
}

export function decodeCursor<TPosition extends CursorCriteria = CursorCriteria>(
  cursor: string,
  expected: DecodeCursorExpected,
): CursorPayload<TPosition> {
  const payload = parseCursorPayload<TPosition>(cursor);

  assertCursorMatchesExpected(payload, expected);

  return payload;
}

export function createCursorEnvelope<TPosition extends CursorCriteria>(
  input: EncodeCursorInput<TPosition>,
): CursorEnvelope {
  return {
    value: encodeCursor(input),
  };
}

export function invalidCursor(details?: Record<string, unknown>): AppError {
  return createAppError("INVALID_CURSOR", {
    details,
  });
}

function buildCursorPayload<TPosition extends CursorCriteria>(
  input: EncodeCursorInput<TPosition>,
): CursorPayload<TPosition> {
  return {
    version: CURSOR_VERSION,
    resource: input.resource,
    order: input.order,
    criteria: normalizeCriteria(input.criteria),
    position: input.position,
  };
}

function parseCursorPayload<TPosition extends CursorCriteria>(cursor: string): CursorPayload<TPosition> {
  if (typeof cursor !== "string" || cursor.length === 0) {
    throw invalidCursor({ cursor: "missing" });
  }

  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as unknown;

    return assertCursorPayloadShape<TPosition>(parsed);
  } catch (error) {
    if (error instanceof Error && error.name === "AppError") {
      throw error;
    }

    throw invalidCursor({ cursor: "malformed" });
  }
}

function assertCursorPayloadShape<TPosition extends CursorCriteria>(value: unknown): CursorPayload<TPosition> {
  if (!isPlainObject(value)) {
    throw invalidCursor({ cursor: "payload must be an object" });
  }

  const version = value.version;
  const resource = value.resource;
  const order = value.order;
  const criteria = value.criteria;
  const position = value.position;

  if (version !== CURSOR_VERSION) {
    throw invalidCursor({ cursor: "unsupported version" });
  }

  if (typeof resource !== "string" || resource.length === 0) {
    throw invalidCursor({ cursor: "resource must be a non-empty string" });
  }

  if (order !== "asc" && order !== "desc") {
    throw invalidCursor({ cursor: "order must be asc or desc" });
  }

  if (!isCursorCriteria(criteria)) {
    throw invalidCursor({ cursor: "criteria must be a flat object" });
  }

  if (!isCursorCriteria(position)) {
    throw invalidCursor({ cursor: "position must be a flat object" });
  }

  return {
    version,
    resource,
    order,
    criteria,
    position: position as TPosition,
  };
}

function assertCursorMatchesExpected(
  payload: CursorPayload,
  expected: DecodeCursorExpected,
): void {
  if (payload.resource !== expected.resource) {
    throw invalidCursor({ resource: "mismatched" });
  }

  if (payload.order !== expected.order) {
    throw invalidCursor({ order: "mismatched" });
  }

  const normalizedExpectedCriteria = normalizeCriteria(expected.criteria);

  if (!areCriteriaEqual(payload.criteria, normalizedExpectedCriteria)) {
    throw invalidCursor({ criteria: "mismatched" });
  }
}

function normalizeCriteria(criteria: CursorCriteria | undefined): CursorCriteria {
  if (!criteria) {
    return {};
  }

  return Object.entries(criteria)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .reduce<CursorCriteria>((accumulator, [key, value]) => {
      accumulator[key] = value;
      return accumulator;
    }, {});
}

function areCriteriaEqual(left: CursorCriteria, right: CursorCriteria): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => right[key] === left[key]);
}

function isCursorCriteria(value: unknown): value is CursorCriteria {
  if (!isPlainObject(value)) {
    return false;
  }

  return Object.values(value).every(isCursorScalarValue);
}

function isCursorScalarValue(value: unknown): value is string | number | boolean | null {
  return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
