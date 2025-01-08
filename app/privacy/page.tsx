import { Navbar } from "../components/navbar";
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Navbar />

        <div className="mt-8 space-y-6">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Privacy Policy
          </h1>

          <div className="prose dark:prose-invert max-w-none">
            <section className="rounded-lg bg-card p-6 shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                Introduction
              </h2>
              <p className="text-muted-foreground">
                This Privacy Policy explains how we collect, use, and protect
                your information when you use our calendar scheduling service.
                We take your privacy seriously and are committed to protecting
                your personal data.
              </p>
            </section>

            <section className="mt-6 rounded-lg bg-background p-6 shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                Information We Collect
              </h2>
              <ul className="list-none space-y-3">
                {[
                  "Account information (name, email address)",
                  "Calendar data from connected services (Google Calendar, Microsoft Calendar)",
                  "Meeting preferences and availability settings",
                  "Communication data between meeting participants",
                  "Technical data (IP address, browser type, device information)",
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2 mt-1 text-primary">•</span>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-6 rounded-lg bg-card p-6 shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                Third-Party Integrations
              </h2>
              <p className="mb-4 text-muted-foreground">
                We integrate with the following services:
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    name: "Google Calendar",
                    desc: "For calendar sync and meeting scheduling",
                  },
                  {
                    name: "Microsoft Calendar",
                    desc: "For calendar sync and meeting scheduling",
                  },
                  { name: "Zoom", desc: "For video conferencing" },
                  { name: "Google Meet", desc: "For video conferencing" },
                  { name: "Microsoft Teams", desc: "For video conferencing" },
                ].map((service, i) => (
                  <div
                    key={i}
                    className="flex items-start p-3 rounded-md bg-muted/50"
                  >
                    <strong className="text-primary mr-2">
                      {service.name}:
                    </strong>
                    <span className="text-muted-foreground">
                      {service.desc}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 rounded-lg bg-background p-6 shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                How We Use Your Information
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>To provide our scheduling service</li>
                <li>To sync your calendar availability</li>
                <li>To create and manage meetings</li>
                <li>To send meeting notifications and updates</li>
                <li>To improve our service</li>
                <li>To provide customer support</li>
              </ul>
            </section>

            <section className="mt-6 rounded-lg bg-card p-6 shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                Data Protection
              </h2>
              <p>
                We implement appropriate security measures to protect your data.
                This includes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments</li>
                <li>Access controls and authentication</li>
                <li>Secure data storage practices</li>
              </ul>
            </section>

            <section className="mt-6 rounded-lg bg-background p-6 shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                Your Rights
              </h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Withdraw consent for data processing</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section className="mt-6 rounded-lg bg-primary/5 p-6 shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                Contact Us
              </h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy or our data
                practices, please contact us at:
              </p>
              <p className="mt-2 font-medium">
                Email:{" "}
                <a
                  href="mailto:privacy@heresmycalendar.com"
                  className="text-primary hover:underline"
                >
                  privacy@heresmycalendar.com
                </a>
              </p>
            </section>

            <section className="mt-6 rounded-lg bg-muted p-4 text-sm text-center text-muted-foreground">
              Last Updated: {new Date().toLocaleDateString()}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
