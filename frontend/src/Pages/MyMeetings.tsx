import { useEffect, useState, useRef } from "react";
import api from "../api";

type SortOrder = 'asc' | 'desc' | null;

export default function MyMeetings() {
    const [rows, setRows] = useState<any[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
    const [modalFullscreen, setModalFullscreen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<SortOrder>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const fetchedRef = useRef(false);

    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;

        setLoading(true);
        api.get('/opd/getMeetings')
            .then(res => {
                setRows(res.data?.data || []);
                setCurrentPage(1);
            })
            .catch(err => {
                console.error('Failed to fetch meetings', err?.response || err);
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
            api.get('/opd/getMeetings')
                .then(res => setRows(res.data?.data || []))
                .catch(err => console.error('Failed to fetch', err));
        } else {
            const sorted = [...rows].sort((a, b) => {
                const valA = a[column];
                const valB = b[column];

                // Handle date columns
                if (column === 'meeting_date') {
                    const dateA = new Date(valA || '').getTime();
                    const dateB = new Date(valB || '').getTime();
                    return newOrder === 'asc' ? dateA - dateB : dateB - dateA;
                }

                // Handle numeric columns
                if (column === 'duration') {
                    const numA = Number(valA) || 0;
                    const numB = Number(valB) || 0;
                    return newOrder === 'asc' ? numA - numB : numB - numA;
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

    if (!rows.length) return <div className="py-8">No meetings found.</div>;

    const columns = [
        'agent_name', 'doctor_name', 'meeting_date', 'gps_location_link', 'clinic_image',
        'selfie_image', 'duration', 'meeting_notes', 'meeting_summary'
    ];

    // Helper to convert Drive link or fileId to public image proxy URL
    function getPublicImageUrl(imageLinkOrId: string) {
        if (!imageLinkOrId) return '';
        // If it's a full drive link, extract the file ID
        const match = imageLinkOrId.match(/(?:\/d\/|id=)([\w-]+)/);
        const fileId = match ? match[1] : imageLinkOrId;
        return `/api/v1/OPD/public-image/${fileId}`;
    }

    return (
        <div className="py-6">
            {/* Image Modal */}
            {modalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.5)' }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setModalOpen(false);
                    }}
                >
                    <div
                        className={`bg-white rounded-lg shadow-xl p-6 relative flex flex-col items-center justify-center ${modalFullscreen ? 'w-screen h-screen' : ''}`}
                        style={modalFullscreen ? { width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh' } : { width: '60vw', maxWidth: '700px', minWidth: '320px' }}
                    >
                        <div className="w-full flex justify-between items-center mb-4">
                            <button
                                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                                onClick={() => setModalFullscreen(f => !f)}
                                aria-label="Toggle Fullscreen"
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                {modalFullscreen ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M9 15v2a2 2 0 0 1-2 2H5m10-4v2a2 2 0 0 0 2 2h2M9 9V7a2 2 0 0 0-2-2H5m10 4V7a2 2 0 0 1 2-2h2"/></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M4 8V6a2 2 0 0 1 2-2h2m8 0h2a2 2 0 0 1 2 2v2m0 8v2a2 2 0 0 1-2 2h-2m-8 0H6a2 2 0 0 1-2-2v-2"/></svg>
                                )}
                            </button>
                            <button
                                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                                onClick={() => setModalOpen(false)}
                                aria-label="Close"
                                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                &#10005;
                            </button>
                        </div>
                        {modalImageUrl && (
                            <img
                                src={modalImageUrl}
                                alt="Meeting Image"
                                className="w-full h-auto rounded"
                                style={modalFullscreen ? { maxHeight: '80vh', objectFit: 'contain' } : { maxHeight: '50vh', objectFit: 'contain' }}
                            />
                        )}
                    </div>
                </div>
            )}
            <h2 className="text-2xl font-semibold mb-4">My Meetings</h2>

            {/* Table Container with horizontal scroll */}
            <div className="overflow-x-auto bg-white rounded shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((c) => (
                                <th key={c} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-2">
                                        <span>{c.replace(/_/g, ' ')}</span>
                                        {(c === 'meeting_date' || c === 'duration') && (
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
                                <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{r.agent_name}</td>
                                <td className="px-4 py-2 text-sm text-gray-700">{r.doctor_name}</td>
                                <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{r.meeting_date || '-'}</td>
                                <td className="px-4 py-2 text-sm text-gray-700">
                                    {r.gps_location_link ? (
                                        <a className="text-blue-600 hover:underline" href={r.gps_location_link} target="_blank" rel="noreferrer">
                                            View Location
                                        </a>
                                    ) : (
                                        '-'
                                    )}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700">
                                    {r.clinic_image ? (
                                        <button
                                            className="text-blue-600 hover:underline"
                                            onClick={() => {
                                                setModalImageUrl(getPublicImageUrl(r.clinic_image));
                                                setModalOpen(true);
                                            }}
                                            type="button"
                                        >
                                            View Image
                                        </button>
                                    ) : (
                                        '-'
                                    )}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700">
                                    {r.selfie_image ? (
                                        <button
                                            className="text-blue-600 hover:underline"
                                            onClick={() => {
                                                setModalImageUrl(getPublicImageUrl(r.selfie_image));
                                                setModalOpen(true);
                                            }}
                                            type="button"
                                        >
                                            View Image
                                        </button>
                                    ) : (
                                        '-'
                                    )}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{r.duration || '-'}</td>
                                <td className="px-4 py-2 text-sm text-gray-700">{r.meeting_notes || '-'}</td>
                                <td className="px-4 py-2 text-sm text-gray-700">{r.meeting_summary || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
                <div className="text-sm text-gray-600">
                    Showing <span className="font-medium">{startIdx + 1}</span> to <span className="font-medium">{Math.min(startIdx + itemsPerPage, rows.length)}</span> of <span className="font-medium">{rows.length}</span> meetings
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
