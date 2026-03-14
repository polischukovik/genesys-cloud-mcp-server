# Tools

This is the detailed reference for MCP tools exposed by this server.

## Standard Output Envelope (Advanced Analytics)

Advanced analytics, async analytics, activity, availability, and KPI tools return a standardized JSON envelope:

```json
{
  "ok": true,
  "data": { "...": "..." },
  "meta": { "...": "..." }
}
```

Error shape:

```json
{
  "ok": false,
  "errorMessage": "...",
  "error": { "message": "..." },
  "meta": { "...": "..." }
}
```

## Quick Index

### Queue and Conversation Discovery

| Tool | MCP Name |
|---|---|
| Search Queues | `search_queues` |
| Search Voice Conversations | `search_voice_conversations` |
| Sample Conversations By Queue | `sample_conversations_by_queue` |
| Query Queue Volumes | `query_queue_volumes` |

### Advanced Analytics

| Tool | MCP Name |
|---|---|
| Analytics Conversations Aggregates | `analytics_conversations_aggregates` |
| Analytics Conversations Aggregates Async | `analytics_conversations_aggregates_async` |
| Analytics Users Aggregates | `analytics_users_aggregates` |
| Analytics Users Aggregates Async | `analytics_users_aggregates_async` |
| Analytics Conversations Details Query | `analytics_conversations_details_query` |
| Analytics Conversations Details Async | `analytics_conversations_details_async` |
| Analytics Conversations Details Availability | `analytics_conversations_details_availability` |
| Analytics Users Details Query | `analytics_users_details_query` |
| Analytics Users Details Async | `analytics_users_details_async` |
| Analytics Users Details Availability | `analytics_users_details_availability` |
| Analytics Transcripts Aggregates | `analytics_transcripts_aggregates` |
| Analytics Transcripts Aggregates Async | `analytics_transcripts_aggregates_async` |
| Analytics Queues Observations | `analytics_queues_observations` |
| Analytics Users Observations | `analytics_users_observations` |
| Analytics Conversations Activity | `analytics_conversations_activity` |
| Analytics Routing Activity | `analytics_routing_activity` |
| Analytics Users Activity | `analytics_users_activity` |

### KPI Tools

| Tool | MCP Name |
|---|---|
| KPI Queue Performance Summary | `kpi_queue_performance_summary` |
| KPI Agent Performance Summary | `kpi_agent_performance_summary` |

### Conversation Intelligence

| Tool | MCP Name |
|---|---|
| Voice Call Quality | `voice_call_quality` |
| Conversation Sentiment | `conversation_sentiment` |
| Conversation Topics | `conversation_topics` |
| Conversation Transcript | `conversation_transcript` |

### OAuth Administration

| Tool | MCP Name |
|---|---|
| OAuth Clients | `oauth_clients` |
| OAuth Client Usage | `oauth_client_usage` |

## Advanced Analytics and KPI Tools

### Analytics Conversations Aggregates

- Tool: `analytics_conversations_aggregates`
- Source: [`../src/tools/analyticsConversationsAggregates.ts`](../src/tools/analyticsConversationsAggregates.ts)
- Permission: `analytics:conversationAggregate:view`
- Endpoint: `POST /api/v2/analytics/conversations/aggregates/query`

Example A:

```json
{
  "query": {
    "interval": "2026-03-01T00:00:00Z/2026-03-08T00:00:00Z",
    "granularity": "P1D",
    "groupBy": ["queueId"],
    "metrics": ["nOffered", "nAnswered", "nAbandon", "tHandle"]
  }
}
```

Example B:

```json
{
  "query": {
    "interval": "2026-03-07T00:00:00Z/2026-03-08T00:00:00Z",
    "groupBy": ["mediaType", "direction"],
    "metrics": ["nConnected", "tTalk", "tWait"],
    "filter": {
      "type": "or",
      "predicates": [
        { "dimension": "mediaType", "value": "voice" },
        { "dimension": "mediaType", "value": "chat" }
      ]
    }
  }
}
```

### Analytics Conversations Aggregates Async

- Tool: `analytics_conversations_aggregates_async`
- Source: [`../src/tools/analyticsConversationsAggregatesAsync.ts`](../src/tools/analyticsConversationsAggregatesAsync.ts)
- Permission: `analytics:conversationAggregate:view`
- Endpoints: async aggregate job endpoints under `/api/v2/analytics/conversations/aggregates/jobs`

Example A (`create_job`):

```json
{
  "operation": "create_job",
  "query": {
    "interval": "2026-02-01T00:00:00Z/2026-03-01T00:00:00Z",
    "groupBy": ["queueId", "mediaType"],
    "metrics": ["nOffered", "nAnswered", "tHandle"],
    "pageSize": 100
  }
}
```

Example B (`run_to_completion`):

```json
{
  "operation": "run_to_completion",
  "query": {
    "interval": "2026-02-01T00:00:00Z/2026-03-01T00:00:00Z",
    "groupBy": ["queueId"],
    "metrics": ["nOffered", "nAbandon", "tWait"],
    "pageSize": 200
  },
  "pollIntervalMs": 3000,
  "maxPollAttempts": 60,
  "maxResultPages": 20
}
```

### Analytics Users Aggregates

- Tool: `analytics_users_aggregates`
- Source: [`../src/tools/analyticsUsersAggregates.ts`](../src/tools/analyticsUsersAggregates.ts)
- Permission: `analytics:userAggregate:view`
- Endpoint: `POST /api/v2/analytics/users/aggregates/query`

Example A:

```json
{
  "query": {
    "interval": "2026-03-01T00:00:00Z/2026-03-08T00:00:00Z",
    "granularity": "P1D",
    "groupBy": ["userId"],
    "metrics": ["tHandle", "tTalk", "tAcw"]
  }
}
```

Example B:

```json
{
  "query": {
    "interval": "2026-03-07T00:00:00Z/2026-03-08T00:00:00Z",
    "groupBy": ["divisionId"],
    "metrics": ["nConnected", "nAnswered"],
    "filter": {
      "type": "or",
      "predicates": [
        { "dimension": "userId", "value": "00000000-0000-0000-0000-000000000001" }
      ]
    }
  }
}
```

### Analytics Users Aggregates Async

- Tool: `analytics_users_aggregates_async`
- Source: [`../src/tools/analyticsUsersAggregatesAsync.ts`](../src/tools/analyticsUsersAggregatesAsync.ts)
- Permission: `analytics:userAggregate:view`
- Endpoints: async aggregate job endpoints under `/api/v2/analytics/users/aggregates/jobs`

Example A (`create_job`):

```json
{
  "operation": "create_job",
  "query": {
    "interval": "2026-02-01T00:00:00Z/2026-03-01T00:00:00Z",
    "groupBy": ["userId"],
    "metrics": ["tHandle", "tTalk", "tAcw"],
    "pageSize": 100
  }
}
```

Example B (`run_to_completion`):

```json
{
  "operation": "run_to_completion",
  "query": {
    "interval": "2026-02-01T00:00:00Z/2026-03-01T00:00:00Z",
    "groupBy": ["userId", "queueId"],
    "metrics": ["nConnected", "tHandle"],
    "pageSize": 200
  },
  "maxPollAttempts": 80,
  "maxResultPages": 25
}
```

### Analytics Conversations Details Query

- Tool: `analytics_conversations_details_query`
- Source: [`../src/tools/analyticsConversationsDetailsQuery.ts`](../src/tools/analyticsConversationsDetailsQuery.ts)
- Permission: `analytics:conversationDetail:view`
- Endpoint: `POST /api/v2/analytics/conversations/details/query`

Example A:

```json
{
  "query": {
    "interval": "2026-03-07T00:00:00Z/2026-03-08T00:00:00Z",
    "order": "desc",
    "orderBy": "conversationStart",
    "paging": { "pageSize": 25, "pageNumber": 1 },
    "segmentFilters": [
      {
        "type": "or",
        "predicates": [{ "dimension": "mediaType", "value": "voice" }]
      }
    ]
  }
}
```

Example B:

```json
{
  "query": {
    "interval": "2026-03-01T00:00:00Z/2026-03-08T00:00:00Z",
    "order": "asc",
    "orderBy": "conversationStart",
    "paging": { "pageSize": 50, "pageNumber": 2 },
    "conversationFilters": [
      {
        "type": "or",
        "predicates": [{ "dimension": "divisionId", "value": "00000000-0000-0000-0000-000000000001" }]
      }
    ]
  }
}
```

### Analytics Conversations Details Async

- Tool: `analytics_conversations_details_async`
- Source: [`../src/tools/analyticsConversationsDetailsAsync.ts`](../src/tools/analyticsConversationsDetailsAsync.ts)
- Permission: `analytics:conversationDetail:view`
- Endpoints: async details endpoints under `/api/v2/analytics/conversations/details/jobs`

Example A (`create_job`):

```json
{
  "operation": "create_job",
  "query": {
    "interval": "2026-02-01T00:00:00Z/2026-03-01T00:00:00Z",
    "order": "asc",
    "orderBy": "conversationStart",
    "limit": 10000
  }
}
```

Example B (`run_to_completion`):

```json
{
  "operation": "run_to_completion",
  "query": {
    "interval": "2026-02-15T00:00:00Z/2026-03-01T00:00:00Z",
    "order": "desc",
    "orderBy": "conversationStart",
    "limit": 50000
  },
  "pageSize": 100,
  "pollIntervalMs": 3000,
  "maxPollAttempts": 120,
  "maxResultPages": 30
}
```

### Analytics Conversations Details Availability

- Tool: `analytics_conversations_details_availability`
- Source: [`../src/tools/analyticsConversationsDetailsAvailability.ts`](../src/tools/analyticsConversationsDetailsAvailability.ts)
- Permission: `analytics:conversationDetail:view`
- Endpoint: `GET /api/v2/analytics/conversations/details/jobs/availability`

Example A:

```json
{}
```

Example B:

```json
{}
```

### Analytics Users Details Query

- Tool: `analytics_users_details_query`
- Source: [`../src/tools/analyticsUsersDetailsQuery.ts`](../src/tools/analyticsUsersDetailsQuery.ts)
- Permission: `analytics:userDetail:view`
- Endpoint: `POST /api/v2/analytics/users/details/query`

Example A:

```json
{
  "query": {
    "interval": "2026-03-07T00:00:00Z/2026-03-08T00:00:00Z",
    "order": "asc",
    "paging": { "pageSize": 100, "pageNumber": 1 }
  }
}
```

Example B:

```json
{
  "query": {
    "interval": "2026-03-01T00:00:00Z/2026-03-08T00:00:00Z",
    "userFilters": [
      {
        "type": "or",
        "predicates": [{ "dimension": "userId", "value": "00000000-0000-0000-0000-000000000001" }]
      }
    ],
    "routingStatusAggregations": [{ "type": "term", "field": "routingStatus" }]
  }
}
```

### Analytics Users Details Async

- Tool: `analytics_users_details_async`
- Source: [`../src/tools/analyticsUsersDetailsAsync.ts`](../src/tools/analyticsUsersDetailsAsync.ts)
- Permission: `analytics:userDetail:view`
- Endpoints: async details endpoints under `/api/v2/analytics/users/details/jobs`

Example A (`create_job`):

```json
{
  "operation": "create_job",
  "query": {
    "interval": "2026-02-01T00:00:00Z/2026-03-01T00:00:00Z",
    "order": "asc",
    "limit": 10000
  }
}
```

Example B (`run_to_completion`):

```json
{
  "operation": "run_to_completion",
  "query": {
    "interval": "2026-02-15T00:00:00Z/2026-03-01T00:00:00Z",
    "order": "desc",
    "limit": 30000
  },
  "pageSize": 100,
  "maxPollAttempts": 120,
  "maxResultPages": 30
}
```

### Analytics Users Details Availability

- Tool: `analytics_users_details_availability`
- Source: [`../src/tools/analyticsUsersDetailsAvailability.ts`](../src/tools/analyticsUsersDetailsAvailability.ts)
- Permission: `analytics:userDetail:view`
- Endpoint: `GET /api/v2/analytics/users/details/jobs/availability`

Example A:

```json
{}
```

Example B:

```json
{}
```

### Analytics Transcripts Aggregates

- Tool: `analytics_transcripts_aggregates`
- Source: [`../src/tools/analyticsTranscriptsAggregates.ts`](../src/tools/analyticsTranscriptsAggregates.ts)
- Permission: `analytics:speechAndTextAnalyticsAggregates:view`
- Endpoint: `POST /api/v2/analytics/transcripts/aggregates/query`

Example A:

```json
{
  "query": {
    "interval": "2026-03-01T00:00:00Z/2026-03-08T00:00:00Z",
    "groupBy": ["topicId"],
    "metrics": ["nConversations", "nTranscripts"]
  }
}
```

Example B:

```json
{
  "query": {
    "interval": "2026-03-07T00:00:00Z/2026-03-08T00:00:00Z",
    "groupBy": ["languageId"],
    "metrics": ["nWords"],
    "filter": {
      "type": "or",
      "predicates": [{ "dimension": "mediaType", "value": "voice" }]
    }
  }
}
```

### Analytics Transcripts Aggregates Async

- Tool: `analytics_transcripts_aggregates_async`
- Source: [`../src/tools/analyticsTranscriptsAggregatesAsync.ts`](../src/tools/analyticsTranscriptsAggregatesAsync.ts)
- Permission: `analytics:speechAndTextAnalyticsAggregates:view`
- Endpoints: async transcript aggregate endpoints under `/api/v2/analytics/transcripts/aggregates/jobs`

Example A (`create_job`):

```json
{
  "operation": "create_job",
  "query": {
    "interval": "2026-02-01T00:00:00Z/2026-03-01T00:00:00Z",
    "groupBy": ["topicId"],
    "metrics": ["nConversations", "nWords"],
    "pageSize": 100
  }
}
```

Example B (`run_to_completion`):

```json
{
  "operation": "run_to_completion",
  "query": {
    "interval": "2026-02-01T00:00:00Z/2026-03-01T00:00:00Z",
    "groupBy": ["languageId", "topicId"],
    "metrics": ["nTranscripts"],
    "pageSize": 200
  },
  "maxResultPages": 20
}
```

### Analytics Queues Observations

- Tool: `analytics_queues_observations`
- Source: [`../src/tools/analyticsQueuesObservations.ts`](../src/tools/analyticsQueuesObservations.ts)
- Permission: `analytics:queueObservation:view`
- Endpoint: `POST /api/v2/analytics/queues/observations/query`

Example A:

```json
{
  "query": {
    "metrics": ["oWaiting", "oInteracting", "oOnQueueUsers"],
    "filter": {
      "type": "or",
      "predicates": [{ "dimension": "queueId", "value": "00000000-0000-0000-0000-000000000001" }]
    }
  }
}
```

Example B:

```json
{
  "query": {
    "metrics": ["oUserPresences", "oUserRoutingStatuses"],
    "detailMetrics": ["oWaiting"],
    "filter": {
      "type": "or",
      "predicates": [{ "dimension": "mediaType", "value": "voice" }]
    }
  }
}
```

### Analytics Users Observations

- Tool: `analytics_users_observations`
- Source: [`../src/tools/analyticsUsersObservations.ts`](../src/tools/analyticsUsersObservations.ts)
- Permission: `analytics:userObservation:view`
- Endpoint: `POST /api/v2/analytics/users/observations/query`

Example A:

```json
{
  "query": {
    "metrics": ["oUserPresences", "oUserRoutingStatuses"],
    "filter": {
      "type": "or",
      "predicates": [{ "dimension": "teamId", "value": "00000000-0000-0000-0000-000000000001" }]
    }
  }
}
```

Example B:

```json
{
  "query": {
    "metrics": ["oInteracting", "oNotResponding"],
    "detailMetrics": ["oInteracting"],
    "filter": {
      "type": "or",
      "predicates": [{ "dimension": "userId", "value": "00000000-0000-0000-0000-000000000001" }]
    }
  }
}
```

### Analytics Conversations Activity

- Tool: `analytics_conversations_activity`
- Source: [`../src/tools/analyticsConversationsActivity.ts`](../src/tools/analyticsConversationsActivity.ts)
- Permission: `analytics:conversationObservation:view`
- Endpoint: `POST /api/v2/analytics/conversations/activity/query`

Example A:

```json
{
  "query": {
    "metrics": [{ "metric": "activeConversations" }],
    "groupBy": ["queueId"],
    "order": "desc"
  },
  "pageSize": 100,
  "pageNumber": 1
}
```

Example B:

```json
{
  "query": {
    "metrics": [
      { "metric": "activeConversations", "details": true },
      { "metric": "waitingConversations" }
    ],
    "groupBy": ["userId", "mediaType"],
    "filter": {
      "type": "or",
      "predicates": [{ "dimension": "queueId", "value": "00000000-0000-0000-0000-000000000001" }]
    }
  }
}
```

### Analytics Routing Activity

- Tool: `analytics_routing_activity`
- Source: [`../src/tools/analyticsRoutingActivity.ts`](../src/tools/analyticsRoutingActivity.ts)
- Permission: `analytics:routingObservation:view`
- Endpoint: `POST /api/v2/analytics/routing/activity/query`

Example A:

```json
{
  "query": {
    "metrics": [{ "metric": "usersOnQueue" }],
    "groupBy": ["queueId"],
    "order": "desc"
  },
  "pageSize": 100,
  "pageNumber": 1
}
```

Example B:

```json
{
  "query": {
    "metrics": [
      { "metric": "usersOnQueue", "details": true },
      { "metric": "usersInteracting" }
    ],
    "groupBy": ["routingStatus", "teamId"],
    "filter": {
      "type": "or",
      "predicates": [{ "dimension": "queueId", "value": "00000000-0000-0000-0000-000000000001" }]
    }
  }
}
```

### Analytics Users Activity

- Tool: `analytics_users_activity`
- Source: [`../src/tools/analyticsUsersActivity.ts`](../src/tools/analyticsUsersActivity.ts)
- Permission: `analytics:userObservation:view`
- Endpoint: `POST /api/v2/analytics/users/activity/query`

Example A:

```json
{
  "query": {
    "metrics": [{ "metric": "interactions" }],
    "groupBy": ["userId"],
    "order": "desc"
  },
  "pageSize": 100,
  "pageNumber": 1
}
```

Example B:

```json
{
  "query": {
    "metrics": [
      { "metric": "interactions", "details": true },
      { "metric": "notResponding" }
    ],
    "groupBy": ["teamId", "routingStatus"],
    "filter": {
      "type": "or",
      "predicates": [{ "dimension": "divisionId", "value": "00000000-0000-0000-0000-000000000001" }]
    }
  }
}
```

### KPI Queue Performance Summary

- Tool: `kpi_queue_performance_summary`
- Source: [`../src/tools/kpiQueuePerformanceSummary.ts`](../src/tools/kpiQueuePerformanceSummary.ts)
- Permission: `analytics:conversationAggregate:view`
- Endpoint: `POST /api/v2/analytics/conversations/aggregates/query`

Example A:

```json
{
  "interval": "2026-03-01T00:00:00Z/2026-03-08T00:00:00Z",
  "granularity": "P1D",
  "queueIds": ["00000000-0000-0000-0000-000000000001"]
}
```

Example B:

```json
{
  "interval": "2026-03-07T00:00:00Z/2026-03-08T00:00:00Z",
  "mediaTypes": ["voice", "chat"],
  "metrics": ["nOffered", "nAnswered", "nAbandon", "tWait", "tHandle"],
  "includeRawResponse": true
}
```

### KPI Agent Performance Summary

- Tool: `kpi_agent_performance_summary`
- Source: [`../src/tools/kpiAgentPerformanceSummary.ts`](../src/tools/kpiAgentPerformanceSummary.ts)
- Permission: `analytics:conversationAggregate:view`
- Endpoint: `POST /api/v2/analytics/conversations/aggregates/query`

Example A:

```json
{
  "interval": "2026-03-01T00:00:00Z/2026-03-08T00:00:00Z",
  "granularity": "P1D",
  "userIds": ["00000000-0000-0000-0000-000000000001"]
}
```

Example B:

```json
{
  "interval": "2026-03-07T00:00:00Z/2026-03-08T00:00:00Z",
  "queueIds": ["00000000-0000-0000-0000-000000000010"],
  "metrics": ["nConnected", "nAnswered", "tHandle", "tTalk", "tAcw"],
  "includeRawResponse": true
}
```

## Other Tools (Summary)

These tools keep their existing request/response behavior and are intentionally straightforward.

- Search and discovery
  - `search_queues` ([`../src/tools/searchQueues.ts`](../src/tools/searchQueues.ts))
  - `search_voice_conversations` ([`../src/tools/searchVoiceConversations.ts`](../src/tools/searchVoiceConversations.ts))
  - `sample_conversations_by_queue` ([`../src/tools/sampleConversationsByQueue/sampleConversationsByQueue.ts`](../src/tools/sampleConversationsByQueue/sampleConversationsByQueue.ts))
  - `query_queue_volumes` ([`../src/tools/queryQueueVolumes/queryQueueVolumes.ts`](../src/tools/queryQueueVolumes/queryQueueVolumes.ts))
- Conversation intelligence
  - `voice_call_quality` ([`../src/tools/voiceCallQuality/voiceCallQuality.ts`](../src/tools/voiceCallQuality/voiceCallQuality.ts))
  - `conversation_sentiment` ([`../src/tools/conversationSentiment/conversationSentiment.ts`](../src/tools/conversationSentiment/conversationSentiment.ts))
  - `conversation_topics` ([`../src/tools/conversationTopics/conversationTopics.ts`](../src/tools/conversationTopics/conversationTopics.ts))
  - `conversation_transcript` ([`../src/tools/conversationTranscript/conversationTranscript.ts`](../src/tools/conversationTranscript/conversationTranscript.ts))
- OAuth administration
  - `oauth_clients` ([`../src/tools/oauthClients/oauthClients.ts`](../src/tools/oauthClients/oauthClients.ts))
  - `oauth_client_usage` ([`../src/tools/oauthClientUsage/oauthClientUsage.ts`](../src/tools/oauthClientUsage/oauthClientUsage.ts))
