import type { AnalyticsApi, Models } from "purecloud-platform-client-v2";
import { z } from "zod";
import { createTool, type ToolFactory } from "./utils/createTool.js";
import { errorResult } from "./utils/errorResult.js";
import { isMissingPermissionsError } from "./utils/genesys/isMissingPermissionsError.js";
import { isUnauthorizedError } from "./utils/genesys/isUnauthorizedError.js";

export interface ToolDependencies {
  readonly analyticsApi: Pick<
    AnalyticsApi,
    "postAnalyticsQueuesObservationsQuery"
  >;
}

const paramsSchema = z.object({
  query: z
    .record(z.unknown())
    .describe(
      "QueueObservationQuery payload for POST /api/v2/analytics/queues/observations/query. Example: { filter, metrics, detailMetrics? }",
    ),
});

function formatErrorMessage(error: unknown): string {
  if (isUnauthorizedError(error)) {
    return "Failed to run queue observations query: Unauthorized access. Please check API credentials or permissions";
  }

  if (isMissingPermissionsError(error)) {
    return "Failed to run queue observations query: Missing required permissions";
  }

  return `Failed to run queue observations query: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
}

export const analyticsQueuesObservations: ToolFactory<
  ToolDependencies,
  typeof paramsSchema
> = ({ analyticsApi }) =>
  createTool({
    schema: {
      name: "analytics_queues_observations",
      annotations: { title: "Analytics Queues Observations" },
      description:
        "Runs a real-time queue observations query and returns current queue state metrics such as waiting, interacting, and availability indicators.",
      paramsSchema,
    },
    call: async ({ query }) => {
      let response: Models.QueueObservationQueryResponse;

      try {
        response = await analyticsApi.postAnalyticsQueuesObservationsQuery(
          query as unknown as Models.QueueObservationQuery,
        );
      } catch (error: unknown) {
        return errorResult(formatErrorMessage(error));
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response),
          },
        ],
      };
    },
  });
