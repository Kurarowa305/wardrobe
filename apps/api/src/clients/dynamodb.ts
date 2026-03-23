export type DynamoDbTransportConfig = {
  region: string;
  endpoint?: string | undefined;
};

export type DynamoDbClientConfig = DynamoDbTransportConfig & {
  tableName: string;
};

export type DynamoDbKey = Record<string, unknown>;
export type DynamoDbItem = Record<string, unknown>;

export type GetItemInput = {
  Key: DynamoDbKey;
  ConsistentRead?: boolean | undefined;
  ProjectionExpression?: string | undefined;
};

export type PutItemInput = {
  Item: DynamoDbItem;
  ConditionExpression?: string | undefined;
};

export type UpdateItemInput = {
  Key: DynamoDbKey;
  UpdateExpression: string;
  ConditionExpression?: string | undefined;
  ExpressionAttributeNames?: Record<string, string> | undefined;
  ExpressionAttributeValues?: Record<string, unknown> | undefined;
  ReturnValues?: "NONE" | "ALL_NEW" | "UPDATED_NEW" | undefined;
};

export type QueryInput = {
  IndexName?: string | undefined;
  KeyConditionExpression: string;
  ExpressionAttributeNames?: Record<string, string> | undefined;
  ExpressionAttributeValues?: Record<string, unknown> | undefined;
  ExclusiveStartKey?: DynamoDbKey | undefined;
  Limit?: number | undefined;
  ScanIndexForward?: boolean | undefined;
};

export type BatchGetItemInput = {
  Keys: DynamoDbKey[];
  ConsistentRead?: boolean | undefined;
  ProjectionExpression?: string | undefined;
};

export type TransactWriteItem = {
  Put?: { Item: DynamoDbItem; ConditionExpression?: string | undefined } | undefined;
  Update?: {
    Key: DynamoDbKey;
    UpdateExpression: string;
    ConditionExpression?: string | undefined;
    ExpressionAttributeNames?: Record<string, string> | undefined;
    ExpressionAttributeValues?: Record<string, unknown> | undefined;
  } | undefined;
  Delete?: { Key: DynamoDbKey; ConditionExpression?: string | undefined } | undefined;
  ConditionCheck?: {
    Key: DynamoDbKey;
    ConditionExpression: string;
    ExpressionAttributeNames?: Record<string, string> | undefined;
    ExpressionAttributeValues?: Record<string, unknown> | undefined;
  } | undefined;
};

export type DynamoDbOperationName =
  | "GetItem"
  | "PutItem"
  | "UpdateItem"
  | "Query"
  | "BatchGetItem"
  | "TransactWriteItems";

export type DynamoDbCommand<TName extends DynamoDbOperationName, TInput> = {
  operation: TName;
  endpoint?: string | undefined;
  region: string;
  input: TInput;
};

export type GetItemCommand = DynamoDbCommand<"GetItem", GetItemInput & { TableName: string }>;
export type PutItemCommand = DynamoDbCommand<"PutItem", PutItemInput & { TableName: string }>;
export type UpdateItemCommand = DynamoDbCommand<"UpdateItem", UpdateItemInput & { TableName: string }>;
export type QueryCommand = DynamoDbCommand<"Query", QueryInput & { TableName: string }>;
export type BatchGetItemCommand = DynamoDbCommand<
  "BatchGetItem",
  { RequestItems: Record<string, { Keys: DynamoDbKey[]; ConsistentRead?: boolean | undefined; ProjectionExpression?: string | undefined }> }
>;
export type TransactWriteItemsCommand = DynamoDbCommand<
  "TransactWriteItems",
  { TransactItems: TransactWriteItem[] }
>;

export type DynamoDbBuiltCommand =
  | GetItemCommand
  | PutItemCommand
  | UpdateItemCommand
  | QueryCommand
  | BatchGetItemCommand
  | TransactWriteItemsCommand;

export type DynamoDbSendResult<TCommand extends DynamoDbBuiltCommand> = {
  operation: TCommand["operation"];
  request: TCommand;
};

const LOCAL_ENDPOINT_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

const isLocalEndpoint = (endpoint: string | undefined): boolean =>
  endpoint !== undefined && LOCAL_ENDPOINT_PATTERN.test(endpoint);

export const createDynamoDbClientConfig = (
  overrides: Partial<DynamoDbClientConfig> = {},
): DynamoDbClientConfig => ({
  region: overrides.region ?? "ap-northeast-1",
  endpoint: overrides.endpoint,
  tableName: overrides.tableName ?? "WardrobeTable",
});

export const createDynamoDbTransportConfig = (
  overrides: Partial<DynamoDbTransportConfig> = {},
): DynamoDbTransportConfig => ({
  region: overrides.region ?? "ap-northeast-1",
  endpoint: overrides.endpoint,
});

export const createDynamoDbDocumentClient = (
  overrides: Partial<DynamoDbTransportConfig> = {},
) => {
  const transport = createDynamoDbTransportConfig(overrides);

  return {
    config: {
      region: transport.region,
      endpoint: transport.endpoint,
      accessMode: isLocalEndpoint(transport.endpoint) ? ("local" as const) : ("aws" as const),
      credentials: isLocalEndpoint(transport.endpoint)
        ? {
            accessKeyId: "local",
            secretAccessKey: "local",
          }
        : undefined,
    },
    send: async <TCommand extends DynamoDbBuiltCommand>(command: TCommand): Promise<DynamoDbSendResult<TCommand>> => ({
      operation: command.operation,
      request: command,
    }),
  };
};

export type DynamoDbDocumentClient = ReturnType<typeof createDynamoDbDocumentClient>;
export type DynamoDbClient = ReturnType<typeof createDynamoDbClient>;

export const createDynamoDbClient = (overrides: Partial<DynamoDbClientConfig> = {}) => {
  const config = createDynamoDbClientConfig(overrides);
  const documentClient = createDynamoDbDocumentClient(config);

  return {
    config,
    documentClient,
    getItem: (input: GetItemInput): Promise<DynamoDbSendResult<GetItemCommand>> =>
      documentClient.send({
        operation: "GetItem",
        region: config.region,
        endpoint: config.endpoint,
        input: { ...input, TableName: config.tableName },
      }),
    putItem: (input: PutItemInput): Promise<DynamoDbSendResult<PutItemCommand>> =>
      documentClient.send({
        operation: "PutItem",
        region: config.region,
        endpoint: config.endpoint,
        input: { ...input, TableName: config.tableName },
      }),
    updateItem: (input: UpdateItemInput): Promise<DynamoDbSendResult<UpdateItemCommand>> =>
      documentClient.send({
        operation: "UpdateItem",
        region: config.region,
        endpoint: config.endpoint,
        input: { ...input, TableName: config.tableName },
      }),
    query: (input: QueryInput): Promise<DynamoDbSendResult<QueryCommand>> =>
      documentClient.send({
        operation: "Query",
        region: config.region,
        endpoint: config.endpoint,
        input: { ...input, TableName: config.tableName },
      }),
    batchGetItem: (input: BatchGetItemInput): Promise<DynamoDbSendResult<BatchGetItemCommand>> =>
      documentClient.send({
        operation: "BatchGetItem",
        region: config.region,
        endpoint: config.endpoint,
        input: {
          RequestItems: {
            [config.tableName]: {
              Keys: input.Keys,
              ConsistentRead: input.ConsistentRead,
              ProjectionExpression: input.ProjectionExpression,
            },
          },
        },
      }),
    transactWriteItems: (
      input: { TransactItems: TransactWriteItem[] },
    ): Promise<DynamoDbSendResult<TransactWriteItemsCommand>> =>
      documentClient.send({
        operation: "TransactWriteItems",
        region: config.region,
        endpoint: config.endpoint,
        input,
      }),
  };
};
