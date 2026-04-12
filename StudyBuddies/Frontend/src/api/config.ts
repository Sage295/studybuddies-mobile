const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

if (!apiBaseUrl) {
  throw new Error("Missing VITE_API_BASE_URL in frontend environment.");
}

export function buildApiUrl(path: string) {
  const normalizedBaseUrl = apiBaseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
}

export { apiBaseUrl };
export const appUrl = import.meta.env.VITE_APP_URL?.trim();
