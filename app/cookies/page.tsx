import { Navbar } from "../components/navbar";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Navbar />

        <div className="mt-8 space-y-6">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Cookie Policy
          </h1>

          <div className="prose dark:prose-invert max-w-none">
            <section className="rounded-lg bg-card p-6 shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                What Are Cookies
              </h2>
              <p className="text-muted-foreground">
                Cookies are small text files that are stored on your computer or
                mobile device when you visit our website. They help us make the
                site work better for you and provide a more personalized
                experience.
              </p>
            </section>

            <section className="mt-6 rounded-lg bg-background p-6 shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                How We Use Cookies
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">We use cookies for:</p>
                <ul className="list-none space-y-3">
                  {[
                    "Authentication and security",
                    "Remembering your preferences",
                    "Understanding how you use our site",
                    "Keeping your session active",
                    "Integration with calendar services",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2 mt-1 text-primary">•</span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mt-6 rounded-lg bg-card p-6 shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                Types of Cookies We Use
              </h2>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-md">
                  <h3 className="font-semibold text-primary mb-2">
                    Essential Cookies
                  </h3>
                  <p className="text-muted-foreground">
                    Required for the website to function. They enable basic
                    features like page navigation and access to secure areas.
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-md">
                  <h3 className="font-semibold text-primary mb-2">
                    Authentication Cookies
                  </h3>
                  <p className="text-muted-foreground">
                    Help us identify you when you log in and keep your session
                    secure.
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-md">
                  <h3 className="font-semibold text-primary mb-2">
                    Preference Cookies
                  </h3>
                  <p className="text-muted-foreground">
                    Remember your settings and preferences for future visits.
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-md">
                  <h3 className="font-semibold text-primary mb-2">
                    Integration Cookies
                  </h3>
                  <p className="text-muted-foreground">
                    Enable calendar and meeting service integrations to work
                    properly.
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-lg bg-background p-6 shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                Third-Party Cookies
              </h2>
              <p className="text-muted-foreground mb-4">
                Some cookies are placed by our third-party services:
              </p>
              <ul className="list-none space-y-3">
                {[
                  "Google (authentication and calendar integration)",
                  "Microsoft (authentication and calendar integration)",
                  "Zoom (meeting integration)",
                  "Analytics services to improve our website",
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
                Managing Cookies
              </h2>
              <p className="text-muted-foreground mb-4">
                Most web browsers allow you to control cookies through their
                settings preferences. However, limiting cookies may impact the
                functionality of our service.
              </p>
              <p className="text-muted-foreground">
                To learn more about cookies and how to manage them, visit{" "}
                <a
                  href="https://www.aboutcookies.org"
                  className="text-primary hover:underline"
                >
                  aboutcookies.org
                </a>
                .
              </p>
            </section>

            <section className="mt-6 rounded-lg bg-primary/5 p-6 shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                Contact Us
              </h2>
              <p className="text-muted-foreground">
                If you have any questions about our use of cookies, please
                contact us at:
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
