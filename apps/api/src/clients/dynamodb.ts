export type DynamoDbClientConfig = {
  region: string;
  endpoint?: string | undefined;
  tableName: string;
};

export const createDynamoDbClientConfig = (
  overrides: Partial<DynamoDbClientConfig> = {},
): DynamoDbClientConfig => ({
  region: overrides.region ?? "ap-northeast-1",
  endpoint: overrides.endpoint,
  tableName: overrides.tableName ?? "WardrobeTable",
});
