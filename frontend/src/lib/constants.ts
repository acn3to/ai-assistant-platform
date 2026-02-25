export const APP_NAME = 'AI Assistant Platform';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  PRICING: '/pricing',
  DASHBOARD: '/dashboard',
  ASSISTANTS: '/assistants',
  CONVERSATIONS: '/conversations',
  CONNECTORS: '/connectors',
  COSTS: '/costs',
  SETTINGS: '/settings',
} as const;

export const PROTECTED_ROUTES = [
  '/dashboard',
  '/assistants',
  '/conversations',
  '/connectors',
  '/costs',
  '/settings',
];

export const PUBLIC_ROUTES = ['/', '/pricing', '/login', '/signup'];

export const BEDROCK_MODELS = [
  {
    id: 'anthropic.claude-3-haiku-20240307-v1:0',
    name: 'Claude 3 Haiku',
    description: 'Fastest and most cost-effective — recommended for dev',
  },
  {
    id: 'anthropic.claude-3-sonnet-20240229-v1:0',
    name: 'Claude 3 Sonnet',
    description: 'Best balance of intelligence and speed',
  },
  {
    id: 'anthropic.claude-3-opus-20240229-v1:0',
    name: 'Claude 3 Opus',
    description: 'Most powerful for complex tasks',
  },
] as const;

