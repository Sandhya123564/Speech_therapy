import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  ArrowLeft,
  BookOpen,
  Search,
  Filter,
  Clock,
  BarChart2,
} from "lucide-react";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ExerciseLibraryPage = () => {
  const { getAuthHeader } = useAuth();
  const [exercises, setExercises] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [exercisesRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/exercises`, { headers: getAuthHeader() }),
        axios.get(`${API_URL}/exercises/categories/list`, { headers: getAuthHeader() }),
      ]);
      setExercises(exercisesRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error("Error fetching exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter((exercise) => {
    const matchesCategory = selectedCategory === "all" || exercise.category === selectedCategory;
    const matchesDifficulty =
      selectedDifficulty === "all" || exercise.difficulty_level === parseInt(selectedDifficulty);
    const matchesSearch =
      !searchQuery ||
      exercise.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.instructions.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const groupedExercises = filteredExercises.reduce((acc, exercise) => {
    const cat = exercise.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(exercise);
    return acc;
  }, {});

  const categoryColors = {
    oro_motor: "#E07A5F",
    articulation: "#2D4A3E",
    automatic_speech: "#F2CC8F",
    speech_language: "#3B82F6",
    cognitive: "#8B5CF6",
    fluency: "#10B981",
    voice: "#EC4899",
    neurological: "#6366F1",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7]">
        <div className="w-12 h-12 border-4 border-[#2D4A3E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7]" data-testid="exercise-library-page">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-[#4B5563] hover:text-[#2D4A3E]">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2D4A3E] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-['Fraunces'] text-lg font-semibold text-[#1F2937]">
                  Exercise Library
                </h1>
                <p className="text-xs text-[#9CA3AF]">{exercises.length} exercises available</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="card-base p-4 mb-8" data-testid="exercise-filters">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
              <Input
                placeholder="Search exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 input-base"
                data-testid="search-input"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48" data-testid="category-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(categories).map(([key, cat]) => (
                  <SelectItem key={key} value={key}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-full md:w-40" data-testid="difficulty-filter">
                <BarChart2 className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="1">Level 1</SelectItem>
                <SelectItem value="2">Level 2</SelectItem>
                <SelectItem value="3">Level 3</SelectItem>
                <SelectItem value="4">Level 4</SelectItem>
                <SelectItem value="5">Level 5</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category Overview */}
        {selectedCategory === "all" && !searchQuery && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {Object.entries(categories).map(([key, cat]) => {
              const count = exercises.filter((e) => e.category === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className="card-base p-4 text-left hover:shadow-hover transition-shadow"
                  data-testid={`category-card-${key}`}
                >
                  <div
                    className="w-3 h-3 rounded-full mb-3"
                    style={{ backgroundColor: categoryColors[key] }}
                  />
                  <p className="font-medium text-[#1F2937] text-sm">{cat.name}</p>
                  <p className="text-xs text-[#9CA3AF]">{count} exercises</p>
                </button>
              );
            })}
          </div>
        )}

        {/* Exercise List */}
        {Object.entries(groupedExercises).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#9CA3AF]">No exercises found matching your filters</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedExercises).map(([category, catExercises]) => (
              <div key={category} data-testid={`exercise-group-${category}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: categoryColors[category] }}
                  />
                  <h2 className="font-['Fraunces'] text-xl font-medium text-[#1F2937]">
                    {categories[category]?.name || category}
                  </h2>
                  <span className="text-sm text-[#9CA3AF]">({catExercises.length})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catExercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className={`card-base card-hover exercise-${category.replace("_", "-")}`}
                      data-testid={`exercise-card-${exercise.id}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-[#1F2937]">{exercise.title}</h3>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < exercise.difficulty_level
                                  ? `difficulty-${exercise.difficulty_level}`
                                  : "bg-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-[#4B5563] mb-4 line-clamp-2">
                        {exercise.instructions}
                      </p>
                      <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{Math.round(exercise.duration_seconds / 60)} min</span>
                        </div>
                        <span className="capitalize">{exercise.target_domain?.replace("_", " ")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ExerciseLibraryPage;
