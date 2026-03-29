import { DynamoDBClient, type DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import {
  BatchGetCommand,
  DynamoDBDocumentClient as AwsDynamoDbDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand as AwsQueryCommand,
  TransactWriteCommand,
  UpdateCommand,
  type BatchGetCommandOutput,
  type GetCommandOutput,
  type PutCommandOutput,
  type QueryCommandOutput,
  type TransactWriteCommandOutput,
  type UpdateCommandOutput,
} from "@aws-sdk/lib-dynamodb";

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
  Put?: { TableName?: string | undefined; Item: DynamoDbItem; ConditionExpression?: string | undefined } | undefined;
  Update?: {
    TableName?: string | undefined;
    Key: DynamoDbKey;
    UpdateExpression: string;
    ConditionExpression?: string | undefined;
    ExpressionAttributeNames?: Record<string, string> | undefined;
    ExpressionAttributeValues?: Record<string, unknown> | undefined;
  } | undefined;
  Delete?: { TableName?: string | undefined; Key: DynamoDbKey; ConditionExpression?: string | undefined } | undefined;
  ConditionCheck?: {
    TableName?: string | undefined;
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

type DynamoDbOperationResultMap = {
  GetItem: GetCommandOutput;
  PutItem: PutCommandOutput;
  UpdateItem: UpdateCommandOutput;
  Query: QueryCommandOutput;
  BatchGetItem: BatchGetCommandOutput;
  TransactWriteItems: TransactWriteCommandOutput;
};

type DynamoDbOperationResult<TName extends DynamoDbOperationName> = DynamoDbOperationResultMap[TName];

export type DynamoDbSendResult<TCommand extends DynamoDbBuiltCommand> = DynamoDbOperationResult<TCommand["operation"]> & {
  operation: TCommand["operation"];
  request: TCommand;
};

const LOCAL_ENDPOINT_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

const isLocalEndpoint = (endpoint: string | undefined): boolean =>
  endpoint !== undefined && LOCAL_ENDPOINT_PATTERN.test(endpoint);

const readNonEmptyEnv = (key: string): string | undefined => {
  const value = process.env[key];
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

type AwsDocumentClientLike = Pick<AwsDynamoDbDocumentClient, "send">;

export type CreateDynamoDbDocumentClientOptions = Partial<DynamoDbTransportConfig> & {
  documentClient?: AwsDocumentClientLike | undefined;
};

export type CreateDynamoDbClientOptions = Partial<DynamoDbClientConfig> & {
  documentClient?: AwsDocumentClientLike | undefined;
};

const executeBuiltCommand = async (documentClient: AwsDocumentClientLike, command: DynamoDbBuiltCommand): Promise<unknown> => {
  switch (command.operation) {
    case "GetItem":
      return documentClient.send(new GetCommand(command.input));
    case "PutItem":
      return documentClient.send(new PutCommand(command.input));
    case "UpdateItem":
      return documentClient.send(new UpdateCommand(command.input));
    case "Query":
      return documentClient.send(new AwsQueryCommand(command.input));
    case "BatchGetItem":
      return documentClient.send(new BatchGetCommand(command.input));
    case "TransactWriteItems":
      return documentClient.send(
        new TransactWriteCommand(command.input as ConstructorParameters<typeof TransactWriteCommand>[0]),
      );
    default: {
      const exhaustiveCheck: never = command;
      throw new Error(`Unsupported DynamoDB operation: ${(exhaustiveCheck as { operation?: string }).operation ?? "unknown"}`);
    }
  }
};

const attachTableNameToTransactItem = (item: TransactWriteItem, tableName: string): TransactWriteItem => {
  const resolved: TransactWriteItem = {};

  if (item.Put) {
    resolved.Put = {
      ...item.Put,
      TableName: item.Put.TableName ?? tableName,
    };
  }

  if (item.Update) {
    resolved.Update = {
      ...item.Update,
      TableName: item.Update.TableName ?? tableName,
    };
  }

  if (item.Delete) {
    resolved.Delete = {
      ...item.Delete,
      TableName: item.Delete.TableName ?? tableName,
    };
  }

  if (item.ConditionCheck) {
    resolved.ConditionCheck = {
      ...item.ConditionCheck,
      TableName: item.ConditionCheck.TableName ?? tableName,
    };
  }

  return resolved;
};

export const createDynamoDbClientConfig = (
  overrides: Partial<DynamoDbClientConfig> = {},
): DynamoDbClientConfig => ({
  region: overrides.region ?? readNonEmptyEnv("AWS_REGION") ?? "ap-northeast-1",
  endpoint: overrides.endpoint ?? readNonEmptyEnv("DDB_ENDPOINT"),
  tableName: overrides.tableName ?? readNonEmptyEnv("TABLE_NAME") ?? "WardrobeTable",
});

export const createDynamoDbTransportConfig = (
  overrides: Partial<DynamoDbTransportConfig> = {},
): DynamoDbTransportConfig => ({
  region: overrides.region ?? "ap-northeast-1",
  endpoint: overrides.endpoint,
});

export const createDynamoDbDocumentClient = (
  overrides: CreateDynamoDbDocumentClientOptions = {},
) => {
  const transport = createDynamoDbTransportConfig(overrides);
  const localMode = isLocalEndpoint(transport.endpoint);
  const credentials = localMode
    ? {
        accessKeyId: "local",
        secretAccessKey: "local",
      }
    : undefined;

  const baseClientConfig: DynamoDBClientConfig = {
    region: transport.region,
    ...(transport.endpoint ? { endpoint: transport.endpoint } : {}),
    ...(credentials ? { credentials } : {}),
  };

  const sdkDocumentClient =
    overrides.documentClient
    ?? AwsDynamoDbDocumentClient.from(new DynamoDBClient(baseClientConfig), {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    });

  return {
    config: {
      region: transport.region,
      endpoint: transport.endpoint,
      accessMode: localMode ? ("local" as const) : ("aws" as const),
      credentials,
    },
    send: async <TCommand extends DynamoDbBuiltCommand>(command: TCommand): Promise<DynamoDbSendResult<TCommand>> => {
      const result = await executeBuiltCommand(sdkDocumentClient, command);

      return {
        ...(result as DynamoDbOperationResult<TCommand["operation"]>),
        operation: command.operation,
        request: command,
      };
    },
  };
};

export type DynamoDbDocumentClient = ReturnType<typeof createDynamoDbDocumentClient>;
export type DynamoDbClient = ReturnType<typeof createDynamoDbClient>;

export const createDynamoDbClient = (overrides: CreateDynamoDbClientOptions = {}) => {
  const { documentClient: injectedDocumentClient, ...configOverrides } = overrides;
  const config = createDynamoDbClientConfig(configOverrides);
  const documentClient = createDynamoDbDocumentClient({
    ...config,
    ...(injectedDocumentClient ? { documentClient: injectedDocumentClient } : {}),
  });

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
      {
        const transactItems = input.TransactItems.map((item) => attachTableNameToTransactItem(item, config.tableName));

        return documentClient.send({
          operation: "TransactWriteItems",
          region: config.region,
          endpoint: config.endpoint,
          input: {
            TransactItems: transactItems,
          },
        });
      },
  };
};
