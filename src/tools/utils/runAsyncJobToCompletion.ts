import { waitFor } from "./waitFor.js";

const DEFAULT_MAX_POLL_ATTEMPTS = 40;
const DEFAULT_POLL_INTERVAL_MS = 3_000;
const DEFAULT_MAX_RESULT_PAGES = 25;

const TERMINAL_ERROR_STATES = new Set(["FAILED", "CANCELLED", "EXPIRED"]);

export interface AsyncJobStatusLike {
  state?: string;
  errorMessage?: string;
}

export interface AsyncJobPageLike {
  cursor?: string;
}

export interface RunAsyncJobToCompletionConfig<TPage extends AsyncJobPageLike> {
  createJob: () => Promise<{ jobId?: string }>;
  getJobStatus: (jobId: string) => Promise<AsyncJobStatusLike>;
  getResultsPage: (jobId: string, cursor?: string) => Promise<TPage>;
  maxPollAttempts?: number;
  pollIntervalMs?: number;
  maxResultPages?: number;
}

export interface RunAsyncJobToCompletionResult<TPage extends AsyncJobPageLike> {
  jobId: string;
  finalStatus: AsyncJobStatusLike;
  pollAttempts: number;
  pageCount: number;
  pages: TPage[];
  truncated: boolean;
  nextCursor?: string;
}

function normalizeState(status: AsyncJobStatusLike): string {
  return (status.state ?? "UNKNOWN").toUpperCase();
}

function normalizeCursor(cursor: string | undefined): string | undefined {
  if (!cursor) {
    return undefined;
  }

  const trimmed = cursor.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function runAsyncJobToCompletion<TPage extends AsyncJobPageLike>({
  createJob,
  getJobStatus,
  getResultsPage,
  maxPollAttempts = DEFAULT_MAX_POLL_ATTEMPTS,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  maxResultPages = DEFAULT_MAX_RESULT_PAGES,
}: RunAsyncJobToCompletionConfig<TPage>): Promise<
  RunAsyncJobToCompletionResult<TPage>
> {
  const createResponse = await createJob();
  const jobId = createResponse.jobId;

  if (!jobId) {
    throw new Error("Job ID not returned by Genesys Cloud for async query");
  }

  let finalStatus: AsyncJobStatusLike = {};
  let pollAttempts = 0;

  while (pollAttempts < maxPollAttempts) {
    finalStatus = await getJobStatus(jobId);
    const state = normalizeState(finalStatus);

    if (state === "FULFILLED") {
      break;
    }

    if (TERMINAL_ERROR_STATES.has(state)) {
      throw new Error(
        finalStatus.errorMessage
          ? `Async query ${state.toLowerCase()}: ${finalStatus.errorMessage}`
          : `Async query ${state.toLowerCase()}`,
      );
    }

    pollAttempts += 1;
    if (pollAttempts >= maxPollAttempts) {
      break;
    }

    await waitFor(pollIntervalMs);
  }

  if (normalizeState(finalStatus) !== "FULFILLED") {
    throw new Error(
      `Timed out waiting for async query completion after ${maxPollAttempts} polling attempts`,
    );
  }

  const pages: TPage[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;
  let nextCursor: string | undefined;

  for (let pageIndex = 0; pageIndex < maxResultPages; pageIndex += 1) {
    const page = await getResultsPage(jobId, cursor);
    pages.push(page);

    const candidateCursor = normalizeCursor(page.cursor);
    if (!candidateCursor || seenCursors.has(candidateCursor)) {
      nextCursor = undefined;
      break;
    }

    nextCursor = candidateCursor;
    if (pageIndex === maxResultPages - 1) {
      break;
    }

    seenCursors.add(candidateCursor);
    cursor = candidateCursor;
  }

  return {
    jobId,
    finalStatus,
    pollAttempts,
    pageCount: pages.length,
    pages,
    truncated: Boolean(nextCursor),
    ...(nextCursor ? { nextCursor } : {}),
  };
}

export function collectArrayFieldFromPages<
  TPage extends Record<string, unknown>,
>(pages: TPage[], fieldName: string): unknown[] {
  const flattened: unknown[] = [];

  for (const page of pages) {
    const field = page[fieldName];
    if (Array.isArray(field)) {
      flattened.push(...field);
    }
  }

  return flattened;
}
