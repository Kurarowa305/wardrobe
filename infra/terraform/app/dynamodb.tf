resource "aws_dynamodb_table" "wardrobe" {
  name         = local.table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "statusListPk"
    type = "S"
  }

  attribute {
    name = "statusGenreListPk"
    type = "S"
  }

  attribute {
    name = "createdAtSk"
    type = "S"
  }

  attribute {
    name = "wearCountSk"
    type = "S"
  }

  attribute {
    name = "lastWornAtSk"
    type = "S"
  }

  attribute {
    name = "historyDateSk"
    type = "S"
  }

  global_secondary_index {
    name            = "StatusListByCreatedAt"
    hash_key        = "statusListPk"
    range_key       = "createdAtSk"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "StatusGenreListByCreatedAt"
    hash_key        = "statusGenreListPk"
    range_key       = "createdAtSk"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "StatusListByWearCount"
    hash_key        = "statusListPk"
    range_key       = "wearCountSk"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "StatusListByLastWornAt"
    hash_key        = "statusListPk"
    range_key       = "lastWornAtSk"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "HistoryByDate"
    hash_key        = "PK"
    range_key       = "historyDateSk"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = true
  }

  deletion_protection_enabled = false

  tags = local.tags
}
