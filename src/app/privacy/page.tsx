import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Arzac Studio privacy policy — how we handle your data.",
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <div className="legal-container">
        <h1>Privacy Policy</h1>
        <p className="updated">Last updated: June 2026</p>

        <section>
          <h2>Who we are</h2>
          <p>
            Arzac Studio (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates arzac.studio and builds websites, CRM systems, and
            WhatsApp AI agents for local businesses in Israel. The business is operated by Liam Arzac from Tel Aviv.
          </p>
        </section>

        <section>
          <h2>What we collect</h2>
          <ul>
            <li><strong>Account data</strong> — name, email, phone number, and business name when you sign up or subscribe.</li>
            <li><strong>Payment data</strong> — processed by Cardcom. We never see or store card details.</li>
            <li><strong>Usage data</strong> — anonymous analytics to improve the service (page views, device type).</li>
            <li><strong>Client data</strong> — leads, bookings, and conversations managed through your CRM and WhatsApp agent.</li>
          </ul>
        </section>

        <section>
          <h2>How we use it</h2>
          <ul>
            <li>To set up and maintain your website, CRM, and WhatsApp agent.</li>
            <li>To process payments and send invoices.</li>
            <li>To communicate with you about your account.</li>
            <li>To improve our service.</li>
          </ul>
        </section>

        <section>
          <h2>Who we share it with</h2>
          <p>
            We share data only with services required to operate: Firebase (hosting/database), Cardcom (payments),
            and Vercel (deployment). We never sell your data.
          </p>
        </section>

        <section>
          <h2>Your rights</h2>
          <p>
            You can request a copy of your data, ask for corrections, or request deletion at any time by contacting
            us at <a href="mailto:website@arzac.studio">website@arzac.studio</a>.
          </p>
        </section>

        <section>
          <h2>Data on cancellation</h2>
          <p>
            When you cancel your subscription, you leave with your domain, client database export, and booking history.
            We delete your data from our systems within 30 days of cancellation.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Questions about this policy? Email <a href="mailto:website@arzac.studio">website@arzac.studio</a> or
            message Liam on WhatsApp.
          </p>
        </section>
      </div>
    </main>
  );
}
