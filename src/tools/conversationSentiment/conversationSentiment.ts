import type {
  Models,
  SpeechTextAnalyticsApi,
} from "purecloud-platform-client-v2";
import { z } from "zod";
import { createTool, type ToolFactory } from "../utils/createTool.js";
import { errorResult } from "../utils/errorResult.js";
import { isUnauthorizedError } from "../utils/genesys/isUnauthorizedError.js";
import { interpretSentiment } from "./interpretSentiment.js";
import { isConversationNotFoundError } from "./isConversationNotFoundError.js";

export interface ToolDependencies {
  readonly speechTextAnalyticsApi: Pick<
    SpeechTextAnalyticsApi,
    "getSpeechandtextanalyticsConversation"
  >;
}

const paramsSchema = z.object({
  conversationIds: z
    .array(
      z
        .string()
        .uuid()
        .describe(
          "A UUID for a conversation. (e.g., 00000000-0000-0000-0000-000000000000)",
        ),
    )
    .min(1)
    .max(100)
    .describe("A list of up to 100 conversation IDs to retrieve sentiment for"),
});

export const conversationSentiment: ToolFactory<
  ToolDependencies,
  typeof paramsSchema
> = ({ speechTextAnalyticsApi }) =>
  createTool({
    schema: {
      name: "conversation_sentiment",
      description:
        "Returns customer sentiment for each conversation ID as a normalized score (-100 to 100) with a human-readable sentiment label.",
      annotations: { title: "Conversation Sentiment" },
      paramsSchema,
    },
    call: async ({ conversationIds }) => {
      const conversations: PromiseSettledResult<Models.ConversationMetrics>[] =
        [];

      conversations.push(
        ...(await Promise.allSettled(
          conversationIds.map((id) =>
            speechTextAnalyticsApi.getSpeechandtextanalyticsConversation(id),
          ),
        )),
      );

      const output: (
        | {
            found: true;
            conversationId: string;
            sentimentScore: number;
            sentimentDescription: string;
          }
        | { found: false; conversationId: string }
      )[] = [];

      for (const convo of conversations) {
        if (convo.status === "fulfilled") {
          const id = convo.value.conversation?.id;
          const score = convo.value.sentimentScore;

          if (id === undefined || score === undefined) continue;
          const scaledScore = Math.round(score * 100);

          output.push({
            found: true,
            conversationId: id,
            sentimentScore: scaledScore,
            sentimentDescription: interpretSentiment(scaledScore),
          });
        } else {
          const result = isConversationNotFoundError(convo.reason);
          if (result.isResourceNotFoundError && result.conversationId) {
            output.push({
              conversationId: result.conversationId,
              found: false,
            });
          } else if (isUnauthorizedError(convo.reason)) {
            return errorResult(
              "Failed to retrieve sentiment analysis: Unauthorized access. Please check API credentials or permissions",
            );
          } else {
            // Ignore conversation
          }
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              conversationsWithSentiment: output
                .filter((o) => o.found)
                .map((o) => ({
                  conversationId: o.conversationId,
                  sentimentScore: o.sentimentScore,
                  sentimentDescription: o.sentimentDescription,
                })),
              conversationsWithoutSentiment: output
                .filter((o) => !o.found)
                .map((o) => o.conversationId),
            }),
          },
        ],
      };
    },
  });
