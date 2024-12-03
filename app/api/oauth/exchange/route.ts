import prisma from "@/app/lib/db";
import { nylasConfig } from "@/app/lib/nylas";
import { nylas } from "@/app/lib/nylas";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server"
import { requireUser } from "@/app/lib/hooks";

export async function GET(req: NextRequest) {
 const session = await requireUser();

 const url = new URL(req.url);
 const code = url.searchParams.get("code");

 if (!code) {
    return Response.json({ error: "No authorization code returned" }, { status: 400 });
 }

 const codeExchangePayload = {
    clientSecret: nylasConfig.apiKey,
    clientId: nylasConfig.clientId as string,
    redirectUri: nylasConfig.redirectUri,
    code,
  };

  try {
    const response = await nylas.auth.exchangeCodeForToken(codeExchangePayload);
    const { grantId, email } = response;

    await prisma.user.update({
      where: {
        id: session.user?.id as string,
      },
      data: {
        grantId: grantId,
        grantEmail: email,
      },
    });

    console.log({ grantId });
  } catch (error) {
    console.error("Error exchanging code for token:", error);
  }

  redirect("/dashboard");
}