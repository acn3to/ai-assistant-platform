import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '@ai-platform/shared';
import type { IDataConnector, IConnectorTool } from '@ai-platform/shared';
import type { ToolUseBlock, ToolResultContent, SessionContext } from '../types';

class ConnectorRuntime {
  /**
   * Processes a tool_use response from Bedrock.
   * Finds the matching connector tool, executes the HTTP call,
   * and returns the result formatted for Bedrock tool_result.
   */
  async executeTool(
    toolUseBlock: ToolUseBlock,
    connectors: IDataConnector[],
    context: SessionContext,
  ): Promise<ToolResultContent> {
    const startTime = Date.now();

    try {
      const { connector, tool } = this.findTool(toolUseBlock.name, connectors);

      logger.info('Executing connector tool', {
        toolName: toolUseBlock.name,
        connectorId: connector.connectorId,
        input: toolUseBlock.input,
      });

      const request = this.buildRequest(connector, tool, toolUseBlock.input, context);
      const response = await this.executeWithTimeout(request, connector.timeoutMs);
      const result = this.mapResponse(response, tool.responseMapping);

      const latency = Date.now() - startTime;
      logger.info('Connector tool executed', {
        toolName: toolUseBlock.name,
        latency,
        status: response.status,
      });

      return {
        toolUseId: toolUseBlock.toolUseId,
        content: [{ json: result }],
        status: 'success',
      };
    } catch (error: any) {
      const latency = Date.now() - startTime;
      logger.error('Connector tool execution failed', {
        toolName: toolUseBlock.name,
        latency,
        error: error.message,
      });

      return {
        toolUseId: toolUseBlock.toolUseId,
        content: [{ json: { error: `Tool execution failed: ${error.message}` } }],
        status: 'error',
      };
    }
  }

  private findTool(
    toolName: string,
    connectors: IDataConnector[],
  ): { connector: IDataConnector; tool: IConnectorTool } {
    for (const connector of connectors) {
      const tool = connector.tools.find((t) => t.name === toolName);
      if (tool) {
        return { connector, tool };
      }
    }
    throw new Error(`Tool '${toolName}' not found in any connector`);
  }

  private buildRequest(
    connector: IDataConnector,
    tool: IConnectorTool,
    input: Record<string, any>,
    context: SessionContext,
  ): AxiosRequestConfig {
    const url = `${connector.baseUrl}${this.interpolate(tool.path, input)}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Apply auth headers
    if (connector.authType === 'bearer' && connector.authConfig.bearerToken) {
      headers['Authorization'] = `Bearer ${this.resolveSecret(connector.authConfig.bearerToken, context.secrets)}`;
    } else if (connector.authType === 'api_key' && connector.authConfig.apiKey) {
      const headerName = connector.authConfig.headerName || 'X-API-Key';
      headers[headerName] = this.resolveSecret(connector.authConfig.apiKey, context.secrets);
    } else if (connector.authType === 'custom_headers' && connector.authConfig.customHeaders) {
      for (const [key, value] of Object.entries(connector.authConfig.customHeaders)) {
        headers[key] = this.resolveSecret(value, context.secrets);
      }
    }

    // Apply tool-specific headers
    if (tool.requestMapping.headers) {
      for (const [key, value] of Object.entries(tool.requestMapping.headers)) {
        headers[key] = this.interpolate(value, { ...input, ...context.sessionVars });
      }
    }

    // Build query params
    const params: Record<string, string> = {};
    if (tool.requestMapping.queryParams) {
      for (const [key, value] of Object.entries(tool.requestMapping.queryParams)) {
        params[key] = this.interpolate(value, input);
      }
    }

    // Build body from template
    let data: any = undefined;
    if (tool.requestMapping.bodyTemplate && ['POST', 'PUT', 'PATCH'].includes(tool.method)) {
      data = this.interpolateObject(tool.requestMapping.bodyTemplate, { ...input, ...context.sessionVars, ...context.secrets });
    }

    return {
      method: tool.method.toLowerCase() as any,
      url,
      headers,
      params: Object.keys(params).length > 0 ? params : undefined,
      data,
    };
  }

  private async executeWithTimeout(config: AxiosRequestConfig, timeoutMs: number): Promise<AxiosResponse> {
    return axios({
      ...config,
      timeout: timeoutMs,
    });
  }

  private mapResponse(response: AxiosResponse, mapping?: IConnectorTool['responseMapping']): any {
    let data = response.data;

    if (mapping?.extractPath) {
      data = this.extractByPath(data, mapping.extractPath);
    }

    // Truncate large responses
    const maxSize = mapping?.maxResponseSize || 10000;
    const serialized = JSON.stringify(data);
    if (serialized.length > maxSize) {
      data = JSON.parse(serialized.substring(0, maxSize) + '..."}}');
    }

    return data;
  }

  private extractByPath(data: any, path: string): any {
    // Simple JSONPath-like extraction: $.Data -> data.Data
    const parts = path.replace('$.', '').split('.');
    let current = data;
    for (const part of parts) {
      if (current == null) return null;
      current = current[part];
    }
    return current;
  }

  private interpolate(template: string, vars: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`;
    });
  }

  private interpolateObject(template: Record<string, any>, vars: Record<string, any>): any {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(template)) {
      if (typeof value === 'string') {
        result[key] = this.interpolate(value, vars);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.interpolateObject(value, vars);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private resolveSecret(value: string, secrets: Record<string, string>): string {
    // Resolve {{secret:name}} patterns
    return value.replace(/\{\{secret:(\w+)\}\}/g, (_, name) => {
      return secrets[name] || `{{secret:${name}}}`;
    });
  }
}

export const connectorRuntime = new ConnectorRuntime();

