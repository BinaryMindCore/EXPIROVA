import { useState, useMemo, useEffect } from "react";
import inventoryGuideImg from "../assets/inventory-guide.png";
import {
  getInventoryItems,
  deleteInventoryItem,
  clearSampleData,
} from "../utils/inventoryStore";

export function Smartinventorycontent() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [sortBy, setSortBy] = useState("FEFO");
  const [menuOpen, setMenuOpen] = useState(null);

  const [inventoryItems, setInventoryItems] = useState(() => {
    return getInventoryItems();
  });

  useEffect(() => {
    const handleUpdate = () => {
      setInventoryItems(getInventoryItems());
    };

    window.addEventListener("inventoryUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("inventoryUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const sampleTitles = [
    "Greek Yogurt",
    "Influenza Vax",
    "Amoxicillin 500mg",
    "Saline Solution 1L",
    "Paracetamol 650mg",
    "Syringe Pack",
  ];
  const hasSampleData = inventoryItems.some((item) => sampleTitles.includes(item.title));

  const categories = [
    "All",
    "Medicine",
    "Food & Dairy",
    "Medical Supply",
    "IV Fluid",
    "Vaccine",
  ];
  const locations = [
    "All",
    "Unit 4, Fridge B",
    "Cold Chain Lab 1",
    "Pharmacy Shelf G-2",
    "ER Supply Bay",
    "Rack A-3",
    "Storage Room",
  ];

  const statusPills = [
    {
      label: "All",
      active: "bg-slate-800 text-white",
      inactive: "bg-white text-slate-600 border border-slate-200",
    },
    {
      label: "URGENT",
      active: "bg-red-600 text-white",
      inactive: "bg-white text-red-600 border border-red-200",
    },
    {
      label: "WARNING",
      active: "bg-amber-500 text-white",
      inactive: "bg-white text-amber-600 border border-amber-200",
    },
    {
      label: "STABLE",
      active: "bg-[#0d5f94] text-white",
      inactive: "bg-white text-[#0d5f94] border border-blue-200",
    },
  ];

  const removeItem = (item) => {
    deleteInventoryItem(item.id, item.title);
    setMenuOpen(null);
  };

  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    let filtered = inventoryItems.filter((item) => {
      // Search
      const matchesSearch =
        !keyword ||
        [
          item.title,
          item.category,
          item.categoryType,
          item.location,
          item.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);

      // Category
      const matchesCategory =
        categoryFilter === "All" ||
        item.categoryType?.trim().toLowerCase() ===
          categoryFilter.trim().toLowerCase();

      // Status
      const matchesStatus =
        statusFilter === "All" ||
        item.status?.trim().toLowerCase() === statusFilter.trim().toLowerCase();

      // Location
      const matchesLocation =
        locationFilter === "All" ||
        item.location?.trim().toLowerCase() ===
          locationFilter.trim().toLowerCase();

      return (
        matchesSearch && matchesCategory && matchesStatus && matchesLocation
      );
    });

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "Name A-Z":
          return a.title.localeCompare(b.title);

        case "Latest Expiry":
          return (
            new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime()
          );

        case "FEFO":
          return (
            new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
          );

        default:
          return 0;
      }
    });

    return filtered;
  }, [
    inventoryItems,
    search,
    categoryFilter,
    statusFilter,
    locationFilter,
    sortBy,
  ]);
  return (
    <main className="w-full px-4 pt-24 pb-28 max-w-7xl mx-auto">
      {/* Inventory Role & Purpose Overview Banner */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 mb-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: What This Inventory Does */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0d5f94]/10 text-[#0d5f94] text-xs font-semibold mb-3">
              <span className="material-symbols-outlined text-[16px]">inventory_2</span>
              Smart Inventory System
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Intelligent Stock & Expiry Control
            </h1>

            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Expirova’s Smart Inventory is a proactive management center designed to prevent stock expiration waste in healthcare, pharmacies, and food storage facilities before it happens.
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-[#0d5f94]/10 text-[#0d5f94] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]">swap_vertical_circle</span>
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">FEFO Priority Sorting</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Automatically organizes items by First-Expired, First-Out to ensure closest-to-expiry stock is dispensed first.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]">alarm_on</span>
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">Tri-Tier Urgency Flags</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Dynamically classifies stock into Urgent (critical), Warning (near-term), and Stable with automated countdowns.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">Multi-Zone Location Tracking</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Monitors batch codes and storage zones across cold-chain, refrigerators, pharmacy shelves, and ER bays.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]">sync_saved_locally</span>
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">Scan-to-Catalog Sync</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Direct integration with the AI OCR camera instantly logs parsed product names, batch IDs, and expiry dates.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: User's Uploaded Illustration */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative rounded-2xl overflow-hidden bg-slate-50/70 border border-slate-200/80 p-4 w-full max-w-md shadow-xs hover:shadow-md transition-shadow">
              <img
                src={inventoryGuideImg}
                alt="Expirova Smart Inventory Management"
                className="w-full h-auto object-contain rounded-xl"
              />
              <div className="mt-3 text-center">
                <span className="text-[11px] font-semibold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200/80 shadow-2xs">
                  Real-time stock auditing & verification
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Items</p>
          <h2 className="text-3xl font-bold text-slate-900">
            {inventoryItems.length}
          </h2>
        </div>
        <div className="bg-red-50 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-red-500">Urgent</p>
          <h2 className="text-3xl font-bold text-red-600">
            {inventoryItems.filter((i) => i.status === "URGENT").length}
          </h2>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-orange-500">Warning</p>
          <h2 className="text-3xl font-bold text-orange-500">
            {inventoryItems.filter((i) => i.status === "WARNING").length}
          </h2>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 shadow-sm">
          <p className="text-sm text-[#0d5f94]">Stable</p>
          <h2 className="text-3xl font-bold text-[#0d5f94]">
            {inventoryItems.filter((i) => i.status === "STABLE").length}
          </h2>
        </div>
      </div>

      {/* Optional Clear Dummy Data Banner */}
      {hasSampleData && (
        <div className="mb-5 p-3 rounded-xl bg-amber-50/90 border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600 text-[20px]">info</span>
            <p className="text-xs text-amber-900 font-medium">
              Demo sample items are currently loaded. You can clear them to only display your own scanned items.
            </p>
          </div>
          <button
            type="button"
            onClick={() => clearSampleData()}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-amber-700 hover:bg-amber-100/60 border border-amber-300 flex items-center gap-1.5 shrink-0 transition shadow-2xs"
          >
            <span className="material-symbols-outlined text-[16px]">cleaning_services</span>
            Clear All Dummy Data
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <section className="mb-5">
        {/* Search */}
        <div className="relative mb-3">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder="Search item, batch, or location..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0d5f94] shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <span className="material-symbols-outlined text-[18px]">
                close
              </span>
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap mb-3">
          {statusPills.map(({ label, active, inactive }) => (
            <button
              key={label}
              type="button"
              onClick={() => setStatusFilter(label)}
              className={`
        px-4 py-2 rounded-full text-sm font-semibold
        transition-all duration-200
        hover:scale-105 active:scale-95
        ${statusFilter === label ? active : inactive}
      `}
            >
              {label === "All" ? "All Status" : label}
            </button>
          ))}
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Category */}
          <div className="relative">
            <span
              className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              style={{ fontSize: "15px" }}
            >
              category
            </span>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="
      w-full
      appearance-none
      bg-white
      border border-gray-200
      rounded-xl
      pl-10
      pr-10
      py-2.5
      text-sm
      font-medium
      text-gray-600
      cursor-pointer
      transition-all
      duration-300
      hover:bg-blue-50
      hover:border-[#0d5f94]
      hover:text-[#0d5f94]
      focus:bg-blue-50
      focus:border-[#0d5f94]
      focus:text-[#0d5f94]
      focus:ring-2
      focus:ring-[#0d5f94]/20
      focus:outline-none
    "
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "Category" : c}
                </option>
              ))}
            </select>

            <span
              className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              style={{ fontSize: "18px" }}
            >
              expand_more
            </span>
          </div>

          {/* Location */}
          <div className="relative">
            <span
              className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              style={{
                fontSize: "16px",
                fontVariationSettings: "'FILL' 0, 'wght' 300",
              }}
            >
              location_on
            </span>

            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="
      w-full
      appearance-none
      bg-white
      border
      border-gray-200
      rounded-xl
      pl-11
      pr-10
      py-3
      text-sm
      font-medium
      text-gray-600
      cursor-pointer
      transition-all
      duration-300
      hover:bg-[#e6f2fa]
      hover:border-[#0d5f94]
      hover:text-[#0d5f94]
      focus:bg-[#e6f2fa]
      focus:border-[#0d5f94]
      focus:text-[#0d5f94]
      focus:ring-2
      focus:ring-[#0d5f94]/20
      focus:outline-none
    "
            >
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l === "All" ? "Location" : l}
                </option>
              ))}
            </select>

            <span
              className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              style={{ fontSize: "18px" }}
            >
              expand_more
            </span>
          </div>

          {/* Sort */}
          <div className="relative col-span-2 md:col-span-1">
            <span
              className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              style={{ fontSize: "15px" }}
            >
              sort
            </span>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="
      w-full
      appearance-none
      bg-white
      border border-gray-200
      rounded-xl
      pl-10
      pr-10
      py-2.5
      text-sm
      font-medium
      text-gray-600
      cursor-pointer
      transition-all
      duration-300
      hover:bg-blue-50
      hover:border-[#0d5f94]
      hover:text-[#0d5f94]
      focus:bg-blue-50
      focus:border-[#0d5f94]
      focus:text-[#0d5f94]
      focus:ring-2
      focus:ring-[#0d5f94]/20
      focus:outline-none
    "
            >
              <option value="FEFO">FEFO</option>
              <option value="Latest Expiry">Latest Expiry</option>
              <option value="Name A-Z">Name A-Z</option>
            </select>

            <span
              className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              style={{ fontSize: "18px" }}
            >
              expand_more
            </span>
          </div>
        </div>

        {/* Result count + active filters */}
        <div className="flex items-center justify-between mt-3 px-1">
          <p className="text-sm text-gray-400">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {filteredItems.length}
            </span>{" "}
            of {inventoryItems.length} items
          </p>
          {(categoryFilter !== "All" ||
            locationFilter !== "All" ||
            statusFilter !== "All" ||
            search) && (
            <button
              onClick={() => {
                setCategoryFilter("All");
                setStatusFilter("All");
                setLocationFilter("All");
                setSearch("");
              }}
              className="text-sm text-[#0d5f94] font-medium hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="material-symbols-outlined text-5xl mb-3">
            inventory_2
          </span>
          <p className="text-lg font-medium text-gray-500">
            No items match your filters
          </p>
          <p className="text-sm mt-1">
            Try adjusting your search or clearing the filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, index) => (
            <div
              key={index}
              className={`bg-white border border-gray-200 rounded-xl p-5 border-l-4 ${item.borderColor} shadow-sm hover:shadow-lg transition-all duration-300`}
            >
              <div className="flex justify-between mb-3">
                <span
                  className={`${item.statusColor} px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide`}
                >
                  {item.status}
                </span>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === index ? null : index);
                    }}
                    className="p-1.5 rounded-full hover:bg-gray-100 transition"
                  >
                    <span className="material-symbols-outlined text-slate-800">
                      more_vert
                    </span>
                  </button>

                  {menuOpen === index && (
                    <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[180px]">
                      <button
                        onClick={() => removeItem(item)}
                        className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 transition font-medium text-xs"
                      >
                        <span className="material-symbols-outlined text-sm">
                          delete
                        </span>
                        Remove Item
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-semibold text-slate-900">
                {item.title}
              </h3>

              <div className="flex items-center gap-1.5 text-gray-500 mt-1 text-sm">
                <span className="material-symbols-outlined text-[16px]">
                  {item.icon}
                </span>
                {item.category}
              </div>

              <div className="mt-6 pt-4 border-t flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                    {item.status === "STABLE" ? "Expiry Date" : "Expiring In"}
                  </p>
                  <p className={`text-xl font-bold ${item.valueColor}`}>
                    {item.expiry}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-0.5">Location</p>
                  <p className="font-medium text-slate-700 text-sm">
                    {item.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
