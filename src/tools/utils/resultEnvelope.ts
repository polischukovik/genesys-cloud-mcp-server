import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

function safeJsonStringify(payload: unknown): string {
  try {
    return JSON.stringify(payload);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown serialization error";

    return JSON.stringify({
      ok: false,
      errorMessage: "Failed to serialize MCP tool response payload",
      error: {
        message,
      },
    });
  }
}

function textResult(payload: unknown, isError = false): CallToolResult {
  return {
    ...(isError ? { isError: true } : {}),
    content: [
      {
        type: "text",
        text: safeJsonStringify(payload),
      },
    ],
  };
}

export function successEnvelopeResult(
  data: unknown,
  meta?: Record<string, unknown>,
): CallToolResult {
  return textResult({
    ok: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function operationEnvelopeResult(
  operation: string,
  data: unknown,
  meta?: Record<string, unknown>,
): CallToolResult {
  return successEnvelopeResult(data, {
    operation,
    ...(meta ?? {}),
  });
}

export function errorEnvelopeResult(
  errorMessage: string,
  meta?: Record<string, unknown>,
): CallToolResult {
  return textResult(
    {
      ok: false,
      errorMessage,
      error: {
        message: errorMessage,
      },
      ...(meta ? { meta } : {}),
    },
    true,
  );
}
