export interface UserSession {
  displayName: string;
  syncKey: string;
}

export async function createUserSession(name: string, password: string): Promise<UserSession> {
  const displayName = name.trim();
  const normalizedName = normalizeName(displayName);
  const secret = password.trim();
  const digest = await digestText(`${normalizedName}:${secret}`);

  return {
    displayName,
    syncKey: `${normalizedName}-${digest.slice(0, 24)}`,
  };
}

function normalizeName(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u4e00-\u9fa5_-]/g, "")
      .slice(0, 48) || "user"
  );
}

async function digestText(value: string) {
  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(value);
    const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash).toString(16).padStart(16, "0");
}
