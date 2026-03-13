import type { AnalyticsApi, Models } from "purecloud-platform-client-v2";
import { z } from "zod";
import { createTool, type ToolFactory } from "./utils/createTool.js";
import { errorResult } from "./utils/errorResult.js";
import { isMissingPermissionsError } from "./utils/genesys/isMissingPermissionsError.js";
import { isUnauthorizedError } from "./utils/genesys/isUnauthorizedError.js";

export interface ToolDependencies {
  readonly analyticsApi: Pick<
    AnalyticsApi,
    | "postAnalyticsConversationsAggregatesJobs"
    | "getAnalyticsConversationsAggregatesJob"
    | "getAnalyticsConversationsAggregatesJobResults"
  >;
}

const paramsSchema = z.object({
  operation: z
    .enum(["create_job", "get_job", "get_results"])
    .describe(
      "Operation to run: create_job creates an async job, get_job checks job status, get_results returns paged job results",
    ),
  query: z
    .record(z.unknown())
    .optional()
    .describe(
      "ConversationAsyncAggregationQuery payload. Required when operation is create_job",
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
    .describe(
      "Optional pagination cursor for get_results, from the previous page response",
    ),
});

function formatErrorMessage(error: unknown): string {
  if (isUnauthorizedError(error)) {
    return "Failed to run async conversations aggregates operation: Unauthorized access. Please check API credentials or permissions";
  }

  if (isMissingPermissionsError(error)) {
    return "Failed to run async conversations aggregates operation: Missing required permissions";
  }

  return `Failed to run async conversations aggregates operation: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
}

export const analyticsConversationsAggregatesAsync: ToolFactory<
  ToolDependencies,
  typeof paramsSchema
> = ({ analyticsApi }) =>
  createTool({
    schema: {
      name: "analytics_conversations_aggregates_async",
      annotations: { title: "Analytics Conversations Aggregates Async" },
      description:
        "Creates and reads asynchronous conversations aggregates jobs. Use create_job for large queries, then poll get_job and page through get_results with cursor.",
      paramsSchema,
    },
    call: async ({ operation, query, jobId, cursor }) => {
      try {
        if (operation === "create_job") {
          if (!query) {
            return errorResult(
              "query is required when operation is create_job",
            );
          }

          const response =
            await analyticsApi.postAnalyticsConversationsAggregatesJobs(
              query as unknown as Models.ConversationAsyncAggregationQuery,
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
            await analyticsApi.getAnalyticsConversationsAggregatesJob(jobId);

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
          await analyticsApi.getAnalyticsConversationsAggregatesJobResults(
            jobId,
            cursor ? { cursor } : undefined,
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
