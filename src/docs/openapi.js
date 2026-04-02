function createServerUrl() {
  const port = Number(process.env.PORT || 3000);
  return `http://localhost:${port}`;
}

function createSwaggerHtml() {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Finance Dashboard API Docs</title>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css"
    />
    <style>
      body {
        margin: 0;
        background: #f4f7fb;
      }

      .topbar {
        display: none;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/swagger.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        persistAuthorization: true
      });
    </script>
  </body>
</html>`;
}

export function createOpenApiSpec() {
  return {
    openapi: "3.0.3",
    info: {
      title: "Finance Dashboard Backend API",
      version: "1.0.0",
      description:
        "OpenAPI documentation for the finance dashboard backend, including authentication, users, records, and dashboard analytics endpoints."
    },
    servers: [
      {
        url: createServerUrl(),
        description: "Local development server"
      }
    ],
    tags: [
      { name: "Health", description: "Service health endpoint" },
      { name: "Auth", description: "Authentication and current user info" },
      { name: "Users", description: "User administration endpoints" },
      { name: "Records", description: "Financial record management endpoints" },
      { name: "Dashboard", description: "Dashboard analytics endpoints" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "Token"
        },
        tokenHeader: {
          type: "apiKey",
          in: "header",
          name: "X-Auth-Token"
        }
      },
      parameters: {
        userId: {
          name: "id",
          in: "path",
          required: true,
          description: "User ID",
          schema: { type: "string", format: "uuid" }
        },
        recordId: {
          name: "id",
          in: "path",
          required: true,
          description: "Financial record ID",
          schema: { type: "string", format: "uuid" }
        }
      },
      schemas: {
        ErrorDetail: {
          type: "object",
          properties: {
            field: { type: "string", example: "email" },
            message: { type: "string", example: "Email must be valid." }
          }
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                message: { type: "string", example: "Validation failed." },
                details: {
                  oneOf: [
                    {
                      type: "array",
                      items: { $ref: "#/components/schemas/ErrorDetail" }
                    },
                    { type: "null" }
                  ]
                }
              },
              required: ["message", "details"]
            }
          },
          required: ["error"]
        },
        HealthResponse: {
          type: "object",
          properties: {
            status: { type: "string", example: "ok" },
            timestamp: { type: "string", format: "date-time" }
          },
          required: ["status", "timestamp"]
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", example: "Sam Support" },
            email: { type: "string", format: "email", example: "sam@finance.local" },
            role: {
              type: "string",
              enum: ["viewer", "analyst", "admin"],
              example: "viewer"
            },
            status: {
              type: "string",
              enum: ["active", "inactive"],
              example: "active"
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" }
          },
          required: ["id", "name", "email", "role", "status", "createdAt", "updatedAt"]
        },
        UserWithAccessToken: {
          allOf: [
            { $ref: "#/components/schemas/User" },
            {
              type: "object",
              properties: {
                accessToken: {
                  type: "string",
                  example: "f2c03310-8aab-4219-9465-fc806d510ad5"
                }
              },
              required: ["accessToken"]
            }
          ]
        },
        UserRequest: {
          type: "object",
          properties: {
            name: { type: "string", example: "Sam Support" },
            email: { type: "string", format: "email", example: "sam@finance.local" },
            password: { type: "string", format: "password", example: "Sam@12345" },
            role: {
              type: "string",
              enum: ["viewer", "analyst", "admin"]
            },
            status: {
              type: "string",
              enum: ["active", "inactive"],
              default: "active"
            }
          },
          required: ["name", "email", "role"]
        },
        UserUpdateRequest: {
          type: "object",
          properties: {
            name: { type: "string", example: "Sam Support" },
            email: { type: "string", format: "email", example: "sam@finance.local" },
            password: { type: "string", format: "password", example: "Updated@123" },
            role: {
              type: "string",
              enum: ["viewer", "analyst", "admin"]
            },
            status: {
              type: "string",
              enum: ["active", "inactive"]
            }
          }
        },
        UserResponse: {
          type: "object",
          properties: {
            data: { $ref: "#/components/schemas/User" }
          },
          required: ["data"]
        },
        UserWithAccessTokenResponse: {
          type: "object",
          properties: {
            data: { $ref: "#/components/schemas/UserWithAccessToken" }
          },
          required: ["data"]
        },
        LoginRequest: {
          type: "object",
          properties: {
            email: { type: "string", format: "email", example: "admin@finance.local" },
            password: { type: "string", format: "password", example: "Admin@123" }
          },
          required: ["email", "password"]
        },
        LoginResponse: {
          type: "object",
          properties: {
            data: {
              type: "object",
              properties: {
                user: { $ref: "#/components/schemas/User" },
                accessToken: {
                  type: "string",
                  example: "8a13b95b-77ae-4fd2-b255-5f2520ca8d11"
                }
              },
              required: ["user", "accessToken"]
            }
          },
          required: ["data"]
        },
        UsersResponse: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/User" }
            }
          },
          required: ["data"]
        },
        FinancialRecord: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            amount: { type: "number", example: 1200 },
            type: {
              type: "string",
              enum: ["income", "expense"],
              example: "income"
            },
            category: { type: "string", example: "Services" },
            date: { type: "string", format: "date", example: "2026-03-30" },
            notes: { type: "string", example: "Implementation project" },
            createdBy: { type: "string", format: "uuid" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" }
          },
          required: [
            "id",
            "amount",
            "type",
            "category",
            "date",
            "notes",
            "createdBy",
            "createdAt",
            "updatedAt"
          ]
        },
        RecordRequest: {
          type: "object",
          properties: {
            amount: { type: "number", example: 1200 },
            type: {
              type: "string",
              enum: ["income", "expense"]
            },
            category: { type: "string", example: "Services" },
            date: { type: "string", format: "date", example: "2026-03-30" },
            notes: { type: "string", example: "Implementation project" }
          },
          required: ["amount", "type", "category", "date"]
        },
        RecordUpdateRequest: {
          type: "object",
          properties: {
            amount: { type: "number", example: 900 },
            type: {
              type: "string",
              enum: ["income", "expense"]
            },
            category: { type: "string", example: "Operations" },
            date: { type: "string", format: "date", example: "2026-03-31" },
            notes: { type: "string", example: "Updated entry" }
          }
        },
        RecordResponse: {
          type: "object",
          properties: {
            data: { $ref: "#/components/schemas/FinancialRecord" }
          },
          required: ["data"]
        },
        RecordListResponse: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/FinancialRecord" }
            },
            meta: {
              type: "object",
              properties: {
                total: { type: "integer", example: 1 },
                page: { type: "integer", example: 1 },
                pageSize: { type: "integer", example: 10 },
                totalPages: { type: "integer", example: 1 }
              },
              required: ["total", "page", "pageSize", "totalPages"]
            }
          },
          required: ["data", "meta"]
        },
        DeleteRecordResponse: {
          type: "object",
          properties: {
            data: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                deleted: { type: "boolean", example: true }
              },
              required: ["id", "deleted"]
            }
          },
          required: ["data"]
        },
        DashboardSummary: {
          type: "object",
          properties: {
            totalIncome: { type: "number", example: 8000 },
            totalExpenses: { type: "number", example: 2970 },
            netBalance: { type: "number", example: 5030 },
            recordCount: { type: "integer", example: 6 },
            categoryTotals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string", example: "Services" },
                  income: { type: "number", example: 3200 },
                  expense: { type: "number", example: 450 },
                  net: { type: "number", example: 2750 }
                },
                required: ["category", "income", "expense", "net"]
              }
            }
          },
          required: ["totalIncome", "totalExpenses", "netBalance", "recordCount", "categoryTotals"]
        },
        DashboardSummaryResponse: {
          type: "object",
          properties: {
            data: { $ref: "#/components/schemas/DashboardSummary" }
          },
          required: ["data"]
        },
        TrendPoint: {
          type: "object",
          properties: {
            period: { type: "string", example: "2026-03" },
            income: { type: "number", example: 2400 },
            expense: { type: "number", example: 1100 },
            net: { type: "number", example: 1300 }
          },
          required: ["period", "income", "expense", "net"]
        },
        DashboardTrendsResponse: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/TrendPoint" }
            }
          },
          required: ["data"]
        },
        RecentActivityItem: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            amount: { type: "number", example: 450 },
            type: {
              type: "string",
              enum: ["income", "expense"],
              example: "expense"
            },
            category: { type: "string", example: "Marketing" },
            date: { type: "string", format: "date", example: "2026-03-29" },
            notes: { type: "string", example: "Campaign spend" }
          }
        },
        RecentActivityResponse: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/RecentActivityItem" }
            }
          },
          required: ["data"]
        }
      },
      responses: {
        Unauthorized: {
          description: "Authentication is required.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        },
        Forbidden: {
          description: "The user does not have access to this action.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        },
        NotFound: {
          description: "The requested resource was not found.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        },
        ValidationError: {
          description: "Validation failed.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        },
        Conflict: {
          description: "The resource conflicts with an existing record.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" }
            }
          }
        }
      }
    },
    paths: {
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          responses: {
            200: {
              description: "Service is healthy.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthResponse" }
                }
              }
            }
          }
        }
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login and receive a fresh access token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" }
              }
            }
          },
          responses: {
            200: {
              description: "Authenticated successfully.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/LoginResponse" }
                }
              }
            },
            401: { $ref: "#/components/responses/Unauthorized" },
            403: { $ref: "#/components/responses/Forbidden" },
            422: { $ref: "#/components/responses/ValidationError" }
          }
        }
      },
      "/api/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get the current authenticated user",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          responses: {
            200: {
              description: "Current user details.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UserResponse" }
                }
              }
            },
            401: { $ref: "#/components/responses/Unauthorized" },
            403: { $ref: "#/components/responses/Forbidden" }
          }
        }
      },
      "/api/users": {
        get: {
          tags: ["Users"],
          summary: "List users",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          responses: {
            200: {
              description: "A list of users.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UsersResponse" }
                }
              }
            },
            401: { $ref: "#/components/responses/Unauthorized" },
            403: { $ref: "#/components/responses/Forbidden" }
          }
        },
        post: {
          tags: ["Users"],
          summary: "Create a user",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserRequest" }
              }
            }
          },
          responses: {
            201: {
              description: "User created.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UserWithAccessTokenResponse" }
                }
              }
            },
            401: { $ref: "#/components/responses/Unauthorized" },
            403: { $ref: "#/components/responses/Forbidden" },
            409: { $ref: "#/components/responses/Conflict" },
            422: { $ref: "#/components/responses/ValidationError" }
          }
        }
      },
      "/api/users/{id}": {
        get: {
          tags: ["Users"],
          summary: "Get a single user",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [{ $ref: "#/components/parameters/userId" }],
          responses: {
            200: {
              description: "User details.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UserResponse" }
                }
              }
            },
            401: { $ref: "#/components/responses/Unauthorized" },
            403: { $ref: "#/components/responses/Forbidden" },
            404: { $ref: "#/components/responses/NotFound" }
          }
        },
        patch: {
          tags: ["Users"],
          summary: "Update a user",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [{ $ref: "#/components/parameters/userId" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserUpdateRequest" }
              }
            }
          },
          responses: {
            200: {
              description: "User updated.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/UserResponse" }
                }
              }
            },
            401: { $ref: "#/components/responses/Unauthorized" },
            403: { $ref: "#/components/responses/Forbidden" },
            404: { $ref: "#/components/responses/NotFound" },
            409: { $ref: "#/components/responses/Conflict" },
            422: { $ref: "#/components/responses/ValidationError" }
          }
        }
      },
      "/api/records": {
        get: {
          tags: ["Records"],
          summary: "List financial records",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [
            {
              name: "type",
              in: "query",
              schema: { type: "string", enum: ["income", "expense"] }
            },
            {
              name: "category",
              in: "query",
              schema: { type: "string" }
            },
            {
              name: "startDate",
              in: "query",
              schema: { type: "string", format: "date" }
            },
            {
              name: "endDate",
              in: "query",
              schema: { type: "string", format: "date" }
            },
            {
              name: "search",
              in: "query",
              schema: { type: "string" }
            },
            {
              name: "page",
              in: "query",
              schema: { type: "integer", minimum: 1, default: 1 }
            },
            {
              name: "pageSize",
              in: "query",
              schema: { type: "integer", minimum: 1, default: 10 }
            }
          ],
          responses: {
            200: {
              description: "Paginated financial records.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RecordListResponse" }
                }
              }
            },
            401: { $ref: "#/components/responses/Unauthorized" },
            403: { $ref: "#/components/responses/Forbidden" }
          }
        },
        post: {
          tags: ["Records"],
          summary: "Create a financial record",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RecordRequest" }
              }
            }
          },
          responses: {
            201: {
              description: "Record created.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RecordResponse" }
                }
              }
            },
            401: { $ref: "#/components/responses/Unauthorized" },
            403: { $ref: "#/components/responses/Forbidden" },
            422: { $ref: "#/components/responses/ValidationError" }
          }
        }
      },
      "/api/records/{id}": {
        get: {
          tags: ["Records"],
          summary: "Get a financial record",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [{ $ref: "#/components/parameters/recordId" }],
          responses: {
            200: {
              description: "Record details.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RecordResponse" }
                }
              }
            },
            401: { $ref: "#/components/responses/Unauthorized" },
            403: { $ref: "#/components/responses/Forbidden" },
            404: { $ref: "#/components/responses/NotFound" }
          }
        },
        patch: {
          tags: ["Records"],
          summary: "Update a financial record",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [{ $ref: "#/components/parameters/recordId" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RecordUpdateRequest" }
              }
            }
          },
          responses: {
            200: {
              description: "Record updated.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RecordResponse" }
                }
              }
            },
            401: { $ref: "#/components/responses/Unauthorized" },
            403: { $ref: "#/components/responses/Forbidden" },
            404: { $ref: "#/components/responses/NotFound" },
            422: { $ref: "#/components/responses/ValidationError" }
          }
        },
        delete: {
          tags: ["Records"],
          summary: "Soft delete a financial record",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [{ $ref: "#/components/parameters/recordId" }],
          responses: {
            200: {
              description: "Record deleted.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DeleteRecordResponse" }
                }
              }
            },
            401: { $ref: "#/components/responses/Unauthorized" },
            403: { $ref: "#/components/responses/Forbidden" },
            404: { $ref: "#/components/responses/NotFound" }
          }
        }
      },
      "/api/dashboard/summary": {
        get: {
          tags: ["Dashboard"],
          summary: "Get dashboard summary",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [
            {
              name: "type",
              in: "query",
              schema: { type: "string", enum: ["income", "expense"] }
            },
            {
              name: "category",
              in: "query",
              schema: { type: "string" }
            },
            {
              name: "startDate",
              in: "query",
              schema: { type: "string", format: "date" }
            },
            {
              name: "endDate",
              in: "query",
              schema: { type: "string", format: "date" }
            },
            {
              name: "search",
              in: "query",
              schema: { type: "string" }
            }
          ],
          responses: {
            200: {
              description: "Summary totals and category rollups.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DashboardSummaryResponse" }
                }
              }
            },
            401: { $ref: "#/components/responses/Unauthorized" },
            403: { $ref: "#/components/responses/Forbidden" }
          }
        }
      },
      "/api/dashboard/trends": {
        get: {
          tags: ["Dashboard"],
          summary: "Get dashboard trends",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [
            {
              name: "type",
              in: "query",
              schema: { type: "string", enum: ["income", "expense"] }
            },
            {
              name: "category",
              in: "query",
              schema: { type: "string" }
            },
            {
              name: "startDate",
              in: "query",
              schema: { type: "string", format: "date" }
            },
            {
              name: "endDate",
              in: "query",
              schema: { type: "string", format: "date" }
            },
            {
              name: "search",
              in: "query",
              schema: { type: "string" }
            },
            {
              name: "granularity",
              in: "query",
              schema: { type: "string", enum: ["monthly", "weekly"] }
            }
          ],
          responses: {
            200: {
              description: "Trend data grouped by period.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DashboardTrendsResponse" }
                }
              }
            },
            401: { $ref: "#/components/responses/Unauthorized" },
            403: { $ref: "#/components/responses/Forbidden" }
          }
        }
      },
      "/api/dashboard/recent-activity": {
        get: {
          tags: ["Dashboard"],
          summary: "Get recent activity",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", minimum: 1, default: 5 }
            }
          ],
          responses: {
            200: {
              description: "Most recent financial activity.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RecentActivityResponse" }
                }
              }
            },
            401: { $ref: "#/components/responses/Unauthorized" },
            403: { $ref: "#/components/responses/Forbidden" }
          }
        }
      }
    }
  };
}

export function getSwaggerHtml() {
  return createSwaggerHtml();
}
