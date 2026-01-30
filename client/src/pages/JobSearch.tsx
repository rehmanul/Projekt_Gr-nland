import { useJobs } from "@/hooks/use-jobs";
import { JobCard } from "@/components/JobCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function JobSearch() {
  const [locationUrl] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    location: searchParams.get("location") || "",
    employmentType: searchParams.get("employmentType") || "all"
  });

  const { data: jobs, isLoading, error } = useJobs({
    search: filters.search || undefined,
    location: filters.location || undefined,
    employmentType: filters.employmentType === "all" ? undefined : filters.employmentType
  });

  // Debounce logic could be added here for production
  
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b shadow-sm sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Job title or keywords" 
                className="pl-9 bg-slate-50 border-slate-200"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Location" 
                className="pl-9 bg-slate-50 border-slate-200"
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div>
              <Select 
                value={filters.employmentType} 
                onValueChange={(val) => setFilters(prev => ({ ...prev, employmentType: val }))}
              >
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white">
              <Filter className="w-4 h-4 mr-2" />
              Filter Results
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-display text-slate-900">
            {isLoading ? "Loading jobs..." : `${jobs?.length || 0} Jobs Found`}
          </h1>
          <div className="text-sm text-slate-500">
            Sorted by <span className="font-semibold text-slate-700">Relevance</span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold text-slate-900">Something went wrong</h3>
            <p className="text-slate-500 mt-2">Failed to load jobs. Please try again later.</p>
          </div>
        ) : jobs?.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No jobs found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your search or filters to find what you're looking for.</p>
            <Button 
              variant="link" 
              className="mt-4 text-primary"
              onClick={() => setFilters({ search: "", location: "", employmentType: "all" })}
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs?.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
