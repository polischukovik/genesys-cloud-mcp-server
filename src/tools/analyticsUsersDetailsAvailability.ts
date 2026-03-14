import type { AnalyticsApi, Models } from "purecloud-platform-client-v2";
import { z } from "zod";
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
    "getAnalyticsUsersDetailsJobsAvailability"
  >;
}

const paramsSchema = z.object({});

function formatErrorMessage(error: unknown): string {
  if (isUnauthorizedError(error)) {
    return "Failed to fetch users details availability: Unauthorized access. Please check API credentials or permissions";
  }

  if (isMissingPermissionsError(error)) {
    return "Failed to fetch users details availability: Missing required permissions";
  }

  return `Failed to fetch users details availability: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
}

export const analyticsUsersDetailsAvailability: ToolFactory<
  ToolDependencies,
  typeof paramsSchema
> = ({ analyticsApi }) =>
  createTool({
    schema: {
      name: "analytics_users_details_availability",
      annotations: { title: "Analytics Users Details Availability" },
      description:
        "Returns the current data-lake availability timestamp for users details jobs.",
      paramsSchema,
    },
    call: async () => {
      let response: Models.DataAvailabilityResponse;

      try {
        response =
          await analyticsApi.getAnalyticsUsersDetailsJobsAvailability();
      } catch (error: unknown) {
        return errorEnvelopeResult(formatErrorMessage(error));
      }

      return successEnvelopeResult(response, {
        endpoint: "/api/v2/analytics/users/details/jobs/availability",
      });
    },
  });
