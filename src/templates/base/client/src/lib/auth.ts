const tokenKey = "create-pern-app-token";

export function getAuthToken(): string | null {
  return localStorage.getItem(tokenKey);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(tokenKey, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(tokenKey);
}
