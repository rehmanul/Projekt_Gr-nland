import { useTenant } from "@/hooks/use-tenant";

export default function Imprint() {
  const { data: tenant } = useTenant();

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">Impressum</h1>
        <p className="text-slate-600 mb-12">
          Legal information as required by § 5 TMG (Telemediengesetz) and § 55 RStV.
        </p>

        <div className="prose prose-slate max-w-none space-y-6 text-slate-600">
          <section>
            <h2 className="text-xl font-bold text-slate-900">Service provider</h2>
            <p>{tenant?.name || "Projekt Grönland"}</p>
            <p>Karlsruhe, Germany</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">Contact</h2>
            <p>Email: support@{tenant?.domain?.replace("www.", "") || "example.com"}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">Responsible for content</h2>
            <p>As per § 55 Abs. 2 RStV: Recruiting NOW / Platform operator.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">Disclaimer</h2>
            <p>
              The contents of our pages have been created with the utmost care. We cannot guarantee the contents' accuracy, completeness, or topicality. As a service provider we are responsible for our own content on these pages according to general laws; we are not obliged to monitor transmitted or stored third-party information.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
