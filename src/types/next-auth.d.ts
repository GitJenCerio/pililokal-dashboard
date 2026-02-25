import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    role?: string;
    isActive?: boolean;
  }

  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      role?: string;
      isActive?: boolean;
    };
  }
}
