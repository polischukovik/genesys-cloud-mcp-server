# Tools

This is the detailed reference for every MCP tool exposed by the server.
Each tool section includes:

- Input parameters
- Required Genesys Cloud permissions
- Platform API endpoints used

## Quick Index

### Queue and Conversation Discovery

| Tool | MCP Name | Key Inputs |
|---|---|---|
| [Search Queues](#search-queues) | `search_queues` | `name`, `pageNumber`, `pageSize` |
| [Search Voice Conversations](#search-voice-conversations) | `search_voice_conversations` | `startDate`, `endDate`, `phoneNumber?`, `pageNumber?`, `pageSize?` |
| [Sample Conversations By Queue](#sample-conversations-by-queue) | `sample_conversations_by_queue` | `queueId`, `startDate`, `endDate` |
| [Query Queue Volumes](#query-queue-volumes) | `query_queue_volumes` | `queueIds[]`, `startDate`, `endDate` |

### Analytics Aggregates and Observations

| Tool | MCP Name | Key Inputs |
|---|---|---|
| [Analytics Conversations Aggregates](#analytics-conversations-aggregates) | `analytics_conversations_aggregates` | `query` (`ConversationAggregationQuery`) |
| [Analytics Conversations Aggregates Async](#analytics-conversations-aggregates-async) | `analytics_conversations_aggregates_async` | `operation`, `query?`, `jobId?`, `cursor?` |
| [Analytics Conversations Details Query](#analytics-conversations-details-query) | `analytics_conversations_details_query` | `query` (`ConversationQuery`) |
| [Analytics Conversations Details Async](#analytics-conversations-details-async) | `analytics_conversations_details_async` | `operation`, `query?`, `jobId?`, `cursor?`, `pageSize?` |
| [Analytics Users Aggregates](#analytics-users-aggregates) | `analytics_users_aggregates` | `query` (`UserAggregationQuery`) |
| [Analytics Users Details Query](#analytics-users-details-query) | `analytics_users_details_query` | `query` (`UserDetailsQuery`) |
| [Analytics Users Details Async](#analytics-users-details-async) | `analytics_users_details_async` | `operation`, `query?`, `jobId?`, `cursor?`, `pageSize?` |
| [Analytics Queues Observations](#analytics-queues-observations) | `analytics_queues_observations` | `query` (`QueueObservationQuery`) |
| [Analytics Users Observations](#analytics-users-observations) | `analytics_users_observations` | `query` (`UserObservationQuery`) |
| [Analytics Transcripts Aggregates](#analytics-transcripts-aggregates) | `analytics_transcripts_aggregates` | `query` (`TranscriptAggregationQuery`) |

### Conversation Intelligence

| Tool | MCP Name | Key Inputs |
|---|---|---|
| [Voice Call Quality](#voice-call-quality) | `voice_call_quality` | `conversationIds[]` |
| [Conversation Sentiment](#conversation-sentiment) | `conversation_sentiment` | `conversationIds[]` |
| [Conversation Topics](#conversation-topics) | `conversation_topics` | `conversationId` |
| [Conversation Transcript](#conversation-transcript) | `conversation_transcript` | `conversationId` |

### OAuth Administration

| Tool | MCP Name | Key Inputs |
|---|---|---|
| [OAuth Clients](#oauth-clients) | `oauth_clients` | No input |
| [OAuth Client Usage](#oauth-client-usage) | `oauth_client_usage` | `oauthClientId`, `startDate`, `endDate` |

## Search Queues

**Tool name:** `search_queues`

Finds routing queues by name (supports wildcards) and returns queue IDs, names, optional descriptions/member counts, and pagination metadata.
[Source file](/src/tools/searchQueues.ts).

### Inputs

- `name`
  - The name (or partial name) of the routing queue(s) to search for. Wildcards ('\*') are supported for pattern matching (e.g., 'Support\*', '\*Emergency', '\*Sales\*'). Use '\*' alone to retrieve all queues
- `pageNumber`
  - The page number of the results to retrieve, starting from 1. Defaults to 1 if not specified. Used with 'pageSize' for navigating large result sets
- `pageSize`
  - The maximum number of queues to return per page. Defaults to 100 if not specified. Used with 'pageNumber' for pagination. The maximum value is 500

### Security

Required permissions:

- `routing:queue:view`

Platform API endpoint used:

- [`GET /api/v2/routing/queues`](https://developer.genesys.cloud/routing/routing/#get-api-v2-routing-queues)

## Query Queue Volumes

**Tool name:** `query_queue_volumes`

Returns conversation counts for each queue ID in the requested interval, useful for queue workload comparisons and trend snapshots.

[Source file](/src/tools/queryQueueVolumes/queryQueueVolumes.ts).

### Inputs

- `queueIds`
  - List of up to 300 queue IDs to filter conversations by
- `startDate`
  - The start date/time in ISO-8601 format (e.g., '2024-01-01T00:00:00Z')
- `endDate`
  - The end date/time in ISO-8601 format (e.g., '2024-01-07T23:59:59Z')

### Security

Required permissions:

- `analytics:conversationDetail:view`

Platform API endpoints used:

- [`POST /api/v2/analytics/conversations/details/jobs`](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#post-api-v2-analytics-conversations-details-jobs)
- [`GET /api/v2/analytics/conversations/details/jobs/{jobId}`](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#get-api-v2-analytics-conversations-details-jobs--jobId-)
- [`GET /api/v2/analytics/conversations/details/jobs/{jobId}/results`](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#get-api-v2-analytics-conversations-details-jobs--jobId--results)

## Analytics Conversations Aggregates

**Tool name:** `analytics_conversations_aggregates`

Runs a synchronous conversations aggregates query and returns interval-based metrics grouped and filtered by conversation dimensions.

[Source file](/src/tools/analyticsConversationsAggregates.ts).

### Inputs

- `query`
  - `ConversationAggregationQuery` JSON payload for `POST /api/v2/analytics/conversations/aggregates/query` (for example: `interval`, `metrics`, `groupBy`, `filter`, `granularity`)

### Security

Required permissions:

- `analytics:conversationAggregate:view`

Platform API endpoint used:

- [POST /api/v2/analytics/conversations/aggregates/query](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#post-api-v2-analytics-conversations-aggregates-query)

## Analytics Conversations Aggregates Async

**Tool name:** `analytics_conversations_aggregates_async`

Creates and reads asynchronous conversations aggregates jobs for large queries. Use `create_job`, then poll `get_job` and page `get_results`.

[Source file](/src/tools/analyticsConversationsAggregatesAsync.ts).

### Inputs

- `operation`
  - One of: `create_job`, `get_job`, `get_results`
- `query`
  - `ConversationAsyncAggregationQuery` JSON payload (required for `create_job`)
- `jobId`
  - Async job ID (required for `get_job` and `get_results`)
- `cursor`
  - Optional page cursor for `get_results`

### Security

Required permissions:

- `analytics:conversationAggregate:view`

Platform API endpoints used:

- [POST /api/v2/analytics/conversations/aggregates/jobs](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#post-api-v2-analytics-conversations-aggregates-jobs)
- [GET /api/v2/analytics/conversations/aggregates/jobs/{jobId}](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#get-api-v2-analytics-conversations-aggregates-jobs--jobId-)
- [GET /api/v2/analytics/conversations/aggregates/jobs/{jobId}/results](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#get-api-v2-analytics-conversations-aggregates-jobs--jobId--results)

## Analytics Users Aggregates

**Tool name:** `analytics_users_aggregates`

Runs a synchronous users aggregates query and returns interval-based metrics grouped and filtered by user dimensions.

[Source file](/src/tools/analyticsUsersAggregates.ts).

### Inputs

- `query`
  - `UserAggregationQuery` JSON payload for `POST /api/v2/analytics/users/aggregates/query` (for example: `interval`, `metrics`, `groupBy`, `filter`, `granularity`)

### Security

Required permissions:

- `analytics:userAggregate:view`

Platform API endpoint used:

- [POST /api/v2/analytics/users/aggregates/query](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#post-api-v2-analytics-users-aggregates-query)

## Analytics Conversations Details Query

**Tool name:** `analytics_conversations_details_query`

Runs a synchronous conversations details query and returns conversation-level records for the requested interval, filters, sorting, and paging.

[Source file](/src/tools/analyticsConversationsDetailsQuery.ts).

### Inputs

- `query`
  - `ConversationQuery` JSON payload for `POST /api/v2/analytics/conversations/details/query` (for example: `interval`, `conversationFilters`, `segmentFilters`, `order`, `orderBy`, `paging`)

### Security

Required permissions:

- `analytics:conversationDetail:view`

Platform API endpoint used:

- [POST /api/v2/analytics/conversations/details/query](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#post-api-v2-analytics-conversations-details-query)

## Analytics Conversations Details Async

**Tool name:** `analytics_conversations_details_async`

Creates and reads asynchronous conversations details jobs. Use this for large result sets that exceed synchronous query limits.

[Source file](/src/tools/analyticsConversationsDetailsAsync.ts).

### Inputs

- `operation`
  - One of: `create_job`, `get_job`, `get_results`
- `query`
  - `AsyncConversationQuery` JSON payload (required for `create_job`)
- `jobId`
  - Async job ID (required for `get_job` and `get_results`)
- `cursor`
  - Optional page cursor for `get_results`
- `pageSize`
  - Optional page size for `get_results`

### Security

Required permissions:

- `analytics:conversationDetail:view`

Platform API endpoints used:

- [POST /api/v2/analytics/conversations/details/jobs](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#post-api-v2-analytics-conversations-details-jobs)
- [GET /api/v2/analytics/conversations/details/jobs/{jobId}](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#get-api-v2-analytics-conversations-details-jobs--jobId-)
- [GET /api/v2/analytics/conversations/details/jobs/{jobId}/results](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#get-api-v2-analytics-conversations-details-jobs--jobId--results)

## Analytics Users Details Query

**Tool name:** `analytics_users_details_query`

Runs a synchronous users details query and returns user-level analytics rows with optional presence and routing status aggregations.

[Source file](/src/tools/analyticsUsersDetailsQuery.ts).

### Inputs

- `query`
  - `UserDetailsQuery` JSON payload for `POST /api/v2/analytics/users/details/query` (for example: `interval`, `userFilters`, `presenceFilters`, `routingStatusFilters`, `paging`)

### Security

Required permissions:

- `analytics:userDetail:view`

Platform API endpoint used:

- [POST /api/v2/analytics/users/details/query](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#post-api-v2-analytics-users-details-query)

## Analytics Users Details Async

**Tool name:** `analytics_users_details_async`

Creates and reads asynchronous users details jobs. Use this for high-volume user analytics queries that need paged retrieval.

[Source file](/src/tools/analyticsUsersDetailsAsync.ts).

### Inputs

- `operation`
  - One of: `create_job`, `get_job`, `get_results`
- `query`
  - `AsyncUserDetailsQuery` JSON payload (required for `create_job`)
- `jobId`
  - Async job ID (required for `get_job` and `get_results`)
- `cursor`
  - Optional page cursor for `get_results`
- `pageSize`
  - Optional page size for `get_results`

### Security

Required permissions:

- `analytics:userDetail:view`

Platform API endpoints used:

- [POST /api/v2/analytics/users/details/jobs](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#post-api-v2-analytics-users-details-jobs)
- [GET /api/v2/analytics/users/details/jobs/{jobId}](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#get-api-v2-analytics-users-details-jobs--jobId-)
- [GET /api/v2/analytics/users/details/jobs/{jobId}/results](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#get-api-v2-analytics-users-details-jobs--jobId--results)

## Analytics Transcripts Aggregates

**Tool name:** `analytics_transcripts_aggregates`

Runs a transcript aggregates query and returns speech and text analytics metrics grouped by the requested transcript dimensions.

[Source file](/src/tools/analyticsTranscriptsAggregates.ts).

### Inputs

- `query`
  - `TranscriptAggregationQuery` JSON payload for `POST /api/v2/analytics/transcripts/aggregates/query` (for example: `interval`, `metrics`, `groupBy`, `filter`, `granularity`)

### Security

Required permissions:

- `analytics:speechAndTextAnalyticsAggregates:view`

Platform API endpoint used:

- [POST /api/v2/analytics/transcripts/aggregates/query](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#post-api-v2-analytics-transcripts-aggregates-query)

## Analytics Queues Observations

**Tool name:** `analytics_queues_observations`

Runs a real-time queue observations query and returns current queue state metrics such as waiting, interacting, and availability indicators.

[Source file](/src/tools/analyticsQueuesObservations.ts).

### Inputs

- `query`
  - `QueueObservationQuery` JSON payload for `POST /api/v2/analytics/queues/observations/query` (for example: `filter`, `metrics`, `detailMetrics`)

### Security

Required permissions:

- `analytics:queueObservation:view`

Platform API endpoint used:

- [POST /api/v2/analytics/queues/observations/query](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#post-api-v2-analytics-queues-observations-query)

## Analytics Users Observations

**Tool name:** `analytics_users_observations`

Runs a real-time user observations query and returns current user state metrics such as presence, routing status, and workload indicators.

[Source file](/src/tools/analyticsUsersObservations.ts).

### Inputs

- `query`
  - `UserObservationQuery` JSON payload for `POST /api/v2/analytics/users/observations/query` (for example: `filter`, `metrics`, `detailMetrics`)

### Security

Required permissions:

- `analytics:userObservation:view`

Platform API endpoint used:

- [POST /api/v2/analytics/users/observations/query](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#post-api-v2-analytics-users-observations-query)

## Sample Conversations By Queue

**Tool name:** `sample_conversations_by_queue`

Returns an evenly sampled set of conversation IDs for a queue and date range, useful for QA spot checks, summaries, and investigations.

[Source file](/src/tools/sampleConversationsByQueue/sampleConversationsByQueue.ts).

### Inputs

- `queueId`
  - The UUID of the queue to filter conversations by. (e.g., 00000000-0000-0000-0000-000000000000)
- `startDate`
  - The start date/time in ISO-8601 format (e.g., '2024-01-01T00:00:00Z')
- `endDate`
  - The end date/time in ISO-8601 format (e.g., '2024-01-07T23:59:59Z')

### Security

Required permissions:

- `analytics:conversationDetail:view`

Platform API endpoints used:

- [`POST /api/v2/analytics/conversations/details/jobs`](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#post-api-v2-analytics-conversations-details-jobs)
- [`GET /api/v2/analytics/conversations/details/jobs/{jobId}`](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#get-api-v2-analytics-conversations-details-jobs--jobId-)
- [`GET /api/v2/analytics/conversations/details/jobs/{jobId}/results`](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#get-api-v2-analytics-conversations-details-jobs--jobId--results)

## Voice Call Quality

**Tool name:** `voice_call_quality`

Retrieves minimum voice MOS for each conversation ID and classifies quality into Poor/Acceptable/Excellent to help identify degraded calls.

Read more [about MOS scores and how they're determined](https://developer.genesys.cloud/analyticsdatamanagement/analytics/detail/call-quality).

[Source file](/src/tools/voiceCallQuality/voiceCallQuality.ts).

### Inputs

- `conversationIds`
  - A list of up to 100 conversation IDs to evaluate voice call quality for

### Security

Required permissions:

- `analytics:conversationDetail:view`

Platform API endpoint used:

- [`GET /api/v2/analytics/conversations/details`](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#get-api-v2-analytics-conversations-details)

## Conversation Sentiment

**Tool name:** `conversation_sentiment`

Returns customer sentiment for each conversation ID as a normalized score (-100 to 100) with a human-readable sentiment label.

[Source file](/src/tools/conversationSentiment/conversationSentiment.ts).

### Inputs

- `conversationIds`
  - A list of up to 100 conversation IDs to retrieve sentiment for

### Security

Required permissions:

- `speechAndTextAnalytics:data:view`
- `recording:recording:view`

Platform API endpoint used:

- [GET /api/v2/speechandtextanalytics/conversations/{conversationId}](https://developer.genesys.cloud/analyticsdatamanagement/speechtextanalytics/#get-api-v2-speechandtextanalytics-conversations--conversationId-)

## Conversation Topics

**Tool name:** `conversation_topics`

Lists detected Speech and Text Analytics topics for a conversation, including topic names and descriptions inferred from transcript content.

Read more [about programs, topics, and phrases](https://help.mypurecloud.com/articles/about-programs-topics-and-phrases/).

[Source file](/src/tools/conversationTopics/conversationTopics.ts).

### Inputs

- `conversationId`
  - A UUID for a conversation. (e.g., 00000000-0000-0000-0000-000000000000)

### Security

Required permissions:

- `speechAndTextAnalytics:topic:view`
- `analytics:conversationDetail:view`
- `analytics:speechAndTextAnalyticsAggregates:view`

Platform API endpoints used:

- [GET /api/v2/speechandtextanalytics/topics](https://developer.genesys.cloud/analyticsdatamanagement/speechtextanalytics/#get-api-v2-speechandtextanalytics-topics)
- [GET /api/v2/analytics/conversations/{conversationId}/details](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#get-api-v2-analytics-conversations--conversationId--details)
- [POST /api/v2/analytics/transcripts/aggregates/query](https://developer.genesys.cloud/analyticsdatamanagement/analytics/analytics-apis#post-api-v2-analytics-transcripts-aggregates-query)

## Search Voice Conversations

**Tool name:** `search_voice_conversations`

Searches inbound and outbound voice conversations for a time window (optional ANI filter) and returns paged conversation IDs with call duration.

[Source file](/src/tools/searchVoiceConversations.ts).

### Inputs

- `phoneNumber`
  - Optional. Filters results to only include conversations involving this phone number (e.g., '+440000000000')
- `pageNumber`
  - The page number of the results to retrieve, starting from 1. Defaults to 1 if not specified. Used with 'pageSize' for navigating large result sets
- `pageSize`
  - The maximum number of conversations to return per page. Defaults to 100 if not specified. Used with 'pageNumber' for pagination. The maximum value is 100
- `startDate`
  - The start date/time in ISO-8601 format (e.g., '2024-01-01T00:00:00Z')
- `endDate`
  - The end date/time in ISO-8601 format (e.g., '2024-01-07T23:59:59Z')

### Security

Required permissions:

- `analytics:conversationDetail:view`

Platform API endpoints used:

- [POST /api/v2/analytics/conversations/details/query](https://developer.genesys.cloud/devapps/api-explorer-standalone#post-api-v2-analytics-conversations-details-query)

## Conversation Transcript

**Tool name:** `conversation_transcript`

Retrieves a structured transcript with speaker labels, utterance timing, and available sentiment markers for customer/agent analysis.

[Source file](/src/tools/conversationTranscript/conversationTranscript.ts).

### Inputs

- `conversationId`
  - The UUID of the conversation to retrieve the transcript for (e.g., 00000000-0000-0000-0000-000000000000)

### Security

Required permissions:

- `recording:recording:view`
- `speechAndTextAnalytics:data:view`

Platform API endpoints used:

- [GET /api/v2/conversations/{conversationId}/recordings](https://developer.genesys.cloud/devapps/api-explorer-standalone#get-api-v2-conversations--conversationId--recordings)
- [GET /api/v2/speechandtextanalytics/conversations/{conversationId}/communications/{communicationId}/transcripturl](https://developer.genesys.cloud/devapps/api-explorer-standalone#get-api-v2-speechandtextanalytics-conversations--conversationId--communications--communicationId--transcripturl)

## OAuth Clients

**Tool name:** `oauth_clients`

Lists OAuth clients with scopes, role assignments, and (when permitted) role/division names for governance and access audits.

[Source file](/src/tools/oauthClients/oauthClients.ts).

### Security

Required permissions:

- `oauth:client:view`
- `authorization:role:view`
  - Optional: Used to populate names of roles used by OAuth Client

Platform API endpoints used:

- [GET /api/v2/oauth/clients](https://developer.genesys.cloud/devapps/api-explorer-standalone#get-api-v2-oauth-clients)
- [GET /api/v2/authorization/divisions](https://developer.genesys.cloud/devapps/api-explorer-standalone#get-api-v2-authorization-divisions)
- [GET /api/v2/authorization/roles](https://developer.genesys.cloud/devapps/api-explorer-standalone#get-api-v2-authorization-roles)

## OAuth Client Usage

**Tool name:** `oauth_client_usage`

Returns API usage for an OAuth client in a time range, including total request count and endpoint-level breakdown.

[Source file](/src/tools/oauthClientUsage/oauthClientUsage.ts).

### Inputs

- `oauthClientId`
  - The UUID of the OAuth Client to retrieve the usage for (e.g., 00000000-0000-0000-0000-000000000000)
- `startDate`
  - The start date/time in ISO-8601 format (e.g., '2024-01-01T00:00:00Z')
- `endDate`
  - The end date/time in ISO-8601 format (e.g., '2024-01-07T23:59:59Z')

### Security

Required permissions:

- `usage:client:view`

Platform API endpoints used:

- [POST /api/v2/oauth/clients/{clientId}/usage/query](https://developer.genesys.cloud/devapps/api-explorer-standalone#post-api-v2-oauth-clients--clientId--usage-query)
- [GET /api/v2/oauth/clients/{clientId}/usage/query/results/{executionId}](https://developer.genesys.cloud/devapps/api-explorer-standalone#get-api-v2-oauth-clients--clientId--usage-query-results--executionId-)
