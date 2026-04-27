const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const rawBackendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8080';
const backendHttpBase = trimTrailingSlash(rawBackendUrl);

export const backendApiUrl = `${backendHttpBase}/api`;

export const backendWsUrl = (() => {
  if (backendHttpBase.startsWith('https://')) {
    return `wss://${backendHttpBase.slice('https://'.length)}/ws/live`;
  }

  if (backendHttpBase.startsWith('http://')) {
    return `ws://${backendHttpBase.slice('http://'.length)}/ws/live`;
  }

  return `ws://${backendHttpBase}/ws/live`;
})();
