import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import axios from "axios";
import Header from "../components/Header";
import { useToast } from "../components/ToastProvider";
import LoadingButton, { type ButtonState } from "../components/LoadingButton";

// --- Helper Functions ---
const getTodayDate = () => new Date().toISOString().split("T")[0];
const getCurrentTime = () =>
  new Date().toTimeString().split(" ")[0].substring(0, 5);

// --- Interfaces ---
interface Hospital {
  id: string;
  hospital_name: string;
}


interface OpdFormData {
  patient_name: string;
  patient_phone: string;
  referee_name: string;
  refree_phone_no: string;
  patient_referral_name: string;
  patient_referral_phone: string;
  hospital_name: string[]; // For display/search
  hospital_ids: string[];  // For backend logic
  medical_condition: string;
  city: string;
  age: string;
  gender: string;
  panel: string;
  appointment_date: string;
  appointment_time: string;
  current_disposition: string;
  source: string;
}

export default function BookOpdPage() {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showSuccess, showError } = useToast();

  const [cities, setCities] = useState<string[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isHospitalLoading, setIsHospitalLoading] = useState(false);


  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");


  const [formData, setFormData] = useState<OpdFormData>({
    patient_name: "",
    patient_phone: "",
    referee_name: "",
    refree_phone_no: "",
    patient_referral_name: "",
    patient_referral_phone: "",
    hospital_name: [],
    hospital_ids: [],
    medical_condition: "",
    city: "",
    age: "",
    gender: "",
    panel: "",
    appointment_date: getTodayDate(),
    appointment_time: getCurrentTime(),
    current_disposition: "opd_booked",
    source: "Doctor Referral",
  });

  // --- 3. State for UI and errors ---
  const [loading, setLoading] = useState(false);
  const [buttonState, setButtonState] = useState<ButtonState>('idle');
  const [error, setError] = useState("");

  // NEW: State for Success Modal Data
  const [successData, setSuccessData] = useState<{ ref: string, name: string } | null>(null);

  // --- 4. State for doctor name lookup ---
  const [isFetchingDoctor, setIsFetchingDoctor] = useState(false);
  const [doctorError, setDoctorError] = useState("");

  // --- 5. State for file objects ---
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [pmjayFile, setPmjayFile] = useState<File | null>(null);

  // --- 6. Memos ---
  const minTime = useMemo(() => {
    const today = getTodayDate();
    return formData.appointment_date === today ? getCurrentTime() : "00:00";
  }, [formData.appointment_date]);

  // Filter hospitals based on search term
  const filteredHospitals = useMemo(() => {
    return hospitals.filter(h =>
      h.hospital_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [hospitals, searchTerm]);

  // --- 7. Effects ---
  useEffect(() => {
    if (formData.appointment_date === getTodayDate()) {
      const now = getCurrentTime();
      if (formData.appointment_time < now) {
        setFormData((prev) => ({ ...prev, appointment_time: now }));
      }
    }
  }, [formData.appointment_date, formData.appointment_time]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const res = await api.get("/hospitals/cities");
        setCities(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch cities:", err);
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    if (!formData.city) {
      setHospitals([]);
      return;
    }
    const fetchHospitals = async () => {
      setIsHospitalLoading(true);
      setHospitals([]);
      try {
        const res = await api.get(`/hospitals/by-city/${formData.city}`);
        setHospitals(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch hospitals:", err);
      }
      setIsHospitalLoading(false);
    };
    fetchHospitals();
  }, [formData.city]);

  // --- 8. Handlers ---
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newState = { ...prev, [name]: value };
      if (name === "city") {
        newState.hospital_name = [];
        newState.hospital_ids = []; // Reset IDs when city changes
        setSearchTerm("");
      }
      return newState;
    });
  };

  // Toggle a single hospital
  const toggleHospital = (hospital: Hospital) => {
    setFormData((prev) => {
      const currentNames = prev.hospital_name;
      const currentIds = prev.hospital_ids;

      if (currentNames.includes(hospital.hospital_name)) {
        // Remove
        return {
          ...prev,
          hospital_name: currentNames.filter(h => h !== hospital.hospital_name),
          hospital_ids: currentIds.filter(id => id !== hospital.id)
        };
      } else {
        // Add
        return {
          ...prev,
          hospital_name: [...currentNames, hospital.hospital_name],
          hospital_ids: [...currentIds, hospital.id]
        };
      }
    });
  };

  // Remove a tag
  const removeHospitalTag = (e: React.MouseEvent, hospitalName: string) => {
    e.stopPropagation();
    const hospObj = hospitals.find(h => h.hospital_name === hospitalName);
    if (hospObj) toggleHospital(hospObj);
  };

  // Select/Deselect All Filtered
  const handleSelectAll = () => {
    const allFilteredSelected = filteredHospitals.every(h => formData.hospital_name.includes(h.hospital_name));

    setFormData(prev => {
      const newNames = new Set(prev.hospital_name);
      const newIds = new Set(prev.hospital_ids);

      if (allFilteredSelected) {
        // Deselect all filtered
        filteredHospitals.forEach(h => {
          newNames.delete(h.hospital_name);
          newIds.delete(h.id);
        });
      } else {
        // Select all filtered
        filteredHospitals.forEach(h => {
          newNames.add(h.hospital_name);
          newIds.add(h.id);
        });
      }
      return {
        ...prev,
        hospital_name: Array.from(newNames),
        hospital_ids: Array.from(newIds)
      };
    });
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: 'aadhar' | 'pmjay'
  ) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (docType === 'aadhar') setAadharFile(file);
    if (docType === 'pmjay') setPmjayFile(file);
  };

  const handleFileRemove = (docType: 'aadhar' | 'pmjay') => {
    if (docType === 'aadhar') {
      setAadharFile(null);
      const el = document.getElementById('aadhar-upload') as HTMLInputElement;
      if (el) el.value = "";
    }
    if (docType === 'pmjay') {
      setPmjayFile(null);
      const el = document.getElementById('pmjay-upload') as HTMLInputElement;
      if (el) el.value = "";
    }
  };

  const fetchDoctorName = async () => {
    const phone = formData.refree_phone_no;

    if (phone.length !== 10) {
      setDoctorError("");
      setFormData((prev) => ({ ...prev, referee_name: "" }));
      return;
    }

    setIsFetchingDoctor(true);
    setDoctorError("");

    try {
      const res = await api.get(`/doctors/get-by-phone/${phone}`);
      setFormData((prev) => ({ ...prev, referee_name: res.data.data.name }));
    } catch (err) {

      if (axios.isAxiosError(err)) {
        if (err.response?.status === 403) {
          // User account is deactivated
          setDoctorError("Your account has been deactivated. Please contact your administrator.");
        } else if (err.response?.status === 404) {
          // Doctor not found in database
          setDoctorError("Doctor not found. You can enter the doctor's name manually.");
        } else {
          // Other errors (500, network issues, etc.)
          setDoctorError("Unable to fetch doctor details. Please try again or enter manually.");
        }
      } else {
        // Non-Axios errors
        setDoctorError("An error occurred. Please enter the doctor's name manually.");
      }
      // Don't clear the name field - allow manual entry
    } finally {
      setIsFetchingDoctor(false);
    }
  };

  // --- Helper to Reset Form ---
  const resetForm = () => {
    setFormData({
      patient_name: "",
      patient_phone: "",
      referee_name: "",
      refree_phone_no: "",
      patient_referral_name: "",
      patient_referral_phone: "",
      hospital_name: [],
      hospital_ids: [],
      medical_condition: "",
      city: "",
      age: "",
      gender: "",
      panel: "",
      appointment_date: getTodayDate(),
      appointment_time: getCurrentTime(),
      current_disposition: "opd_booked",
      source: "Doctor Referral",
    });
    setAadharFile(null);
    setPmjayFile(null);
    setDoctorError("");
    setLoading(false);
    setSuccessData(null);
  };

  // --- 9. Submit Handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setButtonState('loading');
    setError("");
    setSuccessData(null);

    // Basic Validation
    if (!formData.patient_name || !formData.patient_phone || !formData.hospital_ids.length || !formData.medical_condition || !aadharFile) {
      setError("Please fill all required fields, including Aadhar card.");
      setLoading(false);
      setButtonState('error');
      showError("Please fill all required fields, including Aadhar card.");
      setTimeout(() => setButtonState('idle'), 2000);
      return;
    }

    const submissionFormData = new FormData();
    Object.keys(formData).forEach((key) => {
      const typedKey = key as keyof OpdFormData;
      if (typedKey === "hospital_ids") {
        submissionFormData.append("hospital_ids", formData.hospital_ids.join(","));
      } else if (typedKey === "hospital_name") {
        // Backend requires hospital_name string
        submissionFormData.append("hospital_name", formData.hospital_name.join(", "));
      } else {
        submissionFormData.append(key, formData[typedKey] as string);
      }
    });

    if (aadharFile) submissionFormData.append("aadhar_document", aadharFile);
    if (pmjayFile) submissionFormData.append("pmjay_document", pmjayFile);

    try {
      const response = await api.post("/patientLeads/create-web", submissionFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Show success state
      setButtonState('success');
      showSuccess(`OPD booked successfully for ${response.data.data.patient_name}!`);

      // Show Success Modal after brief delay
      setTimeout(() => {
        setSuccessData({
          ref: response.data.data.booking_reference,
          name: response.data.data.patient_name
        });
        setButtonState('idle');
      }, 500);

    } catch (err) {
      setButtonState('error');
      if (axios.isAxiosError(err)) {
        const errorMsg = err.response?.data?.message || "Failed to book OPD.";
        setError(errorMsg);
        showError(errorMsg);
      } else {
        setError("An unexpected error occurred.");
        showError("An unexpected error occurred.");
      }
      setTimeout(() => setButtonState('idle'), 2000);
    } finally {
      setLoading(false);
    }
  };

  // Styles
  const inputStyles = "w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";
  const selectStyles = "w-full px-2 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none";
  const labelStyles = "block text-sm font-medium text-gray-700 mb-2";

  return (
    <div className="min-h-screen bg-gray-50 relative">

      {/* --- SUCCESS MODAL --- */}
      {successData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white border border-gray-200 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl transform scale-100 transition-all">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">OPD Booked!</h3>
            <p className="text-gray-600 mb-6">
              Patient <span className="text-gray-900 font-bold">{successData.name}</span> has been successfully booked with Reference ID: <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{successData.ref}</span>
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-transparent hover:bg-gray-100 text-gray-600 rounded-lg border border-gray-300 transition-colors font-medium cursor-pointer"
              >
                Go Home
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-lg shadow-lg transition-all cursor-pointer"
              >
                Book Another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <Header showBack={true} />

      {/* Main Content */}
      <main className="max-w-4xl w-full mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Page Header */}
          <div className="bg-blue-600 px-6 py-8">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-2xl font-bold text-white">Book New OPD</h1>
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
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-8">

            {/* Section 1: Patient Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Patient Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyles}>Patient Name <span className="text-red-500">*</span></label>
                  <input type="text" name="patient_name" value={formData.patient_name} onChange={handleChange} className={inputStyles} placeholder="Full Name" required disabled={loading} />
                </div>
                <div>
                  <label className={labelStyles}>Patient Phone <span className="text-red-500">*</span></label>
                  <input type="tel" name="patient_phone" value={formData.patient_phone} onChange={handleChange} maxLength={10} className={inputStyles} placeholder="10-digit number" required disabled={loading} />
                </div>
                <div>
                  <label className={labelStyles}>Age</label>
                  <input type="number" name="age" value={formData.age} onChange={handleChange} className={inputStyles} placeholder="Age" disabled={loading} />
                </div>
                <div>
                  <label className={labelStyles}>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className={selectStyles} disabled={loading}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelStyles}>Panel <span className="text-red-500">*</span></label>
                  <select name="panel" value={formData.panel} onChange={handleChange} className={selectStyles} required disabled={loading}>
                    <option value="">Select Panel</option>
                    <option value="Cash">Cash</option>
                    <option value="Ayushman">Ayushman</option>
                    <option value="TPA">TPA</option>
                    <option value="CM Fund">CM Fund</option>
                    <option value="NGO Fund">NGO Fund</option>
                    <option value="Aadhar Card">Aadhar Card</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Hospital & Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Hospital & Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyles}>City <span className="text-red-500">*</span></label>
                  <select name="city" value={formData.city} onChange={handleChange} className={selectStyles} required disabled={loading}>
                    <option value="">Select City</option>
                    {cities.map((city) => <option key={city} value={city}>{city}</option>)}
                  </select>
                </div>

                <div className="relative md:col-span-2">
                  <label className={labelStyles}>Select Hospitals <span className="text-red-500">*</span></label>

                  {/* Selected Tags */}
                  <div
                    className={`w-full min-h-[46px] px-4 py-2.5 bg-white border border-gray-300 rounded-lg flex flex-wrap gap-2 cursor-pointer transition-all ${isDropdownOpen ? 'ring-2 ring-blue-500 border-transparent' : ''}`}
                    onClick={() => !loading && formData.city && setIsDropdownOpen(true)}
                  >
                    {!formData.hospital_name.length && !isDropdownOpen && <span className="text-gray-400">Select hospitals...</span>}

                    {formData.hospital_name.map((hName) => (
                      <span key={hName} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {hName}
                        <button type="button" onClick={(e) => removeHospitalTag(e, hName)} className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600 focus:outline-none">
                          <span className="sr-only">Remove {hName}</span>
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Dropdown */}
                  {isDropdownOpen && (
                    <div ref={dropdownRef} className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                      <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
                        <input
                          type="text"
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Search hospitals..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          autoFocus
                        />
                      </div>

                      {isHospitalLoading ? (
                        <div className="px-4 py-2 text-gray-500 text-center">Loading...</div>
                      ) : filteredHospitals.length > 0 ? (
                        <>
                          <div
                            className="text-blue-600 cursor-pointer px-4 py-2 hover:bg-blue-50 font-semibold text-xs uppercase tracking-wide border-b border-gray-100"
                            onClick={handleSelectAll}
                          >
                            {filteredHospitals.every(h => formData.hospital_name.includes(h.hospital_name)) ? "Deselect All" : "Select All"}
                          </div>
                          {filteredHospitals.map((hospital) => {
                            const isSelected = formData.hospital_name.includes(hospital.hospital_name);
                            return (
                              <div
                                key={hospital.id}
                                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}`}
                                onClick={() => toggleHospital(hospital)}
                              >
                                <div className="flex items-center">
                                  <span className={`block truncate ${isSelected ? 'font-semibold' : 'font-normal'}`}>
                                    {hospital.hospital_name}
                                  </span>
                                </div>
                                {isSelected && (
                                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        <div className="px-4 py-2 text-gray-500 italic">No hospitals found</div>
                      )}
                    </div>
                  )}
                  {!formData.city && <p className="text-xs text-red-500 mt-1">Please select a city first.</p>}
                </div>
              </div>
            </div>

            {/* Section 3: Appointment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Appointment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyles}>Date <span className="text-red-500">*</span></label>
                  <input type="date" name="appointment_date" value={formData.appointment_date} onChange={handleChange} min={getTodayDate()} className={inputStyles} required disabled={loading} />
                </div>
                <div>
                  <label className={labelStyles}>Time <span className="text-red-500">*</span></label>
                  <input type="time" name="appointment_time" value={formData.appointment_time} onChange={handleChange} min={minTime} className={inputStyles} required disabled={loading} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelStyles}>Medical Condition <span className="text-red-500">*</span></label>
                  <input type="text" name="medical_condition" value={formData.medical_condition} onChange={handleChange} className={inputStyles} placeholder="Describe condition" required disabled={loading} />
                </div>
              </div>
            </div>


            {/* Section 4: Source Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Source</h3>
              <div>
                <label className={labelStyles}>Select Source <span className="text-red-500">*</span></label>
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  className={selectStyles}
                  required
                  disabled={loading}
                >
                  <option value="Doctor Referral">Doctor Referral</option>
                  <option value="Patient Referral">Patient Referral</option>
                  <option value="Self">Self</option>
                  <option value="Inbound">Inbound</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Whatsapp/Community">Whatsapp/Community</option>
                </select>
              </div>
            </div>

            {/* Section 5: Referee Info (Conditional) */}
            {formData.source === "Doctor Referral" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Doctor Referral Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyles}>Doctor's Phone (Auto-fill)</label>
                    <input type="tel" name="refree_phone_no" value={formData.refree_phone_no} onChange={handleChange} onBlur={fetchDoctorName} maxLength={10} className={inputStyles} placeholder="10-digit number" disabled={loading} />
                    {isFetchingDoctor && <p className="text-xs text-blue-500 mt-1">Fetching doctor name...</p>}
                    {doctorError && <p className="text-xs text-amber-600 mt-1">{doctorError}</p>}
                  </div>
                  <div>
                    <label className={labelStyles}>Doctor's Name</label>
                    <input
                      type="text"
                      name="referee_name"
                      value={formData.referee_name}
                      onChange={handleChange}
                      className={doctorError ? inputStyles : `${inputStyles} bg-gray-50`}
                      placeholder="Doctor Name"
                      readOnly={!doctorError && formData.referee_name !== ""}
                      disabled={loading}
                    />
                    {doctorError && <p className="text-xs text-gray-500 mt-1">Enter doctor's name manually</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Section 5b: Patient Referral Info (Conditional) */}
            {formData.source === "Patient Referral" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Patient Referral Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyles}>Referring Patient's Name</label>
                    <input
                      type="text"
                      name="patient_referral_name"
                      value={formData.patient_referral_name}
                      onChange={handleChange}
                      className={inputStyles}
                      placeholder="Full name of referring patient"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className={labelStyles}>Referring Patient's Phone</label>
                    <input
                      type="tel"
                      name="patient_referral_phone"
                      value={formData.patient_referral_phone}
                      onChange={handleChange}
                      maxLength={10}
                      className={inputStyles}
                      placeholder="10-digit number"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section 6: Documents */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyles}>Aadhar Card <span className="text-red-500">*</span></label>
                  {!aadharFile ? (
                    <input id="aadhar-upload" type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'aadhar')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all" disabled={loading} />
                  ) : (
                    <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="text-sm truncate w-4/5 text-gray-700">{aadharFile.name}</span>
                      <button type="button" onClick={() => handleFileRemove('aadhar')} className="text-red-500 hover:text-red-700 text-sm font-medium">Remove</button>
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelStyles}>PMJAY Card</label>
                  {!pmjayFile ? (
                    <input id="pmjay-upload" type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, 'pmjay')} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all" disabled={loading} />
                  ) : (
                    <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="text-sm truncate w-4/5 text-gray-700">{pmjayFile.name}</span>
                      <button type="button" onClick={() => handleFileRemove('pmjay')} className="text-red-500 hover:text-red-700 text-sm font-medium">Remove</button>
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
                loadingText="Processing Booking..."
                successText="Booking Confirmed!"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Confirm OPD Booking
              </LoadingButton>
            </div>

          </form>
        </div>
      </main >
    </div >
  );
}