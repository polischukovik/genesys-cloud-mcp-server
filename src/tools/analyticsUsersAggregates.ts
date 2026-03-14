import type { AnalyticsApi, Models } from "purecloud-platform-client-v2";
import { z } from "zod";
import { userAggregationQuerySchema } from "./utils/analyticsSchemas.js";
import { createTool, type ToolFactory } from "./utils/createTool.js";
import { isMissingPermissionsError } from "./utils/genesys/isMissingPermissionsError.js";
import { isUnauthorizedError } from "./utils/genesys/isUnauthorizedError.js";
import {
  errorEnvelopeResult,
  successEnvelopeResult,
} from "./utils/resultEnvelope.js";

export interface ToolDependencies {
  readonly analyticsApi: Pick<
    AnalyticsApi,
    "postAnalyticsUsersAggregatesQuery"
  >;
}

const paramsSchema = z.object({
  query: userAggregationQuerySchema.describe(
    "UserAggregationQuery payload for POST /api/v2/analytics/users/aggregates/query.",
  ),
});

function formatErrorMessage(error: unknown): string {
  if (isUnauthorizedError(error)) {
    return "Failed to run users aggregates query: Unauthorized access. Please check API credentials or permissions";
  }

  if (isMissingPermissionsError(error)) {
    return "Failed to run users aggregates query: Missing required permissions";
  }

  return `Failed to run users aggregates query: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
}

export const analyticsUsersAggregates: ToolFactory<
  ToolDependencies,
  typeof paramsSchema
> = ({ analyticsApi }) =>
  createTool({
    schema: {
      name: "analytics_users_aggregates",
      annotations: { title: "Analytics Users Aggregates" },
      description:
        "Runs a synchronous users aggregates query and returns interval-based metrics grouped and filtered by user dimensions.",
      paramsSchema,
    },
    call: async ({ query }) => {
      let response: Models.UserAggregateQueryResponse;

      try {
        response = await analyticsApi.postAnalyticsUsersAggregatesQuery(
          query as unknown as Models.UserAggregationQuery,
        );
      } catch (error: unknown) {
        return errorEnvelopeResult(formatErrorMessage(error));
      }

      return successEnvelopeResult(response, {
        endpoint: "/api/v2/analytics/users/aggregates/query",
      });
    },
  });
