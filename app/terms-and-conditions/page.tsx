"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function TermsAndConditionsPage() {
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
            📋
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Last updated: October 20, 2026 &nbsp;·&nbsp; Effective: October 20, 2026
          </p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Agreement to Terms</h2>
            <p>
              These Terms &amp; Conditions ("Terms") govern your use of the Meeshaai
              platform, including the website, mobile web app, and all related services
              (collectively, the "Service"). By accessing or using the Service, placing
              an order, or creating an account, you confirm that you have read,
              understood, and agree to be bound by these Terms.
            </p>
            <p className="mt-3">
              If you are using the Service on behalf of a business or organisation, you
              represent that you have the authority to bind that entity to these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. About Meeshaai</h2>
            <p>
              Meeshaai is a gourmet meal delivery platform specialising in freshly
              prepared bread, egg, and sausage preset meals. We connect customers with
              our kitchen facilities and dispatch riders for last-mile delivery within
              our operational zones in Abuja, Nigeria.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Eligibility</h2>
            <ul className="list-disc list-inside space-y-1.5 text-sm">
              <li>You must be at least 13 years of age to use the Service.</li>
              <li>You must provide accurate, complete, and current information when placing orders.</li>
              <li>You must be located within our active delivery zone at the time of ordering.</li>
              <li>You must have a valid Nigerian phone number capable of receiving SMS for OTP verification.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Orders &amp; Pricing</h2>
            <h3 className="text-base font-semibold text-slate-800 mb-2">4.1 Order Placement</h3>
            <p className="text-sm">
              When you place an order through Meeshaai, you are making an offer to
              purchase the selected items at the displayed price plus applicable delivery
              fees. Your order is confirmed when you receive a confirmation notification
              and your payment is successfully processed.
            </p>

            <h3 className="text-base font-semibold text-slate-800 mb-2 mt-4">4.2 Pricing</h3>
            <ul className="list-disc list-inside space-y-1.5 text-sm">
              <li>All prices are displayed in Nigerian Naira (₦) and include VAT where applicable.</li>
              <li>Delivery fees are calculated based on your delivery location and displayed before payment.</li>
              <li>Prices are subject to change without notice. The price shown at checkout is the price you pay.</li>
              <li>Promotional prices are valid only for the stated period and cannot be combined with other offers unless explicitly stated.</li>
            </ul>

            <h3 className="text-base font-semibold text-slate-800 mb-2 mt-4">4.3 Order Accuracy</h3>
            <p className="text-sm">
              You are responsible for reviewing your order details before submitting
              payment. Meeshaai is not liable for errors resulting from incorrect
              information provided by you, including wrong delivery addresses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Payment</h2>
            <p className="text-sm">
              All payments are processed securely through Flutterwave. By placing an
              order, you authorise Meeshaai to charge your selected payment method for
              the total order amount including delivery fees.
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-sm mt-2">
              <li>Accepted payment methods include debit/credit cards, bank transfers, and USSD as supported by Flutterwave.</li>
              <li>Payment must be completed before your order enters preparation.</li>
              <li>Failed payments will result in your order being automatically cancelled.</li>
              <li>Meeshaai does not store card details. All card data is handled by Flutterwave under PCI-DSS standards.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Delivery</h2>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><strong>Delivery Zones:</strong> We currently deliver within designated areas of Abuja. You can verify your location's eligibility during checkout.</li>
              <li><strong>Estimated Times:</strong> Delivery estimates (typically 15–45 minutes) are provided in good faith but are not guarantees. Times may vary due to traffic, weather, or high demand.</li>
              <li><strong>Failed Delivery:</strong> If delivery fails because you are unavailable or provided an incorrect address, re-delivery may incur an additional fee.</li>
              <li><strong>Risk Transfer:</strong> Risk of damage or loss passes to you upon delivery to the specified address.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">7. Cancellations &amp; Refunds</h2>
            <h3 className="text-base font-semibold text-slate-800 mb-2">7.1 Customer Cancellations</h3>
            <p className="text-sm">
              You may cancel your order within 2 minutes of placement before
              preparation begins. Once an order enters "CONFIRMED" or "PREPARING"
              status, cancellation is not possible.
            </p>

            <h3 className="text-base font-semibold text-slate-800 mb-2 mt-4">7.2 Refunds</h3>
            <ul className="list-disc list-inside space-y-1.5 text-sm">
              <li>Refunds are issued for orders where we are unable to fulfil delivery, items are incorrect, or food quality is significantly below standard.</li>
              <li>Refund requests must be made within 24 hours of the order delivery time via our support channels.</li>
              <li>Approved refunds are processed through Flutterwave and typically reflect in your account within 3–7 business days.</li>
              <li>We reserve the right to issue refunds as account credits at our discretion.</li>
            </ul>

            <h3 className="text-base font-semibold text-slate-800 mb-2 mt-4">7.3 No Refund Situations</h3>
            <p className="text-sm">
              Refunds will not be issued where you provided an incorrect delivery address,
              were unavailable to receive the order, or changed your mind after
              preparation commenced.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">8. User Conduct</h2>
            <p className="text-sm">You agree not to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-sm mt-2">
              <li>Place fraudulent, false, or bad-faith orders.</li>
              <li>Use the Service to harass, threaten, or abuse our staff or delivery riders.</li>
              <li>Attempt to circumvent OTP verification or security measures.</li>
              <li>Use automated scripts, bots, or scrapers on our platform.</li>
              <li>Impersonate another person or entity when placing orders.</li>
              <li>Use the Service in violation of any applicable laws or regulations.</li>
            </ul>
            <p className="text-sm mt-3">
              Violation of these rules may result in immediate suspension or permanent
              blocking of your phone number from the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">9. Intellectual Property</h2>
            <p className="text-sm">
              All content on the Meeshaai platform — including the name, logo, menu
              descriptions, photographs, and UI design — is the exclusive property of
              Meeshaai or its licensors and is protected by copyright and trademark law.
              You may not reproduce, distribute, or create derivative works without
              our express written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">10. Limitation of Liability</h2>
            <p className="text-sm">
              To the maximum extent permitted by applicable law, Meeshaai's total
              liability to you for any claim arising from these Terms or use of the
              Service shall not exceed the amount you paid for the specific order giving
              rise to the claim.
            </p>
            <p className="text-sm mt-3">
              Meeshaai is not liable for indirect, incidental, special, consequential, or
              punitive damages, including loss of profits, data, goodwill, or business
              opportunities, even if we have been advised of the possibility of such
              damages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">11. Indemnification</h2>
            <p className="text-sm">
              You agree to indemnify, defend, and hold harmless Meeshaai and its
              officers, directors, employees, and agents from any claims, damages,
              losses, or expenses (including reasonable legal fees) arising from your
              use of the Service, violation of these Terms, or infringement of any
              third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">12. Governing Law &amp; Disputes</h2>
            <p className="text-sm">
              These Terms are governed by and construed in accordance with the laws of
              the Federal Republic of Nigeria. Any disputes arising under these Terms
              shall be subject to the exclusive jurisdiction of the courts of Abuja,
              Nigeria.
            </p>
            <p className="text-sm mt-3">
              Before initiating formal proceedings, we encourage you to contact us at{" "}
              <a href="mailto:support@Meeshaai.com" className="text-amber-600 hover:underline font-medium">
                support@Meeshaai.com
              </a>{" "}
              to seek an amicable resolution.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">13. Changes to Terms</h2>
            <p className="text-sm">
              We reserve the right to modify these Terms at any time. Changes take
              effect upon posting with an updated "Last updated" date. Your continued
              use of the Service following any changes constitutes your acceptance of
              the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">14. Contact</h2>
            <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm space-y-1">
              <p className="font-semibold text-slate-900">Meeshaai Customer Support</p>
              <p>Email: <a href="mailto:support@Meeshaai.com" className="text-amber-600 hover:underline">support@Meeshaai.com</a></p>
              <p>Address: Abuja, Nigeria</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
