import { useTenant } from "@/hooks/use-tenant";

function getDisplayName(name?: string) {
  if (!name || /gr[öo]nland|projekt/i.test(name)) {
    return "Campaign Approval Portal";
  }
  return name;
}

export default function Privacy() {
  const { data: tenant } = useTenant();
  const brandName = getDisplayName(tenant?.name);

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">Privacy Policy</h1>
        <p className="text-slate-600 mb-12">Information on how we process personal data under GDPR.</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-600">
          <section>
            <h2 className="text-xl font-bold text-slate-900">1. Controller</h2>
            <p>
              The controller for the processing of your personal data in connection with this website is{" "}
              {brandName}, Karlsruhe, Germany. Contact: support@
              {tenant?.domain?.replace("www.", "") || "example.com"}.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">2. Data We Collect</h2>
            <p>
              We may process account details, campaign and application data, technical usage logs, and
              cookie/session information required to operate the platform securely.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">3. Purpose and Legal Basis</h2>
            <p>
              We process data to provide platform features, run campaign workflows, improve service quality,
              and comply with legal obligations. Legal bases include contract performance, consent, and
              legitimate interest under GDPR Article 6.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">4. Sharing and Retention</h2>
            <p>
              We share data only with involved parties (CS, customer, agency) and infrastructure providers
              needed to deliver the service. We retain data only as long as operationally and legally needed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">5. Your Rights</h2>
            <p>
              You can request access, rectification, deletion, portability, restriction, and objection where
              applicable. You may also file a complaint with a supervisory authority.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
