import { Header } from "../components/utils/Header";
import { Smartinventorycontent } from "../components/Smartinventorycontent";

export function SmartinventoryPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      <Header />
      <Smartinventorycontent />
    </div>
  );
}
