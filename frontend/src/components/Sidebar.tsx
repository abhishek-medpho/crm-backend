import { Link } from "react-router-dom";

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
    return (
        <>
            {/* Overlay for small screens */}
            <div
                className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            <aside
                className={`fixed left-0 top-0 h-full w-64 bg-white border-r z-50 transform transition-transform ${open ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4 border-b">
                    <div className="text-lg font-bold">MEDPHO CRM</div>
                </div>
                <nav className="p-4">
                    <ul className="space-y-2">
                        <li>
                            <Link to="/opd-bookings" onClick={onClose} className="block px-3 py-2 rounded hover:bg-gray-100">
                                My OPD bookings
                            </Link>
                        </li>
                        <li>
                            <Link to="/doctor-portfolio" onClick={onClose} className="block px-3 py-2 rounded hover:bg-gray-100">
                                My Doctor Portfolio
                            </Link>
                        </li>
                        <li>
                            <Link to="/my-meetings" onClick={onClose} className="block px-3 py-2 rounded hover:bg-gray-100">
                                My Meetings
                            </Link>
                        </li>
                    </ul>
                </nav>
            </aside>
        </>
    );
}
