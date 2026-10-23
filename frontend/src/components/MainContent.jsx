import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  getInventoryItems,
  getRecentScans,
  saveNewInventoryItem,
} from "../utils/inventoryStore";

export function MainContent() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [items, setItems] = useState(() => getInventoryItems());
  const [recentScans, setRecentScans] = useState(() => getRecentScans());

  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    location: "",
    expiryDate: "",
  });

  useEffect(() => {
    const handleUpdate = () => {
      setItems(getInventoryItems());
      setRecentScans(getRecentScans());
    };

    window.addEventListener("inventoryUpdated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("inventoryUpdated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const totalItemsCount = items.length;
  const urgentCount = items.filter((i) => i.status === "URGENT").length;
  const expiringSoonCount = items.filter(
    (i) => i.status === "WARNING" || i.status === "URGENT"
  ).length;

  return (
    <>
      <main className="px-4 py-6 mt-14 pb-28 bg-[#f8fafc] min-h-screen max-w-6xl mx-auto">
        {/* Summary Cards */}
        <section className="grid grid-cols-2 gap-3">
          <div className="col-span-2 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p className="text-gray-500 text-sm">Total Managed Items</p>

            <div className="flex items-end gap-2 mt-2">
              <h1 className="text-5xl font-bold text-slate-900">{totalItemsCount}</h1>

              <span className="text-[#0d5f94] font-medium text-sm mb-2">
                Live Synced
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 relative shadow-sm">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#a66a1f] rounded-l-2xl"></div>

            <p className="text-gray-500 text-sm">Expiring Soon</p>

            <h2 className="text-4xl font-bold text-[#a66a1f] mt-2">{expiringSoonCount}</h2>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 relative shadow-sm">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 rounded-l-2xl"></div>

            <p className="text-gray-500 text-sm">Urgent Action</p>

            <h2 className="text-4xl font-bold text-red-600 mt-2">{urgentCount}</h2>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mt-6">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">
            Quick Actions
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <Link to="/aiscan">
              <button className="bg-[#0d5f94] text-white rounded-2xl py-4 flex items-center justify-center gap-2 shadow-md hover:bg-[#0b527f] transition w-full">
                <span className="material-symbols-outlined">
                  qr_code_scanner
                </span>
                Start Scan
              </button>
            </Link>

            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[#dce9ff] border border-[#c1d8f5] text-slate-800 rounded-2xl py-4 flex items-center justify-center gap-2 shadow-sm hover:bg-[#cfe1ff] transition"
            >
              <span className="material-symbols-outlined">add</span>
              Manual Add
            </button>
          </div>
        </section>

        {/* Recent Scans */}
        <section className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">Recent Scans</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Today's scan activity in real time</p>
            </div>
            <Link
              to="/smartinventory"
              className="text-[#0d5f94] text-sm font-semibold hover:underline"
            >
              View Full Inventory →
            </Link>
          </div>

          <div className="space-y-3">
            {recentScans.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-slate-500 shadow-sm flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
                </div>
                <p className="font-bold text-slate-800 text-base">No items scanned today</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Products scanned or added today will appear here in real time with their exact scan timestamp.
                </p>
                <Link
                  to="/aiscan"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0d5f94] hover:bg-[#0b527f] text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                  Scan Item Now
                </Link>
              </div>
            ) : (
              recentScans.slice(0, 8).map((scan) => (
                <div
                  key={scan.id || `${scan.title}-${scan.scannedAt}`}
                  className="bg-white border border-gray-200 rounded-2xl p-4 flex justify-between items-center shadow-sm hover:shadow-md transition"
                >
                  <div className="flex gap-4 items-center">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        scan.status === "URGENT"
                          ? "bg-red-50 text-red-600"
                          : scan.status === "WARNING"
                          ? "bg-orange-50 text-[#a66a1f]"
                          : "bg-[#e6f2fa] text-[#0d5f94]"
                      }`}
                    >
                      <span className="material-symbols-outlined">
                        {scan.icon || "inventory_2"}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg text-slate-900">
                        {scan.title}
                      </h3>

                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 flex-wrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-[#0d5f94] bg-[#e6f2fa] px-2 py-0.5 rounded-md">
                          <span className="material-symbols-outlined text-[13px]">schedule</span>
                          {scan.scannedAt || "Today"}
                        </span>
                        {scan.location && (
                          <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            <span className="material-symbols-outlined text-[13px]">location_on</span>
                            {scan.location}
                          </span>
                        )}
                        {scan.barcode && (
                          <span className="font-mono text-[11px] text-slate-400">
                            #{scan.barcode}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      scan.statusColor ||
                      (scan.status === "URGENT"
                        ? "bg-red-100 text-red-600"
                        : scan.status === "WARNING"
                        ? "bg-orange-100 text-[#a66a1f]"
                        : "bg-[#d9ebf5] text-[#0d5f94]")
                    }`}
                  >
                    {scan.expiry || scan.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Waste Prevention */}
        <section className="mt-6 bg-[#213146] text-white rounded-3xl p-5 relative overflow-hidden">
          <div className="flex justify-between">
            <div>
              <h2 className="text-3xl font-bold">Waste Prevention</h2>

              <p className="text-slate-300">This quarter's impact metrics</p>
            </div>

            <span className="material-symbols-outlined text-[#97cbff]">
              eco
            </span>
          </div>

          <div className="flex items-end gap-2 h-28 mt-8">
            <div className="flex-1 h-10 bg-[#0d5f94]/40 rounded-t-lg"></div>
            <div className="flex-1 h-14 bg-[#0d5f94]/40 rounded-t-lg"></div>
            <div className="flex-1 h-18 bg-[#0d5f94]/40 rounded-t-lg"></div>
            <div className="flex-1 h-24 bg-[#0d5f94] rounded-t-lg"></div>
            <div className="flex-1 h-12 bg-[#0d5f94]/40 rounded-t-lg"></div>
          </div>

          <div className="border-t border-slate-600 mt-4 pt-4 flex justify-between">
            <div>
              <h3 className="text-5xl font-bold text-[#b1d7ff]">24.8%</h3>

              <p className="text-slate-300">Loss Reduction</p>
            </div>

            <div className="text-right">
              <h3 className="text-5xl font-bold text-[#b1d7ff]">$4,200</h3>

              <p className="text-slate-300">Savings Est.</p>
            </div>
          </div>
        </section>

      </main>
      {/* Modal goes HERE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-bold text-slate-800">
                Add Inventory Item
              </h2>

              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Item Name"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    name: e.target.value,
                  })
                }
                className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#0d5f94]"
              />

              <select
                value={newItem.category}
                onChange={(e) => {
                  const cat = e.target.value;
                  setNewItem({
                    ...newItem,
                    category: cat,
                    location: cat === "Medicine" ? "Pharmacy Shelf G-2" : "",
                  });
                }}
                className="w-full border border-gray-200 rounded-xl p-3"
              >
                <option value="">Select Category</option>
                <option value="Medicine">Medicine</option>
                <option value="Medical Supply">Medical Supply</option>
                <option value="IV Fluid">IV Fluid</option>
                <option value="Vaccine">Vaccine</option>
                <option value="Food & Dairy">Food & Dairy</option>
                <option value="General Goods">General Goods</option>
              </select>

              {newItem.category === "Medicine" ? (
                <select
                  value={newItem.location}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      location: e.target.value,
                    })
                  }
                  className="w-full border border-gray-200 rounded-xl p-3 text-slate-800"
                >
                  <option value="Pharmacy Shelf G-2">Pharmacy Shelf G-2</option>
                  <option value="Rack A-3">Rack A-3</option>
                  <option value="Cold Chain Lab 1">Cold Chain Lab 1</option>
                  <option value="ER Supply Bay">ER Supply Bay</option>
                  <option value="Dispensary Drawer 4">Dispensary Drawer 4</option>
                  <option value="Emergency Cart 1">Emergency Cart 1</option>
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Enter Storage Location Manually (e.g. Unit 4 Fridge, Pantry Shelf B)"
                  value={newItem.location}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      location: e.target.value,
                    })
                  }
                  className="w-full border border-gray-200 rounded-xl p-3"
                />
              )}

              <input
                type="datetime-local"
                value={newItem.expiryDate}
                onChange={(e) =>
                  setNewItem({
                    ...newItem,
                    expiryDate: e.target.value,
                  })
                }
                className="w-full border border-gray-200 rounded-xl p-3 font-mono text-sm"
              />

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="
    flex-1
    border border-gray-200
    py-3
    rounded-xl
    font-medium
    text-slate-700
    transition-all duration-200
    hover:bg-blue-50
    hover:border-[#0d5f94]
    hover:text-[#0d5f94]
    focus:bg-blue-50
    focus:border-[#0d5f94]
    focus:text-[#0d5f94]
    active:bg-[#0d5f94]
    active:text-white
  "
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    if (!newItem.name.trim() || !newItem.expiryDate) {
                      alert("Please enter at least the item name and expiry date.");
                      return;
                    }

                    saveNewInventoryItem({
                      name: newItem.name.trim(),
                      category: newItem.category || "Medicine",
                      location: newItem.location || "Pharmacy Shelf G-2",
                      expiryDate: newItem.expiryDate,
                    });

                    setShowAddModal(false);

                    setNewItem({
                      name: "",
                      category: "",
                      location: "",
                      expiryDate: "",
                    });
                  }}
                  className="
    flex-1
    bg-[#0d5f94]
    hover:bg-[#0b527f]
    text-white
    py-3
    rounded-xl
    font-semibold
    shadow-sm
    transition-all duration-200
    hover:shadow-md
    hover:-translate-y-0.5
    active:scale-95
    focus:outline-none
    focus:ring-2
    focus:ring-[#0d5f94]/30
  "
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
