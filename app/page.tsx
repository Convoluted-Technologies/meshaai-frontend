"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import DishDetailModal from "@/components/DishDetailModal";
import { useCart } from "@/context/CartContext";
import { PresetMeal } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

interface FAQ {
  question: string;
  answer: string;
}

const homeFAQs: FAQ[] = [
  {
    question: "What meals do you offer?",
    answer:
      "We specialize in gourmet roadside-inspired bread and egg meals. Our signature specials feature freshly fried eggs with diced peppers and onions, soft warm artisan bread, melted cheese, crispy seasoned croaker fish, and grilled beef sausages.",
  },
  {
    question: "How do I place an order and customize my meal?",
    answer:
      "Simply tap 'Order Now' or 'Explore Menu', select any dish, customize it with your favorite extras (extra eggs, sausages, cheese, pepper dip), and add it to your cart. You can review your cart anytime and proceed to checkout.",
  },
  {
    question: "What areas do you deliver to in Abuja?",
    answer:
      "We currently deliver across Abuja including Wuse, Maitama, Garki, Jabi, Utako, Asokoro, and surrounding districts. When you enter your delivery address at checkout, the system automatically checks your zone and calculates delivery fees.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Most orders are prepared fresh and delivered within 30 to 45 minutes from confirmation. You will receive real-time updates as your meal moves from the skillet to your door.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We process payments securely through Flutterwave, accepting all major Nigerian debit/credit cards (Mastercard, Visa, Verve), bank transfers, and USSD. All transactions are encrypted and 100% secure.",
  },
  {
    question: "Can I pay cash on delivery?",
    answer:
      "To ensure prompt food dispatch, safety, and seamless contactless delivery, all orders must be completed online through our secure Flutterwave payment gateway before preparation begins.",
  },
  {
    question: "Can I cancel my order or request a refund?",
    answer:
      "Yes! You can cancel your order at any time before the kitchen starts cooking ('PREPARING' stage). Once cancelled, a full refund is automatically initiated back to your original payment method.",
  },
];

export default function CustomerHomePage() {
  const { presets, cart, formatPrice } = useCart();
  const [selectedPreset, setSelectedPreset] = useState<PresetMeal | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  // Only the top 3 best seller items
  const bestSellers = presets.slice(0, 3);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 w-full px-4 sm:px-8 lg:px-12 py-3 sm:py-5 space-y-12 sm:space-y-16">
        {/* HERO BANNER SECTION WITH FRAMER MOTION */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full rounded-3xl sm:rounded-[36px] overflow-hidden min-h-[460px] sm:min-h-[540px] lg:min-h-[580px] flex items-center bg-black shadow-xl"
        >
          {/* Background image & gradient overlay */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <motion.img
              initial={{ scale: 1.12 }}
              animate={{ scale: 1.02 }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              src="/images/hero_food.png"
              alt="Delicious Gourmet Dish"
              className="w-full h-full object-cover object-right sm:object-center"
            />
            {/* Dark gradient fade on left for readable text */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 sm:via-black/75 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 sm:hidden" />
          </div>

          {/* Left Hero Content */}
          <div className="relative z-10 w-full px-6 sm:px-12 lg:px-16 py-12 max-w-2xl space-y-5">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]"
            >
              Elevate Your Taste <br />
              <span className="text-white">Buds.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-white/85 text-sm sm:text-base font-normal leading-relaxed max-w-xl"
            >
              From sizzling eggs to artisan sweet bread, seasoned fish to juicy beef sausages —
              enjoy authentic gourmet street-style meals crafted with heart, in spaces that feel like home.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="pt-2"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-block"
              >
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center bg-[#e31b23] hover:bg-[#c9151c] text-white px-8 py-3.5 rounded-full font-bold text-sm tracking-wide shadow-lg transition-colors"
                >
                  Order Now
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* 3 QUICK ACTION CARDS WITH FRAMER MOTION STAGGER */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Order Online */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="bg-[#FFF5F5] border border-red-100 rounded-3xl p-6 sm:p-8 flex flex-col justify-between min-h-[170px] relative shadow-xs hover:shadow-md transition-shadow"
          >
            <div className="flex justify-end">
              <svg
                className="w-9 h-9 text-[#e31b23]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-800 px-6 py-2.5 rounded-full text-xs font-bold shadow-xs border border-slate-200/60 transition-colors"
                >
                  Order Online
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Card 2: Find an Outlet / Delivery Zones */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="bg-[#FFF5F5] border border-red-100 rounded-3xl p-6 sm:p-8 flex flex-col justify-between min-h-[170px] relative shadow-xs hover:shadow-md transition-shadow"
          >
            <div className="flex justify-end">
              <svg
                className="w-9 h-9 text-[#e31b23]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-800 px-6 py-2.5 rounded-full text-xs font-bold shadow-xs border border-slate-200/60 transition-colors"
                >
                  Find an Outlet
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Card 3: View Menu */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="bg-[#FFF5F5] border border-red-100 rounded-3xl p-6 sm:p-8 flex flex-col justify-between min-h-[170px] relative shadow-xs hover:shadow-md transition-shadow"
          >
            <div className="flex justify-end">
              <svg
                className="w-9 h-9 text-[#e31b23]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5h7.5A2.25 2.25 0 0118 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-7.5A2.25 2.25 0 016 17.25V6.75A2.25 2.25 0 018.25 4.5zM15 12h.008v.008H15V12z"
                />
              </svg>
            </div>
            <div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-800 px-6 py-2.5 rounded-full text-xs font-bold shadow-xs border border-slate-200/60 transition-colors"
                >
                  View Menu
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* STORY / FROM OUR POT TO YOUR PLATE SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center py-4 sm:py-8 overflow-hidden">
          {/* Left Column: Round Plate Meal Presentation */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl sm:rounded-[36px] overflow-hidden bg-slate-50 border border-slate-100 p-4 sm:p-6 shadow-sm flex items-center justify-center group"
          >
            <motion.img
              whileHover={{ scale: 1.06 }}
              transition={{ duration: 0.4 }}
              src="/images/preset_fish.png"
              alt="From Our Skillet to Your Plate"
              className="w-full max-w-md h-auto object-cover rounded-2xl"
            />
          </motion.div>

          {/* Right Column: Narrative */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4 sm:space-y-6"
          >
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              From Our Skillet to Your Plate, <br className="hidden sm:inline" />
              <span className="text-[#600000]">Crafted Daily</span>
            </h2>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              At Meeshaai, we believe good food brings people together. What started as a love for the iconic
              Nigerian roadside bread and egg has been elevated into an artisan culinary craft.
            </p>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Every morning, our chefs crack farm-fresh eggs into sizzling skillets, sautéed with diced bell peppers,
              sweet onions, and seasoned spices. Paired with warm, pillow-soft bread and golden-fried accompaniments,
              it's comfort food made right.
            </p>

            <div className="pt-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-2 bg-[#e31b23] hover:bg-[#c9151c] text-white px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-wider shadow-md transition-colors"
                >
                  <span>Explore Menu</span>
                  <span>→</span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* BEST SELLER COMBO SECTION MATCHING SCREENSHOT */}
        <section className="space-y-8 pt-4 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-xl mx-auto space-y-2"
          >
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#600000] tracking-tight">
              Best Seller Combo
            </h2>
          </motion.div>

          {/* 3 Food Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {bestSellers.map((preset, index) => {
              const lineItem = cart[preset.id];
              const inCart = lineItem && lineItem.qty > 0;

              return (
                <motion.div
                  key={preset.id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: index * 0.1 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  onClick={() => setSelectedPreset(preset)}
                  className="bg-[#f8f9fa] border border-slate-200/80 rounded-3xl p-5 flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-shadow cursor-pointer group"
                >
                  {/* Inner White Image Card */}
                  <div className="relative bg-white rounded-2xl overflow-hidden h-48 sm:h-56 w-full flex items-center justify-center p-3 mb-4 shadow-xs">
                    <motion.img
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                      src={preset.imageUrl}
                      alt={preset.name}
                      className="w-full h-full object-cover rounded-xl"
                    />

                    {!preset.isAvailable && (
                      <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex items-center justify-center font-black text-[#e31b23] uppercase tracking-wider text-xs">
                        Sold Out
                      </div>
                    )}

                    {inCart && (
                      <div className="absolute top-3 left-3 bg-[#e31b23] text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-md">
                        {lineItem.qty} in cart
                      </div>
                    )}
                  </div>

                  {/* Dish Title & Info */}
                  <div className="space-y-2 mb-4 flex-1">
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base uppercase tracking-wide group-hover:text-[#e31b23] transition-colors">
                      {preset.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {preset.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {preset.components.map((comp, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Row: Price & Tap to customise & order button */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between pt-3 border-t border-slate-200/60 mt-auto gap-2">
                    <span className="font-black text-slate-900 text-base sm:text-lg shrink-0">
                      {preset.priceFormatted || formatPrice(preset.priceKobo)}
                    </span>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPreset(preset);
                      }}
                      disabled={!preset.isAvailable}
                      className="bg-[#e31b23] hover:bg-[#c9151c] disabled:opacity-50 text-white px-3.5 sm:px-4 py-2.5 rounded-full font-bold text-[11px] sm:text-xs uppercase tracking-wider shadow-sm hover:shadow transition-colors text-center shrink-0 cursor-pointer"
                    >
                      {inCart
                        ? `In Cart (${lineItem.qty}) · Edit`
                        : "Tap to customise & order"}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Centered View Full Menu Button matching Screenshot */}
          <div className="text-center pt-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              <Link
                href="/menu"
                className="inline-flex items-center justify-center bg-[#e31b23] hover:bg-[#c9151c] text-white px-9 py-3.5 rounded-full font-bold text-sm tracking-wide shadow-md transition-colors"
              >
                View Full Menu
              </Link>
            </motion.div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS SECTION (TOP 7 MOST RELEVANT) */}
        <section className="space-y-8 pt-4 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-2xl mx-auto space-y-3"
          >
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-500">
              Got questions? We've got answers. Everything you need to know about ordering, delivery, and payments.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-3.5">
            {homeFAQs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.06 }}
                  className="border border-slate-200/90 rounded-2xl overflow-hidden bg-[#fbfbfb] hover:border-slate-300 transition-colors shadow-2xs"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full px-6 py-4 sm:py-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-black ${isOpen
                        ? "bg-[#e31b23] text-white"
                        : "bg-slate-200 text-slate-600"
                        }`}
                    >
                      {isOpen ? "−" : "+"}
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden border-t border-slate-100 bg-white"
                      >
                        <div className="px-6 py-4 text-slate-600 text-xs sm:text-sm leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Dish Detail Customization Modal */}
      <DishDetailModal
        preset={selectedPreset}
        onClose={() => setSelectedPreset(null)}
      />
    </div>
  );
}
