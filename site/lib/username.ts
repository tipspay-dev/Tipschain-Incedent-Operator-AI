const USERNAME_REGEX = /^[a-z0-9_-]{3,30}$/;

export function normalizeUsername(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30);
}

export function isValidUsername(username: string) {
  return USERNAME_REGEX.test(username);
}

export function buildUsernameSuggestions(username: string) {
  const base = normalizeUsername(username).slice(0, 28) || "tipspay";
  const suggestions = new Set<string>();

  while (suggestions.size < 3) {
    const suffix = Math.floor(Math.random() * 90) + 10;
    suggestions.add(`${base}${suffix}`);
  }

  return Array.from(suggestions);
}
