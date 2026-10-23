import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import { HomePage } from "./pages/HomePage";
import { DashboardPage } from "./pages/DashboardPage";
import { AiscanPage } from "./pages/AiscanPage";
import { SmartinventoryPage } from "./pages/SmartinventoryPage";
import { AlertPage } from "./pages/AlertPage";
import { ProfilePage } from "./pages/ProfilePage";

import { AuthPage } from "./pages/AuthPage";

import { FloatingScanButton } from "./components/utils/FloatingScanButton";
import { Footer } from "./components/utils/Footer";

function App() {
  return (
    <>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        {/* When the app loads at "/", go to "/home" */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Page Routes */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/aiscan" element={<AiscanPage />} />
        <Route path="/smartinventory" element={<SmartinventoryPage />} />
        <Route path="/alerts" element={<AlertPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      <Footer />
      <FloatingScanButton />
    </>
  );
}

export default App;