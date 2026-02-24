export const ROLE_HIERARCHY: Record<string, number> = {
  ADMIN: 3,
  EDITOR: 2,
  VIEWER: 1,
};

export type Role = "ADMIN" | "EDITOR" | "VIEWER";

export type SessionWithRole = {
  userId: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
};

/**
 * Throws if the session user's role is insufficient for the required minimum role.
 * Use after getServerSession() when the action requires a minimum role.
 */
export function requireRole(
  session: SessionWithRole | null,
  minRole: Role
): asserts session is SessionWithRole {
  if (!session) {
    throw new Error("Unauthorized: not logged in");
  }
  if (!session.isActive) {
    throw new Error("Unauthorized: account is deactivated");
  }
  const userLevel = ROLE_HIERARCHY[session.role] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] ?? 0;
  if (userLevel < requiredLevel) {
    throw new Error("Forbidden: insufficient permissions");
  }
}
