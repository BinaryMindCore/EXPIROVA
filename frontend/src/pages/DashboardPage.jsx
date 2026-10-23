import {Header} from "../components/utils/Header";
import {MainContent} from "../components/MainContent";

export function DashboardPage() {
  return ( 
    <div className="min-h-screen bg-[#f8fafc]">
      <Header />
      <MainContent />
    </div>
  );
}
