import Sidebar from "@/components/DashboardComponents/SidebarComponent";
import Header from "@/components/DashboardComponents/HeaderComponent";
import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 ml-[260px] bg-gray-50">
        <header className="fixed top-0 left-[260px] right-0 h-10 bg-white shadow-sm z-10">
          <Header />
        </header>

        <main className="fixed top-10 left-[260px] right-0 bottom-0 overflow-hidden">
          <div className="h-full w-full overflow-y-auto scrollbar-hide p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
