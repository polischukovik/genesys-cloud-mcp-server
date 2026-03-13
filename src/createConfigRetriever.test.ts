import { describe, expect, test } from "vitest";
import { createConfigRetriever } from "./createConfigRetriever.js";

describe("createConfigRetriever", () => {
  test("uses client credentials mode by default when access token is absent", () => {
    const retriever = createConfigRetriever({
      GENESYSCLOUD_REGION: "mypurecloud.ie",
      GENESYSCLOUD_OAUTHCLIENT_ID: "client-id",
      GENESYSCLOUD_OAUTHCLIENT_SECRET: "client-secret",
    });

    expect(retriever.getGenesysCloudConfig()).toStrictEqual({
      success: true,
      value: {
        kind: "client_credentials",
        region: "mypurecloud.ie",
        oAuthClientId: "client-id",
        oAuthClientSecret: "client-secret",
      },
    });
  });

  test("uses access token mode by default when access token is present", () => {
    const retriever = createConfigRetriever({
      GENESYSCLOUD_REGION: "mypurecloud.ie",
      GENESYSCLOUD_ACCESS_TOKEN: "user-access-token",
      GENESYSCLOUD_OAUTHCLIENT_ID: "client-id",
      GENESYSCLOUD_OAUTHCLIENT_SECRET: "client-secret",
    });

    expect(retriever.getGenesysCloudConfig()).toStrictEqual({
      success: true,
      value: {
        kind: "access_token",
        region: "mypurecloud.ie",
        accessToken: "user-access-token",
      },
    });
  });

  test("uses access token mode when explicitly configured", () => {
    const retriever = createConfigRetriever({
      GENESYSCLOUD_REGION: "mypurecloud.ie",
      GENESYSCLOUD_AUTH_MODE: "access_token",
      GENESYSCLOUD_ACCESS_TOKEN: "user-access-token",
    });

    expect(retriever.getGenesysCloudConfig()).toStrictEqual({
      success: true,
      value: {
        kind: "access_token",
        region: "mypurecloud.ie",
        accessToken: "user-access-token",
      },
    });
  });

  test("errors when access token mode is selected without token", () => {
    const retriever = createConfigRetriever({
      GENESYSCLOUD_REGION: "mypurecloud.ie",
      GENESYSCLOUD_AUTH_MODE: "access_token",
    });

    expect(retriever.getGenesysCloudConfig()).toStrictEqual({
      success: false,
      reason:
        "Failed to parse environment variables\nMissing environment variable: GENESYSCLOUD_ACCESS_TOKEN",
    });
  });

  test("uses client credentials mode when explicitly configured", () => {
    const retriever = createConfigRetriever({
      GENESYSCLOUD_REGION: "mypurecloud.ie",
      GENESYSCLOUD_AUTH_MODE: "client_credentials",
      GENESYSCLOUD_OAUTHCLIENT_ID: "client-id",
      GENESYSCLOUD_OAUTHCLIENT_SECRET: "client-secret",
    });

    expect(retriever.getGenesysCloudConfig()).toStrictEqual({
      success: true,
      value: {
        kind: "client_credentials",
        region: "mypurecloud.ie",
        oAuthClientId: "client-id",
        oAuthClientSecret: "client-secret",
      },
    });
  });
});
