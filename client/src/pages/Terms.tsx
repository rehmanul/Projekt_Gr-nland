import { useTenant } from "@/hooks/use-tenant";

function getDisplayName(name?: string) {
  if (!name || /gr[öo]nland|projekt/i.test(name)) {
    return "Campaign Approval Portal";
  }
  return name;
}

export default function Terms() {
  const { data: tenant } = useTenant();
  const brandName = getDisplayName(tenant?.name);

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">Terms of Service</h1>
        <p className="text-slate-600 mb-12">Terms governing access and use of this platform.</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-600">
          <section>
            <h2 className="text-xl font-bold text-slate-900">1. Scope</h2>
            <p>
              These terms apply to the platform operated by {brandName}. By using the service, you agree to
              these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">2. Services</h2>
            <p>
              The platform provides campaign workflow management between CS, customers, and agencies,
              including status tracking, asset exchange, and approval/revision cycles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">3. User Obligations</h2>
            <p>
              Users must provide accurate information and use the platform lawfully. Access credentials and
              login links must be kept confidential.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">4. Liability</h2>
            <p>
              We are liable within applicable statutory limits. We are not responsible for content uploaded by
              users, except where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">5. Changes and Termination</h2>
            <p>
              We may update these terms with reasonable notice and may suspend access in case of misuse or
              security risk.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
