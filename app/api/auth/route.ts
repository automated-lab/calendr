import { nylas, nylasConfig } from "@/app/lib/nylas";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("Starting Nylas auth with config:", {
      clientId: nylasConfig.clientId,
      redirectUri: nylasConfig.redirectUri,
      apiUri: nylasConfig.apiUri,
    });

    const authURL = await nylas.auth.urlForOAuth2({
      clientId: nylasConfig.clientId,
      redirectUri: nylasConfig.redirectUri,
      provider: "google",
    });

    console.log("Generated auth URL:", authURL);
    return NextResponse.redirect(authURL);
  } catch (error) {
    console.error("Nylas auth error:", error);
    return NextResponse.json(
      { error: "Failed to start auth flow" },
      { status: 500 }
    );
  }
}
