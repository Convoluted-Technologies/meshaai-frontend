"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

type FeedbackType = "general" | "complaint" | "suggestion" | "compliment";

export default function FeedbackPage() {
  const [type, setType] = useState<FeedbackType>("general");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const feedbackTypes = [
    { value: "general", label: "General Inquiry", icon: "💬", color: "blue" },
    { value: "complaint", label: "Complaint", icon: "⚠️", color: "red" },
    { value: "suggestion", label: "Suggestion", icon: "💡", color: "amber" },
    { value: "compliment", label: "Compliment", icon: "⭐", color: "green" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!name || !message) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!email && !phone) {
      setError("Please provide either an email or phone number.");
      return;
    }

    setSubmitting(true);

    try {
      // Simulate API call - replace with actual endpoint
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // TODO: Replace with actual API call
      // const response = await fetch('/api/feedback', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ type, name, email, phone, orderCode, subject, message }),
      // });

      setSuccess(true);
      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setOrderCode("");
      setSubject("");
      setMessage("");
      setType("general");

      // Scroll to success message
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message || "Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <div className="mt-4 mb-8 inset-x-0 z-5 pointer-events-auto">
        <Navbar />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 via-amber-500 to-orange-500 text-3xl shadow-lg shadow-red-600/30">
            📣
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900">
            We'd Love to Hear from You
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Your feedback helps us improve and serve you better. Whether it's a
            question, suggestion, or compliment — we're all ears!
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="glass-panel p-6 border-2 border-green-300 bg-green-50 text-center space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="text-5xl">✅</div>
            <h3 className="text-xl font-bold text-green-900">
              Feedback Received!
            </h3>
            <p className="text-green-700">
              Thank you for reaching out. We'll get back to you within 24-48
              hours.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="glass-panel p-4 border-2 border-red-300 bg-red-50 text-center">
            <p className="text-red-700 font-semibold">⚠️ {error}</p>
          </div>
        )}

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-5 text-center space-y-2 border-2 border-transparent hover:border-red-200 transition-all">
            <div className="text-3xl">📧</div>
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Email Us
            </p>
            <a
              href="mailto:support@meshaai.com"
              className="text-sm font-bold text-red-600 hover:text-red-700 block"
            >
              support@meshaai.com
            </a>
          </div>
          <div className="glass-panel p-5 text-center space-y-2 border-2 border-transparent hover:border-red-200 transition-all">
            <div className="text-3xl">📱</div>
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Call Us
            </p>
            <a
              href="tel:+2348012345678"
              className="text-sm font-bold text-red-600 hover:text-red-700 block"
            >
              +234 801 234 5678
            </a>
          </div>
          <div className="glass-panel p-5 text-center space-y-2 border-2 border-transparent hover:border-red-200 transition-all">
            <div className="text-3xl">⏰</div>
            <p className="text-xs font-semibold text-slate-500 uppercase">
              Response Time
            </p>
            <p className="text-sm font-bold text-slate-700">
              24-48 hours
            </p>
          </div>
        </div>

        {/* Feedback Form */}
        <form onSubmit={handleSubmit} className="glass-panel p-6 sm:p-8 space-y-6">
          {/* Feedback Type */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700">
              Feedback Type <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {feedbackTypes.map((ft) => (
                <button
                  key={ft.value}
                  type="button"
                  onClick={() => setType(ft.value as FeedbackType)}
                  className={`p-4 rounded-xl border-2 font-semibold text-sm transition-all ${
                    type === ft.value
                      ? "border-red-500 bg-red-50 text-red-700 shadow-lg"
                      : "border-slate-200 text-slate-700 hover:border-red-300"
                  }`}
                >
                  <div className="text-2xl mb-1">{ft.icon}</div>
                  {ft.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-bold text-slate-700">
              Your Name <span className="text-red-600">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-red-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-bold text-slate-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-bold text-slate-700">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08012345678"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-red-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <p className="text-xs text-slate-500 -mt-3">
            * Please provide at least one contact method (email or phone)
          </p>

          {/* Order Code (Optional) */}
          <div className="space-y-2">
            <label htmlFor="orderCode" className="block text-sm font-bold text-slate-700">
              Order Code (Optional)
            </label>
            <input
              id="orderCode"
              type="text"
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value.toUpperCase())}
              placeholder="MSH-ABC123"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-red-500 focus:outline-none transition-colors uppercase font-mono"
            />
            <p className="text-xs text-slate-500">
              If your feedback relates to a specific order, please provide the order code.
            </p>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label htmlFor="subject" className="block text-sm font-bold text-slate-700">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your feedback"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-red-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label htmlFor="message" className="block text-sm font-bold text-slate-700">
              Your Message <span className="text-red-600">*</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what's on your mind..."
              required
              rows={6}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-red-500 focus:outline-none transition-colors resize-none"
            />
            <p className="text-xs text-slate-500">
              {message.length}/1000 characters
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-crimson py-4 rounded-xl font-bold text-lg shadow-lg shadow-red-600/30 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                Submitting...
              </span>
            ) : (
              "Submit Feedback"
            )}
          </button>
        </form>

        {/* Additional Info */}
        <div className="glass-panel p-6 border-2 border-amber-200 bg-amber-50/50 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900">Quick Tips</h3>
              <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
                <li>Be specific and detailed to help us understand better</li>
                <li>Include your order code if your feedback relates to an order</li>
                <li>Check your spam folder if you don't receive our reply</li>
                <li>For urgent matters, please call us directly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
