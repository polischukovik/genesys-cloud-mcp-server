import { z } from "zod";

export interface ClientCredentialsGenesysCloudConfig {
  readonly kind: "client_credentials";
  readonly region: string;
  readonly oAuthClientId: string;
  readonly oAuthClientSecret: string;
}

export interface AccessTokenGenesysCloudConfig {
  readonly kind: "access_token";
  readonly region: string;
  readonly accessToken: string;
}

export type GenesysCloudConfig =
  | ClientCredentialsGenesysCloudConfig
  | AccessTokenGenesysCloudConfig;

export interface ConfigRetriever {
  readonly getGenesysCloudConfig: () => Result<GenesysCloudConfig>;
}

export interface SuccessResult<T> {
  success: true;
  value: T;
}

export interface ErrorResult {
  success: false;
  reason: string;
}

export type Result<T> = SuccessResult<T> | ErrorResult;

const sharedGenesysAuthConfigSchema = z.object({
  GENESYSCLOUD_REGION: z.string({
    required_error: "Missing environment variable: GENESYSCLOUD_REGION",
  }),
  GENESYSCLOUD_AUTH_MODE: z
    .enum(["auto", "client_credentials", "access_token"])
    .optional(),
  GENESYSCLOUD_ACCESS_TOKEN: z.string().optional(),
});

const genesysClientCredentialsSchema = z.object({
  GENESYSCLOUD_OAUTHCLIENT_ID: z.string({
    required_error: "Missing environment variable: GENESYSCLOUD_OAUTHCLIENT_ID",
  }),
  GENESYSCLOUD_OAUTHCLIENT_SECRET: z.string({
    required_error:
      "Missing environment variable: GENESYSCLOUD_OAUTHCLIENT_SECRET",
  }),
});

export function createConfigRetriever(env: NodeJS.ProcessEnv): ConfigRetriever {
  return {
    getGenesysCloudConfig: () => {
      const sharedAuthConfig = sharedGenesysAuthConfigSchema.safeParse(env);
      if (!sharedAuthConfig.success) {
        const failureReason = [
          "Failed to parse environment variables",
          ...sharedAuthConfig.error.issues.map((i) => i.message),
        ].join("\n");

        return {
          success: false,
          reason: failureReason,
        };
      }

      const mode = sharedAuthConfig.data.GENESYSCLOUD_AUTH_MODE ?? "auto";
      const accessToken = sharedAuthConfig.data.GENESYSCLOUD_ACCESS_TOKEN;
      const region = sharedAuthConfig.data.GENESYSCLOUD_REGION;

      if (mode === "access_token") {
        if (!accessToken) {
          return {
            success: false,
            reason:
              "Failed to parse environment variables\nMissing environment variable: GENESYSCLOUD_ACCESS_TOKEN",
          };
        }

        return {
          success: true,
          value: {
            kind: "access_token",
            region,
            accessToken,
          },
        };
      }

      if (mode === "auto" && accessToken) {
        return {
          success: true,
          value: {
            kind: "access_token",
            region,
            accessToken,
          },
        };
      }

      const clientCredentialsAuthConfig =
        genesysClientCredentialsSchema.safeParse(env);
      if (!clientCredentialsAuthConfig.success) {
        const failureReason = [
          "Failed to parse environment variables",
          ...clientCredentialsAuthConfig.error.issues.map((i) => i.message),
        ].join("\n");

        return {
          success: false,
          reason: failureReason,
        };
      }

      return {
        success: true,
        value: {
          kind: "client_credentials",
          region,
          oAuthClientId:
            clientCredentialsAuthConfig.data.GENESYSCLOUD_OAUTHCLIENT_ID,
          oAuthClientSecret:
            clientCredentialsAuthConfig.data.GENESYSCLOUD_OAUTHCLIENT_SECRET,
        },
      };
    },
  };
}
