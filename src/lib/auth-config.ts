import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user?.passwordHash || !user.isActive) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.userId = user.id;
        token.role = (user as { role?: string }).role ?? "VIEWER";
        token.isActive = (user as { isActive?: boolean }).isActive ?? true;
      }
      if (account?.provider === "google" && profile?.email) {
        const email = (profile.email as string).toLowerCase();
        let dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser) {
          dbUser = await prisma.user.create({
            data: {
              email,
              name: (profile.name as string) || profile.email,
              role: "VIEWER",
              isActive: true,
            },
          });
        }
        if (!dbUser.isActive) return token;
        token.userId = dbUser.id;
        token.email = dbUser.email;
        token.name = dbUser.name;
        token.role = dbUser.role;
        token.isActive = dbUser.isActive;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.userId as string;
        (session.user as { role?: string }).role = (token.role as string) ?? "VIEWER";
        (session.user as { isActive?: boolean }).isActive = (token.isActive as boolean) ?? true;
      }
      return session;
    },
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile?.email) return true;
      return true;
    },
  },
  pages: { signIn: "/" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  secret: process.env.NEXTAUTH_SECRET,
};
