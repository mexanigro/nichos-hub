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
            Arzac Studio provides professional websites, CRM systems, and AI-powered WhatsApp agents for local
            businesses in Israel. The service is subscription-based, billed monthly in Israeli New Shekels (ILS).
          </p>
        </section>

        <section>
          <h2>Plans and pricing</h2>
          <ul>
            <li><strong>Web + CRM</strong> — ₪790/month. Includes website, hosting, domain, CRM, booking calendar, and unlimited text edits.</li>
            <li><strong>Web + CRM + Agent</strong> — ₪990/month. Everything above plus an AI WhatsApp agent trained on your services.</li>
          </ul>
          <p>Setup is free. The first payment is charged upon subscription. Subsequent payments are charged monthly on the same date.</p>
        </section>

        <section>
          <h2>Cancellation</h2>
          <p>
            You can cancel any month from your dashboard — no penalty, no lock-in. Upon cancellation, you keep your
            domain, your client database (exported), and your booking history. The website and CRM will be deactivated
            at the end of the billing period.
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
            Your brand, content, photos, and client data belong to you. The website template structure, code, and
            design system belong to Arzac Studio. Upon cancellation, you retain all your content and data.
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
