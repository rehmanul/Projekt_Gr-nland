import { useEmployers } from "@/hooks/use-employers";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Building2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Employers() {
  const { data: employers, isLoading } = useEmployers();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-3xl font-display font-bold text-slate-900 mb-4">Top Employers</h1>
        <p className="text-slate-600">Discover the best companies hiring in the region right now.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employers?.map((employer) => (
            <Link key={employer.id} href={`/employers/${employer.id}`}>
              <Card className="h-full p-6 hover:shadow-lg transition-all cursor-pointer group flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-xl bg-slate-50 border flex items-center justify-center p-4 mb-4 group-hover:scale-105 transition-transform">
                  {employer.logoUrl ? (
                    <img src={employer.logoUrl} alt={employer.name} className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary mb-1">
                  {employer.name}
                </h3>
                <div className="flex items-center gap-1 text-sm text-slate-500 mb-4">
                  <MapPin className="w-3 h-3" />
                  {employer.location || "Multiple Locations"}
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 mb-6">
                  {employer.description}
                </p>
                <Button variant="outline" className="mt-auto w-full group-hover:border-primary group-hover:text-primary">
                  View Profile
                </Button>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
