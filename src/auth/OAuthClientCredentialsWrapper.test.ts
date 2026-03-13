import { describe, expect, test, vi } from "vitest";

describe("OAuthClientCredentialsWrapper", () => {
  test("uses access token mode without calling client-credentials login", async () => {
    vi.resetModules();
    const { OAuthClientCredentialsWrapper } = await import(
      "./OAuthClientCredentialsWrapper.js"
    );

    const configRetriever = {
      getGenesysCloudConfig: () =>
        ({
          success: true,
          value: {
            kind: "access_token",
            region: "mypurecloud.ie",
            accessToken: "user-token",
          },
        }) as const,
    };

    const apiClient = {
      setEnvironment: vi.fn(),
      setAccessToken: vi.fn(),
      loginClientCredentialsGrant: vi.fn(),
    };

    const wrappedCall = OAuthClientCredentialsWrapper(
      configRetriever,
      apiClient as never,
    )(async () => ({
      content: [{ type: "text", text: "ok" }],
    }));

    const result = await wrappedCall({});
    expect(result).toStrictEqual({
      content: [{ type: "text", text: "ok" }],
    });
    expect(apiClient.setEnvironment).toHaveBeenCalledWith("mypurecloud.ie");
    expect(apiClient.setAccessToken).toHaveBeenCalledWith("user-token");
    expect(apiClient.loginClientCredentialsGrant).not.toHaveBeenCalled();
  });

  test("uses client credentials mode and caches login", async () => {
    vi.resetModules();
    const { OAuthClientCredentialsWrapper } = await import(
      "./OAuthClientCredentialsWrapper.js"
    );

    const configRetriever = {
      getGenesysCloudConfig: () =>
        ({
          success: true,
          value: {
            kind: "client_credentials",
            region: "mypurecloud.ie",
            oAuthClientId: "client-id",
            oAuthClientSecret: "client-secret",
          },
        }) as const,
    };

    const apiClient = {
      setEnvironment: vi.fn(),
      setAccessToken: vi.fn(),
      loginClientCredentialsGrant: vi.fn().mockResolvedValue(undefined),
    };

    const wrappedCall = OAuthClientCredentialsWrapper(
      configRetriever,
      apiClient as never,
    )(async () => ({
      content: [{ type: "text", text: "ok" }],
    }));

    await wrappedCall({});
    await wrappedCall({});

    expect(apiClient.setEnvironment).toHaveBeenCalledWith("mypurecloud.ie");
    expect(apiClient.loginClientCredentialsGrant).toHaveBeenCalledTimes(1);
    expect(apiClient.loginClientCredentialsGrant).toHaveBeenCalledWith(
      "client-id",
      "client-secret",
    );
  });

  test("returns error result when auth config parsing fails", async () => {
    vi.resetModules();
    const { OAuthClientCredentialsWrapper } = await import(
      "./OAuthClientCredentialsWrapper.js"
    );

    const configRetriever = {
      getGenesysCloudConfig: () =>
        ({
          success: false,
          reason: "Missing environment variable: GENESYSCLOUD_REGION",
        }) as const,
    };

    const apiClient = {
      setEnvironment: vi.fn(),
      setAccessToken: vi.fn(),
      loginClientCredentialsGrant: vi.fn(),
    };

    const wrappedCall = OAuthClientCredentialsWrapper(
      configRetriever,
      apiClient as never,
    )(async () => ({
      content: [{ type: "text", text: "ok" }],
    }));

    const result = await wrappedCall({});
    expect(result).toStrictEqual({
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify({
            errorMessage:
              "Failed to authenticate with Genesys Cloud. Reason:\nMissing environment variable: GENESYSCLOUD_REGION",
          }),
        },
      ],
    });
  });
});
