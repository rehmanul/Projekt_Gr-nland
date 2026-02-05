import { useJobs } from "@/hooks/use-jobs";
import { useEmployers } from "@/hooks/use-employers";
import { useStats } from "@/hooks/use-stats";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JobCard } from "@/components/JobCard";
import { Search, MapPin, ArrowRight, Sparkles, TrendingUp, ShieldCheck, Zap, Briefcase, Users, FileText, Layers, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const heroBadges = ["Remote-ready", "Fast apply", "Top companies", "Verified listings"];

export default function Home() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [, setLocationUrl] = useLocation();

  const { data: jobs, isLoading } = useJobs();
  const { data: stats } = useStats();
  const { data: employers } = useEmployers();

  const jobsList = jobs ?? [];
  const employersList = employers ?? [];

  const jobCounts = useMemo(() => {
    const counts = new Map<number, number>();
    jobsList.forEach((job) => {
      counts.set(job.employerId, (counts.get(job.employerId) ?? 0) + 1);
    });
    return counts;
  }, [jobsList]);

  const latestEmployers = useMemo(() => {
    return [...employersList]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [employersList]);

  const featuredEmployers = useMemo(() => {
    return employersList.filter((employer) => !!employer.logoUrl).slice(0, 6);
  }, [employersList]);

  const mostActiveEmployers = useMemo(() => {
    return [...employersList]
      .sort((a, b) => (jobCounts.get(b.id) ?? 0) - (jobCounts.get(a.id) ?? 0))
      .slice(0, 6);
  }, [employersList, jobCounts]);

  const statsItems = [
    { label: "Active jobs", value: stats?.jobs, icon: Briefcase },
    { label: "Hiring teams", value: stats?.employers, icon: Users },
    { label: "Applications received", value: stats?.applications, icon: FileText },
  ];

  const steps = [
    {
      title: "Search & filter",
      text: "Use smart search and advanced filters to zero in on the right role quickly.",
      icon: Search,
    },
    {
      title: "Compare roles",
      text: "Review employers, locations, and benefits side by side before you decide.",
      icon: Layers,
    },
    {
      title: "Apply in minutes",
      text: "Submit your application and track progress without leaving the portal.",
      icon: CheckCircle2,
    },
  ];

  const employerBuckets = [
    { title: "Newest employers", items: latestEmployers },
    { title: "Featured employers", items: featuredEmployers },
    { title: "Most active employers", items: mostActiveEmployers },
  ];

  const formatStat = (value?: number) => {
    if (typeof value !== "number") return "...";
    return new Intl.NumberFormat("de-DE").format(value);
  };

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

      <section className="relative py-16 lg:py-20 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/stats-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-slate-900/70" />
        <div className="relative container mx-auto px-4 text-white">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/70">
              <Sparkles className="h-4 w-4" />
              Live marketplace activity
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mt-3">Key facts and figures</h2>
            <p className="text-white/70 mt-3">
              Real-time signals from employers and candidates using Projekt Gronland right now.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {statsItems.map((item) => (
              <motion.div
                key={item.label}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2 }}
                className="glass bg-white/10 border border-white/20 rounded-3xl p-8 text-center hover-glow"
              >
                <div className="mx-auto h-28 w-28 rounded-full border border-white/30 flex items-center justify-center relative">
                  <div className="absolute inset-2 rounded-full border border-white/10" />
                  <div className="relative text-3xl font-bold">{formatStat(item.value)}</div>
                </div>
                <div className="mt-5 flex items-center justify-center gap-2 text-sm uppercase tracking-[0.2em] text-white/70">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <Layers className="h-4 w-4" />
              How it works
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mt-3">Search, compare, apply</h2>
            <p className="text-slate-600 mt-3">
              A simple flow designed to help candidates move faster while giving employers quality matches.
            </p>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute left-12 right-12 top-12 border-t border-dashed border-slate-200" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="gradient-border"
                >
                  <div className="gradient-inner p-8 rounded-3xl h-full text-center flex flex-col items-center gap-4 hover-lift">
                    <div className="w-20 h-20 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center">
                      <step.icon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center">
                      0{index + 1}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
                    <p className="text-slate-600">{step.text}</p>
                  </div>
                </motion.div>
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
              {jobsList.slice(0, 6).map((job) => (
                <JobCard key={job.id} job={job} featured={true} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <ShieldCheck className="h-4 w-4" />
              Why Projekt Gronland
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mt-3">Built for fast, local hiring</h2>
            <p className="text-slate-600 mt-3">
              Everything you need to launch a job, attract candidates, and move from search to hire with confidence.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, title: "Verified employers", text: "Every listing is tied to a real hiring team and a live company profile." },
              { icon: Zap, title: "Lightning-fast workflows", text: "Save, apply, and track progress without the usual friction." },
              { icon: TrendingUp, title: "Real-time momentum", text: "See the freshest openings first, with smart filters and alerts." },
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

      <section className="py-16 bg-white/60">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <Briefcase className="h-4 w-4" />
              Employer spotlight
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mt-3">Teams hiring on Projekt Gronland</h2>
            <p className="text-slate-600 mt-3">
              Real companies currently active on the platform. As more employers join, this wall keeps growing.
            </p>
          </div>

          {employersList.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-slate-500">No employers yet. Add one to start showcasing real hiring teams.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {employerBuckets.map((bucket) => (
                <div key={bucket.title} className="glass rounded-2xl p-6 hover-glow">
                  <h3 className="text-lg font-semibold text-slate-900 mb-6">{bucket.title}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {bucket.items.length === 0 ? (
                      <div className="col-span-2 text-sm text-slate-500 text-center">No employers available yet.</div>
                    ) : (
                      bucket.items.map((employer) => (
                        <div key={employer.id} className="flex flex-col items-center gap-2 rounded-xl bg-white/80 border border-white/70 p-3 hover-lift">
                          <div className="h-10 w-full flex items-center justify-center">
                            {employer.logoUrl ? (
                              <img
                                src={employer.logoUrl}
                                alt={employer.name}
                                className="h-8 w-auto object-contain"
                              />
                            ) : (
                              <span className="text-xs font-semibold text-slate-500 text-center line-clamp-1">
                                {employer.name}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 text-center line-clamp-1">{employer.name}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-center mt-10">
            <Link href="/companies">
              <Button variant="outline" className="rounded-full border-slate-200 bg-white/70">
                Explore all employers
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="relative py-16 lg:py-20 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/cta-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-slate-900/70" />
        <div className="relative container mx-auto px-4 text-white">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/70">
              <Zap className="h-4 w-4" />
              For employers
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mt-3">Post a job and reach candidates fast</h2>
            <p className="text-white/70 mt-4">
              Create a job listing in minutes, showcase your brand, and manage candidates from one clean dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Link href="/post-job">
                <Button className="rounded-xl text-white bg-gradient-to-r from-primary via-sky-500 to-accent shine button-pop">
                  Post a Job
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" className="rounded-xl border-white/60 text-white hover:bg-white/10">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
