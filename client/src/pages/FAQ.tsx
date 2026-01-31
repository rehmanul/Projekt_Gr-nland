import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How do I apply for a job?",
    a: "Browse jobs or use the search, open a job that interests you, and click 'Apply Now'. Fill in your name, email, cover letter, and optionally a link to your CV or LinkedIn. Your application is sent directly to the employer.",
  },
  {
    q: "Is it free for job seekers?",
    a: "Yes. Creating applications and browsing jobs is free. We never charge candidates.",
  },
  {
    q: "How do I post a job as an employer?",
    a: "Click 'Post a Job' in the header, sign in or register as an employer, and complete the job form (title, description, location, type, salary range if you wish). Once submitted, your job goes live after a quick check.",
  },
  {
    q: "Can I edit or delete my application?",
    a: "After submitting, the application is sent to the employer. If you need to correct something, please contact the employer directly or get in touch with us and we will assist where possible.",
  },
  {
    q: "How long do job listings stay online?",
    a: "That depends on the employer. Many listings run for 30–90 days or until the position is filled. You can see the publish date on each job page.",
  },
  {
    q: "Who can see my application data?",
    a: "Only the employer for the job you applied to receives your application. We do not sell or share your data with third parties for marketing. See our Privacy Policy for details.",
  },
];

export default function FAQ() {
  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">Frequently Asked Questions</h1>
        <p className="text-lg text-slate-600 mb-12">
          Quick answers to common questions about using our job portal.
        </p>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left font-semibold text-slate-900">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
