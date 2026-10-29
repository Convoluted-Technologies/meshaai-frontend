"use client";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-black text-sm">
              M
            </div>
            <span className="font-black text-slate-900">Meeshaai</span>
          </a>
          <a
            href="/"
            className="text-sm text-slate-600 hover:text-slate-900 font-semibold transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Title Section */}
          <div className="bg-gradient-to-br from-red-600 to-red-700 px-6 sm:px-8 py-8 sm:py-10">
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Refund & Cancellation Policy
            </h1>
            <p className="text-red-100 text-sm sm:text-base leading-relaxed">
              Applies to all meal orders, pre-orders, and payment transactions across Meeshaai digital platforms.
            </p>
          </div>

          {/* Content */}
          <div className="px-6 sm:px-8 py-8 space-y-8">
            {/* Section 1: Overview */}
            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-red-600">1.</span> Overview & Commitment
              </h2>
              <p className="text-slate-700 leading-relaxed">
                At Meeshaai, our meals are freshly prepared to order and dispatched through dedicated logistics networks. 
                Because culinary preparation begins promptly upon order confirmation, our refund and cancellation rules are 
                structured around kitchen lifecycle milestones. This document outlines the exact, automated rules and 
                administrative discretion policies governing order cancellations, payment timeouts, partial adjustments, 
                and refund settlements.
              </p>
            </section>

            {/* Section 2: Order Lifecycle Stages */}
            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-red-600">2.</span> Order Lifecycle Stages & Refund Eligibility
              </h2>
              <p className="text-slate-700 leading-relaxed mb-4">
                Refund eligibility is determined strictly by the real-time operational status of your order:
              </p>
              
              <div className="overflow-x-auto -mx-6 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-6 sm:px-0">
                  <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                          Order Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                          Lifecycle Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                          Customer Cancellation
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                          Refund Eligibility
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                          Processing Mechanism
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white text-sm">
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900">PAID / CONFIRMED</td>
                        <td className="px-4 py-3 text-slate-700">Payment verified; order queued in kitchen queue before cooking starts.</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Allowed
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-green-700">100% Full Refund</td>
                        <td className="px-4 py-3 text-slate-600">Automatic Instant Gateway Refund</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900">SCHEDULED</td>
                        <td className="px-4 py-3 text-slate-700">Pre-order placed outside operating hours; awaiting kitchen opening release.</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Allowed
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-green-700">100% Full Refund</td>
                        <td className="px-4 py-3 text-slate-600">Automatic Instant Gateway Refund</td>
                      </tr>
                      <tr className="hover:bg-slate-50 bg-amber-50">
                        <td className="px-4 py-3 font-bold text-slate-900">PREPARING</td>
                        <td className="px-4 py-3 text-slate-700">Ingredients selected and cooking commenced in kitchen.</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            Locked
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-amber-700">Discretionary (Full or Partial)</td>
                        <td className="px-4 py-3 text-slate-600">Administrative Review & Dispatch</td>
                      </tr>
                      <tr className="hover:bg-slate-50 bg-red-50">
                        <td className="px-4 py-3 font-bold text-slate-900">OUT_FOR_DELIVERY</td>
                        <td className="px-4 py-3 text-slate-700">Meal packaged, handed to rider, and en route.</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            Locked
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-red-700">None (0% Refund)</td>
                        <td className="px-4 py-3 text-slate-600">API Refusal (422)</td>
                      </tr>
                      <tr className="hover:bg-slate-50 bg-red-50">
                        <td className="px-4 py-3 font-bold text-slate-900">DELIVERED</td>
                        <td className="px-4 py-3 text-slate-700">Order safely handed over to the customer.</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            Locked
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-red-700">None (0% Refund)</td>
                        <td className="px-4 py-3 text-slate-600">API Refusal (422)</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900">PENDING_PAYMENT</td>
                        <td className="px-4 py-3 text-slate-700">Order placed, awaiting customer payment settlement.</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Allowed
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-600">N/A (No funds collected)</td>
                        <td className="px-4 py-3 text-slate-600">Order Cancelled / Expired</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900">EXPIRED</td>
                        <td className="px-4 py-3 text-slate-700">Payment was not completed within the timeout window.</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            N/A
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-600">N/A (Automatic refund if late payment clears)</td>
                        <td className="px-4 py-3 text-slate-600">Automatic Full Refund</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Section 3: Detailed Refund Scenarios */}
            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-red-600">3.</span> Detailed Refund Scenarios
              </h2>

              {/* 3.1 */}
              <div className="mb-6 border-l-4 border-green-500 pl-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  3.1. Cancellation Before Kitchen Preparation (Automatic Full Refund)
                </h3>
                <p className="text-slate-700 mb-2">
                  <strong>When it applies:</strong> An order is in PAID, SCHEDULED (pre-order), or CONFIRMED status, 
                  and preparation has not started in the kitchen.
                </p>
                <p className="text-slate-700 mb-2">
                  <strong>Customer Action:</strong> Tap "Cancel Order" in your order status page or send a cancellation 
                  request via the API/app before status changes to PREPARING.
                </p>
                <p className="text-slate-700 mb-2">
                  <strong>System Action:</strong>
                </p>
                <ol className="list-decimal list-inside text-slate-700 space-y-1 ml-4">
                  <li>The order immediately transitions to CANCELLED.</li>
                  <li>The automated billing engine issues an immediate, full refund through our payment provider (Flutterwave).</li>
                  <li>All item costs, modifier add-ons, and delivery fees are refunded in full.</li>
                  <li>Upon settlement, your order updates to terminal status REFUNDED, and you receive a confirmation notification.</li>
                </ol>
              </div>

              {/* 3.2 */}
              <div className="mb-6 border-l-4 border-amber-500 pl-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  3.2. Orders in Preparation (PREPARING — Admin Discretion)
                </h3>
                <p className="text-slate-700 mb-2">
                  <strong>When it applies:</strong> Once a kitchen operator accepts and begins cooking your meal, 
                  ingredients are committed and customer-initiated cancellation is locked.
                </p>
                <p className="text-slate-700 mb-2">
                  <strong>Discretionary Adjustments:</strong>
                </p>
                <ul className="list-disc list-inside text-slate-700 space-y-1 ml-4">
                  <li>If a specific item or ingredient is out of stock, or if you contact support with an urgent request before completion:</li>
                  <li>An authorized operations manager can issue a partial refund (e.g., refunding the omitted item while fulfilling the rest of the meal) or a full refund.</li>
                </ul>
                <p className="text-slate-700 mt-2">
                  <strong>Rules on Partial Refunds:</strong>
                </p>
                <ul className="list-disc list-inside text-slate-700 space-y-1 ml-4">
                  <li>Any partial refund must be less than or equal to the remaining refundable balance of the order.</li>
                  <li>On a partial refund, the order remains in preparation (PREPARING) so the remainder of your meal continues cooking.</li>
                  <li>If 100% of the order total is refunded, the order transitions to REFUNDED.</li>
                </ul>
              </div>

              {/* 3.3 */}
              <div className="mb-6 border-l-4 border-red-500 pl-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  3.3. Dispatched & Delivered Orders (OUT_FOR_DELIVERY / DELIVERED — Strictly Non-Refundable)
                </h3>
                <p className="text-slate-700 mb-2">
                  <strong>When it applies:</strong> Once your meal has left the kitchen facility with a dispatch rider 
                  (OUT_FOR_DELIVERY) or has been delivered (DELIVERED).
                </p>
                <p className="text-slate-700 mb-2">
                  <strong>Policy:</strong> Strictly zero refund.
                </p>
                <p className="text-slate-700">
                  <strong>System Enforcement:</strong> The platform API rejects any refund attempt after dispatch with 
                  HTTP error 422 Unprocessable Entity (REFUND_NOT_ALLOWED_AFTER_DISPATCH). Prepared food and completed 
                  logistics services cannot be reclaimed or refunded.
                </p>
              </div>

              {/* 3.4 */}
              <div className="mb-6 border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  3.4. Payment Timeout & Abandoned Checkouts (PENDING_PAYMENT Expiry)
                </h3>
                <p className="text-slate-700 mb-2">
                  <strong>Checkout Window:</strong> When initiating checkout, an order remains in PENDING_PAYMENT for 
                  up to 15 minutes (or the active platform timeout setting).
                </p>
                <p className="text-slate-700 mb-2">
                  <strong>Expiration:</strong> If payment is not finalized within this window, the system automatically 
                  marks the order as EXPIRED and releases the kitchen slot.
                </p>
                <p className="text-slate-700">
                  <strong>Pre-Expiration Verification Safety:</strong> Before marking any order as expired, the system 
                  authoritatively verifies with Flutterwave. If your payment was completed at the last second, the order 
                  is not expired—it is confirmed and sent to the kitchen.
                </p>
              </div>

              {/* 3.5 */}
              <div className="mb-6 border-l-4 border-purple-500 pl-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  3.5. Late Payments on Expired or Cancelled Orders
                </h3>
                <p className="text-slate-700 mb-2">
                  <strong>What happens:</strong> If a network lag or bank delay causes your payment to settle after an 
                  order has already transitioned to EXPIRED or CANCELLED.
                </p>
                <p className="text-slate-700">
                  <strong>System Action:</strong> Because the order cannot be fulfilled without disrupting kitchen schedules, 
                  our automated payment handler immediately detects the mismatch and triggers an automatic 100% refund to 
                  your original payment account.
                </p>
              </div>

              {/* 3.6 */}
              <div className="mb-6 border-l-4 border-indigo-500 pl-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  3.6. Payment Reconciliation & Missed Webhooks
                </h3>
                <p className="text-slate-700 mb-2">
                  <strong>What happens:</strong> If you completed payment with your bank or card, but a mobile network 
                  disconnect or missed gateway notification prevented the order screen from refreshing.
                </p>
                <p className="text-slate-700">
                  <strong>System Action:</strong> Our automated reconciliation job scans all pending checkouts every few 
                  minutes, authoritatively re-verifying transactions directly with Flutterwave. Once verified, your order 
                  is automatically transitioned to CONFIRMED without requiring any manual intervention.
                </p>
              </div>

              {/* 3.7 */}
              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  3.7. Amount & Currency Discrepancies (Overpayment / Underpayment)
                </h3>
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  <li><strong>Exact Match:</strong> Order is confirmed immediately.</li>
                  <li><strong>Overpayment:</strong> The order is confirmed and scheduled for preparation. The excess amount is flagged for administrative review and refund back to the customer.</li>
                  <li><strong>Underpayment / Currency Mismatch:</strong> The transaction is marked as MISMATCH. The order is not sent to the kitchen until the shortfall is resolved or refunded by operations.</li>
                </ul>
              </div>
            </section>

            {/* Section 4: Refund Methods */}
            <section>
              <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-red-600">4.</span> Refund Methods & Settlement Timelines
              </h2>
              
              <div className="overflow-x-auto -mx-6 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-6 sm:px-0">
                  <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                          Payment Method
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                          Refund Destination
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                          Expected Settlement Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white text-sm">
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">Debit / Credit Card<br/>(Mastercard, Visa, Verve)</td>
                        <td className="px-4 py-3 text-slate-700">Original bank card account</td>
                        <td className="px-4 py-3 text-slate-700">1 to 5 business days (governed by your card issuer)</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">Bank Transfer / Virtual Account</td>
                        <td className="px-4 py-3 text-slate-700">Source bank account</td>
                        <td className="px-4 py-3 text-slate-700">Instant to 24 hours</td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-900">Mobile Money / USSD</td>
                        <td className="px-4 py-3 text-slate-700">Original mobile money / USSD wallet</td>
                        <td className="px-4 py-3 text-slate-700">Instant to a few hours</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-slate-700 mt-4 leading-relaxed">
                All refunds are credited in the exact currency and minor units in which the payment was originally 
                settled (e.g., Nigerian Naira - NGN). Currency conversion spreads applied by your card issuer are 
                determined by your bank.
              </p>
            </section>

            {/* Section 5: Idempotency */}
            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-red-600">5.</span> Idempotency & Customer Protection
              </h2>
              <ul className="space-y-3 text-slate-700">
                <li>
                  <strong className="text-slate-900">No Double Charges / Double Deductions:</strong> All refund operations 
                  utilize unique idempotency keys (order_code + request_key). Re-clicking or retrying a request will never 
                  execute duplicate deductions or cause conflicting refund claims.
                </li>
                <li>
                  <strong className="text-slate-900">Audit Traceability:</strong> Every refund creates an immutable audit 
                  record containing the gateway reference ID, date/time, administrator or automated actor, and failure/success log.
                </li>
                <li>
                  <strong className="text-slate-900">Failure Escalation:</strong> If a gateway outage occurs during refund 
                  processing, the refund is marked FAILED and an immediate high-priority operational alert is dispatched to 
                  our engineering and support leads for manual clearing.
                </li>
              </ul>
            </section>

            {/* Section 6: Support */}
            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3 flex items-center gap-2">
                <span className="text-red-600">6.</span> How to Request Support or Inquire About a Refund
              </h2>
              <p className="text-slate-700 mb-4">
                If you have questions regarding an existing order or believe an error occurred:
              </p>
              <div className="bg-slate-100 rounded-lg p-5 space-y-3">
                <div>
                  <p className="font-bold text-slate-900 mb-1">1. In-App Tracking:</p>
                  <p className="text-slate-700">
                    Visit <code className="bg-white px-2 py-1 rounded text-sm font-mono border border-slate-300">
                    https://meeshaai.com/orders/{"{orderCode}"}/status
                    </code> to inspect your real-time payment status and cancellation options.
                  </p>
                </div>
                <div>
                  <p className="font-bold text-slate-900 mb-1">2. Support Contact:</p>
                  <p className="text-slate-700 mb-2">
                    Reach our Operations Support Team with your unique Order Code (e.g., K3F9A):
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-700">Email:</span>
                    <a 
                      href="mailto:support@meeshaai.com" 
                      className="text-red-600 hover:text-red-700 font-semibold underline"
                    >
                      support@meeshaai.com
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Footer Note */}
          <div className="bg-slate-100 px-6 sm:px-8 py-6 border-t border-slate-200">
            <p className="text-sm text-slate-600 text-center">
              Last Updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
            <p className="text-xs text-slate-500 text-center mt-2">
              This policy is effective immediately and applies to all orders placed on the Meeshaai platform.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
