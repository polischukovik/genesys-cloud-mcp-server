import type { AnalyticsApi, Models } from "purecloud-platform-client-v2";
import { z } from "zod";
import { conversationAggregationQuerySchema } from "./utils/analyticsSchemas.js";
import { createTool, type ToolFactory } from "./utils/createTool.js";
import { errorResult } from "./utils/errorResult.js";
import { isMissingPermissionsError } from "./utils/genesys/isMissingPermissionsError.js";
import { isUnauthorizedError } from "./utils/genesys/isUnauthorizedError.js";

export interface ToolDependencies {
  readonly analyticsApi: Pick<
    AnalyticsApi,
    "postAnalyticsConversationsAggregatesQuery"
  >;
}

const paramsSchema = z.object({
  query: conversationAggregationQuerySchema.describe(
    "ConversationAggregationQuery payload for POST /api/v2/analytics/conversations/aggregates/query.",
  ),
});

function formatErrorMessage(error: unknown): string {
  if (isUnauthorizedError(error)) {
    return "Failed to run conversations aggregates query: Unauthorized access. Please check API credentials or permissions";
  }

  if (isMissingPermissionsError(error)) {
    return "Failed to run conversations aggregates query: Missing required permissions";
  }

  return `Failed to run conversations aggregates query: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
}

export const analyticsConversationsAggregates: ToolFactory<
  ToolDependencies,
  typeof paramsSchema
> = ({ analyticsApi }) =>
  createTool({
    schema: {
      name: "analytics_conversations_aggregates",
      annotations: { title: "Analytics Conversations Aggregates" },
      description:
        "Runs a synchronous conversations aggregates query and returns interval-based metrics grouped and filtered by conversation dimensions.",
      paramsSchema,
    },
    call: async ({ query }) => {
      let response: Models.ConversationAggregateQueryResponse;

      try {
        response = await analyticsApi.postAnalyticsConversationsAggregatesQuery(
          query as unknown as Models.ConversationAggregationQuery,
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
