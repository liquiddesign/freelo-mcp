# freelo-mcp

A Model Context Protocol (MCP) server built with mcp-framework that provides integration with [Freelo](https://www.freelo.io) project management API.

## Features

This MCP server exposes tools for interacting with Freelo tasks, subtasks, and files:

- **freelo_get_task** - Get detailed information about a task including comments and attached files
- **freelo_list_task_subtasks** - List all subtasks with completion status
- **freelo_download_file** - Download files from task comments using UUID

## Quick Start

### 1. Get Your Freelo API Key

1. Log in to your [Freelo Dashboard](https://app.freelo.cz/dashboard)
2. Click on your avatar in the top right corner → **Settings**
3. Scroll to the bottom to find your **API Key**

### 2. Add to Claude Code

```bash
claude mcp add freelo-mcp -e FREELO_EMAIL=your-email@example.com -e FREELO_API_KEY=your-api-key -- npx -y @liquiddesign/freelo-mcp
```

That's it! You can now use Freelo tools in Claude Code.

## Alternative Setup

### Claude Code (Manual)

Add to your MCP settings (`~/.claude/settings.json` or project `.mcp.json`):

```json
{
  "mcpServers": {
    "freelo-mcp": {
      "command": "npx",
      "args": ["-y", "@liquiddesign/freelo-mcp"],
      "env": {
        "FREELO_EMAIL": "your-email@example.com",
        "FREELO_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Claude Desktop

Add to Claude Desktop configuration file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "freelo-mcp": {
      "command": "npx",
      "args": ["-y", "@liquiddesign/freelo-mcp"],
      "env": {
        "FREELO_EMAIL": "your-email@example.com",
        "FREELO_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Watch mode during development
npm run watch
```

For local development, configure Claude to use the built project directly:

```json
{
  "mcpServers": {
    "freelo-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/freelo-mcp/dist/index.js"],
      "env": {
        "FREELO_EMAIL": "your-email@example.com",
        "FREELO_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Project Structure

```
freelo-mcp/
├── src/
│   ├── tools/                           # MCP Tools
│   │   ├── FreeloGetTask.ts             # Get task details with comments & files
│   │   ├── FreeloListTaskSubtasks.ts    # List task subtasks
│   │   └── FreeloDownloadFile.ts        # Download files by UUID
│   ├── utils/
│   │   └── freeloApi.ts                 # Freelo API client & types
│   └── index.ts                         # Server entry point
├── package.json
├── tsconfig.json
└── CLAUDE.md                            # Claude Code instructions
```

## Available Tools

### 1. freelo_get_task

Get detailed information about a specific Freelo task, including all comments and attached files.

**Parameters:**
- `taskId` (number) - The unique ID of the task

**Returns:**
- Task name, description, priority, state
- Author and assignee information
- Dates (created, due, completed)
- Project and task list details
- Tags and time estimates
- Comments with content, author, timestamps, and attached files (with UUIDs)

**Example:**
```
Use freelo_get_task with taskId: 12345
```

### 2. freelo_list_task_subtasks

List all subtasks of a specific task with completion statistics.

**Parameters:**
- `taskId` (number) - The unique ID of the task

**Returns:**
- Array of subtasks with names, state, dates, author, assignee
- Statistics (total, completed, remaining, completion percentage)

**Example:**
```
Use freelo_list_task_subtasks with taskId: 12345
```

### 3. freelo_download_file

Download a file from Freelo using its UUID. File UUIDs are found in task comments (use `freelo_get_task` first).

**Parameters:**
- `fileUuid` (string) - The UUID of the file (from task comments)
- `filename` (string, optional) - Custom filename to save as

**Returns:**
- Downloaded file path (in system temp directory)
- File metadata (UUID, filename, size)

**Example:**
```
Use freelo_download_file with fileUuid: "550e8400-e29b-41d4-a716-446655440000"
```

## Adding New Tools

You can extend this MCP server with additional Freelo API tools:

```bash
# Add a new tool using mcp-framework CLI
mcp add tool my-tool

# Examples of additional Freelo tools you might create:
# - freelo_list_projects
# - freelo_create_task
# - freelo_add_comment
```

## Tool Development

Example tool structure:

```typescript
import { MCPTool } from "mcp-framework";
import { z } from "zod";

interface MyToolInput {
  message: string;
}

class MyTool extends MCPTool<MyToolInput> {
  name = "my_tool";
  description = "Describes what your tool does";

  schema = {
    message: {
      type: z.string(),
      description: "Description of this input parameter",
    },
  };

  async execute(input: MyToolInput) {
    // Your tool logic here
    return `Processed: ${input.message}`;
  }
}

export default MyTool;
```

## Publishing to npm

1. Update your package.json:
   - Ensure `name` is unique and follows npm naming conventions
   - Set appropriate `version`
   - Add `description`, `author`, `license`, etc.
   - Check `bin` points to the correct entry file

2. Build and test locally:
   ```bash
   npm run build
   npm link
   freelo-mcp  # Test your CLI locally
   ```

3. Login to npm (create account if necessary):
   ```bash
   npm login
   ```

4. Publish your package:
   ```bash
   npm publish
   ```

After publishing, users can add it to their Claude Desktop client (see below) or run it with npx.

## Usage with Claude Desktop

After building the project and configuring your credentials (see [Freelo API Setup](#freelo-api-setup)), restart Claude Desktop to load the MCP server.

You can then use the Freelo tools in your conversations with Claude:

**Example conversation:**
```
You: "Get details for Freelo task 12345"
Claude: [Uses freelo_get_task tool and returns task info with comments and files]

You: "Show me the subtasks"
Claude: [Uses freelo_list_task_subtasks tool and displays subtasks]

You: "Download the first file attachment"
Claude: [Uses freelo_download_file with the UUID from the task comments]
```

## Building and Testing

1. Make changes to your tools
2. Run `npm run build` to compile
3. The server will automatically load your tools on startup

## Learn More

### MCP Framework
- [MCP Framework GitHub](https://github.com/QuantGeekDev/mcp-framework)
- [MCP Framework Docs](https://mcp-framework.com)
- [Model Context Protocol](https://modelcontextprotocol.io)

### Freelo API
- [Freelo API Documentation](https://freelo.docs.apiary.io/) - Official API reference
- [Freelo API Help](https://help.freelo.io/help/api-klic/) - How to get your API key
- [Freelo Website](https://www.freelo.io) - Project management platform

## API Reference

This MCP server uses the Freelo REST API v1:

- **Base URL**: `https://api.freelo.io/v1`
- **Authentication**: HTTP Basic Auth (email:apiKey)
- **Response Format**: JSON
- **Current Support**: Read-only operations (GET endpoints)

For detailed API specifications, see the [official Freelo API documentation](https://freelo.docs.apiary.io/).

## Contributing

This is a personal project for Freelo API integration. Feel free to extend it with additional tools or improvements.

## License

MIT
