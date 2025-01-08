import { Navbar } from "../components/navbar";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Navbar />

        <div className="mt-8 space-y-6">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Terms of Service
          </h1>

          <div className="prose dark:prose-invert max-w-none">
            <section className="rounded-lg bg-card p-6 shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                1. Agreement to Terms
              </h2>
              <p className="text-muted-foreground">
                By accessing or using our calendar scheduling service, you agree
                to be bound by these Terms of Service. If you disagree with any
                part of the terms, you may not access the service.
              </p>
            </section>

            <section className="mt-6 rounded-lg bg-background p-6 shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                2. Description of Service
              </h2>
              <p className="text-muted-foreground mb-4">
                We provide a calendar scheduling and management platform that
                allows users to:
              </p>
              <ul className="list-none space-y-3">
                {[
                  "Create and manage scheduling pages",
                  "Connect with various calendar services (Google Calendar, Microsoft Calendar)",
                  "Schedule meetings with video conferencing integration",
                  "Manage availability and booking preferences",
                  "Send and receive meeting notifications",
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
                3. User Accounts
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  You must create an account to use our service. You agree to:
                </p>
                <ul className="list-none space-y-3">
                  {[
                    "Provide accurate and complete information",
                    "Maintain the security of your account credentials",
                    "Promptly update your account information",
                    "Accept responsibility for all activities under your account",
                    "Not share your account with third parties",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2 mt-1 text-primary">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mt-6 rounded-lg bg-background p-6 shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                4. Acceptable Use
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>You agree not to:</p>
                <ul className="list-none space-y-3">
                  {[
                    "Use the service for any illegal purposes",
                    "Send spam or unsolicited communications",
                    "Interfere with the proper working of the service",
                    "Attempt to bypass any service limitations or restrictions",
                    "Use the service to harm others or their reputation",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2 mt-1 text-primary">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mt-6 rounded-lg bg-card p-6 shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                5. Third-Party Services
              </h2>
              <p className="text-muted-foreground">
                Our service integrates with third-party services. By using these
                integrations, you agree to comply with their respective terms of
                service:
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[
                  {
                    name: "Google Calendar",
                    terms: "calendar.google.com/terms",
                  },
                  {
                    name: "Microsoft Calendar",
                    terms: "microsoft.com/calendar/terms",
                  },
                  { name: "Zoom", terms: "zoom.us/terms" },
                  { name: "Google Meet", terms: "meet.google.com/terms" },
                ].map((service, i) => (
                  <div
                    key={i}
                    className="flex items-start p-3 rounded-md bg-muted/50"
                  >
                    <strong className="text-primary mr-2">
                      {service.name}
                    </strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 rounded-lg bg-background p-6 shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                6. Intellectual Property
              </h2>
              <p className="text-muted-foreground">
                The service and its original content, features, and
                functionality are owned by us and are protected by international
                copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section className="mt-6 rounded-lg bg-card p-6 shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                7. Termination
              </h2>
              <p className="text-muted-foreground">
                We may terminate or suspend your account and access to the
                service immediately, without prior notice, for conduct that we
                believe violates these Terms or is harmful to other users of the
                service, us, or third parties, or for any other reason.
              </p>
            </section>

            <section className="mt-6 rounded-lg bg-background p-6 shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                8. Limitation of Liability
              </h2>
              <p className="text-muted-foreground">
                In no event shall we be liable for any indirect, incidental,
                special, consequential, or punitive damages, including without
                limitation, loss of profits, data, use, goodwill, or other
                intangible losses.
              </p>
            </section>

            <section className="mt-6 rounded-lg bg-primary/5 p-6 shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                9. Contact Information
              </h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms, please contact us
                at:
              </p>
              <p className="mt-2 font-medium">
                Email:{" "}
                <a
                  href="mailto:terms@heresmycalendar.com"
                  className="text-primary hover:underline"
                >
                  terms@heresmycalendar.com
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
