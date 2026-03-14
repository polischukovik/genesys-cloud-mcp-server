import type { AnalyticsApi, Models } from "purecloud-platform-client-v2";
import { z } from "zod";
import { activityQuerySchema } from "./utils/analyticsSchemas.js";
import { createTool, type ToolFactory } from "./utils/createTool.js";
import { isMissingPermissionsError } from "./utils/genesys/isMissingPermissionsError.js";
import { isUnauthorizedError } from "./utils/genesys/isUnauthorizedError.js";
import {
  errorEnvelopeResult,
  successEnvelopeResult,
} from "./utils/resultEnvelope.js";

export interface ToolDependencies {
  readonly analyticsApi: Pick<AnalyticsApi, "postAnalyticsUsersActivityQuery">;
}

const paramsSchema = z.object({
  query: activityQuerySchema.describe(
    "UserActivityQuery payload for POST /api/v2/analytics/users/activity/query.",
  ),
  pageSize: z
    .number()
    .int()
    .positive()
    .max(500)
    .optional()
    .describe("Optional page size. Maximum value is 500"),
  pageNumber: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Optional page number, starting from 1"),
});

function formatErrorMessage(error: unknown): string {
  if (isUnauthorizedError(error)) {
    return "Failed to run users activity query: Unauthorized access. Please check API credentials or permissions";
  }

  if (isMissingPermissionsError(error)) {
    return "Failed to run users activity query: Missing required permissions";
  }

  return `Failed to run users activity query: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
}

export const analyticsUsersActivity: ToolFactory<
  ToolDependencies,
  typeof paramsSchema
> = ({ analyticsApi }) =>
  createTool({
    schema: {
      name: "analytics_users_activity",
      annotations: { title: "Analytics Users Activity" },
      description:
        "Runs a users activity query and returns activity grouped by requested user, team, queue, and status dimensions.",
      paramsSchema,
    },
    call: async ({ query, pageSize, pageNumber }) => {
      let response: Models.UserActivityResponse;

      try {
        response = await analyticsApi.postAnalyticsUsersActivityQuery(
          query as unknown as Models.UserActivityQuery,
          pageSize || pageNumber ? { pageSize, pageNumber } : undefined,
        );
      } catch (error: unknown) {
        return errorEnvelopeResult(formatErrorMessage(error));
      }

      return successEnvelopeResult(response, {
        endpoint: "/api/v2/analytics/users/activity/query",
      });
    },
  });
