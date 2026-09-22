import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.trim().toLowerCase() },
          include: {
            expertProfile: { select: { fullName: true } },
          },
        });

        if (!user) {
          return null;
        }

        const valid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword,
        );

        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.expertProfile?.fullName ?? null,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.uid = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? token.sub ?? "";
        session.user.role = token.role ?? "EXPERT";
        session.user.name = (token.name as string | null | undefined) ?? null;
      }
      return session;
    },
  },
};