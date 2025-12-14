import { useNavigate } from "react-router-dom";

interface HeaderProps {
    showBack?: boolean;
}

export default function Header({ showBack = false }: HeaderProps) {
    const navigate = useNavigate();
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : { name: 'User', role: '' };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">

                    {/* Left: Back Button or Logo */}
                    <div className="flex-shrink-0 flex items-center gap-4">
                        {showBack && (
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
                                M
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500 hidden sm:block">
                                Medpho CRM
                            </span>
                        </div>
                    </div>

                    {/* Right Side: User Profile & Actions */}
                    <div className="flex items-center space-x-4">
                        <div className="hidden md:flex flex-col items-end mr-2">
                            <span className="text-gray-900 font-semibold text-sm capitalize leading-tight">
                                {user.name}
                            </span>
                            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full capitalize">
                                {user.role}
                            </span>
                        </div>

                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border border-gray-300">
                            <span className="text-sm font-bold">{user.name.charAt(0).toUpperCase()}</span>
                        </div>

                        <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>

                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                            title="Logout"
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
