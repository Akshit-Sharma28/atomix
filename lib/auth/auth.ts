import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "../prisma";

import type {
  NextAuthOptions,
} from "next-auth";

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
  },
  providers: [  
    CredentialsProvider({
      name: "credentials",

      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        if (!credentials) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            accounts: {
              select: {
                passwordHash: true,
              },
            },
          },
        });

        if (!user?.isActive || !user.accounts) {
          return null;
        }

        const valid =
          await bcrypt.compare(
            credentials.password,
            user.accounts.passwordHash
          );

        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role ?? "REVIEWER";
      }

      return session;
    },
  },

  secret:
    process.env.NEXTAUTH_SECRET,
};
