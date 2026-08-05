import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TriageChatPage = () => {
  const { getAuthHeader } = useAuth();
  const navigate = useNavigate();
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatStatus, setChatStatus] = useState("in_progress");
  const [speechProfile, setSpeechProfile] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Start with initial greeting
    setMessages([
      {
        role: "assistant",
        content: `Hello! I'm your FluentAI Speech Therapy Assistant. I'm here to help understand your speech needs and create a personalized therapy plan for you.

Before we begin, please note that I provide guided exercises and recommendations, but I do not diagnose medical conditions. For medical concerns, please consult a qualified healthcare professional.

Let's start! Could you tell me a bit about what brings you here today? Are you seeking help for yourself, or are you a parent/caregiver helping someone else?`,
      },
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/triage/chat`,
        {
          message: userMessage,
          chat_id: chatId,
        },
        { headers: getAuthHeader() }
      );

      setChatId(response.data.chat_id);
      setMessages((prev) => [...prev, { role: "assistant", content: response.data.response }]);
      setChatStatus(response.data.status);

      if (response.data.speech_profile) {
        setSpeechProfile(response.data.speech_profile);
        toast.success("Assessment complete! Your speech profile has been created.");
      }
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
      setMessages((prev) => prev.slice(0, -1)); // Remove the failed user message
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const createTherapyPlan = async () => {
    if (!speechProfile) return;

    try {
      await axios.post(
        `${API_URL}/therapy/plans?profile_id=${speechProfile.id}`,
        {},
        { headers: getAuthHeader() }
      );
      toast.success("Therapy plan created successfully!");
      navigate("/therapy-plan");
    } catch (error) {
      toast.error("Failed to create therapy plan.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F7] flex flex-col" data-testid="triage-chat-page">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-[#4B5563] hover:text-[#2D4A3E]">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2D4A3E] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-['Fraunces'] text-lg font-semibold text-[#1F2937]">
                  AI Speech Assessment
                </h1>
                <p className="text-xs text-[#9CA3AF]">
                  {chatStatus === "completed" ? "Assessment Complete" : "In Progress"}
                </p>
              </div>
            </div>
          </div>

          {chatStatus === "completed" && speechProfile && (
            <Button
              onClick={createTherapyPlan}
              className="bg-[#10B981] hover:bg-[#059669] text-white rounded-full"
              data-testid="create-plan-btn"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Create Therapy Plan
            </Button>
          )}
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              <div
                className={`max-w-[80%] px-5 py-4 ${
                  message.role === "user" ? "chat-user" : "chat-assistant"
                }`}
                data-testid={`chat-message-${idx}`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="chat-assistant px-5 py-4 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#2D4A3E]" />
                <span className="text-sm text-[#4B5563]">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Speech Profile Summary */}
      {speechProfile && (
        <div className="px-6 py-4 bg-[#10B981]/10 border-t border-[#10B981]/20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#10B981]/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-[#10B981]" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-[#1F2937] mb-2">Your Speech Profile</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-[#9CA3AF]">Primary Difficulty</p>
                    <p className="text-[#1F2937] font-medium capitalize">{speechProfile.primary_difficulty || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-[#9CA3AF]">Severity</p>
                    <p className="text-[#1F2937] font-medium capitalize">{speechProfile.severity || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-[#9CA3AF]">Confidence</p>
                    <p className="text-[#1F2937] font-medium">{Math.round((speechProfile.confidence || 0) * 100)}%</p>
                  </div>
                  <div>
                    <p className="text-[#9CA3AF]">Recommended Path</p>
                    <p className="text-[#1F2937] font-medium capitalize">{speechProfile.recommended_therapy_path || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-4">
            <div className="flex-1 relative">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={chatStatus === "completed" ? "Assessment complete. You can still ask questions..." : "Type your message..."}
                className="input-base resize-none pr-12 min-h-[56px] max-h-32"
                rows={1}
                data-testid="chat-input"
              />
            </div>
            <Button
              onClick={sendMessage}
              disabled={loading || !inputMessage.trim()}
              className="bg-[#2D4A3E] hover:bg-[#223830] text-white rounded-full w-12 h-12 p-0 flex-shrink-0"
              data-testid="send-message-btn"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-[#9CA3AF] mt-2 text-center">
            Press Enter to send • Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default TriageChatPage;
