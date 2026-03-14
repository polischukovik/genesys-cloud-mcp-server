import type {
  AnalyticsApi,
  AuthorizationApi,
  Models,
  UsersApi,
} from "purecloud-platform-client-v2";
import { z } from "zod";
import { isoIntervalSchema } from "./utils/analyticsSchemas.js";
import { createTool, type ToolFactory } from "./utils/createTool.js";
import { isMissingPermissionsError } from "./utils/genesys/isMissingPermissionsError.js";
import { isUnauthorizedError } from "./utils/genesys/isUnauthorizedError.js";
import { resolveUsersAndDivisions } from "./utils/resolveUsersAndDivisions.js";
import {
  errorEnvelopeResult,
  successEnvelopeResult,
} from "./utils/resultEnvelope.js";

const DEFAULT_AGENT_KPI_METRICS = [
  "nConnected",
  "nAnswered",
  "tHandle",
  "tTalk",
  "tAcw",
  "tWait",
] as const;

export interface ToolDependencies {
  readonly analyticsApi: Pick<
    AnalyticsApi,
    "postAnalyticsConversationsAggregatesQuery"
  >;
  readonly usersApi: Pick<UsersApi, "getUsers">;
  readonly authorizationApi: Pick<
    AuthorizationApi,
    "getAuthorizationDivisions"
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
  userIds: z
    .array(z.string().uuid())
    .max(500)
    .optional()
    .describe("Optional user IDs to limit the KPI summary"),
  queueIds: z
    .array(z.string().uuid())
    .max(300)
    .optional()
    .describe("Optional queue IDs to filter interactions"),
  metrics: z
    .array(z.string())
    .min(1)
    .optional()
    .describe(
      "Optional aggregate metrics override. Defaults to common agent KPI metrics",
    ),
  includeRawResponse: z
    .boolean()
    .optional()
    .describe("When true, include the raw aggregate response payload"),
  resolveUsers: z
    .boolean()
    .optional()
    .describe(
      "When true, resolves user IDs to user names and division metadata. Default: true",
    ),
  resolveDivisions: z
    .boolean()
    .optional()
    .describe(
      "When true, resolves division IDs to division names. Default: true",
    ),
});

function formatErrorMessage(error: unknown): string {
  if (isUnauthorizedError(error)) {
    return "Failed to compute agent KPI summary: Unauthorized access. Please check API credentials or permissions";
  }

  if (isMissingPermissionsError(error)) {
    return "Failed to compute agent KPI summary: Missing required permissions";
  }

  return `Failed to compute agent KPI summary: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
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

function buildAgentFilter(
  userIds: string[] | undefined,
  queueIds: string[] | undefined,
): Models.ConversationAggregateQueryFilter | undefined {
  const clauses: Models.ConversationAggregateQueryClause[] = [];

  if (userIds && userIds.length > 0) {
    clauses.push({
      type: "or",
      predicates: userIds.map((userId) => ({
        dimension: "userId",
        value: userId,
      })),
    });
  }

  if (queueIds && queueIds.length > 0) {
    clauses.push({
      type: "or",
      predicates: queueIds.map((queueId) => ({
        dimension: "queueId",
        value: queueId,
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

export const kpiAgentPerformanceSummary: ToolFactory<
  ToolDependencies,
  typeof paramsSchema
> = ({ analyticsApi, usersApi, authorizationApi }) =>
  createTool({
    schema: {
      name: "kpi_agent_performance_summary",
      annotations: { title: "KPI Agent Performance Summary" },
      description:
        "Opinionated agent KPI summary grouped by userId, including interactions plus handle/talk/ACW/wait timing metrics with derived averages.",
      paramsSchema,
    },
    call: async ({
      interval,
      granularity,
      userIds,
      queueIds,
      metrics,
      includeRawResponse,
      resolveUsers = true,
      resolveDivisions = true,
    }) => {
      const filter = buildAgentFilter(userIds, queueIds);
      const query: Models.ConversationAggregationQuery = {
        interval,
        metrics:
          metrics && metrics.length > 0
            ? metrics
            : [...DEFAULT_AGENT_KPI_METRICS],
        groupBy: ["userId"],
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

      const agentSummaries = (response.results ?? []).map((result) => {
        const userId = result.group?.userId ?? "unknown";
        const connected = (result.data ?? []).reduce(
          (acc, data) => acc + metricStat(data, "nConnected", "sum"),
          0,
        );
        const answered = (result.data ?? []).reduce(
          (acc, data) => acc + metricStat(data, "nAnswered", "sum"),
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
        const talkSum = (result.data ?? []).reduce(
          (acc, data) => acc + metricStat(data, "tTalk", "sum"),
          0,
        );
        const talkCount = (result.data ?? []).reduce(
          (acc, data) => acc + metricStat(data, "tTalk", "count"),
          0,
        );
        const acwSum = (result.data ?? []).reduce(
          (acc, data) => acc + metricStat(data, "tAcw", "sum"),
          0,
        );
        const acwCount = (result.data ?? []).reduce(
          (acc, data) => acc + metricStat(data, "tAcw", "count"),
          0,
        );

        return {
          userId,
          connected,
          answered,
          averageHandleMs: handleCount > 0 ? handleSum / handleCount : null,
          averageTalkMs: talkCount > 0 ? talkSum / talkCount : null,
          averageAcwMs: acwCount > 0 ? acwSum / acwCount : null,
        };
      });

      const resolution = await resolveUsersAndDivisions({
        usersApi,
        authorizationApi,
        userIds: agentSummaries.map((summary) => summary.userId),
        resolveUsers,
        resolveDivisions,
      });

      const enrichedAgentSummaries = agentSummaries.map((summary) => {
        const resolvedUser = resolution.usersById[summary.userId];

        if (!resolvedUser) {
          return summary;
        }

        return {
          ...summary,
          ...(resolvedUser.name ? { userName: resolvedUser.name } : {}),
          ...(resolvedUser.divisionId
            ? { divisionId: resolvedUser.divisionId }
            : {}),
          ...(resolvedUser.divisionName
            ? { divisionName: resolvedUser.divisionName }
            : {}),
        };
      });

      return successEnvelopeResult(
        {
          query,
          agentSummaries: enrichedAgentSummaries,
          totals: {
            connected: enrichedAgentSummaries.reduce(
              (acc, summary) => acc + summary.connected,
              0,
            ),
            answered: enrichedAgentSummaries.reduce(
              (acc, summary) => acc + summary.answered,
              0,
            ),
          },
          ...(Object.keys(resolution.usersById).length > 0
            ? { resolvedUsers: resolution.usersById }
            : {}),
          ...(Object.keys(resolution.divisionsById).length > 0
            ? { resolvedDivisions: resolution.divisionsById }
            : {}),
          ...(includeRawResponse ? { response } : {}),
        },
        {
          endpoint: "/api/v2/analytics/conversations/aggregates/query",
          ...(resolution.warnings.length > 0
            ? { resolutionWarnings: resolution.warnings }
            : {}),
        },
      );
    },
  });
