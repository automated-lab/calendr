import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./db";
import Google from "next-auth/providers/google";
import { sendVerificationEmail } from "./resend";
import crypto from "crypto";

export async function generateVerificationToken(email: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const existingToken = await prisma.verificationToken.findFirst({
    where: { identifier: email },
  });

  if (existingToken) {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: existingToken.identifier,
          token: existingToken.token,
        },
      },
    });
  }

  const verificationToken = await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  return verificationToken;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    createUser: async ({ user }) => {
      if (!user.email) return;

      try {
        const verificationToken = await generateVerificationToken(user.email);
        await sendVerificationEmail({
          email: user.email,
          username: user.name || "User",
          token: verificationToken.token,
        });
      } catch (error) {
        console.error("Failed to send verification email:", error);
      }
    },
  },
});
