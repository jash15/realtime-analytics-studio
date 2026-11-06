import type { ScenarioMode, StatusCode, EventType } from '../types/analytics';

export interface GeoLocationPreset {
  country: string;
  countryCode: string;
  city: string;
  lat: number;
  lng: number;
  weight: number;
}

export const GEO_LOCATIONS: GeoLocationPreset[] = [
  { country: 'United States', countryCode: 'US', city: 'San Francisco', lat: 37.77, lng: -122.41, weight: 30 },
  { country: 'United States', countryCode: 'US', city: 'New York', lat: 40.71, lng: -74.00, weight: 25 },
  { country: 'Germany', countryCode: 'DE', city: 'Frankfurt', lat: 50.11, lng: 8.68, weight: 15 },
  { country: 'United Kingdom', countryCode: 'GB', city: 'London', lat: 51.50, lng: -0.12, weight: 12 },
  { country: 'Japan', countryCode: 'JP', city: 'Tokyo', lat: 35.67, lng: 139.65, weight: 14 },
  { country: 'Singapore', countryCode: 'SG', city: 'Singapore', lat: 1.35, lng: 103.81, weight: 10 },
  { country: 'India', countryCode: 'IN', city: 'Mumbai', lat: 19.07, lng: 72.87, weight: 18 },
  { country: 'Australia', countryCode: 'AU', city: 'Sydney', lat: -33.86, lng: 151.20, weight: 8 },
  { country: 'Brazil', countryCode: 'BR', city: 'São Paulo', lat: -23.55, lng: -46.63, weight: 9 },
  { country: 'Canada', countryCode: 'CA', city: 'Toronto', lat: 43.65, lng: -79.38, weight: 8 },
];

export interface EndpointDefinition {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  type: EventType;
  baseLatency: number;
  variance: number;
  errorProbability: number;
}

export const SCENARIO_ENDPOINTS: Record<ScenarioMode, EndpointDefinition[]> = {
  ecommerce: [
    { path: '/api/v1/catalog/products', method: 'GET', type: 'pageview', baseLatency: 35, variance: 20, errorProbability: 0.01 },
    { path: '/api/v1/search', method: 'GET', type: 'pageview', baseLatency: 65, variance: 40, errorProbability: 0.015 },
    { path: '/api/v1/cart/items', method: 'POST', type: 'api_call', baseLatency: 80, variance: 30, errorProbability: 0.02 },
    { path: '/api/v1/checkout/review', method: 'GET', type: 'pageview', baseLatency: 110, variance: 45, errorProbability: 0.01 },
    { path: '/api/v1/checkout/pay', method: 'POST', type: 'checkout', baseLatency: 280, variance: 120, errorProbability: 0.035 },
    { path: '/api/v1/auth/session', method: 'GET', type: 'auth', baseLatency: 25, variance: 15, errorProbability: 0.005 },
    { path: '/api/v1/inventory/check', method: 'POST', type: 'api_call', baseLatency: 50, variance: 25, errorProbability: 0.02 },
  ],
  fintech: [
    { path: '/v2/transfers/instant', method: 'POST', type: 'checkout', baseLatency: 320, variance: 150, errorProbability: 0.025 },
    { path: '/v2/wallets/balance', method: 'GET', type: 'api_call', baseLatency: 45, variance: 20, errorProbability: 0.008 },
    { path: '/v2/kyc/verify-identity', method: 'POST', type: 'auth', baseLatency: 450, variance: 200, errorProbability: 0.04 },
    { path: '/v2/exchange/rates/live', method: 'GET', type: 'pageview', baseLatency: 18, variance: 10, errorProbability: 0.002 },
    { path: '/v2/cards/authorize', method: 'POST', type: 'checkout', baseLatency: 180, variance: 75, errorProbability: 0.03 },
    { path: '/v2/fraud/risk-score', method: 'POST', type: 'api_call', baseLatency: 95, variance: 35, errorProbability: 0.01 },
  ],
  saas: [
    { path: '/api/graphql', method: 'POST', type: 'api_call', baseLatency: 120, variance: 60, errorProbability: 0.02 },
    { path: '/api/v1/teams/members', method: 'GET', type: 'pageview', baseLatency: 40, variance: 15, errorProbability: 0.005 },
    { path: '/api/v1/deployments/trigger', method: 'POST', type: 'api_call', baseLatency: 260, variance: 110, errorProbability: 0.04 },
    { path: '/api/v1/auth/oauth/callback', method: 'GET', type: 'auth', baseLatency: 150, variance: 40, errorProbability: 0.01 },
    { path: '/api/v1/metrics/export', method: 'GET', type: 'api_call', baseLatency: 340, variance: 160, errorProbability: 0.03 },
    { path: '/api/v1/webhooks/delivery', method: 'POST', type: 'api_call', baseLatency: 75, variance: 30, errorProbability: 0.015 },
  ],
  security: [
    { path: '/auth/oauth/token', method: 'POST', type: 'auth', baseLatency: 70, variance: 30, errorProbability: 0.08 },
    { path: '/admin/login', method: 'POST', type: 'auth', baseLatency: 140, variance: 60, errorProbability: 0.15 },
    { path: '/api/v1/waf/inspect', method: 'POST', type: 'api_call', baseLatency: 15, variance: 8, errorProbability: 0.01 },
    { path: '/.env', method: 'GET', type: 'error', baseLatency: 8, variance: 4, errorProbability: 0.95 },
    { path: '/wp-login.php', method: 'POST', type: 'error', baseLatency: 12, variance: 6, errorProbability: 0.92 },
    { path: '/api/v1/firewall/rules', method: 'GET', type: 'api_call', baseLatency: 50, variance: 20, errorProbability: 0.01 },
  ],
};
