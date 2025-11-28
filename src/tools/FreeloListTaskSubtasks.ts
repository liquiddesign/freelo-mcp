import { MCPTool } from "mcp-framework";
import { z } from "zod";
import { createFreeloClient, FreeloSubtask } from "../utils/freeloApi.js";

interface FreeloListTaskSubtasksInput {
  taskId: number;
}

/**
 * Tool for listing all subtasks of a specific Freelo task
 */
class FreeloListTaskSubtasks extends MCPTool<FreeloListTaskSubtasksInput> {
  name = "freelo_list_task_subtasks";
  description = "List all subtasks of a specific Freelo task. Returns subtask names, completion status, and order positions.";

  schema = {
    taskId: {
      type: z.number().positive(),
      description: "The unique ID of the task to retrieve subtasks for",
    },
  };

  async execute(input: FreeloListTaskSubtasksInput) {
    try {
      const client = createFreeloClient();
      const subtasks: FreeloSubtask[] = await client.listTaskSubtasks(input.taskId);

      // Format subtasks for better readability
      const formattedSubtasks = subtasks.map((subtask) => ({
        id: subtask.id,
        name: subtask.name,
        state: subtask.state.state,
        createdAt: subtask.date_add,
        dueDate: subtask.due_date || null,
        dueDateEnd: subtask.due_date_end || null,
        commentsCount: subtask.count_comments,
        subtasksCount: subtask.count_subtasks,
        author: {
          id: subtask.author.id,
          name: subtask.author.fullname,
        },
        assignee: subtask.worker ? {
          id: subtask.worker.id,
          name: subtask.worker.fullname,
        } : null,
        project: {
          id: subtask.project.id,
          name: subtask.project.name,
        },
        taskList: {
          id: subtask.tasklist.id,
          name: subtask.tasklist.name,
        },
      }));

      // Calculate statistics based on state
      const completedCount = formattedSubtasks.filter(st =>
        st.state === 'completed' || st.state === 'finished'
      ).length;
      const totalCount = formattedSubtasks.length;

      return {
        success: true,
        taskId: input.taskId,
        statistics: {
          total: totalCount,
          completed: completedCount,
          remaining: totalCount - completedCount,
          completionPercentage: totalCount > 0
            ? Math.round((completedCount / totalCount) * 100)
            : 0,
        },
        subtasks: formattedSubtasks,
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
        error: "Unknown error occurred while fetching task subtasks",
      };
    }
  }
}

export default FreeloListTaskSubtasks;
