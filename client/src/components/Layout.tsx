import { Link, useLocation } from "wouter";
import { useTenant } from "@/hooks/use-tenant";
import { Button } from "@/components/ui/button";
import { 
  NavigationMenu, 
  NavigationMenuItem, 
  NavigationMenuLink, 
  NavigationMenuList,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import { Menu, X, Briefcase, MapPin, Search } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: React.ReactNode }) {
  const { data: tenant } = useTenant();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/jobs", label: "Find Jobs" },
    { href: "/companies", label: "Companies" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold font-display tracking-tight text-slate-900">
                {tenant?.name || "Projekt Grönland"}
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a className={`text-sm font-medium px-4 py-2 rounded-md transition-colors ${
                    location.startsWith(item.href) 
                      ? "bg-primary/10 text-primary" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}>
                    {item.label}
                  </a>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/post-job">
              <Button className="hidden md:flex font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
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
                      <a className="text-lg font-medium p-2 block hover:bg-slate-100 rounded-md">
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

      <footer className="bg-white border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
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
                <li><a href="#" className="hover:text-primary">Career Advice</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">For Employers</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link href="/post-job" className="hover:text-primary">Post a Job</Link></li>
                <li><a href="#" className="hover:text-primary">Pricing</a></li>
                <li><a href="#" className="hover:text-primary">Success Stories</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Karlsruhe, Germany</span>
                </li>
                <li className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span>support@badische-jobs.de</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-slate-400">
            © {new Date().getFullYear()} {tenant?.name || "Projekt Grönland"}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
