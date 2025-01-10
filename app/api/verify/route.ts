import { NextRequest } from "next/server";
import prisma from "@/app/lib/db";
import { redirect } from "next/navigation";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const token = searchParams.get("token");
  const identifier = searchParams.get("email");

  if (!token || !identifier) {
    return new Response("Missing token or email", { status: 400 });
  }

  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        identifier_token: {
          identifier,
          token,
        },
      },
    });

    if (!verificationToken) {
      return new Response("Invalid token", { status: 400 });
    }

    if (new Date() > verificationToken.expires) {
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier,
            token,
          },
        },
      });
      return new Response("Token expired", { status: 400 });
    }

    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier,
          token,
        },
      },
    });

    return redirect("/dashboard");
  } catch (error) {
    console.error("Verification error:", error);
    return new Response("Verification failed", { status: 500 });
  }
}
