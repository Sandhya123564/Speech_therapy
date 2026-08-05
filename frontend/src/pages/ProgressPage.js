import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Progress } from "../components/ui/progress";
import {
  ArrowLeft,
  TrendingUp,
  Flame,
  Award,
  Calendar,
  Target,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ProgressPage = () => {
  const { getAuthHeader } = useAuth();
  const [progress, setProgress] = useState(null);
  const [sessionResults, setSessionResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      const [progressRes, resultsRes] = await Promise.all([
        axios.get(`${API_URL}/sessions/progress`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/sessions/results`, { headers: getAuthHeader() }),
      ]);
      setProgress(progressRes.data);
      setSessionResults(resultsRes.data);
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts
  const chartData = progress?.weekly_progress?.map((day) => ({
    date: new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }),
    accuracy: Math.round(day.avg_accuracy * 100),
    sessions: day.sessions,
  })) || [];

  // Category performance
  const categoryPerformance = sessionResults.reduce((acc, result) => {
    const category = result.exercise_id?.split("_")[1] || "other";
    if (!acc[category]) {
      acc[category] = { total: 0, count: 0 };
    }
    acc[category].total += result.accuracy || 0;
    acc[category].count += 1;
    return acc;
  }, {});

  const categoryData = Object.entries(categoryPerformance).map(([cat, data]) => ({
    category: cat.charAt(0).toUpperCase() + cat.slice(1),
    accuracy: Math.round((data.total / data.count) * 100),
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7]">
        <div className="w-12 h-12 border-4 border-[#2D4A3E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7]" data-testid="progress-page">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link to="/dashboard" className="text-[#4B5563] hover:text-[#2D4A3E]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2D4A3E] flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-['Fraunces'] text-lg font-semibold text-[#1F2937]">
                Your Progress
              </h1>
              <p className="text-xs text-[#9CA3AF]">Track your improvement over time</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="card-base" data-testid="stat-streak">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#E07A5F]/10 flex items-center justify-center">
                <Flame className="w-5 h-5 text-[#E07A5F]" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#1F2937]">{progress?.streak_days || 0}</p>
                <p className="text-xs text-[#9CA3AF]">Day Streak</p>
              </div>
            </div>
          </div>

          <div className="card-base" data-testid="stat-sessions">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#2D4A3E]/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#2D4A3E]" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#1F2937]">{progress?.total_sessions || 0}</p>
                <p className="text-xs text-[#9CA3AF]">Total Sessions</p>
              </div>
            </div>
          </div>

          <div className="card-base" data-testid="stat-accuracy">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-[#10B981]" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#1F2937]">{progress?.avg_accuracy || 0}%</p>
                <p className="text-xs text-[#9CA3AF]">Avg Accuracy</p>
              </div>
            </div>
          </div>

          <div className="card-base" data-testid="stat-trend">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#1F2937] capitalize">
                  {progress?.improvement_trend || "Stable"}
                </p>
                <p className="text-xs text-[#9CA3AF]">Trend</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="card-base p-6 mb-8" data-testid="weekly-chart">
          <h2 className="font-['Fraunces'] text-lg font-medium text-[#1F2937] mb-6">
            Weekly Accuracy
          </h2>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2D4A3E" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2D4A3E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#2D4A3E"
                    strokeWidth={2}
                    fill="url(#colorAccuracy)"
                    name="Accuracy %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-[#9CA3AF]">
              <p>Complete some exercises to see your progress chart</p>
            </div>
          )}
        </div>

        {/* Category Performance */}
        <div className="card-base p-6 mb-8" data-testid="category-performance">
          <h2 className="font-['Fraunces'] text-lg font-medium text-[#1F2937] mb-6">
            Performance by Category
          </h2>
          {categoryData.length > 0 ? (
            <div className="space-y-4">
              {categoryData.map((cat, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#4B5563]">{cat.category}</span>
                    <span className="text-[#1F2937] font-medium">{cat.accuracy}%</span>
                  </div>
                  <Progress value={cat.accuracy} className="h-2" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#9CA3AF] text-center py-8">
              Complete exercises to see category performance
            </p>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="card-base p-6" data-testid="recent-sessions">
          <h2 className="font-['Fraunces'] text-lg font-medium text-[#1F2937] mb-6">
            Recent Sessions
          </h2>
          {sessionResults.length > 0 ? (
            <div className="space-y-3">
              {sessionResults.slice(0, 10).map((result, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-[#F3F4F6] rounded-xl"
                >
                  <div>
                    <p className="font-medium text-[#1F2937] text-sm">
                      Exercise: {result.exercise_id}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">
                      {new Date(result.completed_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-lg font-semibold ${
                        result.accuracy >= 0.85
                          ? "text-[#10B981]"
                          : result.accuracy >= 0.6
                          ? "text-[#F59E0B]"
                          : "text-[#EF4444]"
                      }`}
                    >
                      {Math.round(result.accuracy * 100)}%
                    </p>
                    <p className="text-xs text-[#9CA3AF]">accuracy</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#9CA3AF] text-center py-8">
              No sessions completed yet. Start practicing to track your progress!
            </p>
          )}
        </div>

        {/* Motivational Message */}
        {progress?.total_sessions > 0 && (
          <div className="mt-8 p-6 bg-gradient-to-r from-[#2D4A3E] to-[#223830] rounded-2xl text-white text-center">
            <Award className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <h3 className="font-['Fraunces'] text-xl font-medium mb-2">
              {progress.streak_days >= 7
                ? "Amazing Dedication!"
                : progress.streak_days >= 3
                ? "You're On a Roll!"
                : "Keep Going!"}
            </h3>
            <p className="text-white/80 text-sm">
              {progress.streak_days >= 7
                ? `${progress.streak_days} days in a row! You're making incredible progress.`
                : progress.streak_days >= 3
                ? `${progress.streak_days} day streak! Consistency is key to improvement.`
                : "Every session brings you closer to your goals. Keep practicing!"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProgressPage;
