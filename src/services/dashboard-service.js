import {
  assertValid,
  validateRecentActivityQuery,
  validateRecordQuery,
  validateTrendQuery
} from "./validation.js";

export function createDashboardService(recordModel) {
  return {
    async getSummary(query = {}) {
      assertValid(validateRecordQuery(query));

      const summary = await recordModel.getSummary(query);
      const categoryTotals = await recordModel.getCategoryTotals(query);

      return {
        ...summary,
        netBalance: summary.totalIncome - summary.totalExpenses,
        categoryTotals
      };
    },
    async getTrends(query = {}) {
      assertValid(validateTrendQuery(query));

      return recordModel.getTrends(query);
    },
    async getRecentActivity(query = {}) {
      assertValid(validateRecentActivityQuery(query));

      return recordModel.getRecentActivity(query.limit);
    }
  };
}
