import { Link } from "wouter";
import { type Job, type Employer } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Building2, Euro } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

interface JobCardProps {
  job: Job & { employer?: Employer };
  featured?: boolean;
}

export function JobCard({ job, featured = false }: JobCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Link href={`/jobs/${job.id}`}>
        <div className={featured ? "gradient-border h-full" : "h-full"}>
          <Card className={`
            h-full p-6 cursor-pointer transition-all duration-300
            hover:shadow-xl hover:border-primary/30 hover-glow
            ${featured ? 'gradient-inner bg-white/90' : 'bg-white/80'}
          `}>
            <div className="flex flex-col h-full gap-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border shadow-sm flex items-center justify-center p-2 overflow-hidden">
                    {job.employer?.logoUrl ? (
                      <img src={job.employer.logoUrl} alt={job.employer.name} className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div>
                <h2 className="font-display font-bold text-lg text-slate-900 line-clamp-1">
                  {job.title}
                </h2>
                    <p className="text-sm text-slate-500 font-medium">
                      {job.employer?.name || "Confidential Employer"}
                    </p>
                  </div>
                </div>
                {featured && (
                  <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                    Featured
                  </Badge>
                )}
              </div>

              <div className="mt-2 space-y-2 flex-1">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="truncate">{job.location || "Remote"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <BriefcaseIcon className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="capitalize">{job.employmentType.replace('-', ' ')}</span>
                </div>
                {(job.salaryMin || job.salaryMax) && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Euro className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>
                      {job.salaryMin ? `${job.salaryMin / 1000}k` : ''}
                      {job.salaryMin && job.salaryMax ? ' - ' : ''}
                      {job.salaryMax ? `${job.salaryMax / 1000}k` : ''}
                      {job.salaryCurrency}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t flex items-center justify-between mt-auto">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {job.publishedAt
                    ? formatDistanceToNow(new Date(job.publishedAt), { addSuffix: true })
                    : "Just now"
                  }
                </div>
                <span className="text-sm font-semibold text-primary">
                  View Details
                </span>
              </div>
            </div>
          </Card>
        </div>
      </Link>
    </motion.div>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
