import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"


export default function AvailabilityRoute() {
    return (
    <Card className="p-4">
        <CardHeader>        
            <CardTitle>Availability</CardTitle>
            <CardDescription>
                Manage your availability settings here.
            </CardDescription>
        </CardHeader>
        <form>
            <CardContent>

            </CardContent>
        </form>
    </Card>
    )
}

