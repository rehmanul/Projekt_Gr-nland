import { useTenant } from "@/hooks/use-tenant";

export default function Privacy() {
  const { data: tenant } = useTenant();

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">Privacy Policy</h1>
        <p className="text-slate-600 mb-12">
          Datenschutzerklärung – Information on the processing of your data (GDPR).
        </p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-600">
          <section>
            <h2 className="text-xl font-bold text-slate-900">1. Controller</h2>
            <p>
              The controller for the processing of your personal data in connection with this website is {tenant?.name || "Projekt Grönland"}, Karlsruhe, Germany. Contact: support@{tenant?.domain?.replace("www.", "") || "example.com"}.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">2. Data we collect</h2>
            <p>
              When you use our job portal we may process: (a) account and profile data you provide; (b) application data (name, email, CV, cover letter) when you apply for jobs; (c) usage data (IP address, browser, pages visited) for technical and security purposes; (d) cookies and similar technologies for session and preferences.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">3. Purposes and legal basis</h2>
            <p>
              We process your data to operate the portal, match candidates with employers, process applications, improve our services, and comply with legal obligations. Legal bases include contract performance (Art. 6(1)(b) GDPR), consent (Art. 6(1)(a) GDPR), and legitimate interests (Art. 6(1)(f) GDPR).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">4. Sharing and retention</h2>
            <p>
              Application data is shared with the employer for the position you apply to. We do not sell your data. Data is retained as long as necessary for the purposes above or as required by law; application data may be retained for the duration of the hiring process and for a limited period thereafter for legal claims.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">5. Your rights</h2>
            <p>
              You have the right to access, rectify, erase, restrict processing, data portability, and to object. Where processing is based on consent, you may withdraw it at any time. You may lodge a complaint with a supervisory authority.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">6. Updates</h2>
            <p>
              We may update this policy from time to time. The current version is always available on this page. Last update: {new Date().toLocaleDateString("en-GB")}.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
