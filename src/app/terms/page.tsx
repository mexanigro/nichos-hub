import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Arzac Studio terms of service — what you get, what we commit to.",
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <h1>Terms of Service</h1>
        <p className="updated">Last updated: June 2026</p>

        <section>
          <h2>The service</h2>
          <p>
            Arzac Studio provides professional websites, CRM systems, AI-powered WhatsApp agents, and AI voice calling
            for local businesses in Israel. The service is subscription-based, billed monthly in Israeli New Shekels (ILS).
          </p>
        </section>

        <section>
          <h2>Plans and pricing</h2>
          <ul>
            <li><strong>Solo Web</strong> — ₪480/month. Website, hosting, domain, AI chatbot, email notifications.</li>
            <li><strong>Base</strong> — ₪770/month. Website, hosting, domain, CRM, AI WhatsApp agent (24/7), up to 100 bookings/month.</li>
            <li><strong>Pro</strong> — ₪960/month. Everything in Base + AI voice calls (cloned voice), up to 300 bookings/month.</li>
            <li><strong>Enterprise</strong> — ₪1,270/month. Everything in Pro + unlimited bookings, unlimited voice calls, priority support.</li>
          </ul>
          <p>Setup is free on all plans. The first payment is charged upon subscription. Subsequent payments are charged monthly on the same date.</p>
        </section>

        <section>
          <h2>Automatic tier upgrade</h2>
          <p>
            If you reach your plan&apos;s booking limit during a billing cycle, you will be automatically upgraded to the
            next tier starting from the following billing cycle. You will be notified via WhatsApp and/or email within
            24 hours. You can request a downgrade with 30 days&apos; written notice, provided your usage fits the lower tier.
          </p>
        </section>

        <section>
          <h2>Cancellation</h2>
          <p>
            You can cancel any month from your dashboard — no penalty, no lock-in. Upon cancellation, you keep your
            domain, your client database (exported), and your booking history. The website, CRM, and AI agents will be
            deactivated at the end of the billing period.
          </p>
        </section>

        <section>
          <h2>What we maintain</h2>
          <p>
            While subscribed, we maintain your website, hosting, domain renewal, SSL certificate, daily backups,
            security updates, SEO configuration, and Google Business sync. Updates and copy edits are unlimited.
          </p>
        </section>

        <section>
          <h2>Payments</h2>
          <p>
            Payments are processed by Cardcom, Israel&apos;s largest payment processor. We never see or store your
            card details. A local invoice is issued for every payment.
          </p>
        </section>

        <section>
          <h2>Intellectual property</h2>
          <p>
            Your brand, content, photos, voice samples, and client data belong to you. The website template structure, code, and
            design system belong to Arzac Studio. Upon cancellation, you retain all your content, data, and voice call logs.
          </p>
        </section>

        <section>
          <h2>Availability</h2>
          <p>
            We target 99.9% uptime for all client sites. Scheduled maintenance is communicated in advance.
            Unplanned downtime is addressed within one hour.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Questions about these terms? Email <a href="mailto:website@arzac.studio">website@arzac.studio</a> or
            message Liam on WhatsApp.
          </p>
        </section>
      </div>
    </main>
  );
}
