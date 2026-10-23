import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export function Footer() {
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  if (location.pathname === "/auth") {
    return null;
  }

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim() && email.includes("@")) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-slate-950 text-slate-400 border-t border-slate-800/80 antialiased relative z-20">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* COLUMN 1: Brand / Company Info (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/home" className="inline-flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0d5f94] to-cyan-500 text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
                <span className="material-symbols-outlined text-[24px]">inventory_2</span>
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                Expirova<span className="text-cyan-400">.</span>
              </span>
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              AI-driven inventory intelligence and FEFO stock automation. Eliminating expiration waste across pharmacies, healthcare clinics, and warehouses.
            </p>

            {/* Social Media Links */}
            <div className="flex items-center gap-3 pt-2">
              {/* Twitter / X */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter / X"
                className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* GitHub */}
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>

              {/* Discord */}
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Discord"
                className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
            </div>
          </div>

          {/* COLUMN 2: Quick Links (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/home"
                  className="hover:text-cyan-400 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Home Overview
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard"
                  className="hover:text-cyan-400 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/smartinventory"
                  className="hover:text-cyan-400 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Smart Inventory
                </Link>
              </li>
              <li>
                <Link
                  to="/aiscan"
                  className="hover:text-cyan-400 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  AI Scanner
                </Link>
              </li>
              <li>
                <Link
                  to="/alerts"
                  className="hover:text-cyan-400 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Expiry Alerts
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: Product & Legal Links (lg:col-span-3) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Platform & Legal
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="#fefo"
                  className="hover:text-cyan-400 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  FEFO Algorithm
                </a>
              </li>
              <li>
                <a
                  href="#ocr"
                  className="hover:text-cyan-400 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Optical OCR Parsing
                </a>
              </li>
              <li>
                <a
                  href="#privacy"
                  className="hover:text-cyan-400 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#terms"
                  className="hover:text-cyan-400 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#security"
                  className="hover:text-cyan-400 hover:translate-x-1 inline-block transition-all duration-200"
                >
                  Security & Compliance
                </a>
              </li>
            </ul>
          </div>

          {/* COLUMN 4: Newsletter Signup (lg:col-span-3) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Stay Informed
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Get product updates, regulatory compliance alerts, and new inventory optimization algorithms.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2 pt-1">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0d5f94] focus:border-transparent transition"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0d5f94] hover:bg-[#0b527f] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md hover:shadow-cyan-500/20 active:scale-98 transition-all duration-200 flex items-center justify-center gap-1.5"
              >
                <span>Subscribe to Updates</span>
                <span className="material-symbols-outlined text-[16px]">mail</span>
              </button>

              {subscribed && (
                <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Thank you! You have been subscribed.
                </p>
              )}
            </form>
          </div>

        </div>
      </div>

      {/* BOTTOM BAR & COPYRIGHT */}
      <div className="border-t border-slate-900 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} Expirova System Inc. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </span>
            <span className="text-slate-700">•</span>
            <a href="#cookies" className="hover:text-slate-300 transition-colors">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
