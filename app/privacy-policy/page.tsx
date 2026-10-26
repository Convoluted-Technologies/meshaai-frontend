"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mt-4 mb-10 inset-x-0 z-5 pointer-events-auto">
        <Navbar />
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-20">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          ← Back to Home
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl mb-4">
            🔐
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Last updated: October 20, 2026 &nbsp;·&nbsp; Effective: October 20, 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Introduction</h2>
            <p>
              Welcome to Meshaai ("we", "our", "us"). We operate a gourmet roadside
              bread &amp; egg meal delivery service accessible at meshaai.com and
              through our mobile platforms. This Privacy Policy explains how we
              collect, use, disclose, and protect your personal information when you
              place orders, browse our menu, or interact with any of our services.
            </p>
            <p className="mt-3">
              By using Meshaai, you agree to the collection and use of information in
              accordance with this policy. If you do not agree, please discontinue use
              of our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Information We Collect</h2>
            <h3 className="text-base font-semibold text-slate-800 mb-2">2.1 Information You Provide Directly</h3>
            <ul className="list-disc list-inside space-y-1.5 text-sm">
              <li><strong>Identity:</strong> Your full name when placing an order.</li>
              <li><strong>Contact:</strong> Phone number (used for OTP verification and delivery coordination), email address (if provided during registration).</li>
              <li><strong>Delivery Details:</strong> Delivery address, landmark, and any special delivery notes you enter.</li>
              <li><strong>Account Credentials:</strong> Password (stored securely — we never store passwords in plain text).</li>
            </ul>

            <h3 className="text-base font-semibold text-slate-800 mb-2 mt-5">2.2 Information Collected Automatically</h3>
            <ul className="list-disc list-inside space-y-1.5 text-sm">
              <li><strong>Device &amp; Browser:</strong> IP address, browser type, operating system, and device identifiers.</li>
              <li><strong>Usage Data:</strong> Pages visited, items viewed, cart interactions, and time spent on pages.</li>
              <li><strong>Location:</strong> Approximate location derived from IP address or, with your consent, precise GPS coordinates used for delivery zone validation.</li>
              <li><strong>Cookies &amp; Local Storage:</strong> Session tokens and cached user preferences stored in your browser to remember your details for faster future orders.</li>
            </ul>

            <h3 className="text-base font-semibold text-slate-800 mb-2 mt-5">2.3 Payment Information</h3>
            <p className="text-sm">
              All payment transactions are processed by Flutterwave, a PCI-DSS compliant
              third-party payment gateway. Meshaai does <strong>not</strong> store your
              card details, bank account numbers, or CVV codes. We only retain the
              transaction reference number and payment status returned by Flutterwave.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><strong>Order Fulfilment:</strong> Processing your order, dispatching a delivery rider, and coordinating delivery to your specified address.</li>
              <li><strong>Authentication:</strong> Sending OTP verification codes via SMS to confirm your phone number and protect your account.</li>
              <li><strong>Customer Support:</strong> Responding to queries, resolving disputes, and processing refunds.</li>
              <li><strong>Service Improvement:</strong> Analysing usage patterns to improve our menu, delivery zones, and checkout experience.</li>
              <li><strong>Marketing (with consent):</strong> Sending promotional offers, new product announcements, and seasonal deals via SMS or email. You may opt out at any time.</li>
              <li><strong>Legal Compliance:</strong> Meeting our obligations under applicable Nigerian data protection laws including the Nigeria Data Protection Act 2023 (NDPA).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Legal Basis for Processing</h2>
            <p className="text-sm">
              We process your personal data on the following legal bases:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm mt-2">
              <li><strong>Contract performance:</strong> To fulfil orders you place with us.</li>
              <li><strong>Legitimate interests:</strong> To detect fraud, improve our services, and ensure platform security.</li>
              <li><strong>Consent:</strong> For marketing communications and non-essential cookies.</li>
              <li><strong>Legal obligation:</strong> To comply with applicable laws and respond to lawful requests from authorities.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Data Sharing &amp; Disclosure</h2>
            <p className="text-sm">
              We do not sell, rent, or trade your personal data. We may share your
              information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm mt-2">
              <li><strong>Delivery Riders:</strong> Your first name, phone number, and delivery address are shared with the assigned rider to complete your delivery.</li>
              <li><strong>Payment Processors:</strong> Flutterwave receives order amount and reference data to process payments.</li>
              <li><strong>Cloud Infrastructure:</strong> We use Google Cloud (europe-west1 region) for our backend infrastructure. All data is encrypted in transit and at rest.</li>
              <li><strong>Legal Requirements:</strong> We may disclose your data if required by law, court order, or governmental authority.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred to the successor entity.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Data Retention</h2>
            <p className="text-sm">
              We retain your personal data for as long as necessary to provide our
              services and fulfil the purposes outlined in this policy:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm mt-2">
              <li>Order records: 5 years (for tax and accounting compliance).</li>
              <li>Account data: Until you request deletion or after 2 years of inactivity.</li>
              <li>Session tokens (localStorage): Cleared when you sign out or after 24 hours.</li>
              <li>Server logs: 90 days.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Your Rights</h2>
            <p className="text-sm">
              Under the Nigeria Data Protection Act 2023 and applicable law, you have
              the following rights:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm mt-2">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data ("right to be forgotten").</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format.</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests or for direct marketing.</li>
              <li><strong>Withdrawal of Consent:</strong> Withdraw consent for marketing at any time without affecting previous processing.</li>
            </ul>
            <p className="text-sm mt-3">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:privacy@meshaai.com" className="text-amber-600 hover:underline font-medium">
                privacy@meshaai.com
              </a>. We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">8. Cookies &amp; Tracking</h2>
            <p className="text-sm">
              We use the following cookies and local storage mechanisms:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm mt-2">
              <li><strong>admin_token</strong> (httpOnly cookie): Secures admin sessions. Expires after 24 hours.</li>
              <li><strong>meshaai_user_v1</strong> (localStorage): Stores your name, phone, and saved address for faster future checkouts. Never transmitted without your action.</li>
              <li><strong>Analytics (future):</strong> We may implement privacy-respecting analytics tools. You will be notified before any such tools are activated.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">9. Data Security</h2>
            <p className="text-sm">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm mt-2">
              <li>TLS 1.3 encryption for all data in transit.</li>
              <li>AES-256 encryption for sensitive data at rest.</li>
              <li>JWT-based authentication with short expiry windows.</li>
              <li>Automated OTP expiry and rate limiting to prevent abuse.</li>
              <li>Role-based access control for administrative functions.</li>
            </ul>
            <p className="text-sm mt-3">
              Despite these measures, no system is 100% secure. If you discover a
              security vulnerability, please disclose it responsibly to{" "}
              <a href="mailto:security@meshaai.com" className="text-amber-600 hover:underline font-medium">
                security@meshaai.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">10. Children's Privacy</h2>
            <p className="text-sm">
              Our services are not directed at children under 13 years of age. We do
              not knowingly collect personal data from children. If you believe a child
              has provided us with personal data, contact us immediately and we will
              delete it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">11. Changes to This Policy</h2>
            <p className="text-sm">
              We may update this Privacy Policy from time to time. We will notify you
              of significant changes by updating the "Last updated" date at the top of
              this page and, where required, by sending a notification to your
              registered phone number or email. Continued use of our services after
              changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">12. Contact Us</h2>
            <p className="text-sm">
              If you have any questions, concerns, or requests regarding this Privacy
              Policy, please contact our Data Protection Officer:
            </p>
            <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm space-y-1">
              <p className="font-semibold text-slate-900">Meshaai Data Protection Officer</p>
              <p>Email: <a href="mailto:privacy@meshaai.com" className="text-amber-600 hover:underline">privacy@meshaai.com</a></p>
              <p>Address: Abuja, Nigeria</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
