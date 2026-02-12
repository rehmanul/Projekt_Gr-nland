import { useTenant } from "@/hooks/use-tenant";

function getDisplayName(name?: string) {
  if (!name || /gr[öo]nland|projekt/i.test(name)) {
    return "Campaign Approval Portal";
  }
  return name;
}

export default function Imprint() {
  const { data: tenant } = useTenant();
  const brandName = getDisplayName(tenant?.name);

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">Imprint</h1>
        <p className="text-slate-600 mb-12">
          Legal information as required by section 5 TMG and section 55 RStV.
        </p>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
          <section>
            <h2 className="text-xl font-bold text-slate-900">Service Provider</h2>
            <p>{brandName}</p>
            <p>Karlsruhe, Germany</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">Contact</h2>
            <p>Email: support@{tenant?.domain?.replace("www.", "") || "example.com"}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">Responsible for Content</h2>
            <p>As per section 55(2) RStV: Recruiting NOW / Platform operator.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
