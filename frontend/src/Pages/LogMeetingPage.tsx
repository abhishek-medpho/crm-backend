import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import axios from 'axios';
// Header provided by Layout
import { useToast } from "../components/ToastProvider";
import LoadingButton, { type ButtonState } from "../components/LoadingButton";

const getTodayDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// List of facilities
const FACILITIES_LIST = [
    'Medicines',
    'Sugar',
    'Blood Pressure',
    'IPD/Injections'
];

export default function LogMeetingPage() {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();

    // --- 1. State for ALL form fields ---
    const [formData, setFormData] = useState({
        doctor_name: '',
        doctor_phone_number: '',
        locality: '',
        opd_count: '',
        duration_of_meeting: '15',
        numPatientsDuringMeeting: '0',
        rating: '3',
        queries_by_the_doctor: '',
        comments_by_ndm: '',
        chances_of_getting_leads: 'medium',
        facilities: [] as string[],
        timestamp_of_the_meeting: getTodayDate()
    });

    // --- 2. NEW: State for file objects ---
    const [clinicFile, setClinicFile] = useState<File | null>(null);
    const [selfieFile, setSelfieFile] = useState<File | null>(null);

    // --- State for photo preview URLs ---
    const [clinicPreviewUrl, setClinicPreviewUrl] = useState<string | null>(null);
    const [selfiePreviewUrl, setSelfiePreviewUrl] = useState<string | null>(null);

    // --- State for photo capture timestamps ---
    const [clinicCaptureTime, setClinicCaptureTime] = useState<Date | null>(null);
    const [selfieCaptureTime, setSelfieCaptureTime] = useState<Date | null>(null);

    // --- State for GPS ---
    const [gpsLocation, setGpsLocation] = useState<{ lat: number, lon: number } | null>(null);
    const [gpsError, setGpsError] = useState('');

    // --- 3. State for form submission and UI ---
    const [loading, setLoading] = useState(false);
    const [buttonState, setButtonState] = useState<ButtonState>('idle');
    const [error, setError] = useState('');


    const [successData, setSuccessData] = useState<{ doctorName: string } | null>(null);

    // --- 4. State for doctor auto-fill ---
    const [isFetchingDoctor, setIsFetchingDoctor] = useState(false);
    const [isDoctorFound, setIsDoctorFound] = useState(false);
    const [doctorError, setDoctorError] = useState('');



    // --- 5. Effect to get GPS on page load ---
    useEffect(() => {
        setGpsError('');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setGpsLocation({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                    });
                },
                (err) => {
                    setGpsError('GPS permission denied. Please enable it to submit.');
                    console.error("GPS Error:", err.message);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            setGpsError("GPS is not supported. Please use a modern browser.");
        }
    }, []);

    // --- 6. Form field change handlers ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            const facilities = checked
                ? [...prev.facilities, value]
                : prev.facilities.filter(facility => facility !== value);
            return { ...prev, facilities };
        });
    };

    // --- 7. Function to fetch doctor details by phone ---
    const fetchDoctorDetails = async () => {
        const phone = formData.doctor_phone_number;

        if (phone.length !== 10) {
            setDoctorError("");
            setIsDoctorFound(false);
            setFormData(prev => ({ ...prev, doctor_name: '', locality: '' }));
            return;
        }

        setIsFetchingDoctor(true);
        setDoctorError("");
        setIsDoctorFound(false);

        try {
            const res = await api.get(`/doctors/get-by-phone/${phone}`);
            const { name, locality } = res.data.data;

            setFormData(prev => ({
                ...prev,
                doctor_name: name,
                locality: locality || ''
            }));
            setIsDoctorFound(true);

        } catch (err) {
            console.error("Failed to fetch doctor:", err);

            if (axios.isAxiosError(err)) {
                if (err.response?.status === 403) {
                    // User account is deactivated
                    setDoctorError("Your account has been deactivated. Please contact your administrator.");
                } else if (err.response?.status === 404) {
                    // Doctor not found in database
                    setDoctorError("Doctor not found. Please enter details.");
                } else {
                    // Other errors (500, network issues, etc.)
                    setDoctorError("Unable to fetch doctor details. Please try again or enter manually.");
                }
            } else {
                // Non-Axios errors
                setDoctorError("An error occurred. Please enter the doctor details manually.");
            }
            setIsDoctorFound(false);
            setFormData(prev => ({ ...prev, doctor_name: '', locality: '' }));
        } finally {
            setIsFetchingDoctor(false);
        }
    };

    // --- 9. Function to process image with metadata overlay ---
    const processImageWithMetadata = async (
        file: File,
        gpsLat: number,
        gpsLon: number,
        timestamp: Date
    ): Promise<File> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.onload = () => {
                    // Create canvas with same dimensions as image
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Could not get canvas context'));
                        return;
                    }

                    canvas.width = img.width;
                    canvas.height = img.height;

                    // Draw original image
                    ctx.drawImage(img, 0, 0);

                    // Calculate font size based on image width (responsive)
                    const fontSize = Math.max(12, Math.floor(img.width / 30));
                    const padding = fontSize;
                    const lineHeight = fontSize * 1.4;

                    // Draw semi-transparent black background for text
                    const textBoxHeight = lineHeight * 2 + padding * 2;
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fillRect(0, img.height - textBoxHeight, img.width, textBoxHeight);

                    // Draw GPS coordinates
                    ctx.fillStyle = 'white';
                    ctx.font = `${fontSize}px Arial, sans-serif`;
                    const gpsText = `GPS: ${gpsLat.toFixed(6)}, ${gpsLon.toFixed(6)}`;
                    ctx.fillText(gpsText, padding, img.height - textBoxHeight + padding + fontSize);

                    // Draw timestamp
                    const timeText = `Time: ${timestamp.toLocaleString()}`;
                    ctx.fillText(timeText, padding, img.height - textBoxHeight + padding + fontSize + lineHeight);

                    // Convert canvas to blob
                    canvas.toBlob((blob) => {
                        if (blob) {
                            // Create new file from blob with original filename
                            const processedFile = new File([blob], file.name, {
                                type: file.type,
                                lastModified: Date.now()
                            });
                            resolve(processedFile);
                        } else {
                            reject(new Error('Could not convert canvas to blob'));
                        }
                    }, file.type);
                };

                img.onerror = () => reject(new Error('Could not load image'));
                img.src = e.target?.result as string;
            };

            reader.onerror = () => reject(new Error('Could not read file'));
            reader.readAsDataURL(file);
        });
    };

    // --- 10. File change and remove handlers ---
    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
        docType: 'clinic' | 'selfie'
    ) => {
        const file = e.target.files ? e.target.files[0] : null;
        if (!file) return;

        if (!gpsLocation) {
            setError('GPS location not available. Please enable location and refresh.');
            return;
        }

        const captureTime = new Date();

        try {
            // Process image with metadata embedded
            const processedFile = await processImageWithMetadata(
                file,
                gpsLocation.lat,
                gpsLocation.lon,
                captureTime
            );

            if (docType === 'clinic') {
                setClinicFile(processedFile);
                const previewUrl = URL.createObjectURL(processedFile);
                setClinicPreviewUrl(previewUrl);
                setClinicCaptureTime(captureTime);
            } else {
                setSelfieFile(processedFile);
                const previewUrl = URL.createObjectURL(processedFile);
                setSelfiePreviewUrl(previewUrl);
                setSelfieCaptureTime(captureTime);
            }
        } catch (err) {
            console.error('Error processing image:', err);
            setError('Failed to process image. Please try again.');
        }
    };

    const handleFileRemove = (docType: 'clinic' | 'selfie') => {
        if (docType === 'clinic') {
            // Clean up preview URL
            if (clinicPreviewUrl) {
                URL.revokeObjectURL(clinicPreviewUrl);
                setClinicPreviewUrl(null);
            }
            setClinicFile(null);
            setClinicCaptureTime(null);
            const input = document.getElementById('clinic-upload') as HTMLInputElement;
            if (input) input.value = "";
        }
        if (docType === 'selfie') {
            // Clean up preview URL
            if (selfiePreviewUrl) {
                URL.revokeObjectURL(selfiePreviewUrl);
                setSelfiePreviewUrl(null);
            }
            setSelfieFile(null);
            setSelfieCaptureTime(null);
            const input = document.getElementById('selfie-upload') as HTMLInputElement;
            if (input) input.value = "";
        }
    };

    // Helper: Reset Form
    const resetForm = () => {
        setFormData({
            doctor_name: '', doctor_phone_number: '', locality: '',
            opd_count: '', duration_of_meeting: '15', numPatientsDuringMeeting: '0',
            rating: '3', queries_by_the_doctor: '', comments_by_ndm: '',
            chances_of_getting_leads: 'medium', facilities: [],
            timestamp_of_the_meeting: getTodayDate()
        });

        handleFileRemove('clinic');
        handleFileRemove('selfie');

        setIsDoctorFound(false);
        setDoctorError('');
    };

    // --- 9. Form submit handler ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setButtonState('loading');
        setError('');
        setSuccessData(null);

        if (!formData.doctor_name || !formData.doctor_phone_number) {
            setError("Doctor Name and Phone are required.");
            setLoading(false);
            setButtonState('error');
            showError("Doctor Name and Phone are required.");
            setTimeout(() => setButtonState('idle'), 2000);
            return;
        }

        if (!clinicFile || !selfieFile) {
            setError("Please upload both Clinic Photo and Selfie.");
            setLoading(false);
            setButtonState('error');
            showError("Please upload both Clinic Photo and Selfie.");
            setTimeout(() => setButtonState('idle'), 2000);
            return;
        }

        if (!gpsLocation) {
            setError("GPS location is required. Please enable location services and reload.");
            setLoading(false);
            setButtonState('error');
            showError("GPS location is required.");
            setTimeout(() => setButtonState('idle'), 2000);
            return;
        }

        const date = new Date(formData.timestamp_of_the_meeting.replace(/-/g, '/'));
        const localTime = new Date().toTimeString().split(' ')[0]; // Get current time
        const formattedTimestamp = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${localTime}`;

        const gpsLink = `https://maps.google.com/?q=${gpsLocation.lat},${gpsLocation.lon}`;

        const submissionFormData = new FormData();

        Object.keys(formData).forEach(key => {
            const typedKey = key as keyof typeof formData;
            if (typedKey === 'facilities') {
                submissionFormData.append('facilities', formData.facilities.join(', '));
            } else if (typedKey === 'timestamp_of_the_meeting') {
                submissionFormData.append('timestamp_of_the_meeting', formattedTimestamp);
            } else {
                submissionFormData.append(typedKey, formData[typedKey]);
            }
        });

        submissionFormData.append('latitude', String(gpsLocation.lat));
        submissionFormData.append('longitude', String(gpsLocation.lon));
        submissionFormData.append('gps_location_of_the_clinic', gpsLink);

        if (clinicFile) {
            submissionFormData.append('clinic_photo', clinicFile);
        }
        if (selfieFile) {
            submissionFormData.append('selfie_photo', selfieFile);
        }

        try {
            const response = await api.post('/doctors/create-web', submissionFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Show success state
            setButtonState('success');
            showSuccess(`Meeting with ${response.data.data.doctor_name} logged successfully!`);

            // Show modal after brief delay
            setTimeout(() => {
                setSuccessData({
                    doctorName: response.data.data.doctor_name
                });
                setButtonState('idle');
            }, 500);

        } catch (err: unknown) {
            setButtonState('error');
            if (axios.isAxiosError(err)) {
                const errorMsg = err.response?.data?.message || "An error occurred.";
                setError(errorMsg);
                showError(errorMsg);
            } else {
                setError("An unexpected error occurred.");
                showError("An unexpected error occurred.");
            }
            setTimeout(() => setButtonState('idle'), 2000);
        }
        setLoading(false);
    };

    const inputStyles = "w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
    const selectStyles = "w-full px-2 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
    const labelStyles = "block text-sm font-medium text-gray-700 mb-2";
    const fileInputStyles = "w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50";

    return (
        <div className="min-h-screen bg-gray-50 relative">

            {/* --- SUCCESS MODAL --- */}
            {successData && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-[fadeIn_0.2s_ease-out]">
                    <div className="bg-white border border-gray-200 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl transform scale-100 transition-all">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
                            <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Meeting Logged!</h3>
                        <p className="text-gray-600 mb-6">
                            Meeting with <span className="text-gray-900 font-medium">{successData.doctorName}</span> has been successfully recorded.
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="px-4 py-2 bg-transparent hover:bg-gray-100 text-gray-600 rounded-lg border border-gray-300 transition-colors font-medium cursor-pointer"
                            >
                                Go Home
                            </button>
                            <button
                                onClick={() => {
                                    setSuccessData(null);
                                    resetForm();
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium rounded-lg shadow-lg transition-all cursor-pointer"
                            >
                                Log Another
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-4xl mx-auto lg:px-4 w-full">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {/* Page Header */}
                    <div className="bg-purple-600 px-6 py-8">
                        <div className="flex items-center space-x-3">
                            <div>
                                <h1 className="text-2xl font-bold text-white">Log Doctor Meeting</h1>
                            </div>
                        </div>
                    </div>

                    {/* Alerts */}
                    <div className="px-6 pt-6">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-shake">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                    {error}
                                </div>
                            </div>
                        )}
                        {gpsError && !gpsLocation && (
                            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.636-1.182 2.85-1.182 3.486 0l5.58 10.362c.636 1.182-.48 2.539-1.743 2.539H4.42c-1.263 0-2.379-1.357-1.743-2.539l5.58-10.362zM10 12a1 1 0 100-2 1 1 0 000 2zm0 2a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>
                                    {gpsError}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                        {/* Section 1: Doctor Information */}
                        <div className="space-y-4">
                            <h3 className={labelStyles.replace('mb-2', '') + " text-lg font-semibold text-gray-900 flex items-center"}>
                                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                Doctor Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className={labelStyles}>Doctor's Phone <span className="text-red-500">*</span></label>
                                    <input
                                        type="tel"
                                        name="doctor_phone_number"
                                        value={formData.doctor_phone_number}
                                        onChange={handleChange}
                                        onBlur={fetchDoctorDetails}
                                        maxLength={10}
                                        className={inputStyles}
                                        placeholder="10-digit phone (will auto-fill name)"
                                        required
                                        disabled={loading}
                                    />
                                    {isFetchingDoctor && <p className="text-xs text-yellow-600 mt-1">Searching for doctor...</p>}
                                    {doctorError && <p className="text-xs text-red-500 mt-1">{doctorError}</p>}
                                </div>

                                <div>
                                    <label className={labelStyles}>Doctor's Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="doctor_name"
                                        value={formData.doctor_name}
                                        onChange={handleChange}
                                        className={`${inputStyles} ${isDoctorFound ? 'text-gray-500 bg-gray-50' : ''}`}
                                        placeholder={"Enter doctor's full name"}
                                        required
                                        readOnly={isDoctorFound}
                                        disabled={loading}
                                    />
                                </div>
                                <div>
                                    <label className={labelStyles}>Locality</label>
                                    <input
                                        type="text"
                                        name="locality"
                                        value={formData.locality}
                                        onChange={handleChange}
                                        className={`${inputStyles} ${isDoctorFound && formData.locality ? 'text-gray-500 bg-gray-50' : ''}`}
                                        placeholder={"Enter clinic area or locality"}
                                        readOnly={isDoctorFound && formData.locality !== ''}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Meeting Details */}
                        <div className="space-y-4 pt-6 border-t border-gray-200">
                            <h3 className={labelStyles.replace('mb-2', '') + " text-lg font-semibold text-gray-900 flex items-center"}>
                                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Meeting Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelStyles}>Duration (minutes)</label>
                                    <input type="number" name="duration_of_meeting" value={formData.duration_of_meeting} onChange={handleChange} min="1" className={inputStyles} disabled={loading} />
                                </div>
                                <div>
                                    <label className={labelStyles}>Avg. OPD Count (Daily)</label>
                                    <input type="number" name="opd_count" value={formData.opd_count} onChange={handleChange} min="0" className={inputStyles} placeholder="e.g., 25" disabled={loading} />
                                </div>
                                <div>
                                    <label className={labelStyles}>Patients During Meeting</label>
                                    <input type="number" name="numPatientsDuringMeeting" value={formData.numPatientsDuringMeeting} onChange={handleChange} min="0" className={inputStyles} disabled={loading} />
                                </div>

                                <div className="md:col-span-2">
                                    <label className={labelStyles}>Facilities Available</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm text-gray-700">
                                        {FACILITIES_LIST.map(facility => (
                                            <label key={facility} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                                <input
                                                    type="checkbox"
                                                    name="facilities"
                                                    value={facility}
                                                    checked={formData.facilities.includes(facility)}
                                                    onChange={handleCheckboxChange}
                                                    className="rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                                                    disabled={loading}
                                                />
                                                <span>{facility}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Notes & Vibe Check */}
                        <div className="space-y-4 pt-6 border-t border-gray-200">
                            <h3 className={labelStyles.replace('mb-2', '') + " text-lg font-semibold text-gray-900 flex items-center"}>
                                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Notes & Vibe Check
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className={labelStyles}>Doctor's Queries</label>
                                    <textarea name="queries_by_the_doctor" value={formData.queries_by_the_doctor} onChange={handleChange} rows={3} className={inputStyles} placeholder="What did the doctor ask or discuss?" disabled={loading} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelStyles}>Your Comments/Notes</label>
                                    <textarea name="comments_by_ndm" value={formData.comments_by_ndm} onChange={handleChange} rows={3} className={inputStyles} placeholder="Additional comments or observations" disabled={loading} />
                                </div>
                                <div>
                                    <label className={labelStyles}>Rating (1-5)</label>
                                    <select name="rating" value={formData.rating} onChange={handleChange} className={selectStyles} disabled={loading}>
                                        <option value="1">1 - Very Poor</option>
                                        <option value="2">2 - Poor</option>
                                        <option value="3">3 - Average</option>
                                        <option value="4">4 - Good</option>
                                        <option value="5">5 - Excellent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelStyles}>Chances of Getting Leads</label>
                                    <select name="chances_of_getting_leads" value={formData.chances_of_getting_leads} onChange={handleChange} className={selectStyles} disabled={loading}>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Photo Proof */}
                        <div className="space-y-4 pt-6 border-t border-gray-200">
                            <h3 className={labelStyles.replace('mb-2', '') + " text-lg font-semibold text-gray-900 flex items-center"}>
                                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                Photo Proof
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Clinic Photo */}
                                <div>
                                    <label className={labelStyles}>Clinic Photo <span className="text-red-500">*</span></label>
                                    {!clinicFile && (
                                        <input
                                            id="clinic-upload"
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={(e) => handleFileChange(e, 'clinic')}
                                            disabled={loading}
                                            className={fileInputStyles}
                                        />
                                    )}
                                    {clinicFile && clinicPreviewUrl && (
                                        <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
                                            <img
                                                src={clinicPreviewUrl}
                                                alt="Clinic Preview"
                                                className="w-full h-64 object-cover"
                                            />
                                            {/* Overlay with GPS and Timestamp */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3 text-xs">
                                                <div className="flex flex-col gap-1">
                                                    {gpsLocation && (
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                            </svg>
                                                            <span>GPS: {gpsLocation.lat.toFixed(6)}, {gpsLocation.lon.toFixed(6)}</span>
                                                        </div>
                                                    )}
                                                    {clinicCaptureTime && (
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                            </svg>
                                                            <span>Time: {clinicCaptureTime.toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Retake Button */}
                                            <button
                                                type="button"
                                                onClick={() => handleFileRemove('clinic')}
                                                disabled={loading}
                                                className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg shadow-lg transition-colors text-sm flex items-center gap-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                Retake
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {/* Selfie Photo */}
                                <div>
                                    <label className={labelStyles}>Selfie with Clinic <span className="text-red-500">*</span></label>
                                    {!selfieFile && (
                                        <input
                                            id="selfie-upload"
                                            type="file"
                                            accept="image/*"
                                            capture="user"
                                            onChange={(e) => handleFileChange(e, 'selfie')}
                                            disabled={loading}
                                            className={fileInputStyles}
                                        />
                                    )}
                                    {selfieFile && selfiePreviewUrl && (
                                        <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
                                            <img
                                                src={selfiePreviewUrl}
                                                alt="Selfie Preview"
                                                className="w-full h-64 object-cover"
                                            />
                                            {/* Overlay with GPS and Timestamp */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3 text-xs">
                                                <div className="flex flex-col gap-1">
                                                    {gpsLocation && (
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                            </svg>
                                                            <span>GPS: {gpsLocation.lat.toFixed(6)}, {gpsLocation.lon.toFixed(6)}</span>
                                                        </div>
                                                    )}
                                                    {selfieCaptureTime && (
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                            </svg>
                                                            <span>Time: {selfieCaptureTime.toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Retake Button */}
                                            <button
                                                type="button"
                                                onClick={() => handleFileRemove('selfie')}
                                                disabled={loading}
                                                className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg shadow-lg transition-colors text-sm flex items-center gap-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                Retake
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6">
                            <LoadingButton
                                type="submit"
                                state={buttonState}
                                loadingText="Submitting..."
                                successText="Success!"
                                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                Submit Meeting Log
                            </LoadingButton>
                        </div>

                    </form>
                </div>
            </main>
        </div>
    );
}