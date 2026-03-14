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
  readonly analyticsApi: Pick<
    AnalyticsApi,
    "postAnalyticsConversationsActivityQuery"
  >;
}

const paramsSchema = z.object({
  query: activityQuerySchema.describe(
    "ConversationActivityQuery payload for POST /api/v2/analytics/conversations/activity/query.",
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
    return "Failed to run conversations activity query: Unauthorized access. Please check API credentials or permissions";
  }

  if (isMissingPermissionsError(error)) {
    return "Failed to run conversations activity query: Missing required permissions";
  }

  return `Failed to run conversations activity query: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
}

export const analyticsConversationsActivity: ToolFactory<
  ToolDependencies,
  typeof paramsSchema
> = ({ analyticsApi }) =>
  createTool({
    schema: {
      name: "analytics_conversations_activity",
      annotations: { title: "Analytics Conversations Activity" },
      description:
        "Runs a conversations activity query and returns current/near-real-time activity observations grouped by requested dimensions.",
      paramsSchema,
    },
    call: async ({ query, pageSize, pageNumber }) => {
      let response: Models.ConversationActivityResponse;

      try {
        response = await analyticsApi.postAnalyticsConversationsActivityQuery(
          query as unknown as Models.ConversationActivityQuery,
          pageSize || pageNumber ? { pageSize, pageNumber } : undefined,
        );
      } catch (error: unknown) {
        return errorEnvelopeResult(formatErrorMessage(error));
      }

      return successEnvelopeResult(response, {
        endpoint: "/api/v2/analytics/conversations/activity/query",
      });
    },
  });
