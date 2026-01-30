import { useJob } from "@/hooks/use-jobs";
import { useCreateApplication } from "@/hooks/use-applications";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Clock, Building2, Euro, Globe, ArrowLeft, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertApplicationSchema, type InsertApplication } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function JobDetails() {
  const [, params] = useRoute("/jobs/:id");
  const jobId = params ? parseInt(params.id) : 0;
  const { data: job, isLoading } = useJob(jobId);
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  const { toast } = useToast();

  const { mutate: submitApplication, isPending } = useCreateApplication();

  const form = useForm<InsertApplication>({
    resolver: zodResolver(insertApplicationSchema),
    defaultValues: {
      jobId: jobId,
      tenantId: job?.tenantId, // Will be set when job loads
      status: 'new'
    }
  });

  const onSubmit = (data: InsertApplication) => {
    // Ensure tenantId and jobId are set correctly
    const payload = {
      ...data,
      jobId: jobId,
      tenantId: job?.tenantId || 1
    };

    submitApplication(payload, {
      onSuccess: () => {
        setIsApplicationOpen(false);
        toast({
          title: "Application Submitted!",
          description: "Your application has been sent successfully. Good luck!",
        });
        form.reset();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="h-8 w-32 bg-slate-200 rounded mb-8 animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-2xl mb-8 animate-pulse" />
        <div className="h-96 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!job) return <div className="text-center py-20">Job not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/jobs" className="inline-flex items-center text-sm text-slate-500 hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Jobs
        </Link>

        {/* Header Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-20 h-20 rounded-xl bg-slate-50 border flex items-center justify-center p-2 shrink-0">
              {job.employer?.logoUrl ? (
                <img src={job.employer.logoUrl} alt={job.employer.name} className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-10 h-10 text-slate-300" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">{job.title}</h1>
                  <div className="text-lg text-slate-600 font-medium mb-4">
                    {job.employer?.name} 
                    {job.employer?.website && (
                      <a href={job.employer.website} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline ml-2 inline-flex items-center">
                        Visit Website <Globe className="w-3 h-3 ml-1" />
                      </a>
                    )}
                  </div>
                </div>
                <Dialog open={isApplicationOpen} onOpenChange={setIsApplicationOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="hidden md:flex shadow-lg shadow-primary/25">Apply Now</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Apply for {job.title}</DialogTitle>
                      <DialogDescription>
                        Send your application to {job.employer?.name}.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="applicantName">Full Name</Label>
                          <Input id="applicantName" {...form.register("applicantName")} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="applicantPhone">Phone</Label>
                          <Input id="applicantPhone" {...form.register("applicantPhone")} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="applicantEmail">Email Address</Label>
                        <Input id="applicantEmail" type="email" {...form.register("applicantEmail")} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="coverLetter">Cover Letter</Label>
                        <Textarea 
                          id="coverLetter" 
                          placeholder="Tell us why you're a good fit..." 
                          className="h-32" 
                          {...form.register("coverLetter")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="resumeUrl">Resume URL (Optional)</Label>
                        <Input 
                          id="resumeUrl" 
                          placeholder="https://linkedin.com/in/..." 
                          {...form.register("resumeUrl")} 
                        />
                      </div>
                      <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsApplicationOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isPending}>
                          {isPending ? "Sending..." : "Submit Application"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {job.location}
                </div>
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full">
                  <BriefcaseIcon className="w-4 h-4 text-slate-400" />
                  <span className="capitalize">{job.employmentType}</span>
                </div>
                {job.salaryMin && (
                  <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full">
                    <Euro className="w-4 h-4 text-slate-400" />
                    <span>
                      {job.salaryMin} - {job.salaryMax} {job.salaryCurrency}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Posted {job.publishedAt ? formatDistanceToNow(new Date(job.publishedAt)) : "Recently"} ago
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold font-display text-slate-900 mb-4">Job Description</h2>
              <div className="prose prose-slate max-w-none text-slate-600">
                <p className="whitespace-pre-line">{job.description}</p>
              </div>
            </section>

            {/* Requirements */}
            {job.requirements && (
              <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold font-display text-slate-900 mb-4">Requirements</h2>
                <div className="prose prose-slate max-w-none text-slate-600">
                  <p className="whitespace-pre-line">{job.requirements}</p>
                </div>
              </section>
            )}
            
            {/* Benefits */}
            {job.benefits && (
              <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold font-display text-slate-900 mb-4">Benefits</h2>
                <div className="prose prose-slate max-w-none text-slate-600">
                  <p className="whitespace-pre-line">{job.benefits}</p>
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-white shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4">About the Company</h3>
              <p className="text-sm text-slate-600 mb-6 line-clamp-6">
                {job.employer?.description || "A leading company in the industry committed to innovation and excellence."}
              </p>
              {job.employer?.id && (
                <Link href={`/employers/${job.employer.id}`}>
                  <Button variant="outline" className="w-full">View Company Profile</Button>
                </Link>
              )}
            </Card>

            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-2">Safe Job Search</h3>
              <p className="text-xs text-blue-700 leading-relaxed">
                Be careful when providing personal information. Never pay money for a job application or interview.
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t md:hidden z-50">
          <Button size="lg" className="w-full shadow-lg" onClick={() => setIsApplicationOpen(true)}>
            Apply Now
          </Button>
        </div>
      </div>
    </div>
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
