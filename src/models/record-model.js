function buildFilters(query = {}) {
  const conditions = ["deleted_at IS NULL"];
  const values = [];

  if (query.type) {
    values.push(query.type);
    conditions.push(`type = $${values.length}`);
  }

  if (query.category) {
    values.push(query.category.trim().toLowerCase());
    conditions.push(`LOWER(category) = $${values.length}`);
  }

  if (query.startDate) {
    values.push(query.startDate);
    conditions.push(`date >= $${values.length}`);
  }

  if (query.endDate) {
    values.push(query.endDate);
    conditions.push(`date <= $${values.length}`);
  }

  if (query.search) {
    values.push(`%${query.search.trim().toLowerCase()}%`);
    conditions.push(`LOWER(CONCAT(category, ' ', notes)) LIKE $${values.length}`);
  }

  return {
    whereClause: conditions.join(" AND "),
    values
  };
}

export function createRecordModel(pool) {
  return {
    async findAll(query = {}) {
      const { whereClause, values } = buildFilters(query);
      const page = Math.max(Number(query.page || 1), 1);
      const pageSize = Math.min(Math.max(Number(query.pageSize || 10), 1), 100);
      const offset = (page - 1) * pageSize;

      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total FROM financial_records WHERE ${whereClause};`,
        values
      );

      const pagedValues = [...values, pageSize, offset];
      const rowsResult = await pool.query(
        `
          SELECT
            id,
            amount::float8 AS amount,
            type,
            category,
            TO_CHAR(date, 'YYYY-MM-DD') AS date,
            notes,
            created_by AS "createdBy",
            created_at AS "createdAt",
            updated_at AS "updatedAt",
            deleted_at AS "deletedAt"
          FROM financial_records
          WHERE ${whereClause}
          ORDER BY date DESC, created_at DESC
          LIMIT $${pagedValues.length - 1}
          OFFSET $${pagedValues.length};
        `,
        pagedValues
      );

      return {
        rows: rowsResult.rows,
        total: countResult.rows[0].total,
        page,
        pageSize
      };
    },
    async findById(id) {
      const result = await pool.query(
        `
          SELECT
            id,
            amount::float8 AS amount,
            type,
            category,
            TO_CHAR(date, 'YYYY-MM-DD') AS date,
            notes,
            created_by AS "createdBy",
            created_at AS "createdAt",
            updated_at AS "updatedAt",
            deleted_at AS "deletedAt"
          FROM financial_records
          WHERE id = $1 AND deleted_at IS NULL;
        `,
        [id]
      );

      return result.rows[0] || null;
    },
    async create(record) {
      const result = await pool.query(
        `
          INSERT INTO financial_records (id, amount, type, category, date, notes, created_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING
            id,
            amount::float8 AS amount,
            type,
            category,
            TO_CHAR(date, 'YYYY-MM-DD') AS date,
            notes,
            created_by AS "createdBy",
            created_at AS "createdAt",
            updated_at AS "updatedAt",
            deleted_at AS "deletedAt";
        `,
        [
          record.id,
          record.amount,
          record.type,
          record.category,
          record.date,
          record.notes,
          record.createdBy
        ]
      );

      return result.rows[0];
    },
    async update(id, updates) {
      const fields = [];
      const values = [];

      if ("amount" in updates) {
        fields.push(`amount = $${fields.length + 1}`);
        values.push(updates.amount);
      }

      if ("type" in updates) {
        fields.push(`type = $${fields.length + 1}`);
        values.push(updates.type);
      }

      if ("category" in updates) {
        fields.push(`category = $${fields.length + 1}`);
        values.push(updates.category);
      }

      if ("date" in updates) {
        fields.push(`date = $${fields.length + 1}`);
        values.push(updates.date);
      }

      if ("notes" in updates) {
        fields.push(`notes = $${fields.length + 1}`);
        values.push(updates.notes);
      }

      if (fields.length === 0) {
        return this.findById(id);
      }

      values.push(id);

      const result = await pool.query(
        `
          UPDATE financial_records
          SET ${fields.join(", ")}, updated_at = NOW()
          WHERE id = $${values.length} AND deleted_at IS NULL
          RETURNING
            id,
            amount::float8 AS amount,
            type,
            category,
            TO_CHAR(date, 'YYYY-MM-DD') AS date,
            notes,
            created_by AS "createdBy",
            created_at AS "createdAt",
            updated_at AS "updatedAt",
            deleted_at AS "deletedAt";
        `,
        values
      );

      return result.rows[0] || null;
    },
    async softDelete(id) {
      const result = await pool.query(
        `
          UPDATE financial_records
          SET deleted_at = NOW(), updated_at = NOW()
          WHERE id = $1 AND deleted_at IS NULL
          RETURNING id;
        `,
        [id]
      );

      return result.rows[0] || null;
    },
    async getSummary(query = {}) {
      const { whereClause, values } = buildFilters(query);
      const result = await pool.query(
        `
          SELECT
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::float8 AS "totalIncome",
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float8 AS "totalExpenses",
            COUNT(*)::int AS "recordCount"
          FROM financial_records
          WHERE ${whereClause};
        `,
        values
      );

      return result.rows[0];
    },
    async getCategoryTotals(query = {}) {
      const { whereClause, values } = buildFilters(query);
      const result = await pool.query(
        `
          SELECT
            category,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::float8 AS income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float8 AS expense,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)::float8 AS net
          FROM financial_records
          WHERE ${whereClause}
          GROUP BY category
          ORDER BY net DESC, category ASC;
        `,
        values
      );

      return result.rows;
    },
    async getTrends(query = {}) {
      const { whereClause, values } = buildFilters(query);
      const granularity = query.granularity === "weekly" ? "weekly" : "monthly";
      const periodSql =
        granularity === "weekly"
          ? "TO_CHAR(DATE_TRUNC('week', date), 'YYYY-MM-DD')"
          : "TO_CHAR(DATE_TRUNC('month', date), 'YYYY-MM')";

      const result = await pool.query(
        `
          SELECT
            ${periodSql} AS period,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::float8 AS income,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float8 AS expense,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)::float8 AS net
          FROM financial_records
          WHERE ${whereClause}
          GROUP BY period
          ORDER BY period ASC;
        `,
        values
      );

      return result.rows;
    },
    async getRecentActivity(limit = 5) {
      const safeLimit = Math.min(Math.max(Number(limit || 5), 1), 20);
      const result = await pool.query(
        `
          SELECT
            id,
            amount::float8 AS amount,
            type,
            category,
            TO_CHAR(date, 'YYYY-MM-DD') AS date,
            notes,
            created_by AS "createdBy",
            created_at AS "createdAt",
            updated_at AS "updatedAt",
            deleted_at AS "deletedAt"
          FROM financial_records
          WHERE deleted_at IS NULL
          ORDER BY date DESC, created_at DESC
          LIMIT $1;
        `,
        [safeLimit]
      );

      return result.rows;
    }
  };
}
