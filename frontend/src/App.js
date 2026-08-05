import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PatientDashboard from "./pages/PatientDashboard";
import TherapistDashboard from "./pages/TherapistDashboard";
import TriageChatPage from "./pages/TriageChatPage";
import TherapyPlanPage from "./pages/TherapyPlanPage";
import ExerciseSessionPage from "./pages/ExerciseSessionPage";
import ExerciseLibraryPage from "./pages/ExerciseLibraryPage";
import ProgressPage from "./pages/ProgressPage";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#2D4A3E] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#4B5563] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === "therapist" ? "/therapist" : "/dashboard"} replace />;
  }

  return children;
};

// Dashboard redirect based on role
const DashboardRedirect = () => {
  const { user } = useAuth();
  if (user?.role === "therapist") {
    return <Navigate to="/therapist" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={user ? <DashboardRedirect /> : <LandingPage />} />
      <Route path="/login" element={user ? <DashboardRedirect /> : <LoginPage />} />
      <Route path="/register" element={user ? <DashboardRedirect /> : <RegisterPage />} />

      {/* Protected Patient/Parent routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["patient", "parent"]}>
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/triage"
        element={
          <ProtectedRoute allowedRoles={["patient", "parent"]}>
            <TriageChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/therapy-plan"
        element={
          <ProtectedRoute allowedRoles={["patient", "parent"]}>
            <TherapyPlanPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/session"
        element={
          <ProtectedRoute allowedRoles={["patient", "parent"]}>
            <ExerciseSessionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exercises"
        element={
          <ProtectedRoute allowedRoles={["patient", "parent", "therapist"]}>
            <ExerciseLibraryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress"
        element={
          <ProtectedRoute allowedRoles={["patient", "parent"]}>
            <ProgressPage />
          </ProtectedRoute>
        }
      />

      {/* Protected Therapist routes */}
      <Route
        path="/therapist"
        element={
          <ProtectedRoute allowedRoles={["therapist"]}>
            <TherapistDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
