import { randomUUID } from "node:crypto";
import { assertValid, validateRecordInput } from "./validation.js";

function notFound() {
  const error = new Error("Financial record not found.");
  error.statusCode = 404;
  throw error;
}

export function createRecordService(recordModel) {
  return {
    async listRecords(query = {}) {
      const result = await recordModel.findAll(query);

      return {
        data: result.rows,
        meta: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: Math.max(Math.ceil(result.total / result.pageSize), 1)
        }
      };
    },
    async getRecord(id) {
      const record = await recordModel.findById(id);
      if (!record) {
        notFound();
      }
      return record;
    },
    async createRecord(payload, user) {
      assertValid(validateRecordInput(payload, "create"));
      return recordModel.create({
        id: randomUUID(),
        amount: payload.amount,
        type: payload.type,
        category: payload.category.trim(),
        date: payload.date,
        notes: payload.notes?.trim() || "",
        createdBy: user.id
      });
    },
    async updateRecord(id, payload) {
      assertValid(validateRecordInput(payload, "update"));
      const current = await recordModel.findById(id);
      if (!current) {
        notFound();
      }

      return recordModel.update(id, {
        ...("amount" in payload ? { amount: payload.amount } : {}),
        ...("type" in payload ? { type: payload.type } : {}),
        ...("category" in payload ? { category: payload.category.trim() } : {}),
        ...("date" in payload ? { date: payload.date } : {}),
        ...("notes" in payload ? { notes: payload.notes?.trim() || "" } : {})
      });
    },
    async deleteRecord(id) {
      const deleted = await recordModel.softDelete(id);
      if (!deleted) {
        notFound();
      }
    }
  };
}
