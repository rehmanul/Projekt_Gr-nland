import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useTenant() {
  return useQuery({
    queryKey: [api.tenants.current.path],
    queryFn: async () => {
      const res = await fetch(api.tenants.current.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tenant info");
      return api.tenants.current.responses[200].parse(await res.json());
    },
  });
}
