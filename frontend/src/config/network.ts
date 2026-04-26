const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

const httpProtocol = isHttps ? 'https' : 'http';
const wsProtocol = isHttps ? 'wss' : 'ws';
const defaultOrigin = `${httpProtocol}://${hostname}:8080`;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? `${defaultOrigin}/api`;
export const WS_URL = import.meta.env.VITE_WS_URL ?? `${wsProtocol}://${hostname}:8080/ws/live`;
