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

        const user =
          await prisma.user.findUnique({
            where: {
              email:
                credentials.email,
            },
          });

        if (!user) {
          return null;
        }

        const account =
          await prisma.account.findFirst({
            where: {
              userId: user.id,
            },
          });

        if (!account) {
          return null;
        }

        const valid =
          await bcrypt.compare(
            credentials.password,
            account.passwordHash
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
    async jwt({
      token,
      user,
    }: any) {
      if (user) {
        token.role =
          user.role;
      }

      return token;
    },

    async session({
      session,
      token,
    }: any) {
      session.user.role =
        token.role;

      return session;
    },
  },

  secret:
    process.env.NEXTAUTH_SECRET,
};