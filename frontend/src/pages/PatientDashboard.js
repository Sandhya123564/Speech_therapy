import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import {
  MessageCircle,
  Play,
  Target,
  TrendingUp,
  Calendar,
  Award,
  BookOpen,
  BarChart3,
  LogOut,
  ChevronRight,
  Flame,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PatientDashboard = () => {
  const { user, logout, getAuthHeader } = useAuth();
  const navigate = useNavigate();
  const [todaySession, setTodaySession] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [sessionRes, progressRes] = await Promise.all([
        axios.get(`${API_URL}/sessions/today`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/sessions/progress`, { headers: getAuthHeader() }),
      ]);
      setTodaySession(sessionRes.data);
      setProgress(progressRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#2D4A3E] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#4B5563]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7]" data-testid="patient-dashboard">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-100 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-[#2D4A3E] flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="font-['Fraunces'] text-xl font-semibold text-[#1F2937]">FluentAI</span>
        </div>

        <nav className="flex-1 space-y-2">
          <Link to="/dashboard" className="sidebar-link active" data-testid="nav-dashboard">
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </Link>
          <Link to="/triage" className="sidebar-link" data-testid="nav-triage">
            <MessageCircle className="w-5 h-5" />
            AI Assessment
          </Link>
          <Link to="/therapy-plan" className="sidebar-link" data-testid="nav-therapy-plan">
            <Target className="w-5 h-5" />
            Therapy Plan
          </Link>
          <Link to="/session" className="sidebar-link" data-testid="nav-session">
            <Play className="w-5 h-5" />
            Practice
          </Link>
          <Link to="/exercises" className="sidebar-link" data-testid="nav-exercises">
            <BookOpen className="w-5 h-5" />
            Exercises
          </Link>
          <Link to="/progress" className="sidebar-link" data-testid="nav-progress">
            <TrendingUp className="w-5 h-5" />
            Progress
          </Link>
        </nav>

        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-[#E07A5F]/20 flex items-center justify-center text-[#E07A5F] font-medium">
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
              Welcome back, {user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-[#4B5563]">
              {todaySession?.has_plan
                ? "Ready for your daily practice?"
                : "Let's start by understanding your speech needs"}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card-base card-hover" data-testid="stat-streak">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#E07A5F]/10 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-[#E07A5F]" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[#1F2937]">{progress?.streak_days || 0}</p>
                  <p className="text-sm text-[#9CA3AF]">Day Streak</p>
                </div>
              </div>
            </div>

            <div className="card-base card-hover" data-testid="stat-sessions">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#2D4A3E]/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-[#2D4A3E]" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[#1F2937]">{progress?.total_sessions || 0}</p>
                  <p className="text-sm text-[#9CA3AF]">Total Sessions</p>
                </div>
              </div>
            </div>

            <div className="card-base card-hover" data-testid="stat-accuracy">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
                  <Award className="w-6 h-6 text-[#10B981]" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[#1F2937]">{progress?.avg_accuracy || 0}%</p>
                  <p className="text-sm text-[#9CA3AF]">Avg Accuracy</p>
                </div>
              </div>
            </div>

            <div className="card-base card-hover" data-testid="stat-trend">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-[#3B82F6]" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[#1F2937] capitalize">{progress?.improvement_trend || "Stable"}</p>
                  <p className="text-sm text-[#9CA3AF]">Trend</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Today's Session or Get Started */}
            {todaySession?.has_plan ? (
              <div className="card-base p-8" data-testid="todays-session-card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="font-['Fraunces'] text-xl font-medium text-[#1F2937] mb-1">
                      Today's Practice
                    </h2>
                    <p className="text-[#4B5563]">
                      {todaySession.exercises?.length || 0} exercises • ~{todaySession.session_duration_minutes} min
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#2D4A3E] flex items-center justify-center">
                    <Play className="w-6 h-6 text-white ml-1" />
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {todaySession.exercises?.slice(0, 3).map((exercise, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-[#4B5563]">
                      <div className="w-2 h-2 rounded-full bg-[#2D4A3E]" />
                      <span>{exercise.title}</span>
                    </div>
                  ))}
                  {todaySession.exercises?.length > 3 && (
                    <p className="text-sm text-[#9CA3AF] pl-5">
                      +{todaySession.exercises.length - 3} more exercises
                    </p>
                  )}
                </div>

                <Link to="/session">
                  <Button className="w-full bg-[#2D4A3E] hover:bg-[#223830] text-white rounded-full py-6" data-testid="start-practice-btn">
                    Start Practice
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="card-base p-8 bg-gradient-to-br from-[#2D4A3E] to-[#223830]" data-testid="get-started-card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="font-['Fraunces'] text-xl font-medium text-white mb-1">
                      Get Started
                    </h2>
                    <p className="text-white/80">
                      Take our AI assessment to create your personalized therapy plan
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                </div>

                <Link to="/triage">
                  <Button className="w-full bg-white text-[#2D4A3E] hover:bg-gray-100 rounded-full py-6" data-testid="start-assessment-btn">
                    Start Assessment
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            )}

            {/* Therapy Plan Summary */}
            <div className="card-base p-8" data-testid="therapy-plan-summary">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="font-['Fraunces'] text-xl font-medium text-[#1F2937] mb-1">
                    Your Therapy Plan
                  </h2>
                  <p className="text-[#4B5563]">
                    {todaySession?.plan?.name || "Not yet created"}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#F2CC8F]/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-[#92700C]" />
                </div>
              </div>

              {todaySession?.plan ? (
                <>
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#4B5563]">Current Difficulty</span>
                      <span className="text-[#1F2937] font-medium">Level {todaySession.plan.current_difficulty}/5</span>
                    </div>
                    <Progress value={(todaySession.plan.current_difficulty / 5) * 100} className="h-2" />
                  </div>

                  <div className="space-y-2 mb-6">
                    <p className="text-sm font-medium text-[#1F2937]">Goals:</p>
                    {todaySession.plan.goals?.slice(0, 3).map((goal, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-[#4B5563]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                        {goal}
                      </div>
                    ))}
                  </div>

                  <Link to="/therapy-plan">
                    <Button variant="outline" className="w-full rounded-full border-[#2D4A3E] text-[#2D4A3E] hover:bg-[#2D4A3E] hover:text-white" data-testid="view-plan-btn">
                      View Full Plan
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#9CA3AF] mb-4">Complete the AI assessment to get your personalized plan</p>
                  <Link to="/triage">
                    <Button variant="outline" className="rounded-full border-[#2D4A3E] text-[#2D4A3E]">
                      Take Assessment
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Weekly Progress Chart */}
          <div className="card-base p-8" data-testid="weekly-progress">
            <h2 className="font-['Fraunces'] text-xl font-medium text-[#1F2937] mb-6">
              This Week's Activity
            </h2>
            <div className="grid grid-cols-7 gap-4">
              {progress?.weekly_progress?.map((day, idx) => (
                <div key={idx} className="text-center">
                  <div
                    className={`h-24 rounded-lg mb-2 flex items-end justify-center ${
                      day.sessions > 0 ? "bg-[#2D4A3E]" : "bg-gray-100"
                    }`}
                    style={{
                      height: day.sessions > 0 ? `${Math.max(40, day.avg_accuracy)}px` : "24px",
                    }}
                  >
                    {day.sessions > 0 && (
                      <span className="text-xs text-white pb-1">{Math.round(day.avg_accuracy * 100)}%</span>
                    )}
                  </div>
                  <p className="text-xs text-[#9CA3AF]">
                    {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
