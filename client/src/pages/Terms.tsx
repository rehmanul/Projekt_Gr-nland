import { useTenant } from "@/hooks/use-tenant";

export default function Terms() {
  const { data: tenant } = useTenant();

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">Terms of Service</h1>
        <p className="text-slate-600 mb-12">
          Allgemeine Geschäftsbedingungen (AGB) – Terms governing the use of our job portal.
        </p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-600">
          <section>
            <h2 className="text-xl font-bold text-slate-900">1. Scope</h2>
            <p>
              These terms apply to the use of the job portal operated by {tenant?.name || "Projekt Grönland"} ("we", "platform"). By registering, posting jobs, or applying, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">2. Services</h2>
            <p>
              We provide a platform for job listings and applications. Employers may post vacancies; candidates may browse and apply. We do not guarantee employment or hiring. All agreements between employers and candidates are solely between them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">3. User obligations</h2>
            <p>
              You must provide accurate information and use the platform lawfully. Job postings must be real and non-discriminatory. Applications must be truthful. You may not misuse the service (spam, scraping, impersonation, or illegal content).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">4. Fees and payment</h2>
            <p>
              Browsing and applying for jobs is free for candidates. Employers may be charged for job postings or packages according to the pricing in effect at the time. Payment terms will be set out in separate agreements or on the pricing page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">5. Liability</h2>
            <p>
              We are liable only for intent and gross negligence, and for breach of essential contractual obligations (cardinal obligations), limited to foreseeable damage. We are not liable for content posted by users or for hiring decisions made by employers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900">6. Changes and termination</h2>
            <p>
              We may update these terms with reasonable notice. Continued use after changes constitutes acceptance. We may suspend or terminate access in case of breach or for operational reasons.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
