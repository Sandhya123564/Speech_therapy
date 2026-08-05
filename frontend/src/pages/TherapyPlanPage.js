import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import {
  MessageCircle,
  Target,
  Calendar,
  Clock,
  TrendingUp,
  ArrowLeft,
  Play,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TherapyPlanPage = () => {
  const { getAuthHeader } = useAuth();
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, profilesRes] = await Promise.all([
        axios.get(`${API_URL}/therapy/plans`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/profiles`, { headers: getAuthHeader() }),
      ]);
      setPlans(plansRes.data);
      setProfiles(profilesRes.data);
      setActivePlan(plansRes.data.find((p) => p.status === "active") || plansRes.data[0]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createPlanFromProfile = async (profileId) => {
    try {
      const response = await axios.post(
        `${API_URL}/therapy/plans?profile_id=${profileId}`,
        {},
        { headers: getAuthHeader() }
      );
      toast.success("Therapy plan created!");
      setPlans((prev) => [response.data, ...prev]);
      setActivePlan(response.data);
    } catch (error) {
      toast.error("Failed to create therapy plan");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7]">
        <div className="w-12 h-12 border-4 border-[#2D4A3E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7]" data-testid="therapy-plan-page">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-[#4B5563] hover:text-[#2D4A3E]">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2D4A3E] flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-['Fraunces'] text-lg font-semibold text-[#1F2937]">
                  Your Therapy Plan
                </h1>
                <p className="text-xs text-[#9CA3AF]">Personalized path to improvement</p>
              </div>
            </div>
          </div>

          <Link to="/session">
            <Button className="bg-[#2D4A3E] hover:bg-[#223830] text-white rounded-full" data-testid="start-session-btn">
              <Play className="w-4 h-4 mr-2" />
              Start Practice
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {!activePlan && profiles.length === 0 ? (
          /* No Profile - Need Assessment */
          <div className="card-base p-12 text-center" data-testid="no-plan-message">
            <div className="w-20 h-20 rounded-full bg-[#F2CC8F]/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-[#92700C]" />
            </div>
            <h2 className="font-['Fraunces'] text-2xl font-medium text-[#1F2937] mb-3">
              No Therapy Plan Yet
            </h2>
            <p className="text-[#4B5563] mb-8 max-w-md mx-auto">
              Complete the AI speech assessment to receive your personalized therapy plan
            </p>
            <Link to="/triage">
              <Button className="bg-[#2D4A3E] hover:bg-[#223830] text-white rounded-full px-8 py-6">
                <MessageCircle className="w-5 h-5 mr-2" />
                Take AI Assessment
              </Button>
            </Link>
          </div>
        ) : !activePlan && profiles.length > 0 ? (
          /* Has Profile but No Plan */
          <div className="card-base p-8" data-testid="create-plan-prompt">
            <h2 className="font-['Fraunces'] text-xl font-medium text-[#1F2937] mb-4">
              Create Your Therapy Plan
            </h2>
            <p className="text-[#4B5563] mb-6">
              You have completed your speech assessment. Click below to generate your personalized therapy plan.
            </p>
            <div className="space-y-4">
              {profiles.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between p-4 bg-[#F3F4F6] rounded-xl">
                  <div>
                    <p className="font-medium text-[#1F2937] capitalize">{profile.primary_difficulty || "Speech Profile"}</p>
                    <p className="text-sm text-[#9CA3AF]">Severity: {profile.severity || "N/A"}</p>
                  </div>
                  <Button
                    onClick={() => createPlanFromProfile(profile.id)}
                    className="bg-[#2D4A3E] hover:bg-[#223830] text-white rounded-full"
                  >
                    Create Plan
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Has Active Plan */
          <div className="space-y-8">
            {/* Plan Overview */}
            <div className="card-base p-8" data-testid="active-plan-overview">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-[#10B981]/10 text-[#10B981] text-xs font-medium rounded-full uppercase">
                      Active
                    </span>
                  </div>
                  <h2 className="font-['Fraunces'] text-2xl font-medium text-[#1F2937]">
                    {activePlan?.name}
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#9CA3AF]">Current Level</p>
                  <p className="text-3xl font-semibold text-[#2D4A3E]">{activePlan?.current_difficulty}/5</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#2D4A3E]/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-[#2D4A3E]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#9CA3AF]">Session Duration</p>
                    <p className="text-lg font-medium text-[#1F2937]">{activePlan?.session_duration_minutes} minutes</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#E07A5F]/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-[#E07A5F]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#9CA3AF]">Exercises/Session</p>
                    <p className="text-lg font-medium text-[#1F2937]">{activePlan?.exercises_per_session} exercises</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-[#3B82F6]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#9CA3AF]">Days per Week</p>
                    <p className="text-lg font-medium text-[#1F2937]">{activePlan?.days_per_week} days</p>
                  </div>
                </div>
              </div>

              {/* Difficulty Progress */}
              <div className="mb-8">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#4B5563]">Difficulty Progression</span>
                  <span className="text-[#2D4A3E] font-medium">Level {activePlan?.current_difficulty} of 5</span>
                </div>
                <Progress value={(activePlan?.current_difficulty / 5) * 100} className="h-3" />
              </div>

              {/* Goals */}
              <div>
                <h3 className="font-medium text-[#1F2937] mb-4">Therapy Goals</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activePlan?.goals?.map((goal, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-[#F3F4F6] rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-[#10B981]/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-[#10B981]" />
                      </div>
                      <span className="text-sm text-[#1F2937] capitalize">{goal}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Exercise Categories */}
            <div className="card-base p-8" data-testid="exercise-categories">
              <h3 className="font-['Fraunces'] text-xl font-medium text-[#1F2937] mb-6">
                Your Exercise Categories
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activePlan?.exercise_categories?.map((category, idx) => {
                  const categoryInfo = {
                    oro_motor: { name: "Oro-Motor", color: "#E07A5F", description: "Mouth strengthening" },
                    articulation: { name: "Articulation", color: "#2D4A3E", description: "Sound production" },
                    automatic_speech: { name: "Automatic Speech", color: "#F2CC8F", description: "Sequences & counting" },
                    speech_language: { name: "Speech & Language", color: "#3B82F6", description: "Vocabulary & sentences" },
                    cognitive: { name: "Cognitive", color: "#8B5CF6", description: "Memory & reasoning" },
                    fluency: { name: "Fluency", color: "#10B981", description: "Speech flow" },
                    voice: { name: "Voice", color: "#EC4899", description: "Vocal control" },
                    neurological: { name: "Neurological", color: "#6366F1", description: "Aphasia, apraxia" },
                  }[category] || { name: category, color: "#9CA3AF", description: "" };

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border-l-4 bg-white shadow-card"
                      style={{ borderLeftColor: categoryInfo.color }}
                    >
                      <p className="font-medium text-[#1F2937]">{categoryInfo.name}</p>
                      <p className="text-sm text-[#9CA3AF]">{categoryInfo.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Adaptive Rules Info */}
            <div className="card-base p-8" data-testid="adaptive-rules">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-[#3B82F6]" />
                </div>
                <div>
                  <h3 className="font-['Fraunces'] text-lg font-medium text-[#1F2937] mb-2">
                    Adaptive Training
                  </h3>
                  <p className="text-[#4B5563] mb-4">
                    Your exercises automatically adjust based on your performance:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                      <span className="text-[#4B5563]">Above 85% accuracy for 3 sessions → Difficulty increases</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                      <span className="text-[#4B5563]">60-85% accuracy → Maintain current level</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                      <span className="text-[#4B5563]">Below 60% accuracy → Exercises simplified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TherapyPlanPage;
