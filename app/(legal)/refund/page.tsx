import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
        <p className="text-zinc-400 mb-8">Last updated: January 3, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Our Commitment</h2>
            <p className="text-zinc-300 leading-relaxed">
              We want you to be completely satisfied with our AI Chatbot service. If you're not happy with your purchase, we're here to help. This Refund Policy outlines the terms and conditions for requesting a refund.
            </p>
          </section>

          {/* Refund Eligibility */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Refund Eligibility</h2>
            
            <div className="grid md:grid-cols-2 gap-6 my-6">
              {/* Eligible */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="text-green-400" size={24} />
                  <h3 className="text-xl font-semibold text-green-400">Eligible for Refund</h3>
                </div>
                <ul className="space-y-3 text-zinc-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={16} />
                    <span>Within 14 days of purchase</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={16} />
                    <span>Technical issues preventing service use</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={16} />
                    <span>Service not as described</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={16} />
                    <span>Duplicate charges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={16} />
                    <span>Unauthorized charges</span>
                  </li>
                </ul>
              </div>

              {/* Not Eligible */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="text-red-400" size={24} />
                  <h3 className="text-xl font-semibold text-red-400">Not Eligible for Refund</h3>
                </div>
                <ul className="space-y-3 text-zinc-300">
                  <li className="flex items-start gap-2">
                    <XCircle className="text-red-400 flex-shrink-0 mt-1" size={16} />
                    <span>After 14 days from purchase</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="text-red-400 flex-shrink-0 mt-1" size={16} />
                    <span>Violation of Terms of Service</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="text-red-400 flex-shrink-0 mt-1" size={16} />
                    <span>Excessive usage before refund request</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="text-red-400 flex-shrink-0 mt-1" size={16} />
                    <span>Change of mind after extensive use</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="text-red-400 flex-shrink-0 mt-1" size={16} />
                    <span>Promotional or discounted subscriptions</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Refund Process */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How to Request a Refund</h2>
            
            <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 text-white font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Contact Support</h3>
                  <p className="text-zinc-300">
                    Email us at <a href="mailto:refunds@example.com" className="text-indigo-400 hover:text-indigo-300 underline">refunds@example.com</a> with your request
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 text-white font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Provide Information</h3>
                  <p className="text-zinc-300 mb-2">Include the following in your email:</p>
                  <ul className="list-disc list-inside text-zinc-300 space-y-1 ml-4">
                    <li>Your account email address</li>
                    <li>Order/Transaction ID</li>
                    <li>Reason for refund request</li>
                    <li>Any relevant screenshots or details</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 text-white font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Review Process</h3>
                  <p className="text-zinc-300">
                    We'll review your request within 2-3 business days and respond via email
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 text-white font-bold">
                  4
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Refund Processing</h3>
                  <p className="text-zinc-300">
                    If approved, refunds are processed within 5-10 business days to your original payment method
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Processing Time */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Refund Processing Time</h2>
            
            <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="text-indigo-400" size={24} />
                <h3 className="text-xl font-semibold">Expected Timeline</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-zinc-300">Request Review</span>
                  <span className="text-indigo-400 font-semibold">2-3 business days</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <span className="text-zinc-300">Refund Processing</span>
                  <span className="text-indigo-400 font-semibold">5-10 business days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300">Bank/Card Processing</span>
                  <span className="text-indigo-400 font-semibold">3-5 business days</span>
                </div>
              </div>

              <p className="text-zinc-400 text-sm mt-4">
                * Total time may vary depending on your payment provider
              </p>
            </div>
          </section>

          {/* Partial Refunds */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Partial Refunds</h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              In certain situations, we may offer partial refunds:
            </p>
            <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
              <li>Pro-rated refunds for annual subscriptions (based on unused months)</li>
              <li>Service interruptions or downtime exceeding our SLA</li>
              <li>Billing errors or overcharges</li>
            </ul>
            <p className="text-zinc-300 leading-relaxed mt-4">
              Partial refunds are calculated based on the unused portion of your subscription period.
            </p>
          </section>

          {/* Subscription Cancellations */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Subscription Cancellations</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-indigo-400">6.1 Monthly Subscriptions</h3>
            <p className="text-zinc-300 leading-relaxed mb-4">
              You can cancel your monthly subscription at any time. You'll continue to have access until the end of your current billing period. No refunds are provided for partial months.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-indigo-400">6.2 Annual Subscriptions</h3>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Annual subscriptions may be eligible for pro-rated refunds if canceled within the first 14 days. After 14 days, you'll retain access until the end of your subscription period, but no refund will be issued.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-indigo-400">6.3 How to Cancel</h3>
            <p className="text-zinc-300 leading-relaxed">
              To cancel your subscription:
            </p>
            <ol className="list-decimal list-inside text-zinc-300 space-y-2 ml-4">
              <li>Log in to your account</li>
              <li>Go to Settings → Subscription</li>
              <li>Click "Cancel Subscription"</li>
              <li>Confirm your cancellation</li>
            </ol>
          </section>

          {/* Special Cases */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Special Cases</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-indigo-400">7.1 Technical Issues</h3>
            <p className="text-zinc-300 leading-relaxed mb-4">
              If you experience technical issues preventing you from using the service, please contact support first. We'll work to resolve the issue. If we cannot resolve it within a reasonable timeframe, you may be eligible for a full refund.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-indigo-400">7.2 Unauthorized Charges</h3>
            <p className="text-zinc-300 leading-relaxed mb-4">
              If you notice unauthorized charges on your account, contact us immediately at <a href="mailto:security@example.com" className="text-indigo-400 hover:text-indigo-300 underline">security@example.com</a>. We'll investigate and process a full refund if the charges are confirmed as unauthorized.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-indigo-400">7.3 Service Changes</h3>
            <p className="text-zinc-300 leading-relaxed">
              If we make significant changes to the service that materially affect your subscription, you may request a pro-rated refund within 30 days of the change notification.
            </p>
          </section>

          {/* Exceptions */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Exceptions and Limitations</h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              The following are not eligible for refunds:
            </p>
            <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
              <li>Free trial conversions (you can cancel before being charged)</li>
              <li>Promotional offers or lifetime deals</li>
              <li>Add-on features or one-time purchases after 7 days</li>
              <li>Accounts terminated for Terms of Service violations</li>
              <li>Refund requests made in bad faith or with fraudulent intent</li>
            </ul>
          </section>

          {/* Chargebacks */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Chargebacks</h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              We encourage you to contact us directly before initiating a chargeback with your bank or credit card company. Chargebacks can result in:
            </p>
            <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
              <li>Immediate account suspension</li>
              <li>Loss of access to your data</li>
              <li>Additional fees to cover chargeback costs</li>
              <li>Permanent ban from our service</li>
            </ul>
            <p className="text-zinc-300 leading-relaxed mt-4">
              Most issues can be resolved quickly through our support team without the need for a chargeback.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
            <p className="text-zinc-300 leading-relaxed">
              We reserve the right to modify this Refund Policy at any time. Changes will be effective immediately upon posting. Your continued use of the service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              For refund requests or questions about this policy, please contact us:
            </p>
            <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6">
              <p className="text-zinc-300 mb-2">
                <strong>Refund Requests:</strong> <a href="mailto:refunds@example.com" className="text-indigo-400 hover:text-indigo-300 underline">refunds@example.com</a>
              </p>
              <p className="text-zinc-300 mb-2">
                <strong>General Support:</strong> <a href="mailto:support@example.com" className="text-indigo-400 hover:text-indigo-300 underline">support@example.com</a>
              </p>
              <p className="text-zinc-300">
                <strong>Address:</strong> [Your Company Address]
              </p>
            </div>
          </section>

          {/* Satisfaction Guarantee */}
          <section className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">Our Satisfaction Guarantee</h2>
            <p className="text-zinc-300 leading-relaxed max-w-2xl mx-auto">
              We're committed to providing excellent service. If you're not satisfied within the first 14 days, we'll work with you to make it right or provide a full refund. Your satisfaction is our priority.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
