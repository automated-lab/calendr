import { requireUser } from "../lib/hooks";
import prisma from "../lib/db";
import { notFound } from "next/navigation";
import { EmptyState } from "../components/EmptyState";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExternalLink, Pen, Settings, Trash, Users2 } from "lucide-react";
import { EventTypeSwitcher } from "@/app/components/EventTypeSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CopyLinkMenuItem } from "@/app/components/CopyLinkMenu";
import { CopyLinkButton } from "@/app/components/CopyLinkButton";
import { ShareDialog } from "@/app/components/ShareDialog";

async function getData(userId: string) {
  const data = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      username: true,
      eventTypes: {
        select: {
          id: true,
          title: true,
          duration: true,
          url: true,
          description: true,
          active: true,
          videoCallSoftware: true,
        },
      },
    },
  });
  if (!data) {
    return notFound();
  }
  return data;
}

export default async function DashboardPage() {
  const session = await requireUser();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const data = await getData(session.user?.id as string);

  return (
    <>
      {data.eventTypes.length === 0 ? (
        <EmptyState
          title="No event types found"
          description="Get started by creating a new event type"
          buttonText="Create Event Type"
          href="/dashboard/event-types/new"
        />
      ) : (
        <>
          <div>
            <div className="flex justify-between items-center px-2">
              <div className="hidden sm:grid gap-y-1">
                <h1 className="text-3xl md:text-4xl font-semibold">
                  Event Types
                </h1>
                <p className="text-muted-foreground">
                  Create and manage your event types here.
                </p>
              </div>
              <Button asChild>
                <Link href="/dashboard/new">
                  <Button>Create New Event</Button>
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 sm:grid-cols-2 gap-5">
            {data.eventTypes.map((item) => (
              <div
                className="overflow-hidden shadow rounded-lg border relative"
                key={item.id}
              >
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Settings className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Event</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <EventTypeSwitcher
                          eventTypeId={item.id}
                          initialChecked={item.active}
                        />
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link href={`/${data.username}/${item.url}`}>
                            <ExternalLink className="mr-2 size-4" />
                            Preview
                          </Link>
                        </DropdownMenuItem>
                        <CopyLinkMenuItem
                          meetingUrl={`${process.env.NEXT_PUBLIC_URL}/${data.username}/${item.url}`}
                        />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/event/${item.id}`}>
                            <Pen className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </DropdownMenuGroup>

                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/event/${item.id}/delete`}>
                          <Trash className="mr-2 size-4" />
                          Delete
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Link
                  href={`/dashboard/${item.id}`}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex-shrink-0">
                    <Users2 className="size-6" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground">
                        {item.duration} Minutes
                      </dt>
                      <dd className="text-lg font-medium text-muted-foreground">
                        {item.title}
                      </dd>
                    </dl>
                  </div>
                </Link>
                <div className="bg-muted/50 px-4 py-2 flex justify-between items-center">
                  <CopyLinkButton
                    url={`${process.env.NEXT_PUBLIC_URL}/${data.username}/${item.url}`}
                  />
                  <ShareDialog
                    username={data.username || ""}
                    eventUrl={item.url}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
