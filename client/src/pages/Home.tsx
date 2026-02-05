import { useJobs } from "@/hooks/use-jobs";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JobCard } from "@/components/JobCard";
import { Search, MapPin, ArrowRight, Sparkles, TrendingUp, ShieldCheck, Zap } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const heroBadges = ["Remote-ready", "Fast apply", "Top companies", "Verified listings"];

export default function Home() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [, setLocationUrl] = useLocation();

  const { data: jobs, isLoading } = useJobs();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (location) params.set("location", location);
    setLocationUrl(`/jobs?${params.toString()}`);
  };

  return (
    <div className="flex flex-col">
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 -z-10" />
        <div className="absolute -top-24 left-10 h-56 w-56 rounded-full bg-primary/20 blur-3xl float-slow" />
        <div className="absolute top-8 right-12 h-64 w-64 rounded-full bg-accent/20 blur-3xl float-fast" />

        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              Germany's most vibrant hiring hub
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-display font-bold text-slate-900 mb-6 tracking-tight"
            >
              Turn job hunting into a <span className="text-gradient">bold adventure</span>
              <br />in your region.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-slate-600 mb-10 max-w-3xl mx-auto"
            >
              Discover curated roles, apply in minutes, and connect with employers who move fast.
              We keep the experience fresh, local, and built for real hiring.
            </motion.p>

            <motion.form
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleSearch}
              className="glass p-2 rounded-2xl shadow-2xl max-w-4xl mx-auto"
            >
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Job title, skills, keywords..."
                    className="pl-10 border-0 shadow-none focus-visible:ring-0 text-base h-12 bg-transparent"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="hidden md:block w-px bg-slate-200 my-2" />
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="City, region or remote"
                    className="pl-10 border-0 shadow-none focus-visible:ring-0 text-base h-12 bg-transparent"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <Button size="lg" className="h-12 px-8 rounded-xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all bg-gradient-to-r from-primary via-sky-500 to-accent shine button-pop">
                  Search Jobs
                </Button>
              </div>
            </motion.form>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {heroBadges.map((badge, index) => (
                <motion.span
                  key={badge}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + index * 0.05 }}
                  className="rounded-full bg-white/80 px-4 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover-lift"
                >
                  {badge}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary mb-2">
                <TrendingUp className="h-4 w-4" />
                Featured Opportunities
              </div>
              <h2 className="text-3xl font-bold font-display text-slate-900">Jobs moving fast right now</h2>
              <p className="text-slate-500 mt-2">Hand-picked roles with standout employers.</p>
            </div>
            <Link href="/jobs">
              <Button variant="outline" className="gap-2 rounded-full border-slate-200 bg-white/70">
                View All Jobs <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-white/60 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs?.slice(0, 6).map((job) => (
                <JobCard key={job.id} job={job} featured={true} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, title: "Verified employers", text: "Every listing is vetted, so you can apply with confidence." },
              { icon: Zap, title: "Lightning-fast workflows", text: "Save, apply, and track progress without the usual friction." },
              { icon: TrendingUp, title: "Real-time momentum", text: "Live updates for openings so you always see what's fresh." },
            ].map((card) => (
              <motion.div
                key={card.title}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2 }}
                className="gradient-border"
              >
                <div className="gradient-inner p-6 h-full flex flex-col gap-4 hover-lift">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <card.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{card.title}</h3>
                    <p className="text-slate-500 mt-2">{card.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { value: "1,200+", label: "Active Jobs" },
              { value: "450+", label: "Companies" },
              { value: "12k+", label: "Candidates Hired" },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-2xl p-6 text-center soft-shadow hover-lift">
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-slate-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
