import { useJobs } from "@/hooks/use-jobs";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JobCard } from "@/components/JobCard";
import { Search, MapPin, ArrowRight } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [, setLocationUrl] = useLocation();

  // Fetch featured jobs (simulated by just fetching latest 3)
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
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white -z-10" />
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-100/50 to-transparent -z-10 blur-3xl" />
        
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-display font-bold text-slate-900 mb-6 tracking-tight"
            >
              Find your next <span className="text-primary">career move</span> <br/>in the region.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto"
            >
              Discover thousands of job opportunities from top employers. 
              The most trusted job board for local professionals.
            </motion.p>

            <motion.form 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              onSubmit={handleSearch}
              className="bg-white p-2 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row gap-2 max-w-3xl mx-auto"
            >
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  placeholder="Job title, keywords..." 
                  className="pl-10 border-0 shadow-none focus-visible:ring-0 text-base h-12"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="hidden md:block w-px bg-slate-200 my-2" />
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  placeholder="City, region or remote" 
                  className="pl-10 border-0 shadow-none focus-visible:ring-0 text-base h-12"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <Button size="lg" className="h-12 px-8 rounded-xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/30">
                Search Jobs
              </Button>
            </motion.form>
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold font-display text-slate-900">Featured Opportunities</h2>
              <p className="text-slate-500 mt-1">Hand-picked jobs from top companies</p>
            </div>
            <Link href="/jobs">
              <Button variant="outline" className="gap-2">
                View All Jobs <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
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

      {/* Stats / Trust Section */}
      <section className="py-20 bg-slate-50 border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl font-bold text-primary mb-2">1,200+</div>
              <div className="text-slate-600 font-medium">Active Jobs</div>
            </div>
            <div className="p-6 border-x-0 md:border-x border-slate-200">
              <div className="text-4xl font-bold text-primary mb-2">450+</div>
              <div className="text-slate-600 font-medium">Companies</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-primary mb-2">12k+</div>
              <div className="text-slate-600 font-medium">Candidates Hired</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
