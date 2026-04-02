export function createRecordsController(services) {
  return {
    async listRecords({ query }) {
      return {
        statusCode: 200,
        body: await services.records.listRecords(query)
      };
    },
    async getRecord({ params }) {
      return {
        statusCode: 200,
        body: {
          data: await services.records.getRecord(params.recordId)
        }
      };
    },
    async createRecord({ body, user }) {
      return {
        statusCode: 201,
        body: {
          data: await services.records.createRecord(body, user)
        }
      };
    },
    async updateRecord({ params, body }) {
      return {
        statusCode: 200,
        body: {
          data: await services.records.updateRecord(params.recordId, body)
        }
      };
    },
    async deleteRecord({ params }) {
      await services.records.deleteRecord(params.recordId);

      return {
        statusCode: 200,
        body: {
          data: {
            id: params.recordId,
            deleted: true
          }
        }
      };
    }
  };
}
