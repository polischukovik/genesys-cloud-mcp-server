import type {
  AuthorizationApi,
  Models,
  UsersApi,
} from "purecloud-platform-client-v2";
import { isMissingPermissionsError } from "./genesys/isMissingPermissionsError.js";
import { isUnauthorizedError } from "./genesys/isUnauthorizedError.js";

const CHUNK_SIZE = 100;

export interface ResolutionDependencies {
  readonly usersApi: Pick<UsersApi, "getUsers">;
  readonly authorizationApi: Pick<
    AuthorizationApi,
    "getAuthorizationDivisions"
  >;
}

export interface ResolvedUser {
  id: string;
  name?: string;
  divisionId?: string;
  divisionName?: string;
}

export interface ResolvedDivision {
  id: string;
  name?: string;
}

export interface UserDivisionResolutionResult {
  usersById: Record<string, ResolvedUser>;
  divisionsById: Record<string, ResolvedDivision>;
  warnings: string[];
}

function chunk<T>(items: T[], size: number): T[][] {
  const output: T[][] = [];

  for (let i = 0; i < items.length; i += size) {
    output.push(items.slice(i, i + size));
  }

  return output;
}

function normalizeIds(ids: string[] | undefined): string[] {
  if (!ids) {
    return [];
  }

  const normalized = new Set<string>();
  for (const id of ids) {
    const trimmed = id?.trim();
    if (!trimmed || trimmed.toLowerCase() === "unknown") {
      continue;
    }
    normalized.add(trimmed);
  }

  return Array.from(normalized.values());
}

function formatResolverWarning(subject: string, error: unknown): string {
  if (isUnauthorizedError(error)) {
    return `${subject} resolution skipped: unauthorized access`;
  }

  if (isMissingPermissionsError(error)) {
    return `${subject} resolution skipped: missing permissions`;
  }

  return `${subject} resolution skipped: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
}

export async function resolveUsersAndDivisions({
  usersApi,
  authorizationApi,
  userIds,
  divisionIds,
  resolveUsers = true,
  resolveDivisions = true,
}: ResolutionDependencies & {
  userIds?: string[];
  divisionIds?: string[];
  resolveUsers?: boolean;
  resolveDivisions?: boolean;
}): Promise<UserDivisionResolutionResult> {
  const usersById: Record<string, ResolvedUser> = {};
  const divisionsById: Record<string, ResolvedDivision> = {};
  const warnings: string[] = [];

  const normalizedUserIds = normalizeIds(userIds);
  const baseDivisionIds = normalizeIds(divisionIds);
  const userDivisionIds = new Set<string>();

  if (resolveUsers && normalizedUserIds.length > 0) {
    for (const userIdChunk of chunk(normalizedUserIds, CHUNK_SIZE)) {
      let usersResponse: Models.UserEntityListing;
      try {
        usersResponse = await usersApi.getUsers({
          id: userIdChunk,
          pageSize: userIdChunk.length,
          expand: ["division"],
        });
      } catch (error: unknown) {
        warnings.push(formatResolverWarning("User", error));
        break;
      }

      for (const user of usersResponse.entities ?? []) {
        if (!user.id) {
          continue;
        }

        usersById[user.id] = {
          id: user.id,
          ...(user.name ? { name: user.name } : {}),
          ...(user.division?.id ? { divisionId: user.division.id } : {}),
          ...(user.division?.name ? { divisionName: user.division.name } : {}),
        };

        if (user.division?.id) {
          userDivisionIds.add(user.division.id);
        }
      }
    }
  }

  const normalizedDivisionIds = Array.from(
    new Set([...baseDivisionIds, ...Array.from(userDivisionIds.values())]),
  );

  if (resolveDivisions && normalizedDivisionIds.length > 0) {
    for (const divisionIdChunk of chunk(normalizedDivisionIds, CHUNK_SIZE)) {
      let divisionsResponse: Models.AuthzDivisionEntityListing;

      try {
        divisionsResponse = await authorizationApi.getAuthorizationDivisions({
          id: divisionIdChunk,
          pageSize: divisionIdChunk.length,
        });
      } catch (error: unknown) {
        warnings.push(formatResolverWarning("Division", error));
        break;
      }

      for (const division of divisionsResponse.entities ?? []) {
        if (!division.id) {
          continue;
        }

        divisionsById[division.id] = {
          id: division.id,
          ...(division.name ? { name: division.name } : {}),
        };
      }
    }
  }

  for (const user of Object.values(usersById)) {
    if (!user.divisionId || user.divisionName) {
      continue;
    }

    const resolvedDivision = divisionsById[user.divisionId];
    if (resolvedDivision?.name) {
      user.divisionName = resolvedDivision.name;
    }
  }

  return {
    usersById,
    divisionsById,
    warnings,
  };
}

export function collectUserAndDivisionIdsFromValue(value: unknown): {
  userIds: string[];
  divisionIds: string[];
} {
  const userIds = new Set<string>();
  const divisionIds = new Set<string>();
  const queue: unknown[] = [value];

  while (queue.length > 0) {
    const next = queue.pop();

    if (!next || typeof next !== "object") {
      continue;
    }

    if (Array.isArray(next)) {
      for (const item of next) {
        queue.push(item);
      }
      continue;
    }

    for (const [key, nestedValue] of Object.entries(
      next as Record<string, unknown>,
    )) {
      if (key === "userId" && typeof nestedValue === "string") {
        userIds.add(nestedValue);
      } else if (key === "divisionId" && typeof nestedValue === "string") {
        divisionIds.add(nestedValue);
      }

      if (nestedValue && typeof nestedValue === "object") {
        queue.push(nestedValue);
      }
    }
  }

  return {
    userIds: Array.from(userIds.values()),
    divisionIds: Array.from(divisionIds.values()),
  };
}
