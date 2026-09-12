import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Arzac Studio terms of service — what you get, what we commit to.",
  alternates: { canonical: "/terms" },
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
            Arzac Studio provides professional websites, a CRM for customers and bookings, and automated email
            notifications for local businesses in Israel. The service has a one-time setup fee and a fixed monthly
            subscription, billed in Israeli New Shekels (ILS). AI-powered WhatsApp agents, AI assistants and AI voice
            calling are optional services, quoted separately.
          </p>
        </section>

        <section>
          <h2>Pricing</h2>
          <ul>
            <li><strong>Setup</strong> — ₪1,500, one-time, charged upon signing. For in-person signups the setup fee may be agreed between ₪1,000 and ₪1,500.</li>
            <li><strong>Subscription</strong> — ₪250/month, fixed. Website, hosting, domain, CRM and email notifications.</li>
            <li><strong>Optional</strong> — WhatsApp agent, AI assistant and AI voice calls: quoted separately, no activation deadline.</li>
          </ul>
          <p>The subscription is charged monthly on the same date. There are no service tiers, automatic upgrades or automatic price changes.</p>
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
