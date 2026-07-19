import Link from 'next/link';
import Image from 'next/image';
import { Heart, Mail } from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/savebitelogo.png" alt="SaveBite logo" width={32} height={32} className="h-8 w-8 rounded-full object-cover" priority />
              <span className="text-xl font-bold text-foreground">SaveBite</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                Login
              </Link>
              <Link href="/register" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <section className="relative isolate overflow-hidden bg-emerald-950">
          <div
            className="hero-background absolute inset-0 -z-20"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=2400&q=85')",
            }}
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-950/95 via-emerald-950/80 to-emerald-950/45" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl py-28 text-center sm:py-36 sm:text-left">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">
                A smarter way to save food
              </p>
              <h1 className="mb-6 text-5xl font-bold tracking-tight text-white sm:text-6xl">
                Reduce Food Waste, Save Money, Help the Planet
              </h1>
              <p className="mb-8 text-xl text-emerald-50/90">
                SaveBite helps households manage their food inventory, donate surplus food, and reduce waste through smart meal planning.
              </p>
              <div className="flex flex-wrap justify-center gap-4 sm:justify-start">
                <Link href="/register" className="rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                  Get Started Free
                </Link>
                <Link href="#features" className="rounded-lg border border-white/60 px-8 py-3 font-medium text-white transition-colors hover:bg-white/10">
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <div id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-border rounded-lg bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-2">Food Inventory</h3>
              <p className="text-muted-foreground">
                Track your food, expiry dates, and storage locations. Get alerts before food expires.
              </p>
            </div>
            <div className="p-6 border border-border rounded-lg bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-2">Donate Surplus</h3>
              <p className="text-muted-foreground">
                Share surplus food with neighbors and reduce waste in your community.
              </p>
            </div>
            <div className="p-6 border border-border rounded-lg bg-card">
              <h3 className="text-lg font-semibold text-foreground mb-2">Meal Planning</h3>
              <p className="text-muted-foreground">
                Plan meals using your inventory and get smart suggestions.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mx-auto max-w-7xl border-t border-border px-4 py-20 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to Start Saving?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of households reducing food waste and saving money.
          </p>
          <Link href="/register" className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors inline-block">
            Create Account Free
          </Link>
        </div>
      </main>

      <footer className="bg-emerald-950 text-emerald-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <div className="mb-4 flex items-center gap-2">
                <Image src="/savebitelogo.png" alt="SaveBite logo" width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
                <span className="text-xl font-bold text-white">SaveBite</span>
              </div>
              <p className="max-w-md text-sm leading-6 text-emerald-100/80">
                Helping households save food, spend smarter, and make a positive impact on their community and the planet.
              </p>
            </div>

            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-200">Explore</h2>
              <ul className="space-y-3 text-sm">
                <li><Link href="#features" className="text-emerald-50/75 transition-colors hover:text-white">Features</Link></li>
                <li><Link href="/register" className="text-emerald-50/75 transition-colors hover:text-white">Create an account</Link></li>
                <li><Link href="/login" className="text-emerald-50/75 transition-colors hover:text-white">Sign in</Link></li>
              </ul>
            </div>

            <div>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-emerald-200">Get in touch</h2>
              <a href="mailto:support@savebite.app" className="flex w-fit items-center gap-2 text-sm text-emerald-50/75 transition-colors hover:text-white">
                <Mail className="h-4 w-4" />
                support@savebite.app
              </a>
              <p className="mt-4 text-sm leading-6 text-emerald-100/70">
                Small choices at home can make a meaningful difference everywhere.
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-emerald-100/15 pt-6 text-sm text-emerald-100/70 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} SaveBite. All rights reserved.</p>
            <p className="flex items-center gap-1">Made with <Heart className="h-4 w-4 fill-current text-emerald-300" /> for less food waste.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
