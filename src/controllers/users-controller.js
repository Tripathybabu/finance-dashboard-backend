export function createUsersController(services) {
  return {
    async listUsers() {
      return {
        statusCode: 200,
        body: {
          data: await services.users.listUsers()
        }
      };
    },
    async getUser({ params }) {
      return {
        statusCode: 200,
        body: {
          data: await services.users.getUser(params.userId)
        }
      };
    },
    async createUser({ body }) {
      return {
        statusCode: 201,
        body: {
          data: await services.users.createUser(body)
        }
      };
    },
    async updateUser({ params, body }) {
      return {
        statusCode: 200,
        body: {
          data: await services.users.updateUser(params.userId, body)
        }
      };
    }
  };
}
