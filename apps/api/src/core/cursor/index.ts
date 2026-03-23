import { createAppError } from "../errors/index.js";

export type CursorPrimitive = string | number | boolean | null;
export type CursorFilterValue = CursorPrimitive | readonly CursorPrimitive[];
export type CursorFilters = Record<string, CursorFilterValue | undefined>;

export type CursorEnvelope<TPosition extends Record<string, CursorPrimitive> = Record<string, CursorPrimitive>> = {
  v: 1;
  resource: string;
  order: string;
  filters: Record<string, CursorFilterValue>;
  position: TPosition;
};

export type CursorContext = {
  resource: string;
  order: string;
  filters?: CursorFilters;
  requestId?: string | undefined;
};

export type DecodeCursorOptions = CursorContext & {
  cursor: string | null | undefined;
};

const CURSOR_VERSION = 1;
function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function isCursorPrimitive(value: unknown): value is CursorPrimitive {
  return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function isCursorFilterValue(value: unknown): value is CursorFilterValue {
  return isCursorPrimitive(value) || (Array.isArray(value) && value.every((item) => isCursorPrimitive(item)));
}

function normalizeFilters(filters: CursorFilters | undefined): Record<string, CursorFilterValue> {
  if (!filters) {
    return {};
  }

  const entries = Object.entries(filters)
    .filter((entry): entry is [string, CursorFilterValue] => entry[1] !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => [key, Array.isArray(value) ? [...value] : value] as const);

  return Object.fromEntries(entries);
}

function invalidCursor(details: Record<string, unknown>, requestId?: string) {
  return createAppError("INVALID_CURSOR", {
    requestId,
    details,
  });
}

function parseCursorEnvelope(cursor: string, requestId?: string): CursorEnvelope {
  if (!cursor) {
    throw invalidCursor({ cursor: "cursor is empty" }, requestId);
  }

  let decoded: string;
  try {
    decoded = fromBase64Url(cursor);
  } catch (error) {
    throw invalidCursor({ cursor: "cursor is malformed" }, requestId);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch (error) {
    throw invalidCursor({ cursor: "cursor payload is not valid JSON" }, requestId);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw invalidCursor({ cursor: "cursor payload must be an object" }, requestId);
  }

  const candidate = parsed as Record<string, unknown>;
  const { v, resource, order, filters, position } = candidate;

  if (v !== CURSOR_VERSION) {
    throw invalidCursor({ cursor: "cursor version is unsupported" }, requestId);
  }

  if (typeof resource !== "string" || resource.length === 0) {
    throw invalidCursor({ cursor: "cursor resource is invalid" }, requestId);
  }

  if (typeof order !== "string" || order.length === 0) {
    throw invalidCursor({ cursor: "cursor order is invalid" }, requestId);
  }

  if (!filters || typeof filters !== "object" || Array.isArray(filters)) {
    throw invalidCursor({ cursor: "cursor filters are invalid" }, requestId);
  }

  if (
    Object.values(filters).some((value) => !isCursorFilterValue(value))
  ) {
    throw invalidCursor({ cursor: "cursor filters include unsupported values" }, requestId);
  }

  if (!position || typeof position !== "object" || Array.isArray(position)) {
    throw invalidCursor({ cursor: "cursor position is invalid" }, requestId);
  }

  if (Object.values(position).some((value) => !isCursorPrimitive(value))) {
    throw invalidCursor({ cursor: "cursor position includes unsupported values" }, requestId);
  }

  return {
    v: CURSOR_VERSION,
    resource,
    order,
    filters: normalizeFilters(filters as CursorFilters),
    position: position as Record<string, CursorPrimitive>,
  };
}

export function encodeCursor<TPosition extends Record<string, CursorPrimitive>>(
  context: Omit<CursorContext, "requestId"> & { position: TPosition },
): string {
  const envelope: CursorEnvelope<TPosition> = {
    v: CURSOR_VERSION,
    resource: context.resource,
    order: context.order,
    filters: normalizeFilters(context.filters),
    position: context.position,
  };

  return toBase64Url(JSON.stringify(envelope));
}

export function decodeCursor<TPosition extends Record<string, CursorPrimitive>>(
  options: DecodeCursorOptions,
): TPosition | null {
  if (options.cursor == null) {
    return null;
  }

  const envelope = parseCursorEnvelope(options.cursor, options.requestId);
  const expectedFilters = normalizeFilters(options.filters);

  if (envelope.resource !== options.resource) {
    throw invalidCursor(
      { cursor: "resource mismatch", expectedResource: options.resource, actualResource: envelope.resource },
      options.requestId,
    );
  }

  if (envelope.order !== options.order) {
    throw invalidCursor(
      { cursor: "order mismatch", expectedOrder: options.order, actualOrder: envelope.order },
      options.requestId,
    );
  }

  if (JSON.stringify(envelope.filters) !== JSON.stringify(expectedFilters)) {
    throw invalidCursor(
      { cursor: "filter mismatch", expectedFilters, actualFilters: envelope.filters },
      options.requestId,
    );
  }

  return envelope.position as TPosition;
}

export function inspectCursor(cursor: string, requestId?: string): CursorEnvelope {
  return parseCursorEnvelope(cursor, requestId);
}
