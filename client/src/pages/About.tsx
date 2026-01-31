import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, Target, Heart } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">About Us</h1>
        <p className="text-lg text-slate-600 mb-12">
          We connect talented professionals with leading employers across the region.
        </p>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              Our Mission
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Our mission is to make job search and hiring simple, transparent, and effective. We believe everyone deserves access to meaningful work and that employers deserve to find the right talent quickly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" />
              For Job Seekers
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Browse thousands of jobs from trusted local and regional employers. Create applications in minutes, get updates on your applications, and discover companies that match your values and career goals.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              For Employers
            </h2>
            <p className="text-slate-600 leading-relaxed">
              Post jobs, manage applications, and build your employer brand on a platform designed for regional hiring. Reach qualified candidates where they are and grow your team with confidence.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Heart className="w-6 h-6 text-primary" />
              Our Values
            </h2>
            <p className="text-slate-600 leading-relaxed">
              We are committed to fairness, transparency, and respect. We do not charge job seekers. We support equal opportunity and inclusive hiring. Your data and privacy are protected.
            </p>
          </section>
        </div>

        <div className="mt-12 flex gap-4">
          <Link href="/jobs">
            <Button>Find Jobs</Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline">Contact Us</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
