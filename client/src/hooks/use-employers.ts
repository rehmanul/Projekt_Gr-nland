import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useEmployers() {
  return useQuery({
    queryKey: [api.employers.list.path],
    queryFn: async () => {
      const res = await fetch(api.employers.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch employers");
      return api.employers.list.responses[200].parse(await res.json());
    },
  });
}

export function useEmployer(id: number) {
  return useQuery({
    queryKey: [api.employers.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.employers.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch employer");
      return api.employers.get.responses[200].parse(await res.json());
    },
    enabled: !!id && !isNaN(id),
  });
}
