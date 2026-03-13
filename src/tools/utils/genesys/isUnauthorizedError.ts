/**
 * Checks if an object is an Unauthorized error.
 */
export function isUnauthorizedError(obj: unknown): boolean {
  if (typeof obj === "object" && obj !== null) {
    const error = obj as { code?: string; status?: number };

    if (error.code && error.status) {
      return error.code === "not.authorized" && error.status === 403;
    }
  }
  return false;
}
