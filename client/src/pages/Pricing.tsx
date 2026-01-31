import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Job Seekers",
    description: "Browse and apply for free",
    price: "Free",
    features: [
      "Unlimited job browsing",
      "Apply to any job",
      "Company profiles",
      "Email updates (optional)",
    ],
    cta: "Find Jobs",
    href: "/jobs",
    primary: false,
  },
  {
    name: "Single Job",
    description: "For occasional hiring",
    price: "On request",
    features: [
      "One job listing",
      "30 days online",
      "Application management",
      "Employer dashboard access",
    ],
    cta: "Post a Job",
    href: "/post-job",
    primary: true,
  },
  {
    name: "Employer Package",
    description: "For regular hiring needs",
    price: "On request",
    features: [
      "Multiple job listings",
      "Extended visibility",
      "Company profile & branding",
      "Dedicated support",
    ],
    cta: "Contact Sales",
    href: "/contact",
    primary: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-4xl font-display font-bold text-slate-900 mb-4 text-center">Pricing</h1>
        <p className="text-lg text-slate-600 mb-12 text-center max-w-2xl mx-auto">
          Simple, transparent options for job seekers and employers.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`p-8 flex flex-col ${plan.primary ? "border-primary shadow-lg ring-2 ring-primary/20" : ""}`}
            >
              <h2 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h2>
              <p className="text-slate-600 text-sm mb-6">{plan.description}</p>
              <div className="text-3xl font-bold text-slate-900 mb-6">{plan.price}</div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-slate-600">
                    <Check className="w-5 h-5 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href}>
                <Button className="w-full" variant={plan.primary ? "default" : "outline"}>
                  {plan.cta}
                </Button>
              </Link>
            </Card>
          ))}
        </div>

        <p className="text-center text-slate-500 text-sm mt-8">
          Custom packages and enterprise options available. <Link href="/contact" className="text-primary hover:underline">Get in touch</Link>.
        </p>
      </div>
    </div>
  );
}
