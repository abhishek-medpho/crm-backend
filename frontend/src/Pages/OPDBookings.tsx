import { useEffect, useState, useRef } from "react";
import api from "../api";

type SortOrder = 'asc' | 'desc' | null;

export default function OPDBookings() {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<SortOrder>(null);
    const [currentPage, setCurrentPage] = useState(1);
    // Responsive itemsPerPage: 10 for desktop, 5 for mobile
    const getItemsPerPage = () => (window.innerWidth < 768 ? 5 : 7);
    const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage());

    useEffect(() => {
        const handleResize = () => setItemsPerPage(getItemsPerPage());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const fetchedRef = useRef(false);

    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;

        setLoading(true);
        api.get('/opd/getOPDBookings')
            .then(res => {
                setRows(res.data?.data || []);
                setCurrentPage(1);
            })
            .catch(err => {
                console.error('Failed to fetch OPD bookings', err?.response || err);
            })
            .finally(() => setLoading(false));
    }, []);

    // Sort by column
    const handleSort = (column: string) => {
        const newOrder: SortOrder = sortColumn === column && sortOrder === 'asc' ? 'desc' : (sortColumn === column && sortOrder === 'desc' ? null : 'asc');
        setSortColumn(newOrder === null ? null : column);
        setSortOrder(newOrder);

        if (newOrder === null) {
            // Reset to original order
            api.get('/opd/getOPDBookings')
                .then(res => setRows(res.data?.data || []))
                .catch(err => console.error('Failed to fetch', err));
        } else {
            const sorted = [...rows].sort((a, b) => {
                const valA = a[column];
                const valB = b[column];

                // Handle date columns
                if (column === 'appointment_date' || column === 'created_at' || column === 'updated_at') {
                    const dateA = new Date(valA || '').getTime();
                    const dateB = new Date(valB || '').getTime();
                    return newOrder === 'asc' ? dateA - dateB : dateB - dateA;
                }

                // Default string comparison
                return newOrder === 'asc'
                    ? String(valA || '').localeCompare(String(valB || ''))
                    : String(valB || '').localeCompare(String(valA || ''));
            });
            setRows(sorted);
        }
        setCurrentPage(1);
    };

    // Pagination
    const totalPages = Math.ceil(rows.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedRows = rows.slice(startIdx, startIdx + itemsPerPage);

    if (loading) return <div className="py-8">Loading...</div>;

    if (!rows.length) return <div className="py-8">No bookings found.</div>;

    const columns = [
        'booking_reference', 'patient_name', 'medical_condition', 'hospital_names', 'referee_name', 'appointment_date', 'current_disposition',
        'patient_phone', 'age', 'gender', 'created_at'
    ];

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">My OPD Bookings</h2>

            {/* Table Container with horizontal scroll */}
            <div className="overflow-x-auto bg-white rounded shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-200">
                        <tr>
                            {columns.map((c) => (
                                <th key={c} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <span>{c.replace(/_/g, ' ')}</span>
                                        {(c === 'appointment_date' || c === 'created_at' || c === 'updated_at') && (
                                            <button
                                                onClick={() => handleSort(c)}
                                                className="ml-1 hover:text-gray-700 transition-colors"
                                                title={`Sort by ${c.replace(/_/g, ' ')}`}
                                            >
                                                {sortColumn === c && sortOrder === 'asc' && <span className="text-blue-600">↑</span>}
                                                {sortColumn === c && sortOrder === 'desc' && <span className="text-blue-600">↓</span>}
                                                {sortColumn !== c && <span className="text-gray-400">⇅</span>}
                                            </button>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {paginatedRows.map((r, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{r.booking_reference}</td>
                                <td className="px-4 py-2 text-sm text-gray-700">{r.patient_name}</td>
                                <td className="px-4 py-2 text-sm text-gray-700">{r.medical_condition}</td>
                                <td className="px-4 py-2 text-sm text-gray-700">{r.hospital_names}</td>
                                <td className="px-4 py-2 text-sm text-gray-700">{r.doctor_name || '-'}</td>
                                <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{r.appointment_date ? new Date(r.appointment_date).toLocaleDateString() : '-'}</td>
                                <td className="px-4 py-2 text-sm text-gray-700">{r.current_disposition}</td>
                                <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                                    <span className="hidden sm:inline">{r.patient_phone}</span>
                                    <a
                                        href={r.patient_phone ? `tel:${r.patient_phone}` : undefined}
                                        className="sm:hidden text-blue-600 underline"
                                        style={{ pointerEvents: r.patient_phone ? 'auto' : 'none' }}
                                    >
                                        {r.patient_phone}
                                    </a>
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{r.age}</td>
                                <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{r.gender}</td>
                                <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
                <div className="text-sm text-gray-600">
                    Showing <span className="font-medium">{startIdx + 1}</span> to <span className="font-medium">{Math.min(startIdx + itemsPerPage, rows.length)}</span> of <span className="font-medium">{rows.length}</span> bookings
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>

                    <select
                        value={currentPage}
                        onChange={(e) => setCurrentPage(Number(e.target.value))}
                        className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <option key={page} value={page}>
                                Page {page} of {totalPages}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
