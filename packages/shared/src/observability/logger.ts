import { Logger } from '@aws-lambda-powertools/logger';

const SERVICE_NAME = process.env.SERVICE_NAME || 'ai-assistant-platform';

const getLogLevel = (): 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' => {
  const stage = process.env.STAGE || 'local';
  switch (stage) {
    case 'prd':
      return 'INFO';
    case 'hml':
    case 'dev':
    case 'local':
    default:
      return 'DEBUG';
  }
};

export const logger = new Logger({
  serviceName: SERVICE_NAME,
  logLevel: getLogLevel(),
  persistentLogAttributes: {
    environment: process.env.STAGE || 'local',
    region: process.env.AWS_REGION || process.env.REGION || 'us-east-1',
  },
});

export const createChildLogger = (persistentAttributes: Record<string, unknown>): Logger => {
  return logger.createChild({
    persistentLogAttributes: persistentAttributes,
  });
};

export const appendLogContext = (context: Record<string, unknown>): void => {
  logger.appendKeys(context);
};

export const removeLogContext = (keys: string[]): void => {
  logger.removeKeys(keys);
};

