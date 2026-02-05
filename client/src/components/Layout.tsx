import { Link, useLocation } from "wouter";
import { useTenant } from "@/hooks/use-tenant";
import { Button } from "@/components/ui/button";
import { Menu, Briefcase } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: React.ReactNode }) {
  const { data: tenant } = useTenant();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/jobs", label: "Find Jobs" },
    { href: "/companies", label: "Companies" },
    { href: "/about", label: "About" },
    { href: "/faq", label: "FAQ" },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-hidden aurora-bg">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl float-slow" />
      <div className="pointer-events-none absolute top-32 -right-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl float-fast" />

      <header className="sticky top-0 z-50 w-full border-b border-white/40 bg-white/70 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-sky-500 flex items-center justify-center shadow-md">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold font-display tracking-tight text-slate-900">
                {tenant?.name || "Projekt Grönland"}
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${
                    location.startsWith(item.href) 
                      ? "bg-primary/15 text-primary" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                  }`}>
                    {item.label}
                  </a>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/post-job">
              <Button className="hidden md:flex font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all bg-gradient-to-r from-primary via-sky-500 to-accent shine button-pop">
                Post a Job
              </Button>
            </Link>
            
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-8">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                      <a className="text-lg font-medium p-2 block hover:bg-white/70 rounded-md">
                        {item.label}
                      </a>
                    </Link>
                  ))}
                  <Link href="/post-job" onClick={() => setIsOpen(false)}>
                    <Button className="w-full mt-4">Post a Job</Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-white/80 border-t border-white/40 backdrop-blur-lg py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-sky-500 flex items-center justify-center shadow-sm">
                  <Briefcase className="w-3 h-3 text-white" />
                </div>
                <span className="font-bold font-display text-slate-900">
                  {tenant?.name || "Projekt Grönland"}
                </span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                Connecting talent with opportunity across the region. Find your dream job or the perfect candidate today.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Candidates</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="/jobs" className="hover:text-primary">Browse Jobs</Link></li>
                <li><Link href="/companies" className="hover:text-primary">Browse Companies</Link></li>
                <li><Link href="/faq" className="hover:text-primary">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Employers</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="/post-job" className="hover:text-primary">Post a Job</Link></li>
                <li><Link href="/pricing" className="hover:text-primary">Pricing</Link></li>
                <li><Link href="/about" className="hover:text-primary">About</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal & Contact</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
                <li><Link href="/imprint" className="hover:text-primary">Impressum</Link></li>
                <li><Link href="/privacy" className="hover:text-primary">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-primary">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-slate-400">
            (c) {new Date().getFullYear()} {tenant?.name || "Projekt Grönland"}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}








