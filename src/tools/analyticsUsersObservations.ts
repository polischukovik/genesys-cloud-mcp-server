import type { AnalyticsApi, Models } from "purecloud-platform-client-v2";
import { z } from "zod";
import { createTool, type ToolFactory } from "./utils/createTool.js";
import { errorResult } from "./utils/errorResult.js";
import { isMissingPermissionsError } from "./utils/genesys/isMissingPermissionsError.js";
import { isUnauthorizedError } from "./utils/genesys/isUnauthorizedError.js";

export interface ToolDependencies {
  readonly analyticsApi: Pick<
    AnalyticsApi,
    "postAnalyticsUsersObservationsQuery"
  >;
}

const paramsSchema = z.object({
  query: z
    .record(z.unknown())
    .describe(
      "UserObservationQuery payload for POST /api/v2/analytics/users/observations/query. Example: { filter, metrics, detailMetrics? }",
    ),
});

function formatErrorMessage(error: unknown): string {
  if (isUnauthorizedError(error)) {
    return "Failed to run user observations query: Unauthorized access. Please check API credentials or permissions";
  }

  if (isMissingPermissionsError(error)) {
    return "Failed to run user observations query: Missing required permissions";
  }

  return `Failed to run user observations query: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
}

export const analyticsUsersObservations: ToolFactory<
  ToolDependencies,
  typeof paramsSchema
> = ({ analyticsApi }) =>
  createTool({
    schema: {
      name: "analytics_users_observations",
      annotations: { title: "Analytics Users Observations" },
      description:
        "Runs a real-time user observations query and returns current user state metrics such as presence, routing status, and workload indicators.",
      paramsSchema,
    },
    call: async ({ query }) => {
      let response: Models.UserObservationQueryResponse;

      try {
        response = await analyticsApi.postAnalyticsUsersObservationsQuery(
          query as unknown as Models.UserObservationQuery,
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
