import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { auditWearStats, auditFingerprint } from "./lib/auditWearStats.mjs";

const { values } = parseArgs({
  options: {
    table: { type: "string" },
    region: { type: "string", default: "ap-northeast-1" },
    input: { type: "string" },
    output: { type: "string" },
  },
});
if (!values.output || Boolean(values.table) === Boolean(values.input))
  throw new Error(
    "Use --table NAME or --input SNAPSHOT.json, and --output REPORT.json",
  );
let rows, source;
if (values.input) {
  rows = JSON.parse(await readFile(values.input, "utf8"));
  if (!Array.isArray(rows))
    throw new Error("Snapshot must be an array of unmarshalled DynamoDB items");
  source = { mode: "offline", input: values.input };
} else {
  const base = new DynamoDBClient({ region: values.region, maxAttempts: 1 });
  const client = DynamoDBDocumentClient.from(base);
  async function scan() {
    const result = [];
    let cursor;
    do {
      const page = await client.send(
        new ScanCommand({
          TableName: values.table,
          ConsistentRead: true,
          ExclusiveStartKey: cursor,
        }),
      );
      result.push(...(page.Items ?? []));
      cursor = page.LastEvaluatedKey;
    } while (cursor && Object.keys(cursor).length);
    return result;
  }
  try {
    const first = await scan();
    rows = await scan();
    if (auditFingerprint(first) !== auditFingerprint(rows))
      throw new Error(
        "Data changed between scans. Retry during a quiet period; no report was written.",
      );
    source = {
      mode: "live",
      table: values.table,
      region: values.region,
      matchingScans: 2,
      snapshotIsolation: false,
    };
  } finally {
    base.destroy();
  }
}
const report = {
  generatedAt: new Date().toISOString(),
  source,
  ...auditWearStats(rows),
};
await writeFile(values.output, JSON.stringify(report, null, 2) + "\n", {
  flag: "wx",
  mode: 0o600,
});
console.log(
  JSON.stringify({
    output: values.output,
    ...report.counts,
    correctionPlanReady: report.correctionPlanReady,
  }),
);
if (report.counts.differences || report.counts.problems) process.exitCode = 2;
