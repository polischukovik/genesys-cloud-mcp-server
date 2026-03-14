import { describe, expect, test } from "vitest";
import {
  collectArrayFieldFromPages,
  runAsyncJobToCompletion,
} from "./runAsyncJobToCompletion.js";

describe("runAsyncJobToCompletion", () => {
  test("runs job to completion and follows cursors", async () => {
    const statusCalls: Array<string> = [];
    const resultCalls: Array<string | undefined> = [];

    const result = await runAsyncJobToCompletion({
      createJob: async () => ({ jobId: "job-1" }),
      getJobStatus: async () => {
        statusCalls.push("status");
        if (statusCalls.length < 2) {
          return { state: "RUNNING" };
        }
        return { state: "FULFILLED" };
      },
      getResultsPage: async (_jobId, cursor) => {
        resultCalls.push(cursor);
        if (!cursor) {
          return {
            cursor: "page-2",
            results: [{ id: "a" }],
          };
        }

        return {
          results: [{ id: "b" }],
        };
      },
      pollIntervalMs: 0,
      maxPollAttempts: 5,
      maxResultPages: 5,
    });

    expect(result.jobId).toBe("job-1");
    expect(result.pageCount).toBe(2);
    expect(result.truncated).toBe(false);
    expect(resultCalls).toStrictEqual([undefined, "page-2"]);
    expect(
      collectArrayFieldFromPages(
        result.pages as unknown as Record<string, unknown>[],
        "results",
      ),
    ).toStrictEqual([{ id: "a" }, { id: "b" }]);
  });

  test("throws when job enters terminal error state", async () => {
    await expect(
      runAsyncJobToCompletion({
        createJob: async () => ({ jobId: "job-2" }),
        getJobStatus: async () => ({
          state: "FAILED",
          errorMessage: "Bad query",
        }),
        getResultsPage: async () => ({ results: [] }),
        pollIntervalMs: 0,
      }),
    ).rejects.toThrow("Bad query");
  });

  test("throws when job does not complete within polling attempts", async () => {
    await expect(
      runAsyncJobToCompletion({
        createJob: async () => ({ jobId: "job-3" }),
        getJobStatus: async () => ({ state: "RUNNING" }),
        getResultsPage: async () => ({ results: [] }),
        pollIntervalMs: 0,
        maxPollAttempts: 2,
      }),
    ).rejects.toThrow("Timed out waiting for async query completion");
  });

  test("marks truncated when max result pages is reached and cursor remains", async () => {
    const result = await runAsyncJobToCompletion({
      createJob: async () => ({ jobId: "job-4" }),
      getJobStatus: async () => ({ state: "FULFILLED" }),
      getResultsPage: async (_jobId, cursor) => ({
        cursor: cursor ? `${cursor}-next` : "page-2",
        results: [{ cursor }],
      }),
      maxResultPages: 1,
    });

    expect(result.pageCount).toBe(1);
    expect(result.truncated).toBe(true);
    expect(result.nextCursor).toBe("page-2");
  });
});
