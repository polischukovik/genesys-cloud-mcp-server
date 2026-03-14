import type { AnalyticsApi, Models } from "purecloud-platform-client-v2";
import { z } from "zod";
import { isoIntervalSchema } from "./utils/analyticsSchemas.js";
import { createTool, type ToolFactory } from "./utils/createTool.js";
import { isMissingPermissionsError } from "./utils/genesys/isMissingPermissionsError.js";
import { isUnauthorizedError } from "./utils/genesys/isUnauthorizedError.js";
import {
  errorEnvelopeResult,
  successEnvelopeResult,
} from "./utils/resultEnvelope.js";

const DEFAULT_QUEUE_KPI_METRICS = [
  "nOffered",
  "nAnswered",
  "nAbandon",
  "tHandle",
  "tTalk",
  "tWait",
  "tAcw",
] as const;

export interface ToolDependencies {
  readonly analyticsApi: Pick<
    AnalyticsApi,
    "postAnalyticsConversationsAggregatesQuery"
  >;
}

const paramsSchema = z.object({
  interval: isoIntervalSchema.describe(
    "ISO-8601 interval in the form start/end.",
  ),
  granularity: z
    .string()
    .optional()
    .describe("Optional granularity (for example: PT30M, PT1H, P1D)."),
  queueIds: z
    .array(z.string().uuid())
    .max(300)
    .optional()
    .describe("Optional queue IDs to limit the KPI summary"),
  mediaTypes: z
    .array(z.string())
    .optional()
    .describe("Optional media types filter (for example: voice, chat, email)"),
  metrics: z
    .array(z.string())
    .min(1)
    .optional()
    .describe(
      "Optional aggregate metrics override. Defaults to common queue KPI metrics",
    ),
  includeRawResponse: z
    .boolean()
    .optional()
    .describe("When true, include the raw aggregate response payload"),
});

function formatErrorMessage(error: unknown): string {
  if (isUnauthorizedError(error)) {
    return "Failed to compute queue KPI summary: Unauthorized access. Please check API credentials or permissions";
  }

  if (isMissingPermissionsError(error)) {
    return "Failed to compute queue KPI summary: Missing required permissions";
  }

  return `Failed to compute queue KPI summary: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
}

function metricStat(
  data: Models.StatisticalResponse | undefined,
  metricName: string,
  statName: keyof Models.StatisticalSummary,
): number {
  const metric = data?.metrics?.find((item) => item.metric === metricName);
  const value = metric?.stats?.[statName];
  return typeof value === "number" ? value : 0;
}

function buildQueueFilter(
  queueIds: string[] | undefined,
  mediaTypes: string[] | undefined,
): Models.ConversationAggregateQueryFilter | undefined {
  const clauses: Models.ConversationAggregateQueryClause[] = [];

  if (queueIds && queueIds.length > 0) {
    clauses.push({
      type: "or",
      predicates: queueIds.map((queueId) => ({
        dimension: "queueId",
        value: queueId,
      })),
    });
  }

  if (mediaTypes && mediaTypes.length > 0) {
    clauses.push({
      type: "or",
      predicates: mediaTypes.map((mediaType) => ({
        dimension: "mediaType",
        value: mediaType,
      })),
    });
  }

  if (clauses.length === 0) {
    return undefined;
  }

  if (clauses.length === 1) {
    return {
      type: clauses[0].type,
      predicates: clauses[0].predicates,
    };
  }

  return {
    type: "and",
    clauses,
  };
}

export const kpiQueuePerformanceSummary: ToolFactory<
  ToolDependencies,
  typeof paramsSchema
> = ({ analyticsApi }) =>
  createTool({
    schema: {
      name: "kpi_queue_performance_summary",
      annotations: { title: "KPI Queue Performance Summary" },
      description:
        "Opinionated queue KPI summary with offered/answered/abandon and handle/wait/talk/ACW metrics, including derived answer and abandon rates.",
      paramsSchema,
    },
    call: async ({
      interval,
      granularity,
      queueIds,
      mediaTypes,
      metrics,
      includeRawResponse,
    }) => {
      const filter = buildQueueFilter(queueIds, mediaTypes);
      const query: Models.ConversationAggregationQuery = {
        interval,
        metrics:
          metrics && metrics.length > 0
            ? metrics
            : [...DEFAULT_QUEUE_KPI_METRICS],
        groupBy: ["queueId"],
        ...(granularity ? { granularity } : {}),
        ...(filter ? { filter } : {}),
      };

      let response: Models.ConversationAggregateQueryResponse;

      try {
        response =
          await analyticsApi.postAnalyticsConversationsAggregatesQuery(query);
      } catch (error: unknown) {
        return errorEnvelopeResult(formatErrorMessage(error));
      }

      const queueSummaries = (response.results ?? []).map((result) => {
        const queueId = result.group?.queueId ?? "unknown";
        const offered = (result.data ?? []).reduce(
          (acc, data) => acc + metricStat(data, "nOffered", "sum"),
          0,
        );
        const answered = (result.data ?? []).reduce(
          (acc, data) => acc + metricStat(data, "nAnswered", "sum"),
          0,
        );
        const abandoned = (result.data ?? []).reduce(
          (acc, data) => acc + metricStat(data, "nAbandon", "sum"),
          0,
        );
        const handleSum = (result.data ?? []).reduce(
          (acc, data) => acc + metricStat(data, "tHandle", "sum"),
          0,
        );
        const handleCount = (result.data ?? []).reduce(
          (acc, data) => acc + metricStat(data, "tHandle", "count"),
          0,
        );
        const waitSum = (result.data ?? []).reduce(
          (acc, data) => acc + metricStat(data, "tWait", "sum"),
          0,
        );
        const waitCount = (result.data ?? []).reduce(
          (acc, data) => acc + metricStat(data, "tWait", "count"),
          0,
        );

        return {
          queueId,
          offered,
          answered,
          abandoned,
          answerRate: offered > 0 ? answered / offered : null,
          abandonRate: offered > 0 ? abandoned / offered : null,
          averageHandleMs: handleCount > 0 ? handleSum / handleCount : null,
          averageWaitMs: waitCount > 0 ? waitSum / waitCount : null,
        };
      });

      return successEnvelopeResult(
        {
          query,
          queueSummaries,
          totals: {
            offered: queueSummaries.reduce(
              (acc, summary) => acc + summary.offered,
              0,
            ),
            answered: queueSummaries.reduce(
              (acc, summary) => acc + summary.answered,
              0,
            ),
            abandoned: queueSummaries.reduce(
              (acc, summary) => acc + summary.abandoned,
              0,
            ),
          },
          ...(includeRawResponse ? { response } : {}),
        },
        {
          endpoint: "/api/v2/analytics/conversations/aggregates/query",
        },
      );
    },
  });
