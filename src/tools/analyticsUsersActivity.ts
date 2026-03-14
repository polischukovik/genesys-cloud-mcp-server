import type {
  AnalyticsApi,
  AuthorizationApi,
  Models,
  UsersApi,
} from "purecloud-platform-client-v2";
import { z } from "zod";
import { activityQuerySchema } from "./utils/analyticsSchemas.js";
import { createTool, type ToolFactory } from "./utils/createTool.js";
import { isMissingPermissionsError } from "./utils/genesys/isMissingPermissionsError.js";
import { isUnauthorizedError } from "./utils/genesys/isUnauthorizedError.js";
import {
  collectUserAndDivisionIdsFromValue,
  resolveUsersAndDivisions,
} from "./utils/resolveUsersAndDivisions.js";
import {
  errorEnvelopeResult,
  successEnvelopeResult,
} from "./utils/resultEnvelope.js";

export interface ToolDependencies {
  readonly analyticsApi: Pick<AnalyticsApi, "postAnalyticsUsersActivityQuery">;
  readonly usersApi: Pick<UsersApi, "getUsers">;
  readonly authorizationApi: Pick<
    AuthorizationApi,
    "getAuthorizationDivisions"
  >;
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
  resolveUsers: z
    .boolean()
    .optional()
    .describe(
      "When true, resolves user IDs found in results to user names and division metadata. Default: true",
    ),
  resolveDivisions: z
    .boolean()
    .optional()
    .describe(
      "When true, resolves division IDs found in results to division names. Default: true",
    ),
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
> = ({ analyticsApi, usersApi, authorizationApi }) =>
  createTool({
    schema: {
      name: "analytics_users_activity",
      annotations: { title: "Analytics Users Activity" },
      description:
        "Runs a users activity query and returns activity grouped by requested user, team, queue, and status dimensions.",
      paramsSchema,
    },
    call: async ({
      query,
      pageSize,
      pageNumber,
      resolveUsers = true,
      resolveDivisions = true,
    }) => {
      let response: Models.UserActivityResponse;

      try {
        response = await analyticsApi.postAnalyticsUsersActivityQuery(
          query as unknown as Models.UserActivityQuery,
          pageSize || pageNumber ? { pageSize, pageNumber } : undefined,
        );
      } catch (error: unknown) {
        return errorEnvelopeResult(formatErrorMessage(error));
      }

      const ids = collectUserAndDivisionIdsFromValue(response);
      const resolution = await resolveUsersAndDivisions({
        usersApi,
        authorizationApi,
        userIds: ids.userIds,
        divisionIds: ids.divisionIds,
        resolveUsers,
        resolveDivisions,
      });

      const responseWithResolution = {
        ...response,
        ...(Object.keys(resolution.usersById).length > 0
          ? { resolvedUsers: resolution.usersById }
          : {}),
        ...(Object.keys(resolution.divisionsById).length > 0
          ? { resolvedDivisions: resolution.divisionsById }
          : {}),
      };

      return successEnvelopeResult(responseWithResolution, {
        endpoint: "/api/v2/analytics/users/activity/query",
        ...(resolution.warnings.length > 0
          ? { resolutionWarnings: resolution.warnings }
          : {}),
      });
    },
  });
