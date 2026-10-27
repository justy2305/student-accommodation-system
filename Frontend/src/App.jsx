import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import GuestRoute from "./components/GuestRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthProvider from "./context/AuthProvider";
import ComingSoon from "./pages/ComingSoon";
import DashboardPlaceholder from "./pages/DashboardPlaceholder";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Only for visitors who are not logged in */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Any logged-in user */}
          <Route element={<ProtectedRoute />}>
            <Route path="/applications" element={<StudentDashboard />} />
            <Route
              path="/saved"
              element={
                <ComingSoon
                  title="Saved homes"
                  description="Homes you save while exploring will appear here."
                />
              }
            />
            <Route
              path="/notifications"
              element={
                <ComingSoon
                  title="Notifications"
                  description="All updates about your applications in one place."
                />
              }
            />
            <Route
              path="/profile"
              element={
                <ComingSoon title="My profile" description="Your personal and contact details." />
              }
            />
          </Route>

          {/* Admins only */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route
              path="/admin/*"
              element={
                <DashboardPlaceholder
                  heading="Admin dashboard"
                  comingIn="Phase 21 (admin dashboard)"
                />
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
