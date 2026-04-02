export function createAuthController(services) {
  return {
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
