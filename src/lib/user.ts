import type { User } from "@prisma/client";

export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export function parseSocialLinks(json: string): Record<string, string> {
  try {
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === "object") return parsed;
    return {};
  } catch {
    return {};
  }
}
