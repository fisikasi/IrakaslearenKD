export function usernameToLocalEmail(username: string) {
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return `${clean}@irakasle.local`;
}
