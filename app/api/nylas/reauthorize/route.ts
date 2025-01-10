import { headers } from "next/headers";
import { nylas } from "@/app/lib/nylas";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function GET() {
  try {
    const headersList = await headers();
    const email = headersList.get("x-user-email");

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's data
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create a new OAuth URL
    const authUrl = await nylas.auth.urlForOAuth2({
      clientId: process.env.NYLAS_CLIENT_ID!,
      redirectUri: `${process.env.NEXT_PUBLIC_URL}/api/oauth/exchange`,
      state: user.id, // Pass the user ID as state
    });

    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error("Reauthorization error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
