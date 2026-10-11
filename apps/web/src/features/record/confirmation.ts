import type { RecommendedTemplate } from "@/api/schemas/home";
import { jstDate } from "@/features/home/controller";
export type ConfirmedRecordBody = {
  date: string;
  templateId: string;
  expectedTemplateRevision: number;
};
export type PendingRecord = {
  wardrobeId: string;
  operationId: string;
  body: ConfirmedRecordBody;
  template: RecommendedTemplate;
};
export type ConfirmationSnapshot = {
  open: boolean;
  template: RecommendedTemplate | null;
  date: string;
  phase: "editing" | "sending" | "unknown" | "stale";
  message:
    | "storage"
    | "invalidDate"
    | "failed"
    | "unknown"
    | "stale"
    | "deleted"
    | null;
};
type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type ConfirmationDependencies = {
  storage: () => StoragePort;
  create: (
    body: ConfirmedRecordBody,
    key: string,
  ) => Promise<{ historyId: string }>;
  refreshTemplate: (id: string) => Promise<RecommendedTemplate>;
  onSuccess: () => void;
  now?: () => Date;
  uuid?: () => string;
};
export const validRecordDate = (date: string) => {
  const parsed = Date.parse(`${date}T00:00:00Z`);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(parsed) &&
    new Date(parsed).toISOString().slice(0, 10) === date
  );
};
const iso = (date: string) =>
  `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
function pendingRecord(value: string, wardrobeId: string): PendingRecord {
  const p = JSON.parse(value) as PendingRecord;
  if (
    !p ||
    p.wardrobeId !== wardrobeId ||
    typeof p.operationId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      p.operationId,
    ) ||
    !p.body ||
    !validRecordDate(iso(p.body.date)) ||
    !Number.isSafeInteger(p.body.expectedTemplateRevision) ||
    p.body.expectedTemplateRevision < 0 ||
    !p.template ||
    p.template.templateId !== p.body.templateId ||
    p.template.revision !== p.body.expectedTemplateRevision ||
    typeof p.template.name !== "string" ||
    !Array.isArray(p.template.clothingItems)
  )
    throw Error("Invalid pending record");
  return p;
}
export class ConfirmationController {
  private snapshot: ConfirmationSnapshot = {
    open: false,
    template: null,
    date: "",
    phase: "editing",
    message: null,
  };
  private pending: PendingRecord | null = null;
  private blocked = false;
  private listeners = new Set<() => void>();
  private key: string;
  constructor(
    readonly wardrobeId: string,
    private readonly dependencies: ConfirmationDependencies,
  ) {
    this.key = `wardrobe:pending-record:${wardrobeId}`;
    try {
      const saved = dependencies.storage().getItem(this.key);
      if (saved) {
        this.pending = pendingRecord(saved, wardrobeId);
        this.snapshot = {
          open: true,
          template: this.pending.template,
          date: iso(this.pending.body.date),
          phase: "unknown",
          message: "unknown",
        };
      }
    } catch {
      this.blocked = true;
      this.snapshot.message = "storage";
    }
  }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(value: Partial<ConfirmationSnapshot>) {
    this.snapshot = { ...this.snapshot, ...value };
    this.listeners.forEach((listener) => listener());
  }
  open(template: RecommendedTemplate) {
    if (this.snapshot.phase === "sending") return;
    if (this.pending) {
      this.update({ open: true });
      return;
    }
    this.update({
      open: true,
      template: structuredClone(template),
      date: jstDate(this.dependencies.now?.() ?? new Date()),
      phase: "editing",
      message: this.blocked ? "storage" : null,
    });
  }
  close() {
    if (this.snapshot.phase !== "sending") this.update({ open: false });
  }
  setDate(date: string) {
    if (this.snapshot.phase === "editing" || this.snapshot.phase === "stale")
      this.update({ date });
  }
  async refresh() {
    if (!this.snapshot.template || this.snapshot.phase === "sending") return;
    const id = this.snapshot.template.templateId;
    this.update({ phase: "sending" });
    try {
      const template = await this.dependencies.refreshTemplate(id);
      this.update({ template, phase: "editing", message: "stale" });
    } catch {
      this.update({ phase: "stale", message: "stale" });
    }
  }
  async submit() {
    if (
      this.snapshot.phase === "sending" ||
      this.snapshot.phase === "stale" ||
      !this.snapshot.template ||
      this.blocked
    )
      return;
    if (!validRecordDate(this.snapshot.date)) {
      this.update({ message: "invalidDate" });
      return;
    }
    const operation = this.pending ?? {
      wardrobeId: this.wardrobeId,
      operationId: (this.dependencies.uuid ?? (() => crypto.randomUUID()))(),
      body: {
        date: this.snapshot.date.replaceAll("-", ""),
        templateId: this.snapshot.template.templateId,
        expectedTemplateRevision: this.snapshot.template.revision,
      },
      template: this.snapshot.template,
    };
    try {
      this.dependencies.storage().setItem(this.key, JSON.stringify(operation));
    } catch {
      this.update({ message: "storage" });
      return;
    }
    this.pending = operation;
    this.update({ phase: "sending", message: null });
    try {
      const result = await this.dependencies.create(
        operation.body,
        operation.operationId,
      );
      if (!result || typeof result.historyId !== "string" || !result.historyId)
        throw Error("Unconfirmed response");
    } catch (error) {
      const failure = error as {
        status?: number;
        details?: { reason?: string };
      };
      if (
        failure.status !== undefined &&
        failure.status >= 400 &&
        failure.status < 500
      ) {
        this.pending = null;
        try {
          this.dependencies.storage().removeItem(this.key);
        } catch {
          /* The durable key is safe to replay; never create another record under it. */
        }
        const stale = failure.details?.reason === "CONFIRMATION_STALE";
        this.update({
          phase: stale ? "stale" : "editing",
          message: stale
            ? "stale"
            : failure.details?.reason === "HISTORY_ALREADY_DELETED"
              ? "deleted"
              : "failed",
        });
        if (stale) await this.refresh();
      } else this.update({ phase: "unknown", message: "unknown" });
      return;
    }
    this.pending = null;
    try {
      this.dependencies.storage().removeItem(this.key);
    } catch {
      /* A restored successful key replays the existing history, not a duplicate. */
    }
    this.update({ open: false, phase: "editing", message: null });
    this.dependencies.onSuccess();
  }
}
