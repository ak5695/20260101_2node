import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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

        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-zinc-400 mb-8">Last updated: January 3, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p className="text-zinc-300 leading-relaxed">
              By accessing or using 2node ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.
            </p>
          </section>

          {/* Use of Service */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Use of Service</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-zinc-200">2.1 Eligibility</h3>
            <p className="text-zinc-300 leading-relaxed mb-4">
              You must be at least 13 years old to use this Service. By using the Service, you represent and warrant that you meet this age requirement.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-zinc-200">2.2 Account Registration</h3>
            <p className="text-zinc-300 leading-relaxed mb-4">
              To access certain features, you may need to create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-zinc-200">2.3 Guest Access</h3>
            <p className="text-zinc-300 leading-relaxed">
              We offer guest access with limited features. Guest data is automatically deleted after 24 hours of inactivity. We are not responsible for any data loss from guest accounts.
            </p>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Acceptable Use Policy</h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit harmful, offensive, or illegal content</li>
              <li>Harass, abuse, or harm others</li>
              <li>Distribute spam or malware</li>
              <li>Attempt to gain unauthorized access to systems</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Use automated systems (bots) without permission</li>
              <li>Impersonate others or misrepresent your affiliation</li>
              <li>Collect user information without consent</li>
            </ul>
          </section>

          {/* Content */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-zinc-200">4.1 Your Content</h3>
            <p className="text-zinc-300 leading-relaxed mb-4">
              You retain ownership of any content you submit to the Service ("User Content"). By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display your content solely for the purpose of providing and improving the Service.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-zinc-200">4.2 Content Responsibility</h3>
            <p className="text-zinc-300 leading-relaxed mb-4">
              You are solely responsible for your User Content. You represent and warrant that:
            </p>
            <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
              <li>You own or have the necessary rights to your content</li>
              <li>Your content does not violate any laws or third-party rights</li>
              <li>Your content does not contain malicious code</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-zinc-200">4.3 AI-Generated Content</h3>
            <p className="text-zinc-300 leading-relaxed">
              Content generated by our AI is provided "as is" without warranties. You are responsible for reviewing and verifying AI-generated content before use. We do not guarantee the accuracy, completeness, or reliability of AI responses.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              The Service and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p className="text-zinc-300 leading-relaxed">
              You may not copy, modify, distribute, sell, or lease any part of our Service without our express written permission.
            </p>
          </section>

          {/* Subscriptions */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Subscriptions and Payments</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-zinc-200">6.1 Billing</h3>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Some features require a paid subscription. By purchasing a subscription, you agree to pay all fees associated with your chosen plan.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-zinc-200">6.2 Automatic Renewal</h3>
            <p className="text-zinc-300 leading-relaxed mb-4">
              Subscriptions automatically renew unless you cancel before the renewal date. You will be charged at the then-current rate.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-zinc-200">6.3 Cancellation</h3>
            <p className="text-zinc-300 leading-relaxed mb-4">
              You may cancel your subscription at any time through your account settings. Cancellation will take effect at the end of the current billing period.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-zinc-200">6.4 Refunds</h3>
            <p className="text-zinc-300 leading-relaxed">
              Please refer to our <Link href="/refund" className="text-zinc-200 hover:text-white underline">Refund Policy</Link> for information about refunds.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Termination</h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including:
            </p>
            <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
              <li>Breach of these Terms</li>
              <li>Violation of our Acceptable Use Policy</li>
              <li>Fraudulent or illegal activity</li>
              <li>Upon your request</li>
            </ul>
            <p className="text-zinc-300 leading-relaxed mt-4">
              Upon termination, your right to use the Service will immediately cease. We are not liable for any loss resulting from termination.
            </p>
          </section>

          {/* Disclaimers */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Disclaimers</h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
              <li>Merchantability and fitness for a particular purpose</li>
              <li>Non-infringement</li>
              <li>Accuracy, reliability, or completeness of content</li>
              <li>Uninterrupted or error-free operation</li>
              <li>Security of data transmission</li>
            </ul>
            <p className="text-zinc-300 leading-relaxed mt-4">
              We do not warrant that the Service will meet your requirements or that defects will be corrected.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING:
            </p>
            <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
              <li>Loss of profits, data, or goodwill</li>
              <li>Service interruption</li>
              <li>Computer damage or system failure</li>
              <li>Cost of substitute services</li>
            </ul>
            <p className="text-zinc-300 leading-relaxed mt-4">
              Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
            <p className="text-zinc-300 leading-relaxed">
              You agree to indemnify and hold us harmless from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc list-inside text-zinc-300 space-y-2 ml-4">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Your User Content</li>
            </ul>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
            <p className="text-zinc-300 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions. Any disputes shall be resolved in the courts of [Your Jurisdiction].
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
            <p className="text-zinc-300 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the new Terms on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
            <p className="text-zinc-300 leading-relaxed mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-6">
              <p className="text-zinc-300">Email: ji569514123@gmail.com</p>
              <p className="text-zinc-300">Official Website: <a href="https://dufran.CN" target="_blank" rel="noopener noreferrer" className="text-zinc-200 hover:text-white underline">dufran.CN</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
