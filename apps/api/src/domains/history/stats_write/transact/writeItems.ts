import type { TransactWriteItem } from "../../../../clients/dynamodb.js";
import { createAppError } from "../../../../core/errors/index.js";

/** History is the first operation; subsequent operations protect daily counters and statistics. */
export async function writeHistoryStatsItems(
  items: TransactWriteItem[],
  write: (items: TransactWriteItem[]) => Promise<unknown>,
): Promise<void> {
  try {
    await write(items);
  } catch (error) {
    if (error && typeof error === "object") {
      const failure = error as { name?: string; CancellationReasons?: { Code?: string }[] };
      const reasons = failure.CancellationReasons ?? [];
      const statsConflict = failure.name === "TransactionCanceledException"
        && reasons.some((reason, index) => reason.Code === "TransactionConflict"
          || (index > 0 && reason.Code === "ConditionalCheckFailed"));
      if (failure.name === "TransactionConflictException" || statsConflict) {
        throw createAppError("CONFLICT", {
          message: "Wear statistics changed while recording. Reload and try again.",
          cause: error,
        });
      }
    }
    throw error;
  }
}
