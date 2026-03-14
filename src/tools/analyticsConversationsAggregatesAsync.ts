import type { AnalyticsApi, Models } from "purecloud-platform-client-v2";
import { z } from "zod";
import { conversationAsyncAggregationQuerySchema } from "./utils/analyticsSchemas.js";
import { createTool, type ToolFactory } from "./utils/createTool.js";
import { isMissingPermissionsError } from "./utils/genesys/isMissingPermissionsError.js";
import { isUnauthorizedError } from "./utils/genesys/isUnauthorizedError.js";
import {
  errorEnvelopeResult,
  operationEnvelopeResult,
} from "./utils/resultEnvelope.js";
import {
  collectArrayFieldFromPages,
  runAsyncJobToCompletion,
} from "./utils/runAsyncJobToCompletion.js";

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
    .enum(["create_job", "get_job", "get_results", "run_to_completion"])
    .describe(
      "Operation to run: create_job creates an async job, get_job checks job status, get_results returns paged job results, run_to_completion creates a job and returns all pages",
    ),
  query: conversationAsyncAggregationQuerySchema
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
  pollIntervalMs: z
    .number()
    .int()
    .positive()
    .max(30000)
    .optional()
    .describe(
      "Polling interval in milliseconds for run_to_completion. Default: 3000",
    ),
  maxPollAttempts: z
    .number()
    .int()
    .positive()
    .max(500)
    .optional()
    .describe(
      "Maximum number of job status polls for run_to_completion. Default: 40",
    ),
  maxResultPages: z
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .describe(
      "Maximum number of paged result fetches for run_to_completion. Default: 25",
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
        "Creates and reads asynchronous conversations aggregates jobs for large queries. Supports manual async operations and run-to-completion mode.",
      paramsSchema,
    },
    call: async ({
      operation,
      query,
      jobId,
      cursor,
      pollIntervalMs,
      maxPollAttempts,
      maxResultPages,
    }) => {
      try {
        if (operation === "create_job") {
          if (!query) {
            return errorEnvelopeResult(
              "query is required when operation is create_job",
            );
          }

          const response =
            await analyticsApi.postAnalyticsConversationsAggregatesJobs(
              query as unknown as Models.ConversationAsyncAggregationQuery,
            );

          return operationEnvelopeResult(operation, response, {
            endpoint: "/api/v2/analytics/conversations/aggregates/jobs",
          });
        }

        if (operation === "run_to_completion") {
          if (!query) {
            return errorEnvelopeResult(
              "query is required when operation is run_to_completion",
            );
          }

          const result = await runAsyncJobToCompletion({
            createJob: () =>
              analyticsApi.postAnalyticsConversationsAggregatesJobs(
                query as unknown as Models.ConversationAsyncAggregationQuery,
              ),
            getJobStatus: (runJobId) =>
              analyticsApi.getAnalyticsConversationsAggregatesJob(runJobId),
            getResultsPage: (runJobId, runCursor) =>
              analyticsApi.getAnalyticsConversationsAggregatesJobResults(
                runJobId,
                runCursor ? { cursor: runCursor } : undefined,
              ),
            pollIntervalMs,
            maxPollAttempts,
            maxResultPages,
          });

          const aggregateRows = collectArrayFieldFromPages(
            result.pages as unknown as Record<string, unknown>[],
            "results",
          );

          return operationEnvelopeResult(
            operation,
            {
              jobId: result.jobId,
              results: aggregateRows,
              pages: result.pages,
            },
            {
              pollAttempts: result.pollAttempts,
              pageCount: result.pageCount,
              truncated: result.truncated,
              ...(result.nextCursor ? { nextCursor: result.nextCursor } : {}),
            },
          );
        }

        if (!jobId) {
          return errorEnvelopeResult(
            "jobId is required when operation is get_job or get_results",
          );
        }

        if (operation === "get_job") {
          const response =
            await analyticsApi.getAnalyticsConversationsAggregatesJob(jobId);

          return operationEnvelopeResult(operation, response, {
            endpoint: "/api/v2/analytics/conversations/aggregates/jobs/{jobId}",
          });
        }

        const response =
          await analyticsApi.getAnalyticsConversationsAggregatesJobResults(
            jobId,
            cursor ? { cursor } : undefined,
          );

        return operationEnvelopeResult(operation, response, {
          endpoint:
            "/api/v2/analytics/conversations/aggregates/jobs/{jobId}/results",
        });
      } catch (error: unknown) {
        return errorEnvelopeResult(formatErrorMessage(error), { operation });
      }
    },
  });
