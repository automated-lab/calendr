import { nylas, nylasConfig } from "@/app/lib/nylas";
import { redirect } from "next/navigation";

export async function GET() {
  console.log("Full redirect URI:", nylasConfig.redirectUri);
  const authURL = nylas.auth.urlForOAuth2({
    clientId: nylasConfig.clientId,
    redirectUri: nylasConfig.redirectUri,
  });
  return redirect(authURL);
}
