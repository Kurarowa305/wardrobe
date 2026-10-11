import { createAppError } from "../../core/errors/index.js";
/** A request-scoped budget. All I/O receives a real AbortSignal; no detached retry. */
export class WeatherBudget {
  readonly deadline: number;
  private dbRemaining = 5000;
  private externalRemaining = 4000;
  constructor(
    readonly now: () => number = Date.now,
    startedAt = now(),
  ) {
    this.deadline = startedAt + 10000;
  }
  remaining(): number {
    return this.deadline - this.now();
  }
  async run<T>(
    kind: "db" | "external" | "write",
    operation: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> {
    const start = this.now();
    const available = Math.min(
      this.remaining(),
      kind === "db"
        ? this.dbRemaining
        : kind === "external"
          ? this.externalRemaining
          : this.remaining(),
    );
    if (available <= 0)
      throw createAppError("SERVICE_UNAVAILABLE", {
        details: { reason: "DEADLINE_EXCEEDED" },
      });
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(
          createAppError("SERVICE_UNAVAILABLE", {
            details: { reason: "DEADLINE_EXCEEDED" },
          }),
        );
      }, available);
    });
    try {
      const result = await Promise.race([
        operation(controller.signal),
        timeout,
      ]);
      if (this.now() - start >= available) {
        controller.abort();
        throw createAppError("SERVICE_UNAVAILABLE", {
          details: { reason: "DEADLINE_EXCEEDED" },
        });
      }
      return result;
    } catch (error) {
      if (kind !== "external")
        throw createAppError("SERVICE_UNAVAILABLE", {
          details: { reason: "WEATHER_STORAGE_FAILED" },
          cause: error,
        });
      throw error;
    } finally {
      clearTimeout(timer!);
      const elapsed = this.now() - start;
      if (kind === "db") this.dbRemaining -= elapsed;
      if (kind === "external") this.externalRemaining -= elapsed;
    }
  }
  externalLeft(): number {
    return Math.min(this.externalRemaining, this.remaining());
  }
}
