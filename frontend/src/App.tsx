import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/ToastProvider";
import Home from "./Pages/home";
import LoginPage from "./Pages/LoginPage";
import BookOpdPage from "./Pages/BookOpdPage";
import LogMeetingPage from "./Pages/LogMeetingPage";
import UpdatePhonePage from "./Pages/UpdatePhonePage";
import PatientDispositionUpdate from "./Pages/PatientDispositionUpdate";
import Layout from "./components/Layout";
import OPDBookings from "./Pages/OPDBookings";
import DoctorPortfolio from "./Pages/DoctorPortfolio";
import MyMeetings from "./Pages/MyMeetings";

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const token = localStorage.getItem('authToken');
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : {};

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Home />} />
            <Route path="book-opd" element={<BookOpdPage />} />
            <Route path="log-meeting" element={<LogMeetingPage />} />
            <Route path="update-patient-phone" element={<UpdatePhonePage />} />
            <Route path="update-disposition" element={
              <ProtectedRoute allowedRoles={["operations", "super_admin"]}>
                <PatientDispositionUpdate />
              </ProtectedRoute>
            } />
            <Route path="opd-bookings" element={<OPDBookings />} />
            <Route path="doctor-portfolio" element={<DoctorPortfolio />} />
            <Route path="my-meetings" element={<MyMeetings />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;