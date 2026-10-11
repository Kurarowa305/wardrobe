import assert from "node:assert/strict";
import {
  createHistoryRequestSchema,
  historyDateSchema,
} from "../src/domains/history/schema/historySchema.ts";
assert.equal(
  createHistoryRequestSchema.safeParse({
    date: "20261011",
    templateId: "tp_a",
    expectedTemplateRevision: 0,
  }).success,
  true,
);
assert.equal(historyDateSchema.safeParse("20260230").success, false);
assert.equal(historyDateSchema.safeParse("20240229").success, true);
console.log("confirmation input contract passed");
const {createHistoryHandler}=await import('../src/domains/history/handlers/createHistoryHandler.ts');
const valid={path:{wardrobeId:'wd_a'},headers:{'content-type':'application/json'},body:{date:'20261011',templateId:'tp_a',expectedTemplateRevision:0}};
await assert.rejects(createHistoryHandler(valid),e=>e.code==='VALIDATION_ERROR');
await assert.rejects(createHistoryHandler({...valid,headers:{...valid.headers,'idempotency-key':['a','b']}}),e=>e.code==='VALIDATION_ERROR');
for(const bad of [-1,1.5,'1',Number.MAX_SAFE_INTEGER+1])assert.equal(createHistoryRequestSchema.safeParse({...valid.body,expectedTemplateRevision:bad}).success,false);
assert.equal(createHistoryRequestSchema.safeParse({date:'20261011',clothingIds:['cl_1'],expectedTemplateRevision:0}).success,false);
console.log('confirmation revision requires UUID, strict request fields passed');
