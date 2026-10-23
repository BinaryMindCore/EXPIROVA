import { Link, useLocation } from "react-router-dom";

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 w-full h-16 bg-white border-t flex justify-around items-center z-50">

    <Link
  to="/dashboard"
  className={`flex flex-col items-center ${
    location.pathname === "/dashboard"
       ? "text-[#0d5f94] scale-110"
      : "text-gray-500 hover:text-[#0d5f94]"
  }`}
>
  <span className="material-symbols-outlined">home</span>
  <span className="text-xs">Home</span>
</Link>

    <Link
  to="/aiscan"
  className={`flex flex-col items-center transition-all duration-300 ${
    location.pathname === "/aiscan"
      ? "text-[#0d5f94] scale-110"
      : "text-gray-500 hover:text-[#0d5f94]"
  }`}
>
  <span className="material-symbols-outlined">
    qr_code_scanner
  </span>

  <span className="text-xs">
    Scan
  </span>
</Link>
      <Link
  to="/smartinventory"
  className={`flex flex-col items-center transition-all duration-300 ${
    location.pathname === "/smartinventory"
      ? "text-[#0d5f94] scale-110"
      : "text-gray-500 hover:text-[#0d5f94]"
  }`}
>
  <span className="material-symbols-outlined">
    inventory_2
  </span>

  <span className="text-xs">
    Inventory
  </span>
</Link>

<Link
  to="/alerts"
  className={`flex flex-col items-center transition-all duration-300 ${
    location.pathname === "/alerts"
      ? "text-[#0d5f94] scale-110"
      : "text-gray-500 hover:text-[#0d5f94]"
  }`}
>
  <span className="material-symbols-outlined">
    notifications
  </span>

  <span className="text-xs">
    Alerts
  </span>
</Link>

    </nav>
  );
}