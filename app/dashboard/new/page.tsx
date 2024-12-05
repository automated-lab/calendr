"use client"

import { SubmitButton } from "@/app/components/SubmitButtons";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/ButtonGroup";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useState } from "react";

type videoCallProvider = "Google Meet" | "Zoom Meeting" | "Microsoft Teams";


export default function NewEventRoute() {

    const [activePlatform, setActivePlatform] = useState<videoCallProvider>("Google Meet")
    return (
        <div className="h-full w-full flex-1 flex flex-col items-center justify-center">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Create Event</CardTitle>
                    <CardDescription>
                        Create a new event for your organization.
                    </CardDescription>

                    <form>
                        <CardContent className="grid gap-y-5">
                            <div className="flex flex-col gap-y-2">
                                <Label>Title</Label>
                                <Input placeholder="30-minute meeting" />
                            </div>
                            <div className="grid gap-y-2">
                                <Label>URL Slug</Label>
                                <div className="flex rounded-md">
                                    <span className="inline-flex items-center px-3 rounded-l-md border-r-0 border-muted bg-muted text-sm text-muted-foreground">
                                        okbook.me/
                                    </span>
                                    <Input className="rounded-l-none" placeholder="Example-url-1" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-y-2">
                                <Label>Description</Label>
                                <Textarea placeholder="Book me!" />
                            </div>

                            <div className="flex flex-col gap-y-2">
                                <Label>Duration</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a duration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15 minutes</SelectItem>
                                        <SelectItem value="30">30 minutes</SelectItem>
                                        <SelectItem value="45">45 minutes</SelectItem>
                                        <SelectItem value="60">60 minutes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-y-2">
                                <Label>Meeting Provider</Label>
                                <ButtonGroup>
                                    <Button 
                                        key="google"
                                        type="button"
                                        onClick={() => setActivePlatform("Google Meet")} 
                                        className="w-full" 
                                        variant={activePlatform === "Google Meet" ? "secondary" : "outline"}
                                    >
                                        Google Meet
                                    </Button>
                                    <Button 
                                        key="zoom"
                                        type="button"
                                        onClick={() => setActivePlatform("Zoom Meeting")} 
                                        className="w-full" 
                                        variant={activePlatform === "Zoom Meeting" ? "secondary" : "outline"}
                                    >
                                        Zoom
                                    </Button>
                                    <Button 
                                        key="teams"
                                        type="button"
                                        onClick={() => setActivePlatform("Microsoft Teams")} 
                                        className="w-full" 
                                        variant={activePlatform === "Microsoft Teams" ? "secondary" : "outline"}
                                    >
                                        Microsoft Teams
                                    </Button>
                                </ButtonGroup>
                            </div>
                        </CardContent>
                        <CardFooter className="flex w-full justify-between">
                            <Button type="button" variant="secondary" asChild><Link href="/dashboard">Cancel</Link></Button>
                            <SubmitButton text="Create Event" />
                        </CardFooter>
                    </form>
                </CardHeader>
            </Card>
        </div>
    )
}