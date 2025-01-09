import prisma from "@/app/lib/db";
import { nylasConfig } from "@/app/lib/nylas";
import { nylas } from "@/app/lib/nylas";
import { NextRequest } from "next/server"
import { requireUser } from "@/app/lib/hooks";

export async function GET(req: NextRequest) {
  const session = await requireUser();

  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return Response.json({ error: "No authorization code returned" }, { status: 400 });
  }

  try {
    console.log("Exchanging code with clientId:", nylasConfig.clientId);
    
    const response = await nylas.auth.exchangeCodeForToken({
      clientId: nylasConfig.clientId,
      clientSecret: nylasConfig.apiKey,
      redirectUri: nylasConfig.redirectUri,
      code,
    });
    
    const { grantId, email } = response;

    if (!grantId || !email) {
      console.error("Missing grantId or email in Nylas response:", response);
      return Response.json({ error: "Invalid response from Nylas" }, { status: 400 });
    }

    await prisma.user.update({
      where: {
        id: session.user?.id as string,
      },
      data: {
        grantId: grantId,
        grantEmail: email,
      },
    });

    console.log("Successfully updated user with grant info:", { grantId, email });
    return Response.redirect(new URL("/dashboard", req.url));
  } catch (error) {
    console.error("Error exchanging code for token:", error);
    return Response.json({ 
      error: error instanceof Error ? error.message : "Failed to authenticate with Nylas",
      details: error
    }, { status: 500 });
  }
}