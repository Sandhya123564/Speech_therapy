import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  Mic,
  MicOff,
  CheckCircle,
  RotateCcw,
  Volume2,
  Timer,
  X,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ExerciseSessionPage = () => {
  const { getAuthHeader } = useAuth();
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timer, setTimer] = useState(0);
  const [exerciseResults, setExerciseResults] = useState([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const [transcript, setTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    fetchTodaySession();
    checkSpeechSupport();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const checkSpeechSupport = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  };

  const fetchTodaySession = async () => {
    try {
      const response = await axios.get(`${API_URL}/sessions/today`, {
        headers: getAuthHeader(),
      });
      setSessionData(response.data);
    } catch (error) {
      toast.error("Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
  };

  const pauseTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const togglePause = () => {
    if (isPaused) {
      startTimer();
    } else {
      pauseTimer();
    }
    setIsPaused(!isPaused);
  };

  const startRecording = () => {
    if (!speechSupported) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      setTranscript(result[0].transcript);
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };

    recognitionRef.current.start();
    setIsRecording(true);
    if (!timerRef.current) startTimer();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const speakText = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const currentExercise = sessionData?.exercises?.[currentExerciseIndex];
  const currentPrompt = currentExercise?.prompts?.[currentPromptIndex];

  const calculateAccuracy = () => {
    if (!currentPrompt || !transcript) return 0;
    const expected = currentPrompt.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    const actual = transcript.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    
    const expectedWords = expected.split(/\s+/);
    const actualWords = actual.split(/\s+/);
    
    let matches = 0;
    expectedWords.forEach((word) => {
      if (actualWords.includes(word)) matches++;
    });
    
    return expectedWords.length > 0 ? matches / expectedWords.length : 0;
  };

  const saveResult = async (accuracy) => {
    const result = {
      exercise_id: currentExercise.id,
      plan_id: sessionData?.plan?.id || "",
      accuracy: accuracy,
      completion_rate: (currentPromptIndex + 1) / (currentExercise?.prompts?.length || 1),
      response_time_ms: timer * 1000,
    };

    setExerciseResults((prev) => [...prev, result]);

    try {
      await axios.post(`${API_URL}/sessions/result`, result, {
        headers: getAuthHeader(),
      });
    } catch (error) {
      console.error("Failed to save result:", error);
    }
  };

  const nextPrompt = async () => {
    const accuracy = calculateAccuracy();
    
    if (currentPromptIndex < (currentExercise?.prompts?.length || 1) - 1) {
      setCurrentPromptIndex((prev) => prev + 1);
      setTranscript("");
    } else {
      await saveResult(accuracy);
      nextExercise();
    }
  };

  const nextExercise = () => {
    if (currentExerciseIndex < (sessionData?.exercises?.length || 1) - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
      setCurrentPromptIndex(0);
      setTranscript("");
      setTimer(0);
    } else {
      pauseTimer();
      setSessionComplete(true);
      toast.success("Session complete! Great job!");
    }
  };

  const skipExercise = () => {
    saveResult(0);
    nextExercise();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const overallProgress = sessionData?.exercises?.length
    ? ((currentExerciseIndex + currentPromptIndex / (currentExercise?.prompts?.length || 1)) /
        sessionData.exercises.length) *
      100
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7]">
        <div className="w-12 h-12 border-4 border-[#2D4A3E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!sessionData?.has_plan) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-6">
        <div className="card-base p-12 text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-[#F2CC8F]/20 flex items-center justify-center mx-auto mb-6">
            <Play className="w-10 h-10 text-[#92700C]" />
          </div>
          <h2 className="font-['Fraunces'] text-2xl font-medium text-[#1F2937] mb-3">
            No Practice Session Available
          </h2>
          <p className="text-[#4B5563] mb-8">
            Complete the AI assessment first to get your personalized therapy plan
          </p>
          <Link to="/triage">
            <Button className="bg-[#2D4A3E] hover:bg-[#223830] text-white rounded-full px-8">
              Take Assessment
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    const avgAccuracy =
      exerciseResults.length > 0
        ? exerciseResults.reduce((sum, r) => sum + r.accuracy, 0) / exerciseResults.length
        : 0;

    return (
      <div className="min-h-screen bg-[#F9F9F7] flex items-center justify-center p-6" data-testid="session-complete">
        <div className="card-base p-12 text-center max-w-lg">
          <div className="w-24 h-24 rounded-full bg-[#10B981]/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-[#10B981]" />
          </div>
          <h2 className="font-['Fraunces'] text-3xl font-medium text-[#1F2937] mb-3">
            Session Complete!
          </h2>
          <p className="text-[#4B5563] mb-8">Great work on completing today's practice</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-[#F3F4F6] rounded-xl">
              <p className="text-3xl font-semibold text-[#2D4A3E]">{exerciseResults.length}</p>
              <p className="text-sm text-[#9CA3AF]">Exercises Done</p>
            </div>
            <div className="p-4 bg-[#F3F4F6] rounded-xl">
              <p className="text-3xl font-semibold text-[#10B981]">{Math.round(avgAccuracy * 100)}%</p>
              <p className="text-sm text-[#9CA3AF]">Accuracy</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Link to="/dashboard" className="flex-1">
              <Button variant="outline" className="w-full rounded-full border-[#2D4A3E] text-[#2D4A3E]">
                Back to Dashboard
              </Button>
            </Link>
            <Link to="/progress" className="flex-1">
              <Button className="w-full bg-[#2D4A3E] hover:bg-[#223830] text-white rounded-full">
                View Progress
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7]" data-testid="exercise-session-page">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-[#4B5563] hover:text-[#2D4A3E]">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-['Fraunces'] text-lg font-semibold text-[#1F2937]">
                Practice Session
              </h1>
              <p className="text-xs text-[#9CA3AF]">
                Exercise {currentExerciseIndex + 1} of {sessionData?.exercises?.length || 0}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[#4B5563]">
              <Timer className="w-4 h-4" />
              <span className="font-mono">{formatTime(timer)}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePause}
              className="text-[#4B5563]"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-4xl mx-auto mt-4">
          <Progress value={overallProgress} className="h-2" />
        </div>
      </header>

      {/* Exercise Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="card-base p-8" data-testid="current-exercise">
          {/* Category Badge */}
          <div className="flex items-center justify-between mb-6">
            <span
              className={`category-badge badge-${currentExercise?.category?.replace("_", "-")}`}
            >
              {currentExercise?.category?.replace("_", " ")}
            </span>
            <span className="text-sm text-[#9CA3AF]">
              Level {currentExercise?.difficulty_level}/5
            </span>
          </div>

          {/* Exercise Title */}
          <h2 className="font-['Fraunces'] text-2xl font-medium text-[#1F2937] mb-4">
            {currentExercise?.title}
          </h2>

          {/* Instructions */}
          <p className="text-[#4B5563] mb-8 leading-relaxed">{currentExercise?.instructions}</p>

          {/* Prompt */}
          <div className="bg-[#F3F4F6] rounded-2xl p-8 text-center mb-8">
            <p className="text-sm text-[#9CA3AF] mb-2">
              Prompt {currentPromptIndex + 1} of {currentExercise?.prompts?.length || 0}
            </p>
            <p className="text-3xl font-medium text-[#1F2937] mb-4">{currentPrompt}</p>
            <Button
              variant="ghost"
              onClick={() => speakText(currentPrompt)}
              className="text-[#2D4A3E]"
              data-testid="speak-prompt-btn"
            >
              <Volume2 className="w-5 h-5 mr-2" />
              Listen
            </Button>
          </div>

          {/* Recording Section */}
          <div className="text-center mb-8">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? "bg-[#EF4444] recording-pulse"
                  : "bg-[#2D4A3E] hover:bg-[#223830]"
              }`}
              data-testid="record-btn"
            >
              {isRecording ? (
                <MicOff className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </button>
            <p className="text-sm text-[#9CA3AF] mt-4">
              {isRecording ? "Recording... Click to stop" : "Click to start recording"}
            </p>
            {!speechSupported && (
              <p className="text-xs text-[#F59E0B] mt-2">
                Speech recognition not supported. You can still practice without recording.
              </p>
            )}
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-8" data-testid="transcript">
              <p className="text-sm text-[#9CA3AF] mb-1">You said:</p>
              <p className="text-[#1F2937]">{transcript}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={skipExercise}
              className="flex-1 rounded-full border-gray-200 text-[#4B5563]"
              data-testid="skip-btn"
            >
              <X className="w-4 h-4 mr-2" />
              Skip
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setTranscript("");
                setCurrentPromptIndex(0);
              }}
              className="flex-1 rounded-full border-[#2D4A3E] text-[#2D4A3E]"
              data-testid="retry-btn"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button
              onClick={nextPrompt}
              className="flex-1 bg-[#2D4A3E] hover:bg-[#223830] text-white rounded-full"
              data-testid="next-btn"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExerciseSessionPage;
