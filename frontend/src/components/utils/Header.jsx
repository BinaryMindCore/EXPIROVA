
import { Link, useLocation } from "react-router-dom";

export function Header() {
  const location = useLocation();

  const navItems = [
    { to: "/home", icon: "home", label: "Home" },
    { to: "/dashboard", icon: "dashboard", label: "Dashboard" },
    { to: "/aiscan", icon: "qr_code_scanner", label: "Scan" },
    { to: "/smartinventory", icon: "inventory_2", label: "Inventory" },
    { to: "/alerts", icon: "notifications", label: "Alerts" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50 shadow-sm">

      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#0d5f94]">
          inventory_2
        </span>
        <h1 className="text-xl font-bold text-blue-900">
          Expirova
        </h1>
      </div>

      {/* Navigation + Profile grouped on the right */}
      <div className="flex items-center gap-6">
        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#0d5f94]/10 text-[#0d5f94]"
                    : "text-gray-500 hover:bg-gray-100 hover:text-[#0d5f94]"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {item.icon}
                </span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profile */}
        <Link
          to="/profile"
          className="
            w-9 h-9
            rounded-full
            bg-[#0d5f94]
            flex items-center justify-center
            text-white
            shadow-sm
            transition-all duration-200
            hover:bg-[#0b527f]
            hover:shadow-md
            hover:-translate-y-0.5
            active:scale-95
          "
        >
          <span className="material-symbols-outlined text-[20px]">
            account_circle
          </span>
        </Link>
      </div>
    </header>
  );
}