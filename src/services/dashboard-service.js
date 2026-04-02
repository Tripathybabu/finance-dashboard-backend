export function createDashboardService(recordModel) {
  return {
    async getSummary(query = {}) {
      const summary = await recordModel.getSummary(query);
      const categoryTotals = await recordModel.getCategoryTotals(query);

      return {
        ...summary,
        netBalance: summary.totalIncome - summary.totalExpenses,
        categoryTotals
      };
    },
    async getTrends(query = {}) {
      return recordModel.getTrends(query);
    },
    async getRecentActivity(query = {}) {
      return recordModel.getRecentActivity(query.limit);
    }
  };
}
