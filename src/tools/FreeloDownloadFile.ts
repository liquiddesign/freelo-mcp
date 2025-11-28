import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { createFreeloClient } from "../utils/freeloApi.js";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

interface FreeloDownloadFileInput {
  fileUuid: string;
  filename?: string;
}

/**
 * Tool for downloading files from Freelo
 * Files in Freelo use UUIDs and are accessed via /file/{uuid} endpoint
 * To get file UUIDs, retrieve task details and inspect the comments.files array
 */
class FreeloDownloadFile extends MCPTool<FreeloDownloadFileInput> {
  name = "freelo_download_file";
  description = "Download a file from Freelo using its UUID. Files are found in task comments. Downloads the file to a temporary directory and returns the file path. Get file UUIDs by retrieving task details with freelo_get_task.";

  schema = {
    fileUuid: {
      type: z.string().uuid(),
      description: "The UUID of the file to download (found in task comments)",
    },
    filename: {
      type: z.string().optional(),
      description: "Optional filename to save as (otherwise uses UUID)",
    },
  };

  async execute(input: FreeloDownloadFileInput) {
    try {
      const client = createFreeloClient();

      // Create temp directory if it doesn't exist
      const tempDir = path.join(os.tmpdir(), "freelo-files");
      await fs.mkdir(tempDir, { recursive: true });

      // Generate filename
      const timestamp = Date.now();
      const filename = input.filename
        ? this.sanitizeFilename(input.filename)
        : `${input.fileUuid}`;
      const filePath = path.join(tempDir, `${timestamp}-${filename}`);

      // Download the file using UUID
      const fileBuffer = await client.downloadFile(input.fileUuid);

      // Save to disk
      await fs.writeFile(filePath, Buffer.from(fileBuffer));

      // Get file size
      const stats = await fs.stat(filePath);

      return {
        success: true,
        file: {
          uuid: input.fileUuid,
          filename: filename,
          filePath: filePath,
          size: stats.size,
          sizeFormatted: this.formatFileSize(stats.size),
        },
        message: `File successfully downloaded to: ${filePath}`,
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: "Unknown error occurred while downloading file",
      };
    }
  }

  /**
   * Sanitize filename to remove potentially dangerous characters
   */
  private sanitizeFilename(filename: string): string {
    // Remove or replace dangerous characters
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_{2,}/g, "_")
      .substring(0, 200); // Limit length
  }

  /**
   * Format file size in human-readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}

export default FreeloDownloadFile;
