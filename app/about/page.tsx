"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function AboutPage() {
  const teamMembers = [
    {
      role: "Founder & Head Chef",
      name: "Chef Adebayo",
      description: "20+ years of culinary excellence",
      icon: "👨‍🍳",
    },
    {
      role: "Operations Manager",
      name: "Ngozi Okafor",
      description: "Ensuring smooth deliveries",
      icon: "📋",
    },
    {
      role: "Customer Success",
      name: "Tunde Bakare",
      description: "Always here to help",
      icon: "💬",
    },
    {
      role: "Quality Control",
      name: "Fatima Yusuf",
      description: "Maintaining top standards",
      icon: "✅",
    },
  ];

  const values = [
    {
      title: "Fresh Ingredients",
      description:
        "We source the freshest eggs, artisan bread, and quality proteins daily to ensure every meal is perfect.",
      icon: "🥚",
    },
    {
      title: "Fast Delivery",
      description:
        "Hot meals delivered to your door within 30-45 minutes. Your satisfaction is our priority.",
      icon: "🚀",
    },
    {
      title: "Food Safety",
      description:
        "Strict hygiene protocols and food safety standards in every step from kitchen to delivery.",
      icon: "🛡️",
    },
    {
      title: "Customer First",
      description:
        "Your feedback shapes our service. We're committed to continuous improvement and excellence.",
      icon: "❤️",
    },
  ];

  const milestones = [
    { year: "2026", event: "Meshaai Founded", description: "Started with a single kitchen in Abuja" },
    { year: "2026", event: "1000+ Orders", description: "Reached our first thousand happy customers" },
    { year: "2026", event: "Delivery Expansion", description: "Expanded coverage across Lagos metropolis" },
    { year: "2026", event: "Premium Menu", description: "Launched gourmet meal customization options" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      <div className="mt-4 mb-8 inset-x-0 z-5 pointer-events-auto">
        <Navbar />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-red-600 via-amber-500 to-orange-500 text-4xl shadow-xl shadow-red-600/30">
            🍳
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900">
            About Meshaai
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Elevating Lagos' beloved roadside bread and egg culture into a
            premium, convenient dining experience delivered right to your door.
          </p>
        </div>

        {/* Our Story */}
        <div className="glass-panel p-8 sm:p-12 space-y-6 border-2 border-amber-200">
          <div className="flex items-center gap-3">
            <span className="text-4xl">📖</span>
            <h2 className="text-3xl font-black text-slate-900">Our Story</h2>
          </div>
          <div className="space-y-4 text-slate-700 text-lg leading-relaxed">
            <p>
              Meshaai was born from a simple observation: Lagos' roadside bread
              and egg vendors serve some of the most delicious, comforting meals
              in the city. But accessing them often meant navigating traffic,
              unpredictable wait times, and varying quality standards.
            </p>
            <p>
              We asked ourselves: <strong>What if we could bring that authentic roadside
              experience to your doorstep, with guaranteed freshness, quality,
              and convenience?</strong>
            </p>
            <p>
              Today, Meshaai combines the soul of traditional Nigerian street
              food with modern food safety standards, premium ingredients, and
              reliable delivery. We've transformed a local favorite into a
              gourmet dining experience you can enjoy anywhere, anytime.
            </p>
            <p className="font-semibold text-red-600">
              From our kitchen to your door — hot, fresh, and always delicious.
            </p>
          </div>
        </div>

        {/* Our Values */}
        <div className="space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              What We Stand For
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Our core values drive everything we do, from sourcing ingredients
              to delivering your meal.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="glass-panel p-6 border-2 border-transparent hover:border-red-200 transition-all hover:shadow-xl"
              >
                <div className="text-5xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Our Journey */}
        <div className="space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Our Journey
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              From a single kitchen to serving thousands of happy customers
              across Lagos.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className="glass-panel p-6 text-center space-y-2 border-2 border-amber-200 hover:border-red-300 transition-all"
              >
                <div className="text-3xl font-black text-red-600">
                  {milestone.year}
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {milestone.event}
                </h3>
                <p className="text-sm text-slate-600">{milestone.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Meet the Team */}
        {/* <div className="space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Meet the Team
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Dedicated professionals working together to bring you the best
              food experience.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="glass-panel p-6 text-center space-y-3 hover:shadow-xl transition-all border-2 border-transparent hover:border-amber-300"
              >
                <div className="text-6xl">{member.icon}</div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {member.name}
                  </h3>
                  <p className="text-sm font-semibold text-red-600">
                    {member.role}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {member.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div> */}

        {/* Why Choose Us */}
        <div className="glass-panel p-8 sm:p-12 space-y-6 border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
          <div className="text-center space-y-3">
            <div className="text-5xl">🌟</div>
            <h2 className="text-3xl font-black text-slate-900">
              Why Choose Meshaai?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-4xl font-black text-red-600 mb-2">5000+</div>
              <p className="text-slate-700 font-semibold">Orders Delivered</p>
            </div>
            <div>
              <div className="text-4xl font-black text-red-600 mb-2">30 min</div>
              <p className="text-slate-700 font-semibold">Average Delivery Time</p>
            </div>
            <div>
              <div className="text-4xl font-black text-red-600 mb-2">4.8★</div>
              <p className="text-slate-700 font-semibold">Customer Rating</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-6 py-8">
          <h2 className="text-3xl font-black text-slate-900">
            Ready to Experience Meshaai?
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Join thousands of satisfied customers enjoying premium bread and egg
            meals delivered fresh to their door.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/#menu"
              className="btn-crimson px-8 py-3 rounded-xl font-bold shadow-lg shadow-red-600/30 hover:scale-105 transition-all text-center"
            >
              Order Now 🍳
            </Link>
            <Link
              href="/faq"
              className="px-8 py-3 rounded-xl font-bold border-2 border-slate-300 text-slate-700 hover:border-red-300 hover:text-red-600 transition-all text-center"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
