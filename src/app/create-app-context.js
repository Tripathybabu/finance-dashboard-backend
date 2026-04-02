import { createAuthController } from "../controllers/auth-controller.js";
import { createDashboardController } from "../controllers/dashboard-controller.js";
import { createRecordsController } from "../controllers/records-controller.js";
import { createUsersController } from "../controllers/users-controller.js";
import { createDatabasePool } from "../config/database.js";
import { initializeDatabase } from "../database/init.js";
import { createRecordModel } from "../models/record-model.js";
import { createUserModel } from "../models/user-model.js";
import { createDashboardService } from "../services/dashboard-service.js";
import { createRecordService } from "../services/record-service.js";
import { createUserService } from "../services/user-service.js";

export async function createAppContext(options = {}) {
  const pool = options.pool || createDatabasePool(options.database);
  const ownsPool = !options.pool;

  if (options.initializeDatabase !== false) {
    await initializeDatabase(pool, {
      seed: options.seedDatabase !== false
    });
  }

  const models = {
    users: createUserModel(pool),
    records: createRecordModel(pool)
  };

  const services = {
    users: createUserService(models.users),
    records: createRecordService(models.records),
    dashboard: createDashboardService(models.records)
  };

  const controllers = {
    auth: createAuthController(services),
    users: createUsersController(services),
    records: createRecordsController(services),
    dashboard: createDashboardController(services)
  };

  return {
    db: pool,
    models,
    services,
    controllers,
    async close() {
      if (ownsPool) {
        await pool.end();
      }
    }
  };
}
