"use client";

import { Button } from "@/components/ui/button";

export default function ReconnectForm({ email }: { email: string }) {
  const handleReconnect = async () => {
    try {
      const appUrl = process.env.NEXT_PUBLIC_URL || window.location.origin;
      const response = await fetch(`${appUrl}/api/nylas/reauthorize`, {
        headers: {
          "x-user-email": email,
        },
      });
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to reauthorize:", error);
      alert("Failed to reconnect calendar");
    }
  };

  return (
    <Button onClick={handleReconnect} variant="outline">
      Reconnect Calendar
    </Button>
  );
}
