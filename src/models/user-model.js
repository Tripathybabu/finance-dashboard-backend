export function createUserModel(pool) {
  return {
    async findAll() {
      const result = await pool.query(`
        SELECT id, name, email, password_hash, role, status, token, created_at, updated_at
        FROM users
        ORDER BY created_at ASC;
      `);

      return result.rows;
    },
    async findById(id) {
      const result = await pool.query(
        `
          SELECT id, name, email, password_hash, role, status, token, created_at, updated_at
          FROM users
          WHERE id = $1;
        `,
        [id]
      );

      return result.rows[0] || null;
    },
    async findByEmail(email) {
      const result = await pool.query(
        `
          SELECT id, name, email, password_hash, role, status, token, created_at, updated_at
          FROM users
          WHERE email = $1;
        `,
        [email]
      );

      return result.rows[0] || null;
    },
    async findByToken(token) {
      const result = await pool.query(
        `
          SELECT id, name, email, password_hash, role, status, token, created_at, updated_at
          FROM users
          WHERE token = $1;
        `,
        [token]
      );

      return result.rows[0] || null;
    },
    async create(user) {
      const result = await pool.query(
        `
          INSERT INTO users (id, name, email, password_hash, role, status, token)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, name, email, password_hash, role, status, token, created_at, updated_at;
        `,
        [user.id, user.name, user.email, user.passwordHash, user.role, user.status, user.token]
      );

      return result.rows[0];
    },
    async update(id, updates) {
      const fields = [];
      const values = [];

      if ("name" in updates) {
        fields.push(`name = $${fields.length + 1}`);
        values.push(updates.name);
      }

      if ("email" in updates) {
        fields.push(`email = $${fields.length + 1}`);
        values.push(updates.email);
      }

      if ("role" in updates) {
        fields.push(`role = $${fields.length + 1}`);
        values.push(updates.role);
      }

      if ("passwordHash" in updates) {
        fields.push(`password_hash = $${fields.length + 1}`);
        values.push(updates.passwordHash);
      }

      if ("status" in updates) {
        fields.push(`status = $${fields.length + 1}`);
        values.push(updates.status);
      }

      if (fields.length === 0) {
        return this.findById(id);
      }

      values.push(id);

      const result = await pool.query(
        `
          UPDATE users
          SET ${fields.join(", ")}, updated_at = NOW()
          WHERE id = $${values.length}
          RETURNING id, name, email, password_hash, role, status, token, created_at, updated_at;
        `,
        values
      );

      return result.rows[0] || null;
    },
    async updateToken(id, token) {
      const result = await pool.query(
        `
          UPDATE users
          SET token = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING id, name, email, password_hash, role, status, token, created_at, updated_at;
        `,
        [token, id]
      );

      return result.rows[0] || null;
    }
  };
}
