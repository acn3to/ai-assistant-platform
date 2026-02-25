export interface ToolUseBlock {
  toolUseId: string;
  name: string;
  input: Record<string, any>;
}

export interface ToolResultContent {
  toolUseId: string;
  content: Array<{ json: any }>;
  status?: 'success' | 'error';
}

export interface SessionContext {
  sessionVars: Record<string, string>;
  secrets: Record<string, string>;
}

