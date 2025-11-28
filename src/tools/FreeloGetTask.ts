import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { createFreeloClient, FreeloTask } from "../utils/freeloApi.js";

interface FreeloGetTaskInput {
  taskId: number;
}

/**
 * Tool for retrieving detailed information about a specific Freelo task
 */
class FreeloGetTask extends MCPTool<FreeloGetTaskInput> {
  name = "freelo_get_task";
  description = "Get detailed information about a specific Freelo task by its ID. Returns task name, description, author, assignee, dates, priority, state, project, task list, comments (with files), and all other task details.";

  schema = {
    taskId: {
      type: z.number().positive(),
      description: "The unique ID of the task to retrieve",
    },
  };

  async execute(input: FreeloGetTaskInput) {
    try {
      const client = createFreeloClient();
      const task: FreeloTask = await client.getTask(input.taskId);

      // Format the response for better readability
      return {
        success: true,
        task: {
          id: task.id,
          name: task.name,
          description: task.description || "(no description)",
          priority: this.formatPriority(task.priority_enum),
          state: task.state?.state || "unknown",
          completed: task.completed || false,

          // Dates
          created: task.date_add,
          dueDate: task.due_date || null,
          dueDateEnd: task.due_date_end || null,
          completedDate: task.date_complete || null,

          // People
          author: {
            id: task.author.id,
            name: task.author.fullname,
            email: task.author.email,
          },
          assignee: task.worker ? {
            id: task.worker.id,
            name: task.worker.fullname,
            email: task.worker.email,
          } : null,

          // Organization
          project: {
            id: task.project.id,
            name: task.project.name,
            state: task.project.state?.state || null,
          },
          taskList: {
            id: task.tasklist.id,
            name: task.tasklist.name,
            state: task.tasklist.state?.state || null,
          },

          // Additional info
          tags: task.tags || [],
          timeEstimate: task.time_estimate || null,

          // Comments and files
          comments: (task.comments || []).map((comment) => ({
            id: comment.id,
            content: comment.content,
            isDescription: comment.is_description || false,
            createdAt: comment.date_add,
            author: {
              id: comment.author.id,
              name: comment.author.fullname,
              email: comment.author.email,
            },
            files: (comment.files || []).map((file) => ({
              uuid: file.uuid,
              filename: file.filename,
              size: file.size,
              sizeFormatted: this.formatFileSize(file.size),
              caption: file.caption,
              description: file.description,
              uploadedAt: file.date_add,
            })),
          })),
          totalComments: (task.comments || []).length,
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch task: ${error.message}`);
      }
      throw new Error("Unknown error occurred while fetching task");
    }
  }

  /**
   * Format priority enum to human-readable string
   */
  private formatPriority(priority: string): string {
    const priorities: Record<string, string> = {
      l: "Low",
      m: "Medium",
      h: "High",
    };
    return priorities[priority] || priority;
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

export default FreeloGetTask;
