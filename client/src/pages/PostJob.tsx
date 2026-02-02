import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertJobSchema, type InsertJob } from "@shared/schema";
import { useCreateJob } from "@/hooks/use-jobs";
import { useEmployers } from "@/hooks/use-employers";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function PostJob() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { mutate: createJob, isPending } = useCreateJob();
  const { data: employers, isLoading: isLoadingEmployers, error: employersError } = useEmployers();
  console.log("PostJob employers:", employers);

  const form = useForm<InsertJob>({
    resolver: zodResolver(insertJobSchema),
    defaultValues: {
      tenantId: 1, // Default to 1 for demo
      employmentType: "full-time",
      visibility: ["primary"]
    }
  });

  const onSubmit = (data: InsertJob) => {
    createJob(data, {
      onSuccess: () => {
        toast({
          title: "Job Posted!",
          description: "Your job listing is now live.",
        });
        setLocation("/jobs");
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

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link href="/" className="inline-flex items-center text-sm text-slate-500 hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Post a New Job</h1>
          <p className="text-slate-600">Reach thousands of qualified candidates in the region.</p>
        </div>

        <Card className="p-8 shadow-sm">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Employer Selection (Mock Auth) */}
            <div className="space-y-2">
              <Label htmlFor="employerId">Posting on behalf of</Label>
              <Select
                onValueChange={(val) => form.setValue("employerId", parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingEmployers ? "Loading..." : "Select Employer"} />
                </SelectTrigger>
                <SelectContent>
                  {employers?.map(emp => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.employerId && <p className="text-red-500 text-sm">Please select an employer</p>}
              {employersError && <p className="text-red-500 text-sm">Error: {employersError.message}</p>}
              <div className="text-xs text-gray-400 mt-1">Status: {isLoadingEmployers ? 'Loading' : 'Loaded'} | Count: {employers?.length ?? 0}</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input id="title" {...form.register("title")} placeholder="e.g. Senior Frontend Engineer" />
              {form.formState.errors.title && <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" {...form.register("location")} placeholder="e.g. Karlsruhe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type</Label>
                <Select
                  defaultValue="full-time"
                  onValueChange={(val) => form.setValue("employmentType", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full Time</SelectItem>
                    <SelectItem value="part-time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salaryMin">Min Salary</Label>
                <Input type="number" id="salaryMin" {...form.register("salaryMin", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryMax">Max Salary</Label>
                <Input type="number" id="salaryMax" {...form.register("salaryMax", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" defaultValue="EUR" disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                className="h-40"
                placeholder="Describe the role responsibilities..."
                {...form.register("description")}
              />
              {form.formState.errors.description && <p className="text-red-500 text-sm">{form.formState.errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                className="h-32"
                placeholder="List key skills and qualifications..."
                {...form.register("requirements")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benefits">Benefits</Label>
              <Textarea
                id="benefits"
                className="h-32"
                placeholder="What perks do you offer?"
                {...form.register("benefits")}
              />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isPending}>
              {isPending ? "Publishing..." : "Publish Job Listing"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
