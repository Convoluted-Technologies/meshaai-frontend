"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // Ordering & Menu
  {
    category: "Ordering & Menu",
    question: "What meals do you offer?",
    answer: "We specialize in gourmet roadside-inspired bread and egg meals. Our menu features preset meal combinations with freshly fried eggs, artisan bread, and grilled sausages. You can customize your meal with various extras and toppings.",
  },
  {
    category: "Ordering & Menu",
    question: "How do I place an order?",
    answer: "Simply browse our menu on the homepage, add items to your cart, provide your delivery location, and proceed to checkout. You'll receive payment instructions and order confirmation immediately.",
  },
  {
    category: "Ordering & Menu",
    question: "Can I customize my meal?",
    answer: "Yes! Each preset meal can be customized with extras like additional eggs, cheese, vegetables, or premium sausages. Just select your preferred extras when adding items to your cart.",
  },
  {
    category: "Ordering & Menu",
    question: "What are your operating hours?",
    answer: "We operate from 7:00 AM to 10:00 PM daily. Orders placed outside these hours will be processed when we reopen.",
  },
  
  // Delivery
  {
    category: "Delivery",
    question: "What areas do you deliver to?",
    answer: "We currently deliver within Abuja and surrounding areas. Enter your delivery address during checkout to check if we service your location. We're constantly expanding our delivery zones!",
  },
  {
    category: "Delivery",
    question: "How long does delivery take?",
    answer: "Most deliveries arrive within 30-45 minutes from order confirmation. Delivery time may vary based on your location, traffic conditions, and order volume. You'll receive updates via SMS.",
  },
  {
    category: "Delivery",
    question: "What is the delivery fee?",
    answer: "Delivery fees are calculated based on your distance from our kitchen. You'll see the exact delivery fee when you enter your location during checkout, before making payment.",
  },
 
  
  // Payment
  {
    category: "Payment",
    question: "What payment methods do you accept?",
    answer: "We accept all major payment methods through our secure Flutterwave payment gateway including: debit/credit cards, bank transfers, and USSD. All transactions are encrypted and secure.",
  },
  {
    category: "Payment",
    question: "Is my payment information secure?",
    answer: "Absolutely! We use Flutterwave's industry-standard encryption to process all payments. We never store your card details on our servers. All payment data is handled securely by Flutterwave.",
  },
  {
    category: "Payment",
    question: "Can I pay cash on delivery?",
    answer: "Currently, we only accept online payment through our secure payment gateway. This ensures faster order processing and contactless delivery for your safety and convenience.",
  },
  {
    category: "Payment",
    question: "What happens if my payment fails?",
    answer: "If a payment fails, you'll be notified immediately and can retry the payment. Your order will be held for 15 minutes. If payment isn't completed within this time, the order will be cancelled automatically.",
  },
  
  // Cancellations & Refunds
  {
    category: "Cancellations & Refunds",
    question: "Can I cancel my order?",
    answer: "Yes, you can cancel your order before it enters the 'PREPARING' stage. Once the kitchen starts preparing your meal, cancellation is no longer possible. To cancel, visit your profile page.",
  },
  {
    category: "Cancellations & Refunds",
    question: "How do refunds work?",
    answer: "If you cancel an eligible order, a full refund is automatically initiated to your original payment method. Refunds typically process within 5-7 business days, depending on your bank.",
  },
  {
    category: "Cancellations & Refunds",
    question: "What if I receive the wrong order?",
    answer: "We sincerely apologize if that happens! Please contact us immediately via the feedback page with your order code and photos. We'll arrange a replacement or full refund right away.",
  },
  {
    category: "Cancellations & Refunds",
    question: "What if my order is delayed?",
    answer: "We strive for timely delivery, but traffic and weather can cause delays. If your order is significantly delayed, please contact us through the feedback page. We may offer compensation or credits for your next order.",
  },
  
  // Account & Privacy
  {
    category: "Account & Privacy",
    question: "Do I need an account to order?",
    answer: "No, you can place orders as a guest using just your phone number. However, creating an account lets you save addresses, view order history, and enjoy faster checkout.",
  },
  {
    category: "Account & Privacy",
    question: "How do I create an account?",
    answer: "Click on 'My Account' in the menu and choose 'Register'. Enter your phone number to receive an OTP code, verify it, and complete your profile. It takes less than a minute!",
  },
  {
    category: "Account & Privacy",
    question: "Is my personal information safe?",
    answer: "Yes! We take privacy seriously. Your personal information is encrypted and never shared with third parties without your consent. Read our Privacy Policy for complete details.",
  },
  {
    category: "Account & Privacy",
    question: "How can I update my saved addresses?",
    answer: "Log into your account, go to 'My Account', and you'll see your saved delivery locations. You can add, edit, or remove addresses as needed.",
  },
  
  // Quality & Food Safety
  {
    category: "Quality & Food Safety",
    question: "Are your ingredients fresh?",
    answer: "Absolutely! We use only the freshest ingredients sourced daily. Our eggs are fresh, our bread is artisan-quality, and all proteins are prepared to order in our hygienic kitchen.",
  },
  {
    category: "Quality & Food Safety",
    question: "Do you accommodate dietary restrictions?",
    answer: "We can accommodate some dietary preferences. Please specify any allergies or restrictions in the order notes, and we'll do our best to accommodate. However, we cannot guarantee zero cross-contamination.",
  },
  {
    category: "Quality & Food Safety",
    question: "What if I have food allergies?",
    answer: "Please specify all allergies in your order notes. While we take precautions, our kitchen handles common allergens like eggs, dairy, and gluten. If you have severe allergies, please contact us before ordering.",
  },
  {
    category: "Quality & Food Safety",
    question: "How do you ensure food safety?",
    answer: "Our kitchen follows strict food safety and hygiene protocols. All staff are trained in food handling, and our facilities are regularly inspected. Meals are prepared fresh and delivered in sealed, food-grade packaging.",
  },
];

const categories = Array.from(new Set(faqs.map((faq) => faq.category)));

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const filteredFAQs =
    selectedCategory === "All"
      ? faqs
      : faqs.filter((faq) => faq.category === selectedCategory);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <div className="mt-4 mb-8 inset-x-0 z-5 pointer-events-auto">
        <Navbar />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-3xl shadow-lg shadow-amber-500/30">
            💡
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900">
            Frequently Asked Questions
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Find answers to common questions about ordering, delivery, payments,
            and more. Can't find what you're looking for?{" "}
            <Link
              href="/feedback"
              className="text-red-600 hover:text-red-700 font-semibold underline"
            >
              Contact us
            </Link>
            .
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              selectedCategory === "All"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "bg-white text-slate-700 border border-slate-200 hover:border-red-300 hover:text-red-600"
            }`}
          >
            All ({faqs.length})
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                selectedCategory === category
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-red-300 hover:text-red-600"
              }`}
            >
              {category} ({faqs.filter((f) => f.category === category).length})
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {filteredFAQs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="glass-panel overflow-hidden border-2 transition-all hover:border-red-200"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 flex items-start justify-between gap-4 text-left hover:bg-red-50/50 transition-colors"
                >
                  <div className="flex-1">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-xs font-bold mb-2">
                      {faq.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      {faq.question}
                    </h3>
                  </div>
                  <div
                    className={`text-2xl transform transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    {isOpen ? "−" : "+"}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50">
                    <p className="text-slate-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still Have Questions */}
        <div className="glass-panel p-8 text-center space-y-4 border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
          <div className="text-4xl">🤔</div>
          <h2 className="text-2xl font-bold text-slate-900">
            Still Have Questions?
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto">
            We're here to help! Reach out to us through our feedback page and
            we'll get back to you as soon as possible.
          </p>
          <Link
            href="/feedback"
            className="inline-block btn-crimson px-8 py-3 rounded-xl font-bold shadow-lg shadow-red-600/30 hover:scale-105 transition-all"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
