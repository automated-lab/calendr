import { CTA } from "./components/Cta";
import { Features } from "./components/Features";
import { Hero } from "./components/Hero";
import { Logos } from "./components/Logos";
import { Navbar } from "./components/navbar";
import { Testimonial } from "./components/Testimonials";
import { auth } from "./lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    return redirect("/dashboard");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Navbar />
      <Hero />
      <Logos />
      <Features />
      <Testimonial />
      <CTA />
    </div>
  );
}
