import { Link, useLocation } from "react-router-dom";

export function FloatingScanButton() {
  const location = useLocation();

  // Hide on Home page, root redirect, and Auth page
  if (
    location.pathname === "/home" ||
    location.pathname === "/" ||
    location.pathname === "/auth"
  ) {
    return null;
  }

  return (
    <Link
      to="/aiscan"
      aria-label="Quick Scan"
      title="Quick Scan"
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#0d5f94] hover:bg-[#0b527f] text-white flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20 group"
    >
      <span
        className="material-symbols-outlined text-[26px] transition-transform duration-200 group-hover:scale-110"
        style={{
          fontVariationSettings: "'FILL' 1",
        }}
      >
        barcode_scanner
      </span>
    </Link>
  );
}

export default FloatingScanButton;
