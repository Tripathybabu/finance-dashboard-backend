export function createAuthController(services) {
  return {
    async login({ body }) {
      return {
        statusCode: 200,
        body: {
          data: await services.users.login(body)
        }
      };
    },
    async getMe({ user }) {
      return {
        statusCode: 200,
        body: {
          data: services.users.sanitizeUser(user)
        }
      };
    }
  };
}
