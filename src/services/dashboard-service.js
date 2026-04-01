function withinRange(record, query) {
  if (query.startDate && record.date < query.startDate) {
    return false;
  }

  if (query.endDate && record.date > query.endDate) {
    return false;
  }

  return true;
}

function getRecords(store, query) {
  return store.getRecords().filter((record) => withinRange(record, query));
}

function groupTotalsByCategory(records) {
  const totals = new Map();

  for (const record of records) {
    const current = totals.get(record.category) || {
      category: record.category,
      income: 0,
      expense: 0,
      net: 0
    };

    if (record.type === "income") {
      current.income += record.amount;
      current.net += record.amount;
    } else {
      current.expense += record.amount;
      current.net -= record.amount;
    }

    totals.set(record.category, current);
  }

  return [...totals.values()].sort((left, right) => right.net - left.net);
}

function bucketKey(record, granularity) {
  if (granularity === "weekly") {
    const date = new Date(`${record.date}T00:00:00.000Z`);
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() - day + 1);
    return date.toISOString().slice(0, 10);
  }

  return record.date.slice(0, 7);
}

export function createDashboardService(store) {
  return {
    getSummary(query = {}) {
      const records = getRecords(store, query);
      const totals = records.reduce(
        (summary, record) => {
          if (record.type === "income") {
            summary.totalIncome += record.amount;
          } else {
            summary.totalExpenses += record.amount;
          }

          return summary;
        },
        { totalIncome: 0, totalExpenses: 0 }
      );

      return {
        ...totals,
        netBalance: totals.totalIncome - totals.totalExpenses,
        recordCount: records.length,
        categoryTotals: groupTotalsByCategory(records)
      };
    },
    getTrends(query = {}) {
      const granularity = query.granularity === "weekly" ? "weekly" : "monthly";
      const buckets = new Map();

      for (const record of getRecords(store, query)) {
        const key = bucketKey(record, granularity);
        const current = buckets.get(key) || {
          period: key,
          income: 0,
          expense: 0,
          net: 0
        };

        if (record.type === "income") {
          current.income += record.amount;
          current.net += record.amount;
        } else {
          current.expense += record.amount;
          current.net -= record.amount;
        }

        buckets.set(key, current);
      }

      return [...buckets.values()].sort((left, right) => left.period.localeCompare(right.period));
    },
    getRecentActivity(query = {}) {
      const limit = Math.min(Math.max(Number(query.limit || 5), 1), 20);
      return store.getRecords().slice(0, limit);
    }
  };
}
