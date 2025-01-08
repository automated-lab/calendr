import { nylas } from "@/app/lib/nylas";
import { CreateConnectorRequest } from "nylas";

export async function GET() {
  try {
    console.log("Starting connector check...");
    console.log(
      "Using Nylas API key:",
      process.env.NYLAS_API_SECRET_KEY?.slice(0, 5) + "..."
    );

    const connectors = await nylas.connectors.list({});
    console.log("Existing connectors:", JSON.stringify(connectors, null, 2));

    if (!connectors.data.find((c) => c.provider === "google")) {
      console.log("No Google connector found, creating one...");
      const connector = await nylas.connectors.create({
        requestBody: {
          name: "Google Calendar",
          provider: "google",
          settings: {
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            redirect_uri: "https://api.us.nylas.com/v3/connect/callback",
            scope: [
              "https://www.googleapis.com/auth/calendar",
              "https://www.googleapis.com/auth/userinfo.email",
              "https://www.googleapis.com/auth/userinfo.profile",
            ],
          },
        } as CreateConnectorRequest,
      });
      console.log(
        "Connector creation response:",
        JSON.stringify(connector, null, 2)
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Full connector error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
