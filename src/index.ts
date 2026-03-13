import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { LRUCache } from "lru-cache";
import platformClient from "purecloud-platform-client-v2";
import { OAuthClientCredentialsWrapper } from "./auth/OAuthClientCredentialsWrapper.js";
import { createConfigRetriever } from "./createConfigRetriever.js";
import { analyticsConversationsAggregates } from "./tools/analyticsConversationsAggregates.js";
import { analyticsConversationsAggregatesAsync } from "./tools/analyticsConversationsAggregatesAsync.js";
import { analyticsQueuesObservations } from "./tools/analyticsQueuesObservations.js";
import { analyticsUsersAggregates } from "./tools/analyticsUsersAggregates.js";
import { analyticsUsersObservations } from "./tools/analyticsUsersObservations.js";
import { conversationSentiment } from "./tools/conversationSentiment/conversationSentiment.js";
import { conversationTopics } from "./tools/conversationTopics/conversationTopics.js";
import { conversationTranscript } from "./tools/conversationTranscript/conversationTranscript.js";
import { oauthClients } from "./tools/oauthClients/oauthClients.js";
import {
  type OAuthClientUsageResponse,
  oauthClientUsage,
} from "./tools/oauthClientUsage/oauthClientUsage.js";
import { queryQueueVolumes } from "./tools/queryQueueVolumes/queryQueueVolumes.js";
import { sampleConversationsByQueue } from "./tools/sampleConversationsByQueue/sampleConversationsByQueue.js";
import { searchQueues } from "./tools/searchQueues.js";
import { searchVoiceConversations } from "./tools/searchVoiceConversations.js";
import { voiceCallQuality } from "./tools/voiceCallQuality/voiceCallQuality.js";

const withAuth = OAuthClientCredentialsWrapper(
  createConfigRetriever(process.env),
  platformClient.ApiClient.instance,
);

const server: McpServer = new McpServer({
  name: "Genesys Cloud",
  version: "1.0.3", // Same version as version in package.json
});

const cache = new LRUCache<string, OAuthClientUsageResponse>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes

  allowStale: false,

  updateAgeOnGet: false,
  updateAgeOnHas: false,
});

const routingApi = new platformClient.RoutingApi();
const analyticsApi = new platformClient.AnalyticsApi();
const speechTextAnalyticsApi = new platformClient.SpeechTextAnalyticsApi();
const recordingApi = new platformClient.RecordingApi();
const oauthApi = new platformClient.OAuthApi();
const authorizationApi = new platformClient.AuthorizationApi();

const searchQueuesTool = searchQueues({ routingApi });
server.registerTool(
  searchQueuesTool.schema.name,
  {
    description: searchQueuesTool.schema.description,
    inputSchema: searchQueuesTool.schema.paramsSchema.shape,
    annotations: searchQueuesTool.schema.annotations,
  },
  withAuth(searchQueuesTool.call),
);

const sampleConversationsByQueueTool = sampleConversationsByQueue({
  analyticsApi,
});
server.registerTool(
  sampleConversationsByQueueTool.schema.name,
  {
    description: sampleConversationsByQueueTool.schema.description,
    inputSchema: sampleConversationsByQueueTool.schema.paramsSchema.shape,
    annotations: sampleConversationsByQueueTool.schema.annotations,
  },
  withAuth(sampleConversationsByQueueTool.call),
);

const queryQueueVolumesTool = queryQueueVolumes({ analyticsApi });
server.registerTool(
  queryQueueVolumesTool.schema.name,
  {
    description: queryQueueVolumesTool.schema.description,
    inputSchema: queryQueueVolumesTool.schema.paramsSchema.shape,
    annotations: queryQueueVolumesTool.schema.annotations,
  },
  withAuth(queryQueueVolumesTool.call),
);

const analyticsConversationsAggregatesTool = analyticsConversationsAggregates({
  analyticsApi,
});
server.registerTool(
  analyticsConversationsAggregatesTool.schema.name,
  {
    description: analyticsConversationsAggregatesTool.schema.description,
    inputSchema: analyticsConversationsAggregatesTool.schema.paramsSchema.shape,
    annotations: analyticsConversationsAggregatesTool.schema.annotations,
  },
  withAuth(analyticsConversationsAggregatesTool.call),
);

const analyticsConversationsAggregatesAsyncTool =
  analyticsConversationsAggregatesAsync({
    analyticsApi,
  });
server.registerTool(
  analyticsConversationsAggregatesAsyncTool.schema.name,
  {
    description: analyticsConversationsAggregatesAsyncTool.schema.description,
    inputSchema:
      analyticsConversationsAggregatesAsyncTool.schema.paramsSchema.shape,
    annotations: analyticsConversationsAggregatesAsyncTool.schema.annotations,
  },
  withAuth(analyticsConversationsAggregatesAsyncTool.call),
);

const analyticsUsersAggregatesTool = analyticsUsersAggregates({ analyticsApi });
server.registerTool(
  analyticsUsersAggregatesTool.schema.name,
  {
    description: analyticsUsersAggregatesTool.schema.description,
    inputSchema: analyticsUsersAggregatesTool.schema.paramsSchema.shape,
    annotations: analyticsUsersAggregatesTool.schema.annotations,
  },
  withAuth(analyticsUsersAggregatesTool.call),
);

const analyticsQueuesObservationsTool = analyticsQueuesObservations({
  analyticsApi,
});
server.registerTool(
  analyticsQueuesObservationsTool.schema.name,
  {
    description: analyticsQueuesObservationsTool.schema.description,
    inputSchema: analyticsQueuesObservationsTool.schema.paramsSchema.shape,
    annotations: analyticsQueuesObservationsTool.schema.annotations,
  },
  withAuth(analyticsQueuesObservationsTool.call),
);

const analyticsUsersObservationsTool = analyticsUsersObservations({
  analyticsApi,
});
server.registerTool(
  analyticsUsersObservationsTool.schema.name,
  {
    description: analyticsUsersObservationsTool.schema.description,
    inputSchema: analyticsUsersObservationsTool.schema.paramsSchema.shape,
    annotations: analyticsUsersObservationsTool.schema.annotations,
  },
  withAuth(analyticsUsersObservationsTool.call),
);

const voiceCallQualityTool = voiceCallQuality({ analyticsApi });
server.registerTool(
  voiceCallQualityTool.schema.name,
  {
    description: voiceCallQualityTool.schema.description,
    inputSchema: voiceCallQualityTool.schema.paramsSchema.shape,
    annotations: voiceCallQualityTool.schema.annotations,
  },
  withAuth(voiceCallQualityTool.call),
);

const conversationSentimentTool = conversationSentiment({
  speechTextAnalyticsApi,
});
server.registerTool(
  conversationSentimentTool.schema.name,
  {
    description: conversationSentimentTool.schema.description,
    inputSchema: conversationSentimentTool.schema.paramsSchema.shape,
    annotations: conversationSentimentTool.schema.annotations,
  },
  withAuth(conversationSentimentTool.call),
);

const conversationTopicsTool = conversationTopics({
  speechTextAnalyticsApi,
  analyticsApi,
});
server.registerTool(
  conversationTopicsTool.schema.name,
  {
    description: conversationTopicsTool.schema.description,
    inputSchema: conversationTopicsTool.schema.paramsSchema.shape,
    annotations: conversationTopicsTool.schema.annotations,
  },
  withAuth(conversationTopicsTool.call),
);

const searchVoiceConversationsTool = searchVoiceConversations({
  analyticsApi,
});
server.registerTool(
  searchVoiceConversationsTool.schema.name,
  {
    description: searchVoiceConversationsTool.schema.description,
    inputSchema: searchVoiceConversationsTool.schema.paramsSchema.shape,
    annotations: searchVoiceConversationsTool.schema.annotations,
  },
  withAuth(searchVoiceConversationsTool.call),
);

const conversationTranscriptTool = conversationTranscript({
  recordingApi,
  speechTextAnalyticsApi,
  fetchUrl: fetch,
});
server.registerTool(
  conversationTranscriptTool.schema.name,
  {
    description: conversationTranscriptTool.schema.description,
    inputSchema: conversationTranscriptTool.schema.paramsSchema.shape,
    annotations: conversationTranscriptTool.schema.annotations,
  },
  withAuth(conversationTranscriptTool.call),
);

const oauthClientsTool = oauthClients({
  oauthApi,
  authorizationApi,
});
server.registerTool(
  oauthClientsTool.schema.name,
  {
    description: oauthClientsTool.schema.description,
    inputSchema: oauthClientsTool.schema.paramsSchema.shape,
    annotations: oauthClientsTool.schema.annotations,
  },
  withAuth(oauthClientsTool.call),
);

const oauthClientUsageTool = oauthClientUsage({
  cache,
  oauthApi,
});
server.registerTool(
  oauthClientUsageTool.schema.name,
  {
    description: oauthClientUsageTool.schema.description,
    inputSchema: oauthClientUsageTool.schema.paramsSchema.shape,
    annotations: oauthClientUsageTool.schema.annotations,
  },
  withAuth(oauthClientUsageTool.call),
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Genesys Cloud MCP Server running on stdio");
