export function createDashboardController(services) {
  return {
    async getSummary({ query }) {
      return {
        statusCode: 200,
        body: {
          data: await services.dashboard.getSummary(query)
        }
      };
    },
    async getTrends({ query }) {
      return {
        statusCode: 200,
        body: {
          data: await services.dashboard.getTrends(query)
        }
      };
    },
    async getRecentActivity({ query }) {
      return {
        statusCode: 200,
        body: {
          data: await services.dashboard.getRecentActivity(query)
        }
      };
    }
  };
}
