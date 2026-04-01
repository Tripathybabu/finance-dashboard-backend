import { createStore } from "./data/store.js";
import { createDashboardService } from "./services/dashboard-service.js";
import { createUserService } from "./services/user-service.js";
import { createRecordService } from "./services/record-service.js";

export function createAppContext(options = {}) {
  const store = createStore(options);

  return {
    store,
    services: {
      users: createUserService(store),
      records: createRecordService(store),
      dashboard: createDashboardService(store)
    }
  };
}
