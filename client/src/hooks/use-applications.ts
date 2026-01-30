import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type InsertApplication } from "@shared/schema";

export function useCreateApplication() {
  return useMutation({
    mutationFn: async (data: InsertApplication) => {
      const res = await fetch(api.applications.create.path, {
        method: api.applications.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit application");
      }
      return api.applications.create.responses[201].parse(await res.json());
    },
  });
}
