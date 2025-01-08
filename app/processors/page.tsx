import { Navbar } from "../components/navbar";

export default function ProcessorsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Navbar />

        <div className="mt-8 space-y-6">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Data Processors
          </h1>

          <div className="prose dark:prose-invert max-w-none">
            <section className="rounded-lg bg-card p-6 shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                Our Data Processors
              </h2>
              <p className="text-muted-foreground">
                We use the following third-party service providers to process
                your data. Each processor has been carefully selected to ensure
                they meet our high standards for data security and privacy
                compliance.
              </p>
            </section>

            <div className="mt-6 grid gap-6">
              <section className="rounded-lg bg-background p-6 shadow-sm border">
                <h3 className="text-xl font-semibold text-primary mb-3">
                  Nylas
                </h3>
                <div className="space-y-3 text-muted-foreground">
                  <p>Purpose: Calendar integration and email communication</p>
                  <p>Data Processed:</p>
                  <ul className="list-none space-y-2">
                    {[
                      "Calendar events and availability",
                      "Email content for scheduling",
                      "Contact information",
                      "Meeting metadata",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start">
                        <span className="mr-2 mt-1 text-primary">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p>Location: United States</p>
                  <a
                    href="https://www.nylas.com/privacy-policy"
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy →
                  </a>
                </div>
              </section>

              <section className="rounded-lg bg-card p-6 shadow-sm border">
                <h3 className="text-xl font-semibold text-primary mb-3">
                  Vercel
                </h3>
                <div className="space-y-3 text-muted-foreground">
                  <p>Purpose: Application hosting and deployment</p>
                  <p>Data Processed:</p>
                  <ul className="list-none space-y-2">
                    {[
                      "Log data",
                      "IP addresses",
                      "Browser information",
                      "Usage statistics",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start">
                        <span className="mr-2 mt-1 text-primary">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p>Location: Global (CDN)</p>
                  <a
                    href="https://vercel.com/legal/privacy-policy"
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy →
                  </a>
                </div>
              </section>

              <section className="rounded-lg bg-background p-6 shadow-sm border">
                <h3 className="text-xl font-semibold text-primary mb-3">
                  Supabase
                </h3>
                <div className="space-y-3 text-muted-foreground">
                  <p>Purpose: Database and user authentication</p>
                  <p>Data Processed:</p>
                  <ul className="list-none space-y-2">
                    {[
                      "User account information",
                      "Authentication data",
                      "Application data",
                      "User preferences",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start">
                        <span className="mr-2 mt-1 text-primary">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p>Location: Multiple regions</p>
                  <a
                    href="https://supabase.com/privacy"
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy →
                  </a>
                </div>
              </section>

              <section className="rounded-lg bg-card p-6 shadow-sm border">
                <h3 className="text-xl font-semibold text-primary mb-3">
                  Uploadthing
                </h3>
                <div className="space-y-3 text-muted-foreground">
                  <p>Purpose: File upload and storage</p>
                  <p>Data Processed:</p>
                  <ul className="list-none space-y-2">
                    {[
                      "User uploaded files",
                      "File metadata",
                      "Upload timestamps",
                      "File access logs",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start">
                        <span className="mr-2 mt-1 text-primary">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p>Location: Global</p>
                  <a
                    href="https://uploadthing.com/privacy"
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy →
                  </a>
                </div>
              </section>
            </div>

            <section className="mt-6 rounded-lg bg-primary/5 p-6 shadow-sm border">
              <h2 className="text-2xl font-semibold mb-4 text-primary">
                Contact Us
              </h2>
              <p className="text-muted-foreground">
                If you have any questions about our data processors, please
                contact us at:
              </p>
              <p className="mt-2 font-medium">
                Email:{" "}
                <a
                  href="mailto:privacy@example.com"
                  className="text-primary hover:underline"
                >
                  privacy@example.com
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
