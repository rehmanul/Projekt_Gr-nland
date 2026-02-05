import { useQuery } from "@tanstack/react-query";

export type SiteStats = {
  jobs: number;
  employers: number;
  applications: number;
};

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: async (): Promise<SiteStats> => {
      const res = await fetch("/api/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });
}
