import { assertValid, validateRecordInput } from "./validation.js";

function notFound() {
  const error = new Error("Financial record not found.");
  error.statusCode = 404;
  throw error;
}

function applyFilters(records, query) {
  return records.filter((record) => {
    if (query.type && record.type !== query.type) {
      return false;
    }

    if (query.category && record.category.toLowerCase() !== query.category.toLowerCase()) {
      return false;
    }

    if (query.startDate && record.date < query.startDate) {
      return false;
    }

    if (query.endDate && record.date > query.endDate) {
      return false;
    }

    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      const haystack = `${record.category} ${record.notes}`.toLowerCase();
      if (!haystack.includes(searchTerm)) {
        return false;
      }
    }

    return true;
  });
}

export function createRecordService(store) {
  return {
    listRecords(query = {}) {
      const page = Math.max(Number(query.page || 1), 1);
      const pageSize = Math.min(Math.max(Number(query.pageSize || 10), 1), 100);
      const filtered = applyFilters(store.getRecords(), query);
      const startIndex = (page - 1) * pageSize;

      return {
        data: filtered.slice(startIndex, startIndex + pageSize),
        meta: {
          total: filtered.length,
          page,
          pageSize,
          totalPages: Math.max(Math.ceil(filtered.length / pageSize), 1)
        }
      };
    },
    getRecord(id) {
      const record = store.getRecordById(id);
      if (!record) {
        notFound();
      }
      return record;
    },
    createRecord(payload, user) {
      assertValid(validateRecordInput(payload, "create"));
      return store.createRecord({
        amount: payload.amount,
        type: payload.type,
        category: payload.category.trim(),
        date: payload.date,
        notes: payload.notes?.trim() || "",
        createdBy: user.id
      });
    },
    updateRecord(id, payload) {
      assertValid(validateRecordInput(payload, "update"));
      const current = store.getRecordById(id);
      if (!current) {
        notFound();
      }

      return store.updateRecord(id, {
        ...("amount" in payload ? { amount: payload.amount } : {}),
        ...("type" in payload ? { type: payload.type } : {}),
        ...("category" in payload ? { category: payload.category.trim() } : {}),
        ...("date" in payload ? { date: payload.date } : {}),
        ...("notes" in payload ? { notes: payload.notes?.trim() || "" } : {})
      });
    },
    deleteRecord(id) {
      const deleted = store.deleteRecord(id);
      if (!deleted) {
        notFound();
      }
    }
  };
}
