// Shared Inventory Store & LocalStorage Synchronization for Expirova

export const DEFAULT_ITEMS = [
  {
    id: 1,
    status: "URGENT",
    categoryType: "Food & Dairy",
    statusColor: "bg-red-100 text-red-700",
    borderColor: "border-l-red-600",
    title: "Greek Yogurt",
    category: "Food & Dairy | Batch #GY42",
    barcode: "8901234567890",
    expiry: "2 Days",
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    location: "Unit 4, Fridge B",
    icon: "restaurant",
    valueColor: "text-red-600",
    scannedAt: "Scanned 2h ago",
  },
  {
    id: 2,
    status: "WARNING",
    categoryType: "Vaccine",
    statusColor: "bg-orange-100 text-orange-700",
    borderColor: "border-l-amber-500",
    title: "Influenza Vax",
    category: "Vaccine | Batch #V09",
    barcode: "8902345678901",
    expiry: "14 Days",
    expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    location: "Cold Chain Lab 1",
    icon: "vaccines",
    valueColor: "text-amber-600",
    scannedAt: "Scanned 5h ago",
  },
  {
    id: 3,
    status: "STABLE",
    categoryType: "Medicine",
    statusColor: "bg-blue-100 text-[#0d5f94]",
    borderColor: "border-l-[#0d5f94]",
    title: "Amoxicillin 500mg",
    category: "Medicine | Batch #AX123",
    barcode: "8903456789012",
    expiry: "12 Oct 2027",
    expiryDate: "2027-10-12",
    location: "Pharmacy Shelf G-2",
    icon: "medication",
    valueColor: "text-[#0d5f94]",
    scannedAt: "Scanned 1d ago",
  },
  {
    id: 4,
    status: "STABLE",
    categoryType: "IV Fluid",
    statusColor: "bg-blue-100 text-[#0d5f94]",
    borderColor: "border-l-[#0d5f94]",
    title: "Saline Solution 1L",
    category: "IV Fluid | Batch #SL99",
    barcode: "8904567890123",
    expiry: "05 Jan 2028",
    expiryDate: "2028-01-05",
    location: "ER Supply Bay",
    icon: "medical_services",
    valueColor: "text-[#0d5f94]",
    scannedAt: "Scanned 2d ago",
  },
  {
    id: 5,
    status: "STABLE",
    categoryType: "Medicine",
    statusColor: "bg-blue-100 text-[#0d5f94]",
    borderColor: "border-l-[#0d5f94]",
    title: "Paracetamol 650mg",
    category: "Medicine | Batch #PC44",
    barcode: "8905678901234",
    expiry: "20 Feb 2028",
    expiryDate: "2028-02-20",
    location: "Rack A-3",
    icon: "medication",
    valueColor: "text-[#0d5f94]",
    scannedAt: "Scanned 3d ago",
  },
  {
    id: 6,
    status: "STABLE",
    categoryType: "Medical Supply",
    statusColor: "bg-blue-100 text-[#0d5f94]",
    borderColor: "border-l-[#0d5f94]",
    title: "Syringe Pack",
    category: "Medical Supply",
    barcode: "8906789012345",
    expiry: "10 Jun 2028",
    expiryDate: "2028-06-10",
    location: "Storage Room",
    icon: "vaccines",
    valueColor: "text-[#0d5f94]",
    scannedAt: "Scanned 4d ago",
  },
];

export const getDefaultLocationForCategory = (category) => {
  switch (category) {
    case "Hair Care":
    case "Skin Care":
    case "Personal Care":
      return "Bathroom Shelf";
    case "Food & Grocery":
    case "Food & Dairy":
      return "Pantry";
    case "Beverage":
      return "Refrigerator";
    case "Medicine":
      return "Medicine Cabinet";
    case "Household":
      return "Storage Closet";
    default:
      return "General Storage";
  }
};

export const getCategoryIcon = (category) => {
  switch (category) {
    case "Hair Care":
      return "content_cut";
    case "Skin Care":
      return "spa";
    case "Personal Care":
      return "soap";
    case "Food & Grocery":
    case "Food & Dairy":
      return "restaurant";
    case "Beverage":
      return "local_cafe";
    case "Medicine":
      return "medication";
    case "Household":
      return "cleaning_services";
    case "Vaccine":
      return "vaccines";
    default:
      return "inventory_2";
  }
};

export const toLocalDateTimeInputValue = (dateInput) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
};

export const calculateStatusAndExpiry = (expiryDateString) => {
  if (!expiryDateString) {
    return {
      status: "STABLE",
      expiry: "No Expiry",
      statusColor: "bg-blue-100 text-[#0d5f94]",
      borderColor: "border-l-[#0d5f94]",
      valueColor: "text-[#0d5f94]",
    };
  }

  const now = new Date();
  // Support both YYYY-MM-DDTHH:mm and YYYY-MM-DD
  let target;
  if (typeof expiryDateString === "string" && expiryDateString.length === 10) {
    target = new Date(`${expiryDateString}T23:59:59`);
  } else {
    target = new Date(expiryDateString);
  }

  if (isNaN(target.getTime())) {
    return {
      status: "STABLE",
      expiry: "Invalid Date",
      statusColor: "bg-blue-100 text-[#0d5f94]",
      borderColor: "border-l-[#0d5f94]",
      valueColor: "text-[#0d5f94]",
    };
  }

  const diffMs = target.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // 1. PAST EXPIRATION
  if (diffMs <= 0) {
    const expiredHoursAgo = Math.abs(diffHours);
    let expiredText;
    if (expiredHoursAgo < 1) {
      expiredText = "Expired Just Now";
    } else if (expiredHoursAgo < 24) {
      const h = Math.floor(expiredHoursAgo);
      expiredText = `Expired (${h}h ago)`;
    } else {
      const d = Math.floor(expiredHoursAgo / 24);
      expiredText = `Expired (${d}d ago)`;
    }
    return {
      status: "URGENT",
      expiry: expiredText,
      statusColor: "bg-red-100 text-red-700",
      borderColor: "border-l-red-600",
      valueColor: "text-red-600",
    };
  }

  // 2. EXPIRING TODAY (< 24 HOURS)
  if (diffHours <= 24) {
    const h = Math.max(1, Math.round(diffHours));
    return {
      status: "URGENT",
      expiry: h === 1 ? "Expires in 1 Hour" : `Expires in ${h} Hours`,
      statusColor: "bg-red-100 text-red-700",
      borderColor: "border-l-red-600",
      valueColor: "text-red-600",
    };
  }

  // 3. EXPIRING IN 1 TO 3 DAYS (URGENT)
  if (diffDays <= 3) {
    const days = Math.max(1, Math.ceil(diffDays));
    return {
      status: "URGENT",
      expiry: `${days} Day${days > 1 ? "s" : ""}`,
      statusColor: "bg-red-100 text-red-700",
      borderColor: "border-l-red-600",
      valueColor: "text-red-600",
    };
  }

  // 4. EXPIRING IN 4 TO 14 DAYS (WARNING)
  if (diffDays <= 14) {
    const days = Math.ceil(diffDays);
    return {
      status: "WARNING",
      expiry: `${days} Days`,
      statusColor: "bg-orange-100 text-orange-700",
      borderColor: "border-l-amber-500",
      valueColor: "text-amber-600",
    };
  }

  // 5. STABLE (> 14 DAYS)
  const formatted = target.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return {
    status: "STABLE",
    expiry: formatted,
    statusColor: "bg-blue-100 text-[#0d5f94]",
    borderColor: "border-l-[#0d5f94]",
    valueColor: "text-[#0d5f94]",
  };
};

export const getInventoryItems = () => {
  let items = [];
  try {
    const saved = localStorage.getItem("inventoryItems");
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Return exactly what the user has saved, even if empty array! Never resurrect dummy data.
        items = parsed;
      }
    } else {
      // First time initialization only
      items = DEFAULT_ITEMS;
      localStorage.setItem("inventoryItems", JSON.stringify(DEFAULT_ITEMS));
    }
  } catch (e) {
    console.error("Error reading inventoryItems from localStorage:", e);
  }

  // Dynamically evaluate status & expiry text against the exact current moment
  return items.map((item) => {
    if (item.expiryDate) {
      const live = calculateStatusAndExpiry(item.expiryDate);
      return {
        ...item,
        status: live.status,
        expiry: live.expiry,
        statusColor: live.statusColor,
        borderColor: live.borderColor,
        valueColor: live.valueColor,
      };
    }
    return item;
  });
};

export const deleteInventoryItem = (id, title) => {
  let current = [];
  try {
    const saved = localStorage.getItem("inventoryItems");
    if (saved !== null) {
      current = JSON.parse(saved) || [];
    }
  } catch (e) {
    console.error(e);
  }

  const updatedItems = current.filter((item) => {
    if (id && item.id) {
      return String(item.id) !== String(id);
    }
    if (title && item.title) {
      return item.title.trim().toLowerCase() !== title.trim().toLowerCase();
    }
    return true;
  });

  localStorage.setItem("inventoryItems", JSON.stringify(updatedItems));

  // Also remove from recentScans if present
  try {
    const scans = JSON.parse(localStorage.getItem("recentScans")) || [];
    const updatedScans = scans.filter((s) => {
      if (id && s.id) {
        return String(s.id) !== String(id);
      }
      if (title && s.title) {
        return s.title.trim().toLowerCase() !== title.trim().toLowerCase();
      }
      return true;
    });
    localStorage.setItem("recentScans", JSON.stringify(updatedScans));
  } catch (e) {
    console.error(e);
  }

  window.dispatchEvent(new CustomEvent("inventoryUpdated"));
  return updatedItems;
};

export const clearSampleData = () => {
  const sampleTitles = [
    "Greek Yogurt",
    "Influenza Vax",
    "Amoxicillin 500mg",
    "Saline Solution 1L",
    "Paracetamol 650mg",
    "Syringe Pack",
  ];

  let current = [];
  try {
    const saved = localStorage.getItem("inventoryItems");
    if (saved !== null) {
      current = JSON.parse(saved) || [];
    }
  } catch (e) {
    console.error(e);
  }

  const onlyUserItems = current.filter((item) => !sampleTitles.includes(item.title));
  localStorage.setItem("inventoryItems", JSON.stringify(onlyUserItems));

  // Also clean up recentScans
  try {
    const scans = JSON.parse(localStorage.getItem("recentScans")) || [];
    const cleanScans = scans.filter((s) => !sampleTitles.includes(s.title));
    localStorage.setItem("recentScans", JSON.stringify(cleanScans));
  } catch (e) {
    console.error(e);
  }

  window.dispatchEvent(new CustomEvent("inventoryUpdated"));
  return onlyUserItems;
};

export const saveNewInventoryItem = ({
  name,
  category = "Personal Care",
  location,
  expiryDate,
  barcode,
  mfgDate,
}) => {
  const metrics = calculateStatusAndExpiry(expiryDate);
  const cleanBarcode = barcode || `BC-${Math.floor(100000 + Math.random() * 900000)}`;
  const batchNumber = Math.floor(100 + Math.random() * 900);

  const now = new Date();
  const timeFormatted = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const finalLocation = location ? location.trim() : getDefaultLocationForCategory(category);

  const newItem = {
    id: Date.now(),
    title: name,
    categoryType: category,
    category: `${category} | Batch #${batchNumber}`,
    barcode: cleanBarcode,
    location: finalLocation,
    expiryDate: expiryDate,
    mfgDate: mfgDate || now.toISOString().split("T")[0],
    expiry: metrics.expiry,
    status: metrics.status,
    statusColor: metrics.statusColor,
    borderColor: metrics.borderColor,
    valueColor: metrics.valueColor,
    icon: getCategoryIcon(category),
    scannedTimestamp: now.toISOString(),
    scannedAt: `Today at ${timeFormatted}`,
  };

  const currentItems = getInventoryItems();
  const updatedItems = [newItem, ...currentItems.filter((i) => i.id !== newItem.id)];

  localStorage.setItem("inventoryItems", JSON.stringify(updatedItems));

  // Also update recent scans list for the Dashboard (keep today's scans)
  try {
    const existingScans = JSON.parse(localStorage.getItem("recentScans")) || [];
    const todayStr = now.toDateString();

    const filteredToday = existingScans.filter((s) => {
      if (!s) return false;
      const ts = s.scannedTimestamp || (typeof s.id === "number" && s.id > 1700000000000 ? s.id : null);
      if (!ts) return false;
      return new Date(ts).toDateString() === todayStr;
    });

    const updatedScans = [newItem, ...filteredToday.filter((s) => s.id !== newItem.id)].slice(0, 15);
    localStorage.setItem("recentScans", JSON.stringify(updatedScans));
  } catch (e) {
    console.error("Error updating recentScans:", e);
  }

  // Dispatch custom event to notify all components in real-time
  window.dispatchEvent(new CustomEvent("inventoryUpdated", { detail: newItem }));

  return newItem;
};

/**
 * Returns only scans performed TODAY with their real-time timestamp.
 * Returns an empty array if nothing was scanned today (no dummy data).
 */
export const getRecentScans = () => {
  try {
    const saved = localStorage.getItem("recentScans");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const now = new Date();
        const todayStr = now.toDateString();

        // Strictly filter for scans created TODAY
        const todayScans = parsed
          .filter((item) => {
            if (!item) return false;
            const ts = item.scannedTimestamp || (typeof item.id === "number" && item.id > 1700000000000 ? item.id : null);
            if (!ts) return false;
            const itemDate = new Date(ts);
            return !isNaN(itemDate.getTime()) && itemDate.toDateString() === todayStr;
          })
          .map((item) => {
            const ts = item.scannedTimestamp || (typeof item.id === "number" && item.id > 1700000000000 ? item.id : null);
            if (ts) {
              const itemDate = new Date(ts);
              const timeFormatted = itemDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
              return {
                ...item,
                scannedAt: `Today at ${timeFormatted}`,
              };
            }
            return item;
          });

        return todayScans;
      }
    }
  } catch (e) {
    console.error("Error reading recentScans:", e);
  }

  // Return empty array if no scans occurred today (no fake dummy data)
  return [];
};
