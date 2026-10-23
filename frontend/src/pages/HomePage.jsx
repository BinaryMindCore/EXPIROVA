import { Link } from "react-router-dom";
import { Header } from "../components/utils/Header";
import homeBg from "../assets/home-bg.jpg";
import step1Scan from "../assets/step-1-scan.jpg";
import step2Ai from "../assets/step-2-ai.jpg";
import step3Inventory from "../assets/step-3-inventory.jpg";
import step4Alerts from "../assets/step-4-alerts.jpg";

export function HomePage() {
  const steps = [
    {
      step: "01",
      icon: "photo_camera",
      title: "Scan Medicine or Product",
      desc: "Open the Scan tool and point your camera at any product label, barcode, QR code, or medicine blister pack. You can also upload an existing image.",
      link: "/aiscan",
      linkText: "Try Scanner",
      image: step1Scan,
    },
    {
      step: "02",
      icon: "psychology",
      title: "Instant AI Extraction",
      desc: "Our neural OCR engine immediately parses text to identify product titles, batch identifiers, and expiration dates with high precision.",
      link: "/dashboard",
      linkText: "View Insights",
      image: step2Ai,
    },
    {
      step: "03",
      icon: "inventory_2",
      title: "Smart FEFO Inventory",
      desc: "Products are automatically organized into your catalog using First-Expired, First-Out (FEFO) algorithms to prevent premature stock waste.",
      link: "/smartinventory",
      linkText: "Open Inventory",
      image: step3Inventory,
    },
    {
      step: "04",
      icon: "notifications_active",
      title: "Proactive Expiry Alerts",
      desc: "Receive timely warnings (Urgent, Warning, Stable) days or weeks before expiration, giving your team time to use or transfer stock.",
      link: "/alerts",
      linkText: "Check Alerts",
      image: step4Alerts,
    },
  ];

  const features = [
    {
      icon: "qr_code_scanner",
      title: "Smart OCR Recognition",
      description:
        "High-accuracy optical recognition extracts medicine names, batch codes, and expiry dates without tedious manual data entry.",
      badge: "AI-Powered",
    },
    {
      icon: "swap_vertical_circle",
      title: "FEFO Stock Allocation",
      description:
        "Prioritize dispensing items that expire first, directly reducing medical and food inventory spoilage by up to 85%.",
      badge: "Automation",
    },
    {
      icon: "crisis_alert",
      title: "Multi-Tier Smart Alerts",
      description:
        "Categorized alerts with color-coded urgencies (Expires in 24h, 7 days, 14 days) keep your staff ahead of every deadline.",
      badge: "Real-Time",
    },
    {
      icon: "analytics",
      title: "Analytics & Compliance",
      description:
        "Live dashboard monitoring overall inventory health, waste prevention statistics, and storage department distribution.",
      badge: "Audit-Ready",
    },
  ];

  const industries = [
    { name: "Hospitals & ERs", icon: "local_hospital", note: "Vaccines, IV fluids & injectables" },
    { name: "Pharmacies", icon: "medication", note: "Prescriptions & shelf medicine" },
    { name: "Laboratories", icon: "biotechnology", note: "Reagents, chemical kits & test vials" },
    { name: "Warehouses", icon: "warehouse", note: "Bulk storage & dispatch pallets" },
    { name: "Food & Grocery", icon: "storefront", note: "Dairy, produce & packaged items" },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col selection:bg-[#0d5f94]/20 selection:text-[#0d5f94]">
      <Header />

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-16 lg:pt-28 lg:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Soft background ambient gradient */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-blue-100/60 to-cyan-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Headline and Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs text-xs font-semibold text-[#0d5f94]">
                <span className="w-2 h-2 rounded-full bg-[#0d5f94] animate-pulse" />
                AI-Powered Smart Expiry Management System
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Scan. Track. Monitor. <br />
                <span className="text-[#0d5f94]">Prevent Expiry Waste</span> Before It Happens.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Expirova combines camera optical character recognition, FEFO inventory sorting, and intelligent early-warning alerts to help healthcare institutions, pharmacies, and stores eliminate stock write-offs.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to="/dashboard"
                  className="bg-[#0d5f94] hover:bg-[#0b527f] text-white font-semibold px-6 py-3.5 rounded-xl shadow-md shadow-[#0d5f94]/20 flex items-center gap-2 transition active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[20px]">dashboard</span>
                  Go to Dashboard
                </Link>

                <Link
                  to="/aiscan"
                  className="bg-white hover:bg-slate-50 text-slate-800 font-semibold px-6 py-3.5 rounded-xl border border-slate-300 shadow-xs flex items-center gap-2 transition active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[#0d5f94] text-[20px]">qr_code_scanner</span>
                  Start Scanning
                </Link>

                <Link
                  to="/smartinventory"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-3.5 rounded-xl transition flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                  Inventory
                </Link>
              </div>

              {/* Quick Trust / Metrics Bar */}
              <div className="pt-4 grid grid-cols-3 gap-4 border-t border-slate-200">
                <div>
                  <p className="text-2xl font-bold text-slate-900">85%</p>
                  <p className="text-xs text-slate-500">Less Product Waste</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#0d5f94]">&lt; 1.2s</p>
                  <p className="text-xs text-slate-500">Instant AI Scan</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">100%</p>
                  <p className="text-xs text-slate-500">FEFO Compliance</p>
                </div>
              </div>
            </div>

            {/* Right Column: Featured Packaging & Scanner Image */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xl group">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <img
                    src={homeBg}
                    alt="Expirova Smart Scanner in Action"
                    className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                  {/* Floating Recognition Card */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl p-3 shadow-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#0d5f94]/10 text-[#0d5f94] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[22px]">verified</span>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Automatic Detection</p>
                        <p className="text-sm font-bold text-slate-900">Barcode & Expiry Validated</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* USER GUIDE: STEP-BY-STEP WORKFLOW */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase font-bold tracking-wider text-[#0d5f94] bg-[#0d5f94]/10 px-3 py-1 rounded-full">
              User Guide
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              How Expirova Works in 4 Steps
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              A streamlined workflow designed for busy nurses, pharmacists, and warehouse managers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item) => (
              <div
                key={item.step}
                className="group relative h-[420px] rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-950 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col justify-between p-5 select-none"
                style={{ perspective: "1000px" }}
              >
                {/* Background Image Layer: moves backward on hover */}
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover object-center transform transition-all duration-500 ease-out group-hover:scale-[0.88] group-hover:opacity-20 group-hover:brightness-50"
                  />
                  {/* Atmospheric Gradient Layer */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-slate-950/60 transition-all duration-500" />
                </div>

                {/* Default Top Header: Step Badge & Icon */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-xs font-black text-white/90 font-mono tracking-wider px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/25 shadow-sm">
                    STEP {item.step}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/25 text-white flex items-center justify-center shadow-sm group-hover:bg-[#0d5f94] group-hover:border-[#0d5f94] transition-all duration-300">
                    <span className="material-symbols-outlined text-[22px]">
                      {item.icon}
                    </span>
                  </div>
                </div>

                {/* Default Bottom Content: Step Title & Hover hint */}
                <div className="relative z-10 transition-all duration-300 group-hover:opacity-0 group-hover:translate-y-4">
                  <h3 className="text-lg font-bold text-white tracking-tight drop-shadow-sm">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300/80 mt-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>Hover for details</span>
                  </div>
                </div>

                {/* Hover Foreground Overlay: Description & Action Link comes in front */}
                <div className="absolute inset-0 z-20 p-5 flex flex-col justify-end bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400 ease-out pointer-events-none group-hover:pointer-events-auto">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-400 ease-out space-y-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                        Step {item.step} Details
                      </span>
                      <h4 className="text-base font-bold text-white leading-tight mt-0.5">
                        {item.title}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-white/10 shadow-lg">
                      {item.desc}
                    </p>

                    <div>
                      <Link
                        to={item.link}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#0d5f94] hover:bg-[#0b527f] px-3.5 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-cyan-400/30 group/btn"
                      >
                        <span>{item.linkText}</span>
                        <span className="material-symbols-outlined text-[16px] transition-transform duration-200 group-hover/btn:translate-x-1">
                          arrow_forward
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CORE FEATURES & ABOUT THE WEBSITE */}
      <section className="py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500 bg-slate-200/80 px-3 py-1 rounded-full">
              System Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Everything Needed for Smart Expiry Control
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Purpose-built tools to minimize waste, maintain safety, and speed up stock audits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feat) => (
              <div
                key={feat.title}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:shadow-md transition flex gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-[#0d5f94]/10 text-[#0d5f94] flex-shrink-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[26px]">
                    {feat.icon}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-slate-900">
                      {feat.title}
                    </h3>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {feat.badge}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARGET INDUSTRIES (BUILT FOR) */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-100/70 border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-slate-900">
              Built for Fast-Paced Inventory Environments
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Trusted by healthcare teams, clinical pharmacies, and supply managers.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {industries.map((ind) => (
              <div
                key={ind.name}
                className="bg-white border border-slate-200 rounded-xl p-3.5 text-center shadow-xs flex flex-col items-center justify-center"
              >
                <div className="w-9 h-9 rounded-full bg-blue-50 text-[#0d5f94] flex items-center justify-center mb-2">
                  <span className="material-symbols-outlined text-[20px]">
                    {ind.icon}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{ind.name}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{ind.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section className="py-14 px-4 bg-white border-t border-slate-200 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <h3 className="text-xl font-bold text-slate-900">
            Start Monitoring Your Stock with Expirova
          </h3>
          <p className="text-sm text-slate-600">
            Keep shelves fresh, streamline regulatory audits, and ensure expired products never reach consumers.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/dashboard"
              className="bg-[#0d5f94] hover:bg-[#0b527f] text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/aiscan"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-5 py-2.5 rounded-lg border border-slate-300 transition"
            >
              Scan New Item
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
