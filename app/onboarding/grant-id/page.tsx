export const dynamic = "force-dynamic";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import VideoGif from "@/public/work-is-almost-over-happy.gif";
import { CalendarCheck2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function OnboardingGrantIdPage() {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center">
      <Card>
        <CardHeader>
          <CardTitle></CardTitle>
          <CardDescription>
            Please grant mycalendar access to your Google Calendar
          </CardDescription>
          <Image
            src={VideoGif}
            alt="working gif"
            className="w-full size-64 rounded-lg"
          />
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/api/auth">
              <CalendarCheck2 className="size-4 mr-2" />
              Connect your Calendar
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
