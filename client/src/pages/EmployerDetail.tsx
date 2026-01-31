import { useEmployer } from "@/hooks/use-employers";
import { useJobs } from "@/hooks/use-jobs";
import { useRoute, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/JobCard";
import { Building2, MapPin, Globe, ArrowLeft } from "lucide-react";

export default function EmployerDetail() {
  const [, params] = useRoute("/employers/:id");
  const employerId = params?.id ? parseInt(params.id) : 0;
  const { data: employer, isLoading: employerLoading } = useEmployer(employerId);
  const { data: jobs, isLoading: jobsLoading } = useJobs({ employerId: employerId || undefined });

  if (employerLoading || !employerId) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="h-8 w-48 bg-slate-200 rounded mb-8 animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!employer) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Company not found</h1>
        <Link href="/companies">
          <Button variant="outline">Back to Companies</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/companies" className="inline-flex items-center text-sm text-slate-500 hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Companies
        </Link>

        <Card className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 rounded-xl bg-slate-50 border flex items-center justify-center p-2 shrink-0">
              {employer.logoUrl ? (
                <img src={employer.logoUrl} alt={employer.name} className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-12 h-12 text-slate-300" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">{employer.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-4">
                {employer.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" /> {employer.location}
                  </span>
                )}
                {employer.website && (
                  <a href={employer.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                    <Globe className="w-4 h-4" /> Website
                  </a>
                )}
                {employer.industry && (
                  <span className="bg-slate-100 px-3 py-1 rounded-full">{employer.industry}</span>
                )}
              </div>
              {employer.description && (
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">{employer.description}</p>
              )}
            </div>
          </div>
        </Card>

        <h2 className="text-xl font-bold font-display text-slate-900 mb-4">Open Positions</h2>
        {jobsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : jobs && jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center text-slate-500">
            No open positions at the moment. Check back later or{" "}
            <Link href="/jobs" className="text-primary hover:underline">browse all jobs</Link>.
          </Card>
        )}
      </div>
    </div>
  );
}
