import { MCPServer } from "mcp-framework";
import "dotenv/config";
import { dirname } from "path";
import { fileURLToPath } from "url";

// Resolve the base path from the current module location
// This ensures tools are found correctly when running via npm link or global install
const __dirname = dirname(fileURLToPath(import.meta.url));

const server = new MCPServer({
  basePath: __dirname,
  transport: {
    type: "stdio"
  }
});

server.start();