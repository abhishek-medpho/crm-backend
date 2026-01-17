import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Outlet, useLocation } from "react-router-dom";

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const isHome = location.pathname === "/";

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header onMenuToggle={() => setSidebarOpen(true)} showBack={!isHome} />
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                <Outlet />
            </main>

            <footer className="bg-white border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
                    <p>© 2025 Medpho CRM. All rights reserved.</p>
                    <div className="mt-2 md:mt-0 flex space-x-4">
                        <a href="#" className="hover:text-gray-600">Privacy Policy</a>
                        <a href="#" className="hover:text-gray-600">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
