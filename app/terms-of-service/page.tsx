"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mt-4 mb-10 inset-x-0 z-5 pointer-events-auto">
        <Navbar />
      </div>

      <div className="max-w-3xl mx-auto px-6 pb-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          ← Back to Home
        </Link>

        <div className="mb-10">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl mb-4">
            📄
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Last updated: October 20, 2026 &nbsp;·&nbsp; Effective: October 20, 2026
          </p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Service Description</h2>
            <p>
              Meshaai provides an on-demand food ordering and delivery platform that
              enables customers to browse our curated menu of gourmet bread, egg, and
              sausage meals, customise their order with optional extras, and receive
              delivery to their specified location within our active delivery zones.
            </p>
            <p className="mt-3">
              These Terms of Service ("ToS") define the rules, obligations, and
              expectations that apply to your use of the Meshaai platform. They
              complement our{" "}
              <Link href="/terms-and-conditions" className="text-amber-600 hover:underline font-medium">
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="text-amber-600 hover:underline font-medium">
                Privacy Policy
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Account &amp; Authentication</h2>
            <h3 className="text-base font-semibold text-slate-800 mb-2">2.1 Guest Ordering</h3>
            <p className="text-sm">
              You may place orders as a guest using only your phone number, which is
              verified via a one-time password (OTP). Guest users' details are saved
              locally in your browser to speed up future orders.
            </p>

            <h3 className="text-base font-semibold text-slate-800 mb-2 mt-4">2.2 Registered Accounts</h3>
            <p className="text-sm">
              Optionally, you may register a full account with your name, phone, email,
              and password. Registration enables order history, faster checkout, and
              account-level features. You are responsible for maintaining the
              confidentiality of your password and for all activities that occur under
              your account.
            </p>

            <h3 className="text-base font-semibold text-slate-800 mb-2 mt-4">2.3 Account Termination</h3>
            <p className="text-sm">
              We reserve the right to suspend or terminate your account without notice
              if you violate these Terms, engage in fraudulent activity, abuse our
              staff, or misuse the platform in any way.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. OTP Verification</h2>
            <p className="text-sm">
              Phone verification via OTP is required for:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm mt-2">
              <li>First-time orders as a guest.</li>
              <li>New account registration.</li>
              <li>Account recovery or sensitive account changes.</li>
            </ul>
            <p className="text-sm mt-3">
              Returning customers with a valid saved session are exempt from OTP
              re-verification for standard orders. OTP codes expire after 10 minutes
              and can only be used once. After 5 failed attempts, your number will be
              temporarily locked for 15 minutes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Menu &amp; Product Availability</h2>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Menu items and extras are subject to availability. Items marked "Sold Out" cannot be ordered until restocked.</li>
              <li>Menu prices, components, and descriptions may change without prior notice.</li>
              <li>Photographs on the platform are representative and may differ slightly from the delivered product.</li>
              <li>We may temporarily or permanently discontinue any menu item at our discretion.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Ordering Hours</h2>
            <p className="text-sm">
              Orders can be placed during our operating hours, which are displayed on
              the platform. Ordering may be temporarily paused due to:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm mt-2">
              <li>Kitchen maintenance or restocking.</li>
              <li>Extreme weather or unforeseen circumstances.</li>
              <li>Scheduled downtime (notified in advance where possible).</li>
            </ul>
            <p className="text-sm mt-3">
              Meshaai is not liable for any loss arising from inability to place an
              order during paused periods.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Delivery Riders</h2>
            <p className="text-sm">
              Our dispatch riders are independent contractors or employees of Meshaai
              Logistics. By placing an order, you consent to your contact details and
              delivery address being shared with the assigned rider for the purpose of
              completing your delivery.
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm mt-2">
              <li>Riders will attempt to contact you by phone upon arrival.</li>
              <li>You must be available to receive the order at the specified address.</li>
              <li>Rider re-dispatch after a failed delivery attempt may incur an additional fee.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Food Safety &amp; Quality</h2>
            <p className="text-sm">
              Meshaai is committed to food safety and prepares all meals fresh to order.
              We operate in compliance with Lagos State food safety regulations.
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm mt-2">
              <li>All orders are prepared in our registered kitchen facilities.</li>
              <li>Meals are packaged in food-safe, tamper-evident containers.</li>
              <li>Consume delivered food promptly. Meshaai is not responsible for food quality degradation due to delayed consumption after delivery.</li>
              <li>If you have food allergies, please contact us before ordering. We cannot guarantee a fully allergen-free environment.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">8. Platform Availability</h2>
            <p className="text-sm">
              We aim to maintain 99.5% platform uptime but do not guarantee
              uninterrupted access to our services. Scheduled and unscheduled
              maintenance windows may cause temporary unavailability.
            </p>
            <p className="text-sm mt-3">
              The platform is provided "as is" without warranties of any kind, express
              or implied, including but not limited to warranties of merchantability,
              fitness for a particular purpose, or non-infringement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">9. Third-Party Services</h2>
            <p className="text-sm">
              Our platform integrates with the following third-party services:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm mt-2">
              <li><strong>Flutterwave</strong> — payment processing. Subject to Flutterwave's own terms of service.</li>
              <li><strong>Google Cloud</strong> — backend infrastructure hosting. All data remains under our custody and control.</li>
              <li><strong>SMS Gateway</strong> — delivery of OTP codes. Message and data rates from your carrier may apply.</li>
            </ul>
            <p className="text-sm mt-3">
              Meshaai is not responsible for the actions, policies, or availability of
              these third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">10. Feedback &amp; Reviews</h2>
            <p className="text-sm">
              Any feedback, suggestions, or ideas you share with us become the property
              of Meshaai. We may use them to improve our services without obligation to
              compensate you.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">11. Entire Agreement</h2>
            <p className="text-sm">
              These Terms of Service, together with our{" "}
              <Link href="/terms-and-conditions" className="text-amber-600 hover:underline font-medium">
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="text-amber-600 hover:underline font-medium">
                Privacy Policy
              </Link>
              , constitute the entire agreement between you and Meshaai with respect to
              your use of the Service and supersede all prior discussions and agreements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">12. Contact</h2>
            <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm space-y-1">
              <p className="font-semibold text-slate-900">Meshaai Customer Support</p>
              <p>Email: <a href="mailto:support@meshaai.com" className="text-amber-600 hover:underline">support@meshaai.com</a></p>
              <p>Address: Lagos, Nigeria</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
