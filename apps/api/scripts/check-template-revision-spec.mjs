import assert from "node:assert/strict";
import { createTemplateUsecase } from "../src/domains/template/usecases/templateUsecase.ts";
const records = new Map();
const repo = {
  async create(item) {
    records.set(item.templateId, { ...item });
  },
  async get({ templateId }) {
    return { Item: records.get(templateId) };
  },
  async update(item) {
    records.set(item.templateId, { ...records.get(item.templateId), ...item });
  },
  async delete({ templateId, expectedRevision }) {
    const item = records.get(templateId);
    records.set(templateId, {
      ...item,
      status: "DELETED",
      revision: expectedRevision + 1,
    });
  },
};
const usecase = createTemplateUsecase({
  repo,
  generateTemplateId: () => "tp_revision",
  now: () => 10,
  clothingBatchGetRepo: {
    async batchGetByIds() {
      return [
        {
          Responses: {
            Table: [{ clothingId: "cl_1", imageKey: null, status: "ACTIVE" }],
          },
        },
      ];
    },
  },
});
await usecase.create({
  wardrobeId: "wd_test",
  name: "original",
  clothingIds: ["cl_1"],
  tagIds: ["season:summer"],
});
assert.equal(
  (await usecase.get({ wardrobeId: "wd_test", templateId: "tp_revision" }))
    .revision,
  1,
);
await usecase.update({
  wardrobeId: "wd_test",
  templateId: "tp_revision",
  name: "edited",
});
assert.equal(
  (await usecase.get({ wardrobeId: "wd_test", templateId: "tp_revision" }))
    .revision,
  2,
);
await usecase.update({
  wardrobeId: "wd_test",
  templateId: "tp_revision",
  name: "edited",
});
assert.equal(
  (await usecase.get({ wardrobeId: "wd_test", templateId: "tp_revision" }))
    .revision,
  2,
);
await usecase.delete({ wardrobeId: "wd_test", templateId: "tp_revision" });
assert.equal(
  (await usecase.get({ wardrobeId: "wd_test", templateId: "tp_revision" }))
    .revision,
  3,
);
console.log("Template content revisions and no-op stability OK");
records.set("tp_legacy", {
  ...records.get("tp_revision"),
  templateId: "tp_legacy",
  revision: undefined,
  status: "ACTIVE",
});
assert.equal(
  (await usecase.get({ wardrobeId: "wd_test", templateId: "tp_legacy" }))
    .revision,
  0,
);
await usecase.update({
  wardrobeId: "wd_test",
  templateId: "tp_legacy",
  name: "first edit",
});
assert.equal(
  (await usecase.get({ wardrobeId: "wd_test", templateId: "tp_legacy" }))
    .revision,
  1,
);
const originalUpdate = repo.update,
  originalDelete = repo.delete;
repo.update = async (item) => {
  const current = records.get(item.templateId);
  if (current.status !== "ACTIVE" || current.revision !== item.expectedRevision)
    throw Object.assign(Error("conflict"), {
      name: "ConditionalCheckFailedException",
    });
  await originalUpdate(item);
};
repo.delete = async (item) => {
  const current = records.get(item.templateId);
  if (current.status !== "ACTIVE" || current.revision !== item.expectedRevision)
    throw Object.assign(Error("conflict"), {
      name: "ConditionalCheckFailedException",
    });
  await originalDelete(item);
};
const concurrency = await Promise.allSettled([
  usecase.update({
    wardrobeId: "wd_test",
    templateId: "tp_legacy",
    name: "race",
  }),
  usecase.delete({ wardrobeId: "wd_test", templateId: "tp_legacy" }),
]);
assert.equal(concurrency.filter((r) => r.status === "fulfilled").length, 1);
assert.equal(
  concurrency.find((r) => r.status === "rejected").reason.code,
  "CONFLICT",
);
const { createTemplateRepo } = await import(
  "../src/domains/template/repo/templateRepo.ts"
);
const wire = [];
const dbRepo = createTemplateRepo({
  async updateItem(request) {
    wire.push(request);
    return {};
  },
});
const entity = {
  wardrobeId: "wd_test",
  templateId: "tp_1",
  name: "n",
  status: "ACTIVE",
  clothingIds: ["cl_1"],
  tagIds: [],
  createdAt: 1,
  wearCount: 10,
  lastWornAt: 50,
  deletedAt: null,
  revision: 2,
  expectedRevision: 1,
};
await dbRepo.update(entity);
assert.match(wire[0].ConditionExpression, /#status = :active/);
assert.match(wire[0].ConditionExpression, /#revision = :expectedRevision/);
assert.equal(wire[0].ExpressionAttributeValues[":expectedRevision"], 1);
assert.equal(wire[0].ExpressionAttributeValues[":revision"], 2);
assert.doesNotMatch(wire[0].UpdateExpression, /wearCount|lastWornAt/);
await dbRepo.delete({
  wardrobeId: "wd_test",
  templateId: "tp_1",
  deletedAt: 10,
  expectedRevision: 0,
});
assert.match(wire[1].ConditionExpression, /attribute_not_exists\(#revision\)/);
assert.equal(wire[1].ExpressionAttributeValues[":revision"], 1);
console.log(
  "Legacy revision, concurrent edit/delete and DynamoDB ACTIVE/revision conditions preserve stats OK",
);
