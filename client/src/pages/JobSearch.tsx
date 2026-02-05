import { useJobs } from "@/hooks/use-jobs";
import { JobCard } from "@/components/JobCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Briefcase } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { AdvancedFiltersPanel, defaultAdvancedFilters, type AdvancedFilters } from "@/components/search/AdvancedFilters";
import { Button } from "@/components/ui/button";

interface BasicFilters {
  search: string;
  location: string;
  employmentType: string;
}

// Parse URL params to filters
function parseUrlFilters(): { basic: BasicFilters; advanced: AdvancedFilters } {
  const params = new URLSearchParams(window.location.search);

  return {
    basic: {
      search: params.get("search") || "",
      location: params.get("location") || "",
      employmentType: params.get("employmentType") || "all",
    },
    advanced: {
      salaryMin: params.get("salaryMin") ? Number(params.get("salaryMin")) : undefined,
      salaryMax: params.get("salaryMax") ? Number(params.get("salaryMax")) : undefined,
      remoteType: params.get("remoteType")?.split(",").filter(Boolean) || [],
      experienceLevel: params.get("experienceLevel")?.split(",").filter(Boolean) || [],
      postedWithin: params.get("postedWithin") || "all",
      companySize: params.get("companySize")?.split(",").filter(Boolean) || [],
      category: params.get("category") || undefined,
      sortBy: params.get("sortBy") || "relevance",
      sortOrder: (params.get("sortOrder") as "asc" | "desc") || "desc",
    },
  };
}

// Build URL from filters
function buildUrlParams(basic: BasicFilters, advanced: AdvancedFilters): string {
  const params = new URLSearchParams();

  if (basic.search) params.set("search", basic.search);
  if (basic.location) params.set("location", basic.location);
  if (basic.employmentType !== "all") params.set("employmentType", basic.employmentType);

  if (advanced.salaryMin) params.set("salaryMin", String(advanced.salaryMin));
  if (advanced.salaryMax) params.set("salaryMax", String(advanced.salaryMax));
  if (advanced.remoteType.length) params.set("remoteType", advanced.remoteType.join(","));
  if (advanced.experienceLevel.length) params.set("experienceLevel", advanced.experienceLevel.join(","));
  if (advanced.postedWithin !== "all") params.set("postedWithin", advanced.postedWithin);
  if (advanced.companySize.length) params.set("companySize", advanced.companySize.join(","));
  if (advanced.category) params.set("category", advanced.category);
  if (advanced.sortBy !== "relevance") params.set("sortBy", advanced.sortBy);
  if (advanced.sortOrder !== "desc") params.set("sortOrder", advanced.sortOrder);

  return params.toString();
}

export default function JobSearch() {
  const [, setLocation] = useLocation();

  // Initialize from URL
  const initialFilters = useMemo(() => parseUrlFilters(), []);
  const [basicFilters, setBasicFilters] = useState<BasicFilters>(initialFilters.basic);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(initialFilters.advanced);

  // Sync filters to URL
  useEffect(() => {
    const queryString = buildUrlParams(basicFilters, advancedFilters);
    const newUrl = queryString ? `/jobs?${queryString}` : "/jobs";
    window.history.replaceState(null, "", newUrl);
  }, [basicFilters, advancedFilters]);

  // Build query params for API
  const queryParams = useMemo(() => ({
    search: basicFilters.search || undefined,
    location: basicFilters.location || undefined,
    employmentType: basicFilters.employmentType === "all" ? undefined : basicFilters.employmentType,
    salaryMin: advancedFilters.salaryMin,
    salaryMax: advancedFilters.salaryMax,
    remoteType: advancedFilters.remoteType.length ? advancedFilters.remoteType.join(",") : undefined,
    experienceLevel: advancedFilters.experienceLevel.length ? advancedFilters.experienceLevel.join(",") : undefined,
    postedWithin: advancedFilters.postedWithin !== "all" ? advancedFilters.postedWithin : undefined,
    companySize: advancedFilters.companySize.length ? advancedFilters.companySize.join(",") : undefined,
    category: advancedFilters.category,
    sortBy: advancedFilters.sortBy !== "relevance" ? advancedFilters.sortBy : undefined,
    sortOrder: advancedFilters.sortOrder,
  }), [basicFilters, advancedFilters]);

  const { data: jobs, isLoading, error } = useJobs(queryParams);

  const handleClearAll = useCallback(() => {
    setBasicFilters({ search: "", location: "", employmentType: "all" });
    setAdvancedFilters(defaultAdvancedFilters);
  }, []);

  const sortLabel = advancedFilters.sortBy === "date"
    ? "Date"
    : advancedFilters.sortBy === "salary"
      ? "Salary"
      : "Relevance";

  return (
    <div className="min-h-screen pb-20">
      {/* Sticky Search Bar */}
      <div className="glass border-b sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Job title or keywords"
                className="pl-9 input-glass"
                value={basicFilters.search}
                onChange={(e) => setBasicFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div className="relative md:col-span-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Location"
                className="pl-9 input-glass"
                value={basicFilters.location}
                onChange={(e) => setBasicFilters(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div className="md:col-span-1">
              <Select
                value={basicFilters.employmentType}
                onValueChange={(val) => setBasicFilters(prev => ({ ...prev, employmentType: val }))}
              >
                <SelectTrigger className="input-glass">
                  <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
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
            <div className="md:col-span-1">
              <Button
                onClick={handleClearAll}
                variant="outline"
                className="w-full border-white/60 text-slate-600 hover:bg-white/80 button-pop"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Advanced Filters Panel */}
        <AdvancedFiltersPanel
          filters={advancedFilters}
          onChange={setAdvancedFilters}
          onClear={() => setAdvancedFilters(defaultAdvancedFilters)}
        />

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold font-display text-slate-900">
            {isLoading ? "Loading jobs..." : `${jobs?.length || 0} Jobs Found`}
          </h1>
          <div className="text-sm text-slate-500">
            Sorted by <span className="font-semibold text-slate-700">{sortLabel}</span>
            {advancedFilters.sortOrder === "asc" ? " Up" : " Down"}
          </div>
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-white/60 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold text-slate-900">Something went wrong</h3>
            <p className="text-slate-500 mt-2">Failed to load jobs. Please try again later.</p>
          </div>
        ) : jobs?.length === 0 ? (
          <div className="text-center py-20 bg-white/80 rounded-2xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No jobs found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your search or filters to find what you're looking for.</p>
            <Button
              variant="ghost"
              className="mt-4 text-primary hover:text-primary"
              onClick={handleClearAll}
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

