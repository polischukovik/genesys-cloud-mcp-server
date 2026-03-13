import type { AnalyticsApi, Models } from "purecloud-platform-client-v2";
import { z } from "zod";
import { createTool, type ToolFactory } from "./utils/createTool.js";
import { errorResult } from "./utils/errorResult.js";
import { isMissingPermissionsError } from "./utils/genesys/isMissingPermissionsError.js";
import { isUnauthorizedError } from "./utils/genesys/isUnauthorizedError.js";

export interface ToolDependencies {
  readonly analyticsApi: Pick<AnalyticsApi, "postAnalyticsUsersDetailsQuery">;
}

const paramsSchema = z.object({
  query: z
    .record(z.unknown())
    .describe(
      "UserDetailsQuery payload for POST /api/v2/analytics/users/details/query. Example: { interval, userFilters?, presenceFilters?, routingStatusFilters?, order?, paging?, presenceAggregations?, routingStatusAggregations? }",
    ),
});

function formatErrorMessage(error: unknown): string {
  if (isUnauthorizedError(error)) {
    return "Failed to run users details query: Unauthorized access. Please check API credentials or permissions";
  }

  if (isMissingPermissionsError(error)) {
    return "Failed to run users details query: Missing required permissions";
  }

  return `Failed to run users details query: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
}

export const analyticsUsersDetailsQuery: ToolFactory<
  ToolDependencies,
  typeof paramsSchema
> = ({ analyticsApi }) =>
  createTool({
    schema: {
      name: "analytics_users_details_query",
      annotations: { title: "Analytics Users Details Query" },
      description:
        "Runs a synchronous users details query and returns user-level analytics rows with optional presence and routing status aggregations.",
      paramsSchema,
    },
    call: async ({ query }) => {
      let response: Models.AnalyticsUserDetailsQueryResponse;

      try {
        response = await analyticsApi.postAnalyticsUsersDetailsQuery(
          query as unknown as Models.UserDetailsQuery,
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
