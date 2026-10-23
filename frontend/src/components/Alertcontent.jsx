import { useState, useEffect } from "react";
import { getInventoryItems, deleteInventoryItem } from "../utils/inventoryStore";

export function Alertcontent() {
  const [inventoryItems, setInventoryItems] = useState(() => getInventoryItems());
  const [toast, setToast] = useState(false);

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

  const urgentAlerts = inventoryItems.filter((item) => item.status === "URGENT");
  const warningAlerts = inventoryItems.filter((item) => item.status === "WARNING");

  const markAsUsed = (item) => {
    deleteInventoryItem(item.id, item.title);
    setToast(true);

    setTimeout(() => {
      setToast(false);
    }, 3000);
  };

  const AlertCard = ({
    item,
    urgent = false,
  }) => (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="p-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h4 className="text-2xl font-bold text-gray-900">{item.title}</h4>
            <p className="text-gray-500 mt-1">Batch / Barcode: {item.barcode ? `#${item.barcode}` : (item.category || "General")}</p>
          </div>

          <span
            className={`text-sm px-4 py-2 rounded-full font-semibold whitespace-nowrap border ${
              urgent
                ? "bg-red-50 text-red-600 border-red-200"
                : "bg-orange-50 text-orange-600 border-orange-200"
            }`}
          >
            {item.expiry || (urgent ? "URGENT" : "WARNING")}
          </span>
        </div>

        <div className="flex gap-8 mt-5 text-gray-600">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">location_on</span>
            {item.location || "Pantry / Storage"}
          </div>

          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">calendar_today</span>
            {item.expiryDate || item.expiry}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 p-4">
        <button
          onClick={() => markAsUsed(item)}
          className="w-full bg-[#0d5f94] hover:bg-[#0b527f] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
        >
          <span className="material-symbols-outlined">check_circle</span>
          Mark as Consumed / Used
        </button>
      </div>
    </div>
  );

  return (
    <>
      <main
        className="overflow-y-auto px-6 pt-20 pb-32 bg-[#f8fafc] min-h-screen max-w-6xl mx-auto"
      >
        {/* HERO HEADER */}
        <section className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            Manage items nearing expiration with immediate actions.
          </h1>

          <p className="text-base text-gray-500 mt-2">
            Stay ahead and take action to reduce waste and improve inventory
            efficiency.
          </p>
        </section>

        {/* URGENT */}
        {urgentAlerts.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-red-600">
                error
              </span>

              <h3 className="text-2xl font-bold text-red-600 uppercase">
                Urgent Action ({urgentAlerts.length})
              </h3>
            </div>

            <div className="space-y-4">
              {urgentAlerts.map((item) => (
                <AlertCard key={item.id || item.barcode} item={item} urgent />
              ))}
            </div>
          </section>
        )}

        {/* WARNING */}
        {warningAlerts.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-orange-500">
                warning
              </span>

              <h3 className="text-2xl font-bold text-orange-500 uppercase">
                Expiring Soon ({warningAlerts.length})
              </h3>
            </div>

            <div className="space-y-4">
              {warningAlerts.map((item) => (
                <AlertCard key={item.id || item.barcode} item={item} />
              ))}
            </div>
          </section>
        )}

        {/* EMPTY STATE */}
        {urgentAlerts.length === 0 && warningAlerts.length === 0 && (
          <div className="bg-white rounded-2xl border p-12 text-center shadow-sm">
            <span className="material-symbols-outlined text-green-600 text-6xl">
              task_alt
            </span>

            <h3 className="text-2xl font-bold mt-4">All alerts cleared!</h3>

            <p className="text-gray-500 mt-2">
              No items currently require attention.
            </p>
          </div>
        )}
      </main>

      {/* SUCCESS TOAST */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-[100] bg-white border border-gray-200 shadow-2xl rounded-2xl p-5 min-w-[350px]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#dbeeff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#0d5f94]">
                check
              </span>
            </div>

            <div>
              <h4 className="font-bold text-gray-900">Item marked as used!</h4>

              <p className="text-gray-500 mt-1">
                The item has been removed from alerts.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
