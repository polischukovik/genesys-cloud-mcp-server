import type { AnalyticsApi, Models } from "purecloud-platform-client-v2";
import { z } from "zod";
import { createTool, type ToolFactory } from "./utils/createTool.js";
import { errorResult } from "./utils/errorResult.js";
import { isMissingPermissionsError } from "./utils/genesys/isMissingPermissionsError.js";
import { isUnauthorizedError } from "./utils/genesys/isUnauthorizedError.js";

export interface ToolDependencies {
  readonly analyticsApi: Pick<
    AnalyticsApi,
    "postAnalyticsConversationsDetailsQuery"
  >;
}

const paramsSchema = z.object({
  query: z
    .record(z.unknown())
    .describe(
      "ConversationQuery payload for POST /api/v2/analytics/conversations/details/query. Example: { interval, conversationFilters?, segmentFilters?, order?, orderBy?, paging?, aggregations? }",
    ),
});

function formatErrorMessage(error: unknown): string {
  if (isUnauthorizedError(error)) {
    return "Failed to run conversations details query: Unauthorized access. Please check API credentials or permissions";
  }

  if (isMissingPermissionsError(error)) {
    return "Failed to run conversations details query: Missing required permissions";
  }

  return `Failed to run conversations details query: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
}

export const analyticsConversationsDetailsQuery: ToolFactory<
  ToolDependencies,
  typeof paramsSchema
> = ({ analyticsApi }) =>
  createTool({
    schema: {
      name: "analytics_conversations_details_query",
      annotations: { title: "Analytics Conversations Details Query" },
      description:
        "Runs a synchronous conversations details query and returns conversation-level records for the requested interval, filters, sorting, and paging.",
      paramsSchema,
    },
    call: async ({ query }) => {
      let response: Models.AnalyticsConversationQueryResponse;

      try {
        response = await analyticsApi.postAnalyticsConversationsDetailsQuery(
          query as unknown as Models.ConversationQuery,
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
