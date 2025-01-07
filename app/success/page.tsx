import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <Card className="max-w-[400px] w-full mx-auto flex flex-col items-center">
        <CardHeader>
          <div className="size-16 bg-green-500/10 rounded-full flex items-center justify-center">
            <Check className="size-8 text-green-500" />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <h1 className="text-2xl font-bold">Meeting Created Successfully</h1>
          <p className="text-sm text-muted-foreground mt-4">
            You will receive an email with the meeting details.
          </p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" asChild>
            <Link href="/dashboard">Close</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
