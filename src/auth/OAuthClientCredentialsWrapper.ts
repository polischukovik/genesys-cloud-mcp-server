import type { ApiClientClass } from "purecloud-platform-client-v2";
import type { z } from "zod";
import type { ConfigRetriever } from "../createConfigRetriever.js";
import type { ToolCall } from "../tools/utils/createTool.js";
import { errorResult } from "../tools/utils/errorResult.js";

let clientCredentialsAuthenticated = false;
let configuredAccessToken: string | undefined;

type AuthResult =
  | { authenticated: true }
  | { authenticated: false; reason: string };

async function authenticate(
  apiClient: ApiClientClass,
  configRetriever: ConfigRetriever,
): Promise<AuthResult> {
  const config = configRetriever.getGenesysCloudConfig();
  if (!config.success) {
    return { authenticated: false, reason: config.reason };
  }
  const authConfig = config.value;

  try {
    apiClient.setEnvironment(authConfig.region);

    if (authConfig.kind === "access_token") {
      if (configuredAccessToken !== authConfig.accessToken) {
        apiClient.setAccessToken(authConfig.accessToken);
        configuredAccessToken = authConfig.accessToken;
      }

      // Access-token mode is externally managed (e.g. OAuth code/PKCE flow).
      // We do not call login here.
      return {
        authenticated: true,
      };
    }

    if (!clientCredentialsAuthenticated) {
      await apiClient.loginClientCredentialsGrant(
        authConfig.oAuthClientId,
        authConfig.oAuthClientSecret,
      );
      clientCredentialsAuthenticated = true;
    }
  } catch (e: unknown) {
    return {
      authenticated: false,
      reason: e instanceof Error ? e.message : String(e),
    };
  }

  return {
    authenticated: true,
  };
}

export const OAuthClientCredentialsWrapper = (
  configRetriever: ConfigRetriever,
  apiClient: ApiClientClass,
) => {
  return <Schema extends z.Schema = z.Schema>(
    call: ToolCall<Schema>,
  ): ToolCall<Schema> =>
    async (input: Schema) => {
      const authResult = await authenticate(apiClient, configRetriever);
      if (!authResult.authenticated) {
        return errorResult(
          `Failed to authenticate with Genesys Cloud. Reason:\n${authResult.reason}`,
        );
      }

      return call(input);
    };
};
