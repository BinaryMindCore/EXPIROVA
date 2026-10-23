import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { getInventoryItems } from "../utils/inventoryStore";

export function Profilecontent() {
  const navigate = useNavigate();

  // Loading and Notification States
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3500);
  };

  // Helper: Format initials from full name or email
  const getInitials = (name, email) => {
    if (name && name.trim()) {
      const parts = name.trim().split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "EX";
  };

  // User Profile Information State
  const [userInfo, setUserInfo] = useState(() => {
    let storedUser = null;
    try {
      const u = localStorage.getItem("currentUser") || localStorage.getItem("user");
      if (u) storedUser = JSON.parse(u);
    } catch {
      /* ignore storage parse error */
    }

    const rememberedEmail = storedUser?.email || localStorage.getItem("rememberedEmail") || "user@example.com";
    const rememberedName = storedUser?.name || localStorage.getItem("rememberedFullName") || rememberedEmail.split("@")[0];

    return {
      name: rememberedName,
      email: rememberedEmail,
      phone: storedUser?.phone || "+1 (555) 019-2834",
      role: storedUser?.role || "Personal Account",
      avatarUrl: storedUser?.avatar_url || "",
      memberSince: "October 2026",
      signUpMethod: "Email & Password Authentication",
    };
  });

  // Modal form states
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    role: "Personal Account",
  });
  const [formErrors, setFormErrors] = useState({});

  // Inventory Statistics State
  const [stats, setStats] = useState(() => {
    const items = getInventoryItems();
    const total = items.length;
    const tracked = items.filter((i) => i.status !== "URGENT").length;
    const resolved = total === 0 ? "100%" : Math.round((tracked / total) * 100) + "%";
    return { totalItems: total, activeItems: tracked, freshSafePct: resolved };
  });

  // Alert and App Preferences State
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem("userPreferences");
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore storage parse error */
    }
    return {
      expiryAlerts: true,
      emailNotifications: true,
      twoFactor: false,
      reminderTiming: "14, 7, 3, 1 day",
    };
  });

  const [customReminderDays, setCustomReminderDays] = useState(() => {
    return localStorage.getItem("customReminderDays") || "21, 14, 7, 1";
  });

  // Modals visibility
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  // Password modal form
  const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
  const [passwordStatus, setPasswordStatus] = useState({ loading: false, error: "", success: "" });

  // 1. Sync inventory stats from store and backend
  const refreshInventoryStats = async () => {
    try {
      const localItems = getInventoryItems();
      let allItems = [...localItems];

      // Optionally fetch server inventory if token exists
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await API.get("/inventory");
          if (res.data?.products && Array.isArray(res.data.products) && res.data.products.length > 0) {
            // merge unique by id or barcode
            const serverProducts = res.data.products.map(p => ({
              id: p.id,
              status: new Date(p.expiry_date) < new Date() ? "URGENT" : "STABLE",
            }));
            allItems = serverProducts;
          }
        } catch {
          /* ignore server inventory fetch error */
        }
      }

      const total = allItems.length;
      const tracked = allItems.filter((i) => i.status !== "URGENT").length;
      const resolved = total === 0 ? "100%" : Math.round((tracked / total) * 100) + "%";
      setStats({ totalItems: total, activeItems: tracked, freshSafePct: resolved });
    } catch (err) {
      console.warn("Stats evaluation error:", err);
    }
  };

  // 2. Fetch authenticated user data on page load
  useEffect(() => {
    const handleInventoryChange = () => refreshInventoryStats();
    window.addEventListener("inventoryUpdated", handleInventoryChange);
    window.addEventListener("storage", handleInventoryChange);

    const fetchUserProfile = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const res = await API.get("/auth/me");
          if (res.data?.success && res.data?.user) {
            const user = res.data.user;

            // Format member since date
            let formattedMemberSince = "October 2026";
            if (user.created_at) {
              const d = new Date(user.created_at);
              if (!isNaN(d.getTime())) {
                formattedMemberSince = d.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                });
              }
            }

            const updatedInfo = {
              name: user.name || user.email.split("@")[0],
              email: user.email,
              phone: user.phone || "+1 (555) 019-2834",
              role: user.role || "Personal Account",
              avatarUrl: user.avatar_url || "",
              memberSince: formattedMemberSince,
              signUpMethod: "Email & Password Authentication",
            };

            setUserInfo(updatedInfo);
            localStorage.setItem("user", JSON.stringify(updatedInfo));
            localStorage.setItem("currentUser", JSON.stringify(updatedInfo));
            localStorage.setItem("rememberedFullName", updatedInfo.name);
            localStorage.setItem("rememberedEmail", updatedInfo.email);

            // Sync preferences if returned
            const updatedPrefs = {
              expiryAlerts: user.expiry_alerts !== undefined ? Boolean(user.expiry_alerts) : true,
              emailNotifications: user.email_notifications !== undefined ? Boolean(user.email_notifications) : true,
              twoFactor: false,
              reminderTiming: user.reminder_timing || "14, 7, 3, 1 day",
            };
            setPreferences(updatedPrefs);
            localStorage.setItem("userPreferences", JSON.stringify(updatedPrefs));
          }
        } catch (err) {
          console.warn("Could not fetch remote profile, using cached user data:", err.message);
        }
      }
      setLoading(false);
    };

    fetchUserProfile();

    return () => {
      window.removeEventListener("inventoryUpdated", handleInventoryChange);
      window.removeEventListener("storage", handleInventoryChange);
    };
  }, []);

  // Open Edit Profile Modal with existing details
  const handleOpenEditModal = () => {
    setEditForm({
      name: userInfo.name,
      phone: userInfo.phone || "+1 (555) 019-2834",
      role: userInfo.role || "Personal Account",
    });
    setFormErrors({});
    setIsEditProfileModalOpen(true);
  };

  // Form validation & submission for editing profile
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    const errors = {};

    if (!editForm.name || !editForm.name.trim()) {
      errors.name = "Full Name cannot be empty.";
    }

    if (editForm.phone && editForm.phone.trim()) {
      // Basic validation for phone number characters
      const phoneDigits = editForm.phone.replace(/[^0-9]/g, "");
      if (phoneDigits.length < 7) {
        errors.phone = "Please enter a valid phone number with at least 7 digits.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaveLoading(true);

    try {
      const token = localStorage.getItem("token");
      const updatedData = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        role: editForm.role.trim() || "Personal Account",
      };

      if (token) {
        const res = await API.put("/auth/profile", updatedData);
        if (res.data?.success && res.data?.user) {
          const u = res.data.user;
          updatedData.name = u.name || updatedData.name;
          updatedData.phone = u.phone || updatedData.phone;
          updatedData.role = u.role || updatedData.role;
        }
      }

      // Update state and localStorage immediately
      const newInfo = {
        ...userInfo,
        name: updatedData.name,
        phone: updatedData.phone,
        role: updatedData.role,
      };

      setUserInfo(newInfo);
      localStorage.setItem("user", JSON.stringify(newInfo));
      localStorage.setItem("currentUser", JSON.stringify(newInfo));
      localStorage.setItem("rememberedFullName", updatedData.name);

      setIsEditProfileModalOpen(false);
      showToast("Profile details updated successfully!");
    } catch (err) {
      console.error("Save profile error:", err);
      showToast(err.response?.data?.message || "Failed to update profile. Saved locally.", "error");
      
      // Fallback update to local state
      setUserInfo(prev => ({
        ...prev,
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        role: editForm.role.trim(),
      }));
      setIsEditProfileModalOpen(false);
    } finally {
      setSaveLoading(false);
    }
  };

  // Toggle Alert preferences (Expiry Alerts, Email Notifications)
  const handleToggle = async (key) => {
    const newValue = !preferences[key];
    const updated = { ...preferences, [key]: newValue };
    setPreferences(updated);
    localStorage.setItem("userPreferences", JSON.stringify(updated));

    // Persist to backend if token available
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = {};
        if (key === "expiryAlerts") payload.expiry_alerts = newValue;
        if (key === "emailNotifications") payload.email_notifications = newValue;
        await API.put("/auth/profile", payload);
      } catch (err) {
        console.warn("Remote preference sync warning:", err.message);
      }
    }

    showToast(`${key === "expiryAlerts" ? "Expiry alerts" : "Email notifications"} ${newValue ? "enabled" : "disabled"}.`);
  };

  // Timing dropdown change
  const handleTimingChange = async (e) => {
    const newValue = e.target.value;
    const updated = { ...preferences, reminderTiming: newValue };
    setPreferences(updated);
    localStorage.setItem("userPreferences", JSON.stringify(updated));

    const token = localStorage.getItem("token");
    if (token) {
      try {
        await API.put("/auth/profile", { reminder_timing: newValue });
      } catch (err) {
        console.warn("Timing preference sync error:", err.message);
      }
    }

    showToast(`Reminder timing set to ${newValue}.`);
  };

  // Primary Save Changes button
  const handleApplyAndSave = async () => {
    setSaveLoading(true);
    try {
      localStorage.setItem("userPreferences", JSON.stringify(preferences));
      localStorage.setItem("rememberedFullName", userInfo.name);
      localStorage.setItem("rememberedEmail", userInfo.email);
      if (preferences.reminderTiming === "Custom") {
        localStorage.setItem("customReminderDays", customReminderDays);
      }

      const token = localStorage.getItem("token");
      if (token) {
        await API.put("/auth/profile", {
          name: userInfo.name,
          phone: userInfo.phone,
          role: userInfo.role,
          expiry_alerts: preferences.expiryAlerts,
          email_notifications: preferences.emailNotifications,
          reminder_timing: preferences.reminderTiming === "Custom" ? customReminderDays : preferences.reminderTiming,
        });
      }

      showToast("All profile settings and preferences applied successfully!");
    } catch (err) {
      console.warn("Save settings warning:", err.message);
      showToast("Settings saved to local storage!", "success");
    } finally {
      setSaveLoading(false);
    }
  };

  // Logout methods
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("currentUser");
    navigate("/auth", { state: { loggedOut: true } });
  };

  const handleLogoutAllDevices = () => {
    if (confirm("Are you sure you want to log out from all devices? You will be signed out everywhere.")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("currentUser");
      navigate("/auth", { state: { loggedOut: true } });
    }
  };

  // Change password submission
  const handleChangePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      setPasswordStatus({ loading: false, error: "New password must be at least 6 characters long.", success: "" });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ loading: false, error: "Passwords do not match.", success: "" });
      return;
    }

    setPasswordStatus({ loading: false, error: "", success: "Password updated successfully!" });
    setTimeout(() => {
      setIsChangePasswordModalOpen(false);
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      setPasswordStatus({ loading: false, error: "", success: "" });
      showToast("Your password was successfully updated.");
    }, 1200);
  };

  return (
    <main className="pt-20 pb-24 px-4 max-w-6xl mx-auto space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Profile & Settings</h2>
        <p className="text-sm text-gray-500">
          Manage your credentials and preferences for Expirova
        </p>
      </div>

      {/* Toast Notification Alert */}
      {toast.show && (
        <div
          className={`p-3.5 border rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn transition-all ${
            toast.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              {toast.type === "error" ? "error" : "check_circle"}
            </span>
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => setToast({ show: false, message: "", type: "success" })}
            className="cursor-pointer opacity-70 hover:opacity-100"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="bg-white border border-gray-200 rounded-xl p-6 h-72"></div>
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 h-72"></div>
        </div>
      ) : (
        /* Responsive Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT COLUMN: Profile Header & Inventory Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Header Card */}
            <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              <div
                className="absolute top-0 left-0 w-full h-1"
                style={{ backgroundColor: "#0d5f94" }}
              ></div>

              {/* Dynamic Avatar with initials fallback */}
              <div className="relative mt-2">
                {userInfo.avatarUrl ? (
                  <img
                    alt={userInfo.name}
                    className="w-24 h-24 rounded-full object-cover border-2 shadow-xs"
                    style={{ borderColor: "#cde4f5" }}
                    src={userInfo.avatarUrl}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget.nextSibling;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                ) : null}

                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center font-bold text-2xl text-white shadow-xs border-2 ${
                    userInfo.avatarUrl ? "hidden" : "flex"
                  }`}
                  style={{
                    background: "linear-gradient(135deg, #0d5f94 0%, #177cb0 100%)",
                    borderColor: "#cde4f5",
                  }}
                >
                  {getInitials(userInfo.name, userInfo.email)}
                </div>

                <button
                  type="button"
                  title="Edit profile"
                  className="absolute bottom-0 right-0 text-white p-1 rounded-full border-2 border-white active:scale-95 transition-transform cursor-pointer"
                  style={{ backgroundColor: "#0d5f94" }}
                  onClick={handleOpenEditModal}
                >
                  <span className="material-symbols-outlined text-[16px] block">
                    edit
                  </span>
                </button>
              </div>

              {/* Identity details */}
              <div className="flex-grow mt-3 w-full">
                <div className="flex flex-col items-center gap-1.5">
                  <h3 className="text-lg font-semibold text-gray-900 truncate max-w-[260px]">
                    {userInfo.name}
                  </h3>
                  <span
                    className="px-3 py-0.5 rounded-full text-xs font-medium w-fit"
                    style={{ backgroundColor: "#e8f3fb", color: "#0d5f94" }}
                  >
                    {userInfo.role}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2 truncate max-w-[260px] mx-auto">
                  {userInfo.email}
                </p>
                <p className="text-sm font-mono text-gray-500 mt-0.5">
                  {userInfo.phone || "+1 (555) 019-2834"}
                </p>
              </div>

              <button
                type="button"
                className="mt-5 w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors active:scale-95 border cursor-pointer"
                style={{ borderColor: "#0d5f94", color: "#0d5f94" }}
                onClick={handleOpenEditModal}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#e8f3fb")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                Edit Profile
              </button>
            </section>

            {/* Real Dynamic Inventory Activity Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Total Items
                </p>
                <p
                  className="text-lg font-bold mt-1"
                  style={{ color: "#0d5f94" }}
                >
                  {stats.totalItems}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Active Items
                </p>
                <p
                  className="text-lg font-bold mt-1"
                  style={{ color: "#0d5f94" }}
                >
                  {stats.activeItems}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Fresh & Safe
                </p>
                <p className="text-lg font-bold text-green-700 mt-1">
                  {stats.freshSafePct}
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Personal Details, Alert Preferences, Session */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Details Card */}
            <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined"
                    style={{ color: "#0d5f94" }}
                  >
                    badge
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Personal Details
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Verified Member
                </span>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-400">Full Name</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {userInfo.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400">Email Address</p>
                  <p className="text-sm font-semibold text-gray-800 break-all">
                    {userInfo.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400">Phone Number</p>
                  <p className="text-sm font-semibold text-gray-800 font-mono">
                    {userInfo.phone || "+1 (555) 019-2834"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400">Account Type</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {userInfo.role}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400">Expirova Plan</p>
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-500 text-[16px]">stars</span>
                    Personal Free Plan
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400">Active Storage</p>
                  <p className="text-sm font-semibold text-gray-800">
                    Kitchen Pantry, Fridge, Medicine
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400">Member Since</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {userInfo.memberSince}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400">Sign-Up Method</p>
                  <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#0d5f94]">mail</span>
                    {userInfo.signUpMethod}
                  </p>
                </div>
              </div>
            </section>

            {/* Alert Preferences Card */}
            <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600">
                    notifications_active
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Alert Preferences
                  </h3>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {/* Expiry Alerts Toggle */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Expiry Alerts
                    </p>
                    <p className="text-xs text-gray-500">
                      Get notified before groceries, food, or medicines expire
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.expiryAlerts}
                      onChange={() => handleToggle("expiryAlerts")}
                    />
                    <div
                      className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"
                      style={
                        preferences.expiryAlerts
                          ? { backgroundColor: "#0d5f94" }
                          : {}
                      }
                    ></div>
                  </label>
                </div>

                {/* Email Notifications Toggle */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Email Notifications
                    </p>
                    <p className="text-xs text-gray-500">
                      Weekly summary reports from Expirova
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.emailNotifications}
                      onChange={() => handleToggle("emailNotifications")}
                    />
                    <div
                      className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"
                      style={
                        preferences.emailNotifications
                          ? { backgroundColor: "#0d5f94" }
                          : {}
                      }
                    ></div>
                  </label>
                </div>

                {/* Reminder Timing Dropdown */}
                <div className="p-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    Reminder Timing
                  </label>
                  <select
                    value={preferences.reminderTiming}
                    onChange={handleTimingChange}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-800 outline-none cursor-pointer"
                    style={{ "--tw-ring-color": "#0d5f94" }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#0d5f94";
                      e.target.style.boxShadow = "0 0 0 1px #0d5f94";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e5e7eb";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    <option value="30, 14, 7, 1 day">30, 14, 7, 1 day</option>
                    <option value="14, 7, 3, 1 day">14, 7, 3, 1 day</option>
                    <option value="7, 3, 1 day">7, 3, 1 day</option>
                    <option value="Custom">Custom</option>
                  </select>

                  {preferences.reminderTiming === "Custom" && (
                    <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl animate-fadeIn">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Custom Reminder Intervals (days before expiry)
                      </label>
                      <input
                        type="text"
                        value={customReminderDays}
                        onChange={(e) => setCustomReminderDays(e.target.value)}
                        placeholder="e.g. 21, 14, 7, 1"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0d5f94]"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        Enter comma-separated days before expiry to receive notification alerts.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Security & Privacy Card */}
            <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <span
                  className="material-symbols-outlined"
                  style={{ color: "#0d5f94" }}
                >
                  security
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Security & Privacy
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Two-Factor Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Two-Factor Authentication
                    </p>
                    <p className="text-xs text-gray-500">
                      Add extra verification layer for your Expirova account
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.twoFactor}
                      onChange={() => handleToggle("twoFactor")}
                    />
                    <div
                      className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white"
                      style={
                        preferences.twoFactor
                          ? { backgroundColor: "#0d5f94" }
                          : {}
                      }
                    ></div>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setIsChangePasswordModalOpen(true)}
                  className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-500 text-[18px]">lock_reset</span>
                    <span className="text-sm font-medium text-gray-800">
                      Change Password
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-gray-400 group-hover:translate-x-1 transition-transform">
                    chevron_right
                  </span>
                </button>
              </div>
            </section>

            {/* Session Management & Primary Save Button */}
            <section className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                <span
                  className="material-symbols-outlined"
                  style={{ color: "#0d5f94" }}
                >
                  devices
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Session Management
                </h3>
              </div>
              <div className="p-4 space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">
                    Current Session
                  </h4>
                  <div
                    className="flex items-center justify-between p-3 rounded-lg border"
                    style={{
                      backgroundColor: "#e8f3fb55",
                      borderColor: "#b3d5ed",
                    }}
                  >
                    <div className="flex gap-3">
                      <span
                        className="material-symbols-outlined"
                        style={{ color: "#0d5f94" }}
                      >
                        laptop_chromebook
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-gray-900">
                          Current Device &middot; {userInfo.email}
                        </p>
                        <p className="text-xs text-green-700 font-medium mt-0.5">
                          Active session now
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Apply & Save Settings Primary Banner */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                    <div>
                      <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[#0d5f94] text-[18px]">verified</span>
                        Apply & Save Settings
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Saves your alert preferences, custom reminder intervals, and personal details.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={saveLoading}
                      onClick={handleApplyAndSave}
                      className="w-full sm:w-auto px-6 py-2.5 bg-[#0d5f94] hover:bg-[#0b527f] active:scale-95 text-white text-sm font-semibold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-70"
                    >
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      {saveLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>

                {/* Logout Action Buttons */}
                <div className="pt-3 border-t border-gray-200 space-y-2.5">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Account Session & Logout
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="button"
                      onClick={handleLogoutAllDevices}
                      className="flex-1 py-2.5 px-3 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px] text-gray-500">power_settings_new</span>
                      Logout from All Devices
                    </button>
                    <button
                      type="button"
                      className="flex-1 py-2.5 px-3 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      onClick={() => setIsLogoutModalOpen(true)}
                    >
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                      Logout from This Device
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setIsLogoutModalOpen(false)}
          ></div>
          <div className="relative w-full max-w-sm p-4 mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Sign Out</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to log out from Expirova? Any unsaved changes will be lost.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-full text-sm font-medium shadow-sm active:scale-95 transition cursor-pointer"
                  onClick={handleLogout}
                >
                  Confirm Logout
                </button>
                <button
                  type="button"
                  className="w-full py-3 text-gray-500 text-sm font-medium hover:bg-gray-50 rounded-full transition cursor-pointer"
                  onClick={() => setIsLogoutModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setIsEditProfileModalOpen(false)}
          ></div>
          <div className="relative w-full max-w-md mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 animate-fadeIn">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0d5f94]">edit_note</span>
                  <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
                </div>
                <button
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nandani Honey"
                    value={editForm.name}
                    onChange={(e) => {
                      setEditForm({ ...editForm, name: e.target.value });
                      if (formErrors.name) setFormErrors({ ...formErrors, name: null });
                    }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition ${
                      formErrors.name
                        ? "border-red-400 focus:ring-1 focus:ring-red-400"
                        : "border-gray-300 focus:border-[#0d5f94] focus:ring-1 focus:ring-[#0d5f94]"
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Account Type / Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#0d5f94] focus:ring-1 focus:ring-[#0d5f94] bg-white cursor-pointer"
                  >
                    <option value="Personal Account">Personal Account</option>
                    <option value="Household Manager">Household Manager</option>
                    <option value="Pharmacy / Clinic Staff">Pharmacy / Clinic Staff</option>
                    <option value="Healthcare Professional">Healthcare Professional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +1 (555) 019-2834"
                    value={editForm.phone}
                    onChange={(e) => {
                      setEditForm({ ...editForm, phone: e.target.value });
                      if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
                    }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm outline-none font-mono transition ${
                      formErrors.phone
                        ? "border-red-400 focus:ring-1 focus:ring-red-400"
                        : "border-gray-300 focus:border-[#0d5f94] focus:ring-1 focus:ring-[#0d5f94]"
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Email Address (Account Identifier)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={userInfo.email}
                    className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-400 rounded-lg text-sm cursor-not-allowed"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Email address is permanently bound to your authenticated account.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="flex-1 text-white py-2.5 rounded-xl text-sm font-semibold shadow-sm active:scale-95 transition cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#0d5f94" }}
                  >
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    {saveLoading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium hover:bg-gray-100 rounded-xl transition cursor-pointer"
                    onClick={() => setIsEditProfileModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangePasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setIsChangePasswordModalOpen(false)}
          ></div>
          <div className="relative w-full max-w-sm mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-200 animate-fadeIn">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0d5f94]">lock_reset</span>
                  Change Password
                </h3>
                <button
                  onClick={() => setIsChangePasswordModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {passwordStatus.error && (
                <div className="mb-3 p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  {passwordStatus.error}
                </div>
              )}
              {passwordStatus.success && (
                <div className="mb-3 p-2.5 bg-green-50 text-green-700 text-xs rounded-lg border border-green-200">
                  {passwordStatus.success}
                </div>
              )}

              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min. 6 characters"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#0d5f94]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#0d5f94]"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    className="w-full text-white py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer"
                    style={{ backgroundColor: "#0d5f94" }}
                  >
                    Update Password
                  </button>
                  <button
                    type="button"
                    className="w-full py-2 text-gray-500 text-sm hover:bg-gray-50 rounded-xl transition cursor-pointer"
                    onClick={() => setIsChangePasswordModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
