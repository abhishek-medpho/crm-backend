import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./components/ToastProvider";
import Home from "./Pages/home";
import LoginPage from "./Pages/LoginPage";
import BookOpdPage from "./Pages/BookOpdPage";
import LogMeetingPage from "./Pages/LogMeetingPage";
import UpdatePhonePage from "./Pages/UpdatePhonePage";
import PatientDispositionUpdate from "./Pages/PatientDispositionUpdate";

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const token = localStorage.getItem('authToken');
  // Parse user to check role
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
          <Route
            path="/"
            element={<ProtectedRoute><Home /></ProtectedRoute>}
          />

          <Route
            path="/book-opd"
            element={<ProtectedRoute><BookOpdPage /></ProtectedRoute>}
          />
          <Route
            path="/log-meeting"
            element={<ProtectedRoute><LogMeetingPage /></ProtectedRoute>}
          />
          <Route
            path="/update-patient-phone"
            element={<ProtectedRoute><UpdatePhonePage /></ProtectedRoute>}
          />

          <Route
            path="/update-disposition"
            element={
              <ProtectedRoute allowedRoles={['operations', 'super_admin']}>
                <PatientDispositionUpdate />
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;