import { APIGatewayProxyResult } from 'aws-lambda';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.ACCESS_CONTROL_ALLOW_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

export const ok = <T>(body: T): APIGatewayProxyResult => ({
  statusCode: 200,
  headers: CORS_HEADERS,
  body: JSON.stringify(body),
});

export const created = <T>(body: T): APIGatewayProxyResult => ({
  statusCode: 201,
  headers: CORS_HEADERS,
  body: JSON.stringify(body),
});

export const noContent = (): APIGatewayProxyResult => ({
  statusCode: 204,
  headers: CORS_HEADERS,
  body: '',
});

export const badRequest = (message: string): APIGatewayProxyResult => ({
  statusCode: 400,
  headers: CORS_HEADERS,
  body: JSON.stringify({ error: 'Bad Request', message }),
});

export const unauthorized = (message = 'Unauthorized'): APIGatewayProxyResult => ({
  statusCode: 401,
  headers: CORS_HEADERS,
  body: JSON.stringify({ error: 'Unauthorized', message }),
});

export const forbidden = (message = 'Forbidden'): APIGatewayProxyResult => ({
  statusCode: 403,
  headers: CORS_HEADERS,
  body: JSON.stringify({ error: 'Forbidden', message }),
});

export const notFound = (message = 'Not Found'): APIGatewayProxyResult => ({
  statusCode: 404,
  headers: CORS_HEADERS,
  body: JSON.stringify({ error: 'Not Found', message }),
});

export const conflict = (message: string): APIGatewayProxyResult => ({
  statusCode: 409,
  headers: CORS_HEADERS,
  body: JSON.stringify({ error: 'Conflict', message }),
});

export const internalError = (message = 'Internal Server Error'): APIGatewayProxyResult => ({
  statusCode: 500,
  headers: CORS_HEADERS,
  body: JSON.stringify({ error: 'Internal Server Error', message }),
});

