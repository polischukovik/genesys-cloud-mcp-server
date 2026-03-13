import type { AnalyticsApi, Models } from "purecloud-platform-client-v2";
import { z } from "zod";
import { asyncConversationDetailsQuerySchema } from "./utils/analyticsSchemas.js";
import { createTool, type ToolFactory } from "./utils/createTool.js";
import { errorResult } from "./utils/errorResult.js";
import { isMissingPermissionsError } from "./utils/genesys/isMissingPermissionsError.js";
import { isUnauthorizedError } from "./utils/genesys/isUnauthorizedError.js";

export interface ToolDependencies {
  readonly analyticsApi: Pick<
    AnalyticsApi,
    | "postAnalyticsConversationsDetailsJobs"
    | "getAnalyticsConversationsDetailsJob"
    | "getAnalyticsConversationsDetailsJobResults"
  >;
}

const paramsSchema = z.object({
  operation: z
    .enum(["create_job", "get_job", "get_results"])
    .describe(
      "Operation to run: create_job creates an async details job, get_job checks job status, get_results returns paged job results",
    ),
  query: asyncConversationDetailsQuerySchema
    .optional()
    .describe(
      "AsyncConversationQuery payload. Required when operation is create_job",
    ),
  jobId: z
    .string()
    .optional()
    .describe(
      "Async analytics job ID. Required when operation is get_job or get_results",
    ),
  cursor: z
    .string()
    .optional()
    .describe("Optional pagination cursor for get_results"),
  pageSize: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe("Optional page size for get_results. Maximum value is 100"),
});

function formatErrorMessage(error: unknown): string {
  if (isUnauthorizedError(error)) {
    return "Failed to run async conversations details operation: Unauthorized access. Please check API credentials or permissions";
  }

  if (isMissingPermissionsError(error)) {
    return "Failed to run async conversations details operation: Missing required permissions";
  }

  return `Failed to run async conversations details operation: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
}

export const analyticsConversationsDetailsAsync: ToolFactory<
  ToolDependencies,
  typeof paramsSchema
> = ({ analyticsApi }) =>
  createTool({
    schema: {
      name: "analytics_conversations_details_async",
      annotations: { title: "Analytics Conversations Details Async" },
      description:
        "Creates and reads asynchronous conversations details jobs. Use this for large result sets that exceed synchronous query limits.",
      paramsSchema,
    },
    call: async ({ operation, query, jobId, cursor, pageSize }) => {
      try {
        if (operation === "create_job") {
          if (!query) {
            return errorResult(
              "query is required when operation is create_job",
            );
          }

          const response =
            await analyticsApi.postAnalyticsConversationsDetailsJobs(
              query as unknown as Models.AsyncConversationQuery,
            );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ operation, response }),
              },
            ],
          };
        }

        if (!jobId) {
          return errorResult(
            "jobId is required when operation is get_job or get_results",
          );
        }

        if (operation === "get_job") {
          const response =
            await analyticsApi.getAnalyticsConversationsDetailsJob(jobId);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ operation, response }),
              },
            ],
          };
        }

        const response =
          await analyticsApi.getAnalyticsConversationsDetailsJobResults(
            jobId,
            cursor || pageSize ? { cursor, pageSize } : undefined,
          );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ operation, response }),
            },
          ],
        };
      } catch (error: unknown) {
        return errorResult(formatErrorMessage(error));
      }
    },
  });
