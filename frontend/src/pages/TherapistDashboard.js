import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import {
  MessageCircle,
  Users,
  Search,
  BarChart3,
  BookOpen,
  LogOut,
  TrendingUp,
  User,
  Eye,
  Calendar,
  Target,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TherapistDashboard = () => {
  const { user, logout, getAuthHeader } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientProgress, setPatientProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddPatient, setShowAddPatient] = useState(false);
const [addingPatient, setAddingPatient] = useState(false);
const [newPatient, setNewPatient] = useState({
  name: "",
  email: "",
  password: "",
  patient_age: "",
  patient_type: "child",
  relationship: "self",
});

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`${API_URL}/therapist/patients`, {
        headers: getAuthHeader(),
      });
      setPatients(response.data);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const viewPatientProgress = async (patientId) => {
    try {
      const response = await axios.get(`${API_URL}/therapist/patient/${patientId}/progress`, {
        headers: getAuthHeader(),
      });
      setPatientProgress(response.data);
      setSelectedPatient(patients.find((p) => p.user_id === patientId));
    } catch (error) {
      toast.error("Failed to load patient progress");
    }
  };
  const handleAddPatient = async (e) => {
  e.preventDefault();

  if (
    !newPatient.name ||
    !newPatient.email ||
    !newPatient.password ||
    !newPatient.patient_age
  ) {
    toast.error("Please fill in all required fields");
    return;
  }

  if (newPatient.password.length < 6) {
    toast.error("Password must be at least 6 characters");
    return;
  }

  setAddingPatient(true);

  try {
    await axios.post(
      `${API_URL}/therapist/patients`,
      {
        ...newPatient,
        patient_age: Number(newPatient.patient_age),
      },
      {
        headers: getAuthHeader(),
      }
    );

    toast.success("Patient added successfully");

    setNewPatient({
      name: "",
      email: "",
      password: "",
      patient_age: "",
      patient_type: "child",
      relationship: "self",
    });

    setShowAddPatient(false);
    await fetchPatients();
  } catch (error) {
    toast.error(
      error.response?.data?.detail ||
        "Failed to add patient"
    );
  } finally {
    setAddingPatient(false);
  }
};
  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7]">
        <div className="w-12 h-12 border-4 border-[#2D4A3E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7]" data-testid="therapist-dashboard">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-100 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-[#2D4A3E] flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="font-['Fraunces'] text-xl font-semibold text-[#1F2937]">FluentAI</span>
        </div>

        <nav className="flex-1 space-y-2">
          <Link to="/therapist" className="sidebar-link active" data-testid="nav-dashboard">
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </Link>
          <Link to="/exercises" className="sidebar-link" data-testid="nav-exercises">
            <BookOpen className="w-5 h-5" />
            Exercise Library
          </Link>
        </nav>

        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6] font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1F2937] truncate">{user?.name}</p>
              <p className="text-xs text-[#9CA3AF] capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-[#EF4444] hover:bg-red-50"
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-['Fraunces'] text-3xl font-semibold text-[#1F2937] mb-2">
              Therapist Dashboard
            </h1>
            <p className="text-[#4B5563]">Monitor and manage your patients' therapy progress</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Patient List */}
            <div className="lg:col-span-1">
              <div className="card-base p-6" data-testid="patient-list">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-['Fraunces'] text-lg font-medium text-[#1F2937]">
                    Your Patients
                  </h2>
                  <Button
                    onClick={() => setShowAddPatient(!showAddPatient)}
                    className="bg-[#2D4A3E] hover:bg-[#223830] text-white rounded-full px-4"
                  >
                     + Add Patient
                  </Button>
                  <Users className="w-5 h-5 text-[#9CA3AF]" />
                </div>
                 {showAddPatient && (
                    <form onSubmit={handleAddPatient} className="mb-5 p-4 bg-[#F9F9F7] rounded-xl border border-gray-200 space-y-3">
                      <h3 className="font-medium text-[#1F2937]">Add New Patient</h3>

                      <Input
                         placeholder="Patient name"
                         value={newPatient.name}
                         onChange={(e) =>
                           setNewPatient({ ...newPatient, name: e.target.value })
                         }
                         className="input-base"
                     />

                     <Input
                       type="email"
                       placeholder="Patient email"
                       value={newPatient.email}
                       onChange={(e) =>
                         setNewPatient({ ...newPatient, email: e.target.value })
                       }
                       className="input-base"
                     />

                     <Input
                       type="password"
                       placeholder="Password (minimum 6 characters)"
                       value={newPatient.password}
                       onChange={(e) =>
                         setNewPatient({ ...newPatient, password: e.target.value })
                       }
                       className="input-base"
                      />

                       <Input
                         type="number"
                         placeholder="Age"
                         value={newPatient.patient_age}
                         onChange={(e) =>
                           setNewPatient({ ...newPatient, patient_age: e.target.value })
                         }
                         className="input-base"
                      />

                      <select
                        value={newPatient.patient_type}
                        onChange={(e) =>
                          setNewPatient({ ...newPatient, patient_type: e.target.value })
                        }
                        className="w-full rounded-md border border-gray-200 p-2 text-sm"
                      >
                        <option value="child">Child</option>
                        <option value="adult">Adult</option>
                      </select>

                      <select
                        value={newPatient.relationship}
                        onChange={(e) =>
                          setNewPatient({ ...newPatient, relationship: e.target.value })
                        }
                        className="w-full rounded-md border border-gray-200 p-2 text-sm"
                      >
                        <option value="self">Self</option>
                        <option value="parent">Parent</option>
                        <option value="caregiver">Caregiver</option>
                      </select>

                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={addingPatient}
                          className="flex-1 bg-[#2D4A3E] hover:bg-[#223830] text-white rounded-full"
                        >
                          {addingPatient ? "Adding..." : "Add Patient"}
                        </Button>

                        <Button
                          type="button"
                          onClick={() => setShowAddPatient(false)}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                  <Input
                    placeholder="Search patients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 input-base text-sm"
                    data-testid="patient-search"
                  />
                </div>

                {filteredPatients.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-[#E5E7EB] mx-auto mb-3" />
                    <p className="text-sm text-[#9CA3AF]">
                      {patients.length === 0
                        ? "No patients assigned yet"
                        : "No patients match your search"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredPatients.map((patient) => (
                      <button
                        key={patient.id}
                        onClick={() => viewPatientProgress(patient.user_id)}
                        className={`w-full p-3 rounded-xl text-left transition-colors ${
                          selectedPatient?.id === patient.id
                            ? "bg-[#2D4A3E]/10 border border-[#2D4A3E]/20"
                            : "hover:bg-[#F3F4F6]"
                        }`}
                        data-testid={`patient-${patient.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#E07A5F]/20 flex items-center justify-center text-[#E07A5F] font-medium">
                            {patient.patient_name?.charAt(0).toUpperCase() || "P"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#1F2937] truncate">
                              {patient.patient_name}
                            </p>
                            <p className="text-xs text-[#9CA3AF]">
                              {patient.patient_type} • Age {patient.patient_age}
                            </p>
                          </div>
                          <Eye className="w-4 h-4 text-[#9CA3AF]" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Patient Details */}
            <div className="lg:col-span-2">
              {selectedPatient && patientProgress ? (
                <div className="space-y-6" data-testid="patient-details">
                  {/* Patient Header */}
                  <div className="card-base p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#E07A5F]/20 flex items-center justify-center text-[#E07A5F] text-xl font-medium">
                          {selectedPatient.patient_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-['Fraunces'] text-xl font-medium text-[#1F2937]">
                            {selectedPatient.patient_name}
                          </h3>
                          <p className="text-[#4B5563]">
                            {selectedPatient.patient_type} • Age {selectedPatient.patient_age}
                          </p>
                          <p className="text-sm text-[#9CA3AF]">
                            Relationship: {selectedPatient.relationship}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="card-base p-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-[#2D4A3E]" />
                        <div>
                          <p className="text-xl font-semibold text-[#1F2937]">
                            {patientProgress.session_results?.length || 0}
                          </p>
                          <p className="text-xs text-[#9CA3AF]">Sessions</p>
                        </div>
                      </div>
                    </div>
                    <div className="card-base p-4">
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-[#10B981]" />
                        <div>
                          <p className="text-xl font-semibold text-[#1F2937]">
                            {patientProgress.session_results?.length > 0
                              ? Math.round(
                                  (patientProgress.session_results.reduce(
                                    (sum, r) => sum + (r.accuracy || 0),
                                    0
                                  ) /
                                    patientProgress.session_results.length) *
                                    100
                                )
                              : 0}
                            %
                          </p>
                          <p className="text-xs text-[#9CA3AF]">Avg Accuracy</p>
                        </div>
                      </div>
                    </div>
                    <div className="card-base p-4">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-[#3B82F6]" />
                        <div>
                          <p className="text-xl font-semibold text-[#1F2937]">
                            {patientProgress.therapy_plans?.[0]?.current_difficulty || 1}/5
                          </p>
                          <p className="text-xs text-[#9CA3AF]">Level</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Speech Profile */}
                  {patientProgress.speech_profiles?.length > 0 && (
                    <div className="card-base p-6">
                      <h4 className="font-medium text-[#1F2937] mb-4">Speech Profile</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-[#9CA3AF]">Primary Difficulty</p>
                          <p className="text-[#1F2937] font-medium capitalize">
                            {patientProgress.speech_profiles[0].primary_difficulty || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#9CA3AF]">Severity</p>
                          <p className="text-[#1F2937] font-medium capitalize">
                            {patientProgress.speech_profiles[0].severity || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#9CA3AF]">Patient Type</p>
                          <p className="text-[#1F2937] font-medium capitalize">
                            {patientProgress.speech_profiles[0].patient_type || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#9CA3AF]">Confidence</p>
                          <p className="text-[#1F2937] font-medium">
                            {Math.round((patientProgress.speech_profiles[0].confidence || 0) * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Therapy Plan */}
                  {patientProgress.therapy_plans?.length > 0 && (
                    <div className="card-base p-6">
                      <h4 className="font-medium text-[#1F2937] mb-4">Current Therapy Plan</h4>
                      <div className="mb-4">
                        <p className="text-lg font-medium text-[#2D4A3E]">
                          {patientProgress.therapy_plans[0].name}
                        </p>
                        <div className="flex gap-4 text-sm text-[#4B5563] mt-2">
                          <span>{patientProgress.therapy_plans[0].session_duration_minutes} min/session</span>
                          <span>{patientProgress.therapy_plans[0].exercises_per_session} exercises</span>
                          <span>{patientProgress.therapy_plans[0].days_per_week} days/week</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-[#9CA3AF] mb-2">Progress Level</p>
                        <Progress
                          value={(patientProgress.therapy_plans[0].current_difficulty / 5) * 100}
                          className="h-2"
                        />
                        <p className="text-xs text-[#9CA3AF] mt-1">
                          Level {patientProgress.therapy_plans[0].current_difficulty} of 5
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Recent Sessions */}
                  <div className="card-base p-6">
                    <h4 className="font-medium text-[#1F2937] mb-4">Recent Sessions</h4>
                    {patientProgress.session_results?.length > 0 ? (
                      <div className="space-y-2">
                        {patientProgress.session_results.slice(0, 5).map((result, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-[#F3F4F6] rounded-lg"
                          >
                            <div>
                              <p className="text-sm font-medium text-[#1F2937]">
                                {result.exercise_id}
                              </p>
                              <p className="text-xs text-[#9CA3AF]">
                                {new Date(result.completed_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div
                              className={`text-lg font-semibold ${
                                result.accuracy >= 0.85
                                  ? "text-[#10B981]"
                                  : result.accuracy >= 0.6
                                  ? "text-[#F59E0B]"
                                  : "text-[#EF4444]"
                              }`}
                            >
                              {Math.round(result.accuracy * 100)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[#9CA3AF] text-center py-4">No sessions completed yet</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="card-base p-12 text-center" data-testid="no-patient-selected">
                  <User className="w-16 h-16 text-[#E5E7EB] mx-auto mb-4" />
                  <h3 className="font-['Fraunces'] text-xl font-medium text-[#1F2937] mb-2">
                    Select a Patient
                  </h3>
                  <p className="text-[#4B5563]">
                    Choose a patient from the list to view their progress and therapy details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TherapistDashboard;
