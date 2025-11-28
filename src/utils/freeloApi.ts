/**
 * Freelo API Client
 * Documentation: https://freelo.docs.apiary.io/
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface FreeloUser {
  id: number;
  fullname: string;
  email?: string;
}

export interface FreeloState {
  id: number;
  state: string; // e.g., "active", "completed", "archived"
}

export interface FreeloTaskList {
  id: number;
  name: string;
  state?: FreeloState; // Optional - not always included in responses
}

export interface FreeloProject {
  id: number;
  name: string;
  state?: FreeloState; // Optional - not always included in responses
}

export interface FreeloTask {
  id: number;
  name: string;
  description?: string;
  priority_enum: string; // e.g., "l" (low), "m" (medium), "h" (high)
  due_date?: string;
  due_date_end?: string;
  date_add: string;
  date_complete?: string;
  date_finished?: string;
  author: FreeloUser;
  worker?: FreeloUser;
  tasklist: FreeloTaskList; // API uses "tasklist", not "task_list"
  project: FreeloProject;
  state: FreeloState;
  tags?: string[];
  time_estimate?: number;
  completed?: boolean;
  comments?: FreeloComment[];
}

export interface FreeloFile {
  uuid: string;
  filename: string;
  size: number;
  caption?: string;
  description?: string;
  date_add: string;
  date_edited_at?: string;
}

export interface FreeloComment {
  id: number;
  content: string;
  date_add: string;
  author: FreeloUser;
  is_description?: boolean;
  files?: FreeloFile[];
}

export interface FreeloSubtask {
  id: number;
  task_id: number;
  name: string;
  date_add: string;
  due_date?: string;
  due_date_end?: string;
  count_comments: number;
  count_subtasks: number;
  author: FreeloUser;
  worker?: FreeloUser;
  state: FreeloState;
  project: FreeloProject;
  tasklist: FreeloTaskList;
}

export interface FreeloSubtasksResponse {
  total: number;
  count: number;
  page: number;
  per_page: number;
  data: {
    subtasks: FreeloSubtask[];
  };
}

export interface FreeloAttachment {
  id: number;
  name: string;
  filename: string;
  size: number;
  mime_type: string;
  url: string;
  date_add: string;
  author: FreeloUser;
}

export interface FreeloApiError {
  error: string;
  message: string;
  statusCode: number;
}

// ============================================================================
// API Client
// ============================================================================

export class FreeloApiClient {
  private email: string;
  private apiKey: string;
  private baseUrl: string = "https://api.freelo.io/v1";

  constructor(email: string, apiKey: string) {
    if (!email) {
      throw new Error("Freelo email is required. Set FREELO_EMAIL environment variable.");
    }
    if (!apiKey) {
      throw new Error("Freelo API key is required. Set FREELO_API_KEY environment variable.");
    }
    this.email = email;
    this.apiKey = apiKey;
  }

  /**
   * Make authenticated API request using HTTP Basic Authentication
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // HTTP Basic Authentication: base64(email:apiKey)
    const credentials = Buffer.from(`${this.email}:${this.apiKey}`).toString('base64');

    const headers = {
      "Authorization": `Basic ${credentials}`,
      "User-Agent": `freelo-mcp (${this.email})`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If error response is not JSON, use status text
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Freelo API error: ${error.message}`);
      }
      throw new Error("Unknown Freelo API error");
    }
  }

  /**
   * Get task details by ID
   */
  async getTask(taskId: number): Promise<FreeloTask> {
    return this.request<FreeloTask>(`/task/${taskId}`);
  }

  /**
   * List subtasks for a task
   * Returns paginated response with subtasks array
   */
  async listTaskSubtasks(taskId: number): Promise<FreeloSubtask[]> {
    const response = await this.request<FreeloSubtasksResponse>(`/task/${taskId}/subtasks`);
    return response.data.subtasks;
  }

  /**
   * Download file by UUID
   * According to API documentation: GET /file/{file_uuid}
   */
  async downloadFile(fileUuid: string): Promise<ArrayBuffer> {
    // HTTP Basic Authentication: base64(email:apiKey)
    const credentials = Buffer.from(`${this.email}:${this.apiKey}`).toString('base64');

    const response = await fetch(`${this.baseUrl}/file/${fileUuid}`, {
      headers: {
        "Authorization": `Basic ${credentials}`,
        "User-Agent": `freelo-mcp (${this.email})`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }

    return response.arrayBuffer();
  }

  /**
   * NOTE: API does not provide a direct endpoint for listing task attachments.
   * Files are included in the task comments when you fetch a task.
   * This method is kept for backwards compatibility but will throw an error.
   * @deprecated Use getTask() and extract files from comments instead
   */
  async listTaskAttachments(taskId: number): Promise<FreeloAttachment[]> {
    throw new Error(
      "API does not support /task/{id}/attachments endpoint. " +
      "Files are included in task comments. Use getTask() instead."
    );
  }

  /**
   * NOTE: API does not provide a direct endpoint for getting attachment by ID.
   * Files use UUIDs and are accessed via /file/{uuid}
   * @deprecated Use downloadFile(uuid) instead
   */
  async getAttachment(attachmentId: number): Promise<FreeloAttachment> {
    throw new Error(
      "API does not support /attachments/{id} endpoint. " +
      "Files use UUIDs. Use downloadFile(uuid) instead."
    );
  }
}

/**
 * Create API client instance from environment variables
 */
export function createFreeloClient(): FreeloApiClient {
  const email = process.env.FREELO_EMAIL;
  const apiKey = process.env.FREELO_API_KEY;

  if (!email) {
    throw new Error(
      "FREELO_EMAIL environment variable is not set. " +
      "Please configure it in your MCP server settings."
    );
  }

  if (!apiKey) {
    throw new Error(
      "FREELO_API_KEY environment variable is not set. " +
      "Please configure it in your MCP server settings."
    );
  }

  return new FreeloApiClient(email, apiKey);
}
