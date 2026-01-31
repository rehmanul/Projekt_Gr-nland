import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500 shrink-0" />
            <h1 className="text-2xl font-bold text-slate-900">404 Page Not Found</h1>
          </div>
          <p className="mt-4 text-sm text-slate-600 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
