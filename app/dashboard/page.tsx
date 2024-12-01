import { requireUser } from "../lib/hooks";


export default async function DashboardPage() {
    const session = await requireUser();

  return <div>
    <h1>Hello from the Dashboard</h1></div>;
}
