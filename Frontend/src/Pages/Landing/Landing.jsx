"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import {
  ArrowRight,
  Shield,
  Activity,
  Database,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

export default function FraudDetectionLanding() {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f1a12] to-[#0a120a] text-white overflow-hidden relative">
      <div className="absolute -z-10 w-full h-full bg-[#4aff78]/5 mix-blend-overlay"></div>

      {/* Decorative elements */}
      <div className="absolute top-40 right-20 w-6 h-6 text-[#4aff78] animate-pulse">
        <Shield className="w-full h-full" />
      </div>
      <div className="absolute bottom-40 left-20 w-6 h-6 text-[#4aff78] animate-pulse delay-300">
        <Activity className="w-full h-full" />
      </div>
      <div className="absolute top-[60%] right-[15%] w-4 h-4 text-[#4aff78] animate-pulse delay-700">
        <CheckCircle className="w-full h-full" />
      </div>

      {/* Navbar */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#4aff78] rounded flex items-center justify-center">
            <Shield className="w-5 h-5 text-black" />
          </div>
          <span className="font-bold text-xl">SecureGuard</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 pt-16 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div
            className={`space-y-8 transition-all duration-1000 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-12"
            }`}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Detect & Prevent Financial Fraud in{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4aff78] to-[#B5F9B5] font-extrabold">
                Real Time
              </span>
            </h1>

            <p className="text-xl text-gray-300 max-w-xl">
              Designed for banks and financial institutions, our solution
              provides comprehensive protection.
            </p>

            <button
              onClick={() => navigate("/login")} // Navigate to the login page
              className="group relative px-8 py-4 bg-gradient-to-r from-[#4aff78] to-[#8aff8a] rounded-md text-black font-medium text-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,255,120,0.5)] overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2 group-hover:gap-4 transition-all duration-300">
                Get Started <ArrowRight className="w-5 h-5" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-[#8aff8a] to-[#4aff78] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </button>
          </div>

          <div
            className={`relative transition-all duration-1000 delay-300 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-12"
            }`}
          >
            <div className="absolute -z-10 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#4aff78]/20 to-transparent blur-3xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>

            <div className="bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] p-1 rounded-2xl shadow-[0_0_40px_rgba(74,255,120,0.2)] rotate-6 hover:rotate-0 transition-all duration-500">
              <div className="bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-2xl p-6 backdrop-blur-sm border border-[#4aff78]/20">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Fraud Alert Dashboard</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="h-2 w-full bg-[#1c1c1c] rounded-full overflow-hidden">
                    <div className="h-full w-[75%] bg-gradient-to-r from-[#4aff78] to-[#8aff8a] rounded-full"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#1c1c1c] p-4 rounded-xl border border-[#4aff78]/10">
                      <div className="text-sm text-gray-400">
                        Transactions Analyzed
                      </div>
                      <div className="text-2xl font-bold">1.2M+</div>
                      <div className="flex items-center gap-1 text-[#4aff78] text-sm">
                        <ArrowRight className="w-3 h-3" />
                        <span>+12.5%</span>
                      </div>
                    </div>
                    <div className="bg-[#1c1c1c] p-4 rounded-xl border border-[#4aff78]/10">
                      <div className="text-sm text-gray-400">
                        Fraud Prevented
                      </div>
                      <div className="text-2xl font-bold">$4.8M</div>
                      <div className="flex items-center gap-1 text-[#4aff78] text-sm">
                        <ArrowRight className="w-3 h-3" />
                        <span>+8.3%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1c1c1c] p-4 rounded-xl border border-[#4aff78]/10">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Recent Alerts</div>
                      <div className="text-xs text-[#4aff78]">View All</div>
                    </div>
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#ff5555]"></div>
                        <div className="text-sm">
                          Unusual transaction pattern detected
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#ffaa55]"></div>
                        <div className="text-sm">
                          Multiple login attempts from new location
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#4aff78]"></div>
                        <div className="text-sm">
                          Regulatory compliance check passed
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div
          className={`text-center mb-16 transition-all duration-1000 delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Stay ahead of fraud with our AI-powered system
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Harness AI-driven fraud detection.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Activity className="w-6 h-6" />,
              title: "Real-time Monitoring",
              description:
                "Monitors and analyzes transactions in real time to detect suspicious patterns instantly",
            },
            {
              icon: <Database className="w-6 h-6" />,
              title: "AI-based Anomaly Detection",
              description:
                "Detects suspicious patterns using advanced AI-based anomaly detection algorithms",
            },
            {
              icon: <Shield className="w-6 h-6" />,
              title: "Historical Data Analysis",
              description:
                "Retrieves past fraud case data and applies financial regulations for context",
            },
            {
              icon: <AlertTriangle className="w-6 h-6" />,
              title: "Actionable Alerts",
              description:
                "Provides contextual insights and actionable alerts for immediate investigation",
            },
            {
              icon: <CheckCircle className="w-6 h-6" />,
              title: "Regulatory Compliance",
              description:
                "Ensures compliance with financial laws while minimizing false positives",
            },
            {
              icon: <ArrowRight className="w-6 h-6" />,
              title: "Seamless Integration",
              description:
                "Integrates with your existing systems with minimal disruption to operations",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className={`bg-gradient-to-tr from-[#1C1C1C] to-[#0a0a0a] p-6 rounded-xl border border-[#4aff78]/10 hover:border-[#4aff78]/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,255,120,0.15)] delay-${
                500 + index * 100
              } ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-12"
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-[#4aff78]/10 flex items-center justify-center text-[#4aff78] mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div
          className={`bg-gradient-to-tr from-[#1c1c1c] to-[#0a0a0a] rounded-2xl p-8 md:p-12 border border-[#4aff78]/20 relative overflow-hidden transition-all duration-1000 delay-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          <div className="absolute -z-10 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#4aff78]/10 to-transparent blur-3xl top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2"></div>

          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to secure your financial transactions?
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Join hundreds of financial institutions that trust our AI-powered
              fraud detection system to protect their assets and customers.
            </p>

            <div>
              <button
                onClick={() => navigate("/login")} // Navigate to the login page
                className="group relative px-8 py-4 bg-gradient-to-r from-[#4aff78] to-[#8aff8a] rounded-md text-black font-medium text-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,255,120,0.5)] overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2 group-hover:gap-4 transition-all duration-300">
                  Get Started <ArrowRight className="w-5 h-5" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-[#8aff8a] to-[#4aff78] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-[#4aff78]/10 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-[#4aff78] rounded flex items-center justify-center">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-xl">SecureGuard</span>
          </div>

          <div className="text-sm text-gray-400">
            © {new Date().getFullYear()} SecureGuard. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
