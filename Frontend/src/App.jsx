import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import GuestRoute from "./components/GuestRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthProvider from "./context/AuthProvider";
import AccommodationDetails from "./pages/AccommodationDetails";
import DashboardPlaceholder from "./pages/DashboardPlaceholder";
import Explore from "./pages/Explore";
import Login from "./pages/Login";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public: anyone can browse homes */}
          <Route path="/" element={<Explore />} />
          <Route path="/accommodations/:id" element={<AccommodationDetails />} />

          {/* Only for visitors who are not logged in */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Any logged-in user */}
          <Route element={<ProtectedRoute />}>
            <Route path="/applications" element={<StudentDashboard />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
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
