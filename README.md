# Genesys Cloud MCP Server

[![npm](https://img.shields.io/npm/v/@makingchatbots/genesys-cloud-mcp-server)](https://www.npmjs.com/package/@makingchatbots/genesys-cloud-mcp-server)
[![Follow me on LinkedIn for updates](https://img.shields.io/badge/Follow%20for%20updates-LinkedIn-blue)](https://www.linkedin.com/in/lucas-woodward-the-dev/)

A Model Context Protocol (MCP) server for Genesys Cloud's Platform API.

## Tools

Full tool reference (detailed input payloads, permissions, and endpoints): [docs/tools.md](docs/tools.md).

### Queue and Conversation Discovery

| Tool | MCP Name | Key Inputs |
|---|---|---|
| [Search Queues](docs/tools.md#search-queues) | `search_queues` | `name`, `pageNumber`, `pageSize` |
| [Search Voice Conversations](docs/tools.md#search-voice-conversations) | `search_voice_conversations` | `startDate`, `endDate`, `phoneNumber?`, `pageNumber?`, `pageSize?` |
| [Sample Conversations By Queue](docs/tools.md#sample-conversations-by-queue) | `sample_conversations_by_queue` | `queueId`, `startDate`, `endDate` |
| [Query Queue Volumes](docs/tools.md#query-queue-volumes) | `query_queue_volumes` | `queueIds[]`, `startDate`, `endDate` |

### Analytics Aggregates and Observations

| Tool | MCP Name | Key Inputs |
|---|---|---|
| [Analytics Conversations Aggregates](docs/tools.md#analytics-conversations-aggregates) | `analytics_conversations_aggregates` | `query` (`ConversationAggregationQuery`) |
| [Analytics Conversations Aggregates Async](docs/tools.md#analytics-conversations-aggregates-async) | `analytics_conversations_aggregates_async` | `operation`, `query?`, `jobId?`, `cursor?` |
| [Analytics Users Aggregates](docs/tools.md#analytics-users-aggregates) | `analytics_users_aggregates` | `query` (`UserAggregationQuery`) |
| [Analytics Queues Observations](docs/tools.md#analytics-queues-observations) | `analytics_queues_observations` | `query` (`QueueObservationQuery`) |
| [Analytics Users Observations](docs/tools.md#analytics-users-observations) | `analytics_users_observations` | `query` (`UserObservationQuery`) |

### Conversation Intelligence

| Tool | MCP Name | Key Inputs |
|---|---|---|
| [Voice Call Quality](docs/tools.md#voice-call-quality) | `voice_call_quality` | `conversationIds[]` |
| [Conversation Sentiment](docs/tools.md#conversation-sentiment) | `conversation_sentiment` | `conversationIds[]` |
| [Conversation Topics](docs/tools.md#conversation-topics) | `conversation_topics` | `conversationId` |
| [Conversation Transcript](docs/tools.md#conversation-transcript) | `conversation_transcript` | `conversationId` |

### OAuth Administration

| Tool | MCP Name | Key Inputs |
|---|---|---|
| [OAuth Clients](docs/tools.md#oauth-clients) | `oauth_clients` | No input |
| [OAuth Client Usage](docs/tools.md#oauth-client-usage) | `oauth_client_usage` | `oauthClientId`, `startDate`, `endDate` |

## Usage with Claude Desktop

### MCP Bundle

This MCP Server provides an [MCP Bundle](https://github.com/anthropics/mcpb) (.mcpb file) along with each [release](https://github.com/MakingChatbots/genesys-cloud-mcp-server/releases),
which is a single-click installable package for Claude Desktop. To use it:

1. Download the `.mcpb` file from the [latest release](https://github.com/MakingChatbots/genesys-cloud-mcp-server/releases)
2. In Claude Desktop navigate to Settings > Extensions.
3. Open the .mcpb file with Claude
4. Configure the Region and OAuth Client for the extension

The extension will now be available in your conversations.

### NPX

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "genesys-cloud": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@makingchatbots/genesys-cloud-mcp-server"],
      "env": {
        "GENESYSCLOUD_REGION": "<PUT REGION HERE>",
        "GENESYSCLOUD_OAUTHCLIENT_ID": "<PUT OAUTHCLIENT ID HERE>",
        "GENESYSCLOUD_OAUTHCLIENT_SECRET": "<PUT OAUTHCLIENT SECRET HERE>",
        "GENESYSCLOUD_AUTH_MODE": "client_credentials"
      }
    }
  }
}
```

## Usage with Gemini CLI

Add below to your `.gemini/settings.json` file. You can read more about the [setup from the official guide](https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/tutorials.md#configure-the-mcp-server-in-settingsjson).

```json
{
  "mcpServers": {
    "genesysCloud": {
      "command": "npx",
      "args": ["-y", "@makingchatbots/genesys-cloud-mcp-server"],
      "env": {
        "GENESYSCLOUD_REGION": "${GENESYSCLOUD_REGION}",
        "GENESYSCLOUD_OAUTHCLIENT_ID": "${GENESYSCLOUD_OAUTHCLIENT_ID}",
        "GENESYSCLOUD_OAUTHCLIENT_SECRET": "${GENESYSCLOUD_OAUTHCLIENT_SECRET}",
        "GENESYSCLOUD_AUTH_MODE": "client_credentials"
      }
    }
  }
}
```

## Authentication

This currently only supports a stdio server. Authentication supports two modes:

1. `client_credentials` (default when `GENESYSCLOUD_ACCESS_TOKEN` is not provided)
2. `access_token` (for delegated OAuth Code/PKCE style flows where the caller supplies a user access token)

### Client Credentials Mode

To configure OAuth Client Credentials authentication you'll need to:

1. Create an OAuth Client in Genesys Cloud
2. Assign the permissions to it for the tools you want to be used
3. Provide the following environment variables when referencing the server:
   - `GENESYSCLOUD_REGION`
   - `GENESYSCLOUD_OAUTHCLIENT_ID`
   - `GENESYSCLOUD_OAUTHCLIENT_SECRET`
   - Optional: `GENESYSCLOUD_AUTH_MODE=client_credentials`

### Access Token Mode (Delegated User Token)

For delegated, on-behalf-of-user calls:

1. Obtain a valid Genesys Cloud user access token externally (e.g. OAuth Code/PKCE flow)
2. Provide the following environment variables when referencing the server:
   - `GENESYSCLOUD_REGION`
   - `GENESYSCLOUD_ACCESS_TOKEN`
   - `GENESYSCLOUD_AUTH_MODE=access_token` (recommended for explicitness)

If `GENESYSCLOUD_AUTH_MODE` is omitted, the server uses `auto` mode:

- If `GENESYSCLOUD_ACCESS_TOKEN` is set, it uses access-token mode
- Otherwise, it falls back to client credentials mode

## Development

### Getting Started

```bash
nvm use
npm install
npm run dev
```

## Security and Pre-Commit Hygiene

Before opening a PR or publishing your fork:

1. Keep credentials in local environment only (`.env*`), never hardcode tokens/secrets.
2. Remove local HTTP/debug capture files before commit because they may contain bearer tokens/cookies.
3. Rotate any credential that was ever pasted into a terminal, chat, or captured log.
4. Verify no sensitive changes are staged:
   - `git status --short`
   - `git diff -- . ':(exclude).env*'`

## Under active development

This is part of [personal project](https://www.linkedin.com/posts/lucas-woodward-the-dev_genesys-genesyscloud-vertexai-activity-7321306518908280833-cWt8?utm_source=share&utm_medium=member_desktop&rcm=ACoAABsbo2wBcmnNqxYJ5UO9BrsfURZcVEtgLOU)
to create a conversational Business Insights tool. It is a practical way for me to learn MCP servers, and how best to represent Genesys Cloud's Platform APIs in a way that can be easily consumed by LLMs.

There will be a lot of changes, and I will be sure to [share my learnings in my newsletter](https://makingchatbots.com/).
