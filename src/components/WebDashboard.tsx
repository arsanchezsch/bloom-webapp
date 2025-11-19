// ============================================
// WEB DASHBOARD
// Main dashboard with AI chat, progress tracking, and recommendations
// ============================================

import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { 
  MessageSquare, 
  TrendingUp, 
  User,
  Settings,
  Sparkles,
  Send,
  Camera,
  ChevronRight,
  Plus,
  Sun,
  Moon,
  Leaf,
  Calendar as CalendarIcon,
  Lightbulb,
  Mail,
  Edit,
  Check,
  X
} from "lucide-react";
import bloomLogo from "figma:asset/73a8a80abf64277705c5d856c147464ec33b1a04.png";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer
} from "recharts";
import { fakeBackend, type ScanRecord } from "../services/fakeBackend";

interface WebDashboardProps {
  onViewResults: () => void;
  userInfo?: Record<string, any>;
}

type TabType = "chat" | "progress" | "recommendations" | "profile";

// Mock data for progress tracking (por ahora)
const progressData = [
  { date: "Week 1", acne: 65, hydration: 78, pores: 55, overall: 66 },
  { date: "Week 2", acne: 62, hydration: 80, pores: 58, overall: 68 },
  { date: "Week 3", acne: 58, hydration: 82, pores: 60, overall: 70 },
  { date: "Week 4", acne: 55, hydration: 84, pores: 63, overall: 72 }
];

const currentMetrics = [
  { name: "Acne", value: 55, change: -10, color: "#FF6B4A" },
  { name: "Hydration", value: 84, change: +6, color: "#10B981" },
  { name: "Pores", value: 63, change: +8, color: "#FFA94D" },
  { name: "Redness", value: 70, change: +2, color: "#FF6B4A" }
];

// Mock chat messages
const initialMessages = [
  {
    id: "1",
    role: "assistant" as const,
    content:
      "Hi! I'm your Bloom AI assistant. I can help you understand your skin analysis, recommend products, and answer any skincare questions. How can I help you today?",
    timestamp: new Date(Date.now() - 3600000),
  },
];

// Suggested questions
const suggestedQuestions = [
  "What products should I use for my acne?",
  "How can I improve my skin hydration?",
  "What's the best routine for my skin type?",
  "How often should I exfoliate?",
];

export function WebDashboard({ onViewResults, userInfo }: WebDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  // 🔹 Scan history real (desde fakeBackend)
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);

  useEffect(() => {
    const loadScans = async () => {
      const scans = await fakeBackend.getAllScans();
      scans.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setScanHistory(scans);
    };

    loadScans();
  }, []);

  // Profile state (coming from initial consultation when available)
  const initialName = userInfo?.fullName || "Bloom User";
  const initialEmail = userInfo?.email || "user@example.com";

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [userName, setUserName] = useState(initialName);
  const [userEmail, setUserEmail] = useState(initialEmail);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempName, setTempName] = useState(initialName);
  const [tempEmail, setTempEmail] = useState(initialEmail);

  // User info from initial questionnaire
  const userQuestionnaire = {
    skinType: userInfo?.skinType || "Combination",
    age: userInfo?.age || "28",
    concerns: userInfo?.skinConcerns || ["Acne", "Large Pores", "Oily T-zone"],
    allergies: userInfo?.medicalHistory || "None reported",
    currentProducts:
      userInfo?.currentProducts || "Basic cleanser and moisturizer",
    sunExposure: "Not specified",
    joinDate: "Today",
  };

  const handleSendMessage = (messageText?: string) => {
    const textToSend = messageText || inputValue;
    if (!textToSend.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content:
          "Thanks for your question! Based on your skin analysis, I recommend focusing on consistent hydration and gentle exfoliation. Your acne score has improved by 10 points this month!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;

        const imageMessage = {
          id: Date.now().toString(),
          role: "user" as const,
          content: "I uploaded a photo for analysis",
          image: imageData,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, imageMessage]);

        setTimeout(() => {
          const aiMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant" as const,
            content:
              "Thanks for sharing your photo! I can see some areas that need attention. Based on this image, I recommend focusing on gentle cleansing and hydration. Would you like specific product recommendations?",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
        }, 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveName = () => {
    setUserName(tempName);
    setIsEditingName(false);
  };

  const handleCancelName = () => {
    setTempName(userName);
    setIsEditingName(false);
  };

  const handleSaveEmail = () => {
    setUserEmail(tempEmail);
    setIsEditingEmail(false);
  };

  const handleCancelEmail = () => {
    setTempEmail(userEmail);
    setIsEditingEmail(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-[#E5E5E5] flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-[#E5E5E5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1
                className="text-[#18212D] font-['Manrope',sans-serif]"
                style={{ fontSize: "20px", lineHeight: "28px" }}
              >
                Bloom
              </h1>
              <p className="text-xs text-[#6B7280] font-['Manrope',sans-serif]">
                Skin Analysis
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab("chat")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-['Manrope',sans-serif] ${
              activeTab === "chat"
                ? "bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] text-white shadow-lg"
                : "text-[#6B7280] hover:bg-[#F5F5F5]"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span>AI Chat</span>
          </button>

          <button
            onClick={() => setActiveTab("progress")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-['Manrope',sans-serif] ${
              activeTab === "progress"
                ? "bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] text-white shadow-lg"
                : "text-[#6B7280] hover:bg-[#F5F5F5]"
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span>Progress</span>
          </button>

          <button
            onClick={() => setActiveTab("recommendations")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-['Manrope',sans-serif] ${
              activeTab === "recommendations"
                ? "bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] text-white shadow-lg"
                : "text-[#6B7280] hover:bg-[#F5F5F5]"
            }`}
          >
            <Lightbulb className="w-5 h-5" />
            <span>Recommendations</span>
          </button>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[#E5E5E5]">
          <div className="flex items-center gap-3 px-3 py-2">
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="flex-1">
              <div className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                {userName}
              </div>
              <div className="text-xs text-[#6B7280] font-['Manrope',sans-serif]">
                Premium Member
              </div>
            </div>
            <button
              onClick={() => setActiveTab("profile")}
              className="text-[#6B7280] hover:text-[#18212D] transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-[#E5E5E5] px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h2
                className="text-[#18212D] font-['Manrope',sans-serif]"
                style={{ fontSize: "28px", lineHeight: "36px" }}
              >
                {activeTab === "chat" && "AI Skin Assistant"}
                {activeTab === "progress" && "Your Progress"}
                {activeTab === "recommendations" && "Recommendations"}
                {activeTab === "profile" && "User Profile"}
              </h2>
              <p className="text-[#6B7280] mt-1 font-['Manrope',sans-serif]">
                {activeTab === "chat" && "Get personalized skincare advice"}
                {activeTab === "progress" &&
                  "Track your skin improvement and view your scan history"}
                {activeTab === "recommendations" &&
                  "Personalized skincare routine and lifestyle tips"}
                {activeTab === "profile" &&
                  "Manage your account and personal information"}
              </p>
            </div>
            <img src={bloomLogo} alt="Bloom" className="h-12" />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Chat Tab */}
          {activeTab === "chat" && (
            <div className="h-full flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-8 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-2xl rounded-2xl px-6 py-4 ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] text-white"
                          : "bg-white border border-[#E5E5E5]"
                      }`}
                    >
                      {(message as any).image && (
                        <img
                          src={(message as any).image}
                          alt="Uploaded"
                          className="rounded-xl mb-3 max-w-sm"
                        />
                      )}
                      <p className="text-sm font-['Manrope',sans-serif]">
                        {message.content}
                      </p>
                      <div
                        className={`text-xs mt-2 ${
                          message.role === "user"
                            ? "text-white/70"
                            : "text-[#6B7280]"
                        } font-['Manrope',sans-serif]`}
                      >
                        {message.timestamp.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Suggested Questions */}
                {messages.length <= 1 && (
                  <div className="pt-4">
                    <p className="text-sm text-[#6B7280] mb-3 font-['Manrope',sans-serif]">
                      Try asking:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {suggestedQuestions.map((question, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(question)}
                          className="text-left bg-white border border-[#E5E5E5] rounded-xl px-4 py-3 text-sm text-[#6B7280] hover:border-[#FF6B4A] hover:text-[#FF6B4A] hover:bg-[#FFF5F3] transition-all font-['Manrope',sans-serif]"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="bg-white border-t border-[#E5E5E5] p-6">
                <div className="max-w-4xl mx-auto flex gap-3">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSendMessage()
                    }
                    placeholder="Ask anything about your skin..."
                    className="flex-1 h-14 bg-[#F5F5F5] rounded-xl px-6 text-[#18212D] placeholder:text-[#6B7280] border border-[#E5E5E5] focus:outline-none focus:border-[#FF6B4A] transition-colors font-['Manrope',sans-serif]"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-14 w-14 bg.white hover:bg-[#F5F5F5] text-[#6B7280] hover:text-[#FF6B4A] rounded-xl border border-[#E5E5E5] font-['Manrope',sans-serif] flex items-center justify-center p-0"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim()}
                    className="h-14 px-8 bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] hover:from-[#E74C3C] hover:to-[#FF8C42] text-white rounded-xl shadow-lg border-0 disabled:opacity-50 font-['Manrope',sans-serif]"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Progress Tab */}
          {activeTab === "progress" && (
            <div className="p-8 space-y-6">
              {/* Multi-line Chart */}
              <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 shadow-sm">
                <h3
                  className="text-[#18212D] mb-6 font-['Manrope',sans-serif]"
                  style={{ fontSize: "20px", lineHeight: "28px" }}
                >
                  Metrics Over Time
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                    <XAxis dataKey="date" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <RechartsTooltip />
                    <Line
                      type="monotone"
                      dataKey="acne"
                      stroke="#FF6B4A"
                      strokeWidth={3}
                      name="Acne"
                    />
                    <Line
                      type="monotone"
                      dataKey="hydration"
                      stroke="#10B981"
                      strokeWidth={3}
                      name="Hydration"
                    />
                    <Line
                      type="monotone"
                      dataKey="pores"
                      stroke="#FFA94D"
                      strokeWidth={3}
                      name="Pores"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Improvement Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 shadow-sm">
                  <h3
                    className="text-[#18212D] mb-6 font-['Manrope',sans-serif]"
                    style={{ fontSize: "20px", lineHeight: "28px" }}
                  >
                    Your Improvements
                  </h3>
                  <div className="space-y-4">
                    {currentMetrics.map((metric, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between"
                      >
                        <span className="text-[#6B7280] font-['Manrope',sans-serif]">
                          {metric.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D]"
                              style={{ width: `${metric.value}%` }}
                            />
                          </div>
                          <span
                            className={`text-sm font-['Manrope',sans-serif] min-w-[60px] text-right ${
                              metric.change >= 0
                                ? "text-[#10B981]"
                                : "text-[#FF6B4A]"
                            }`}
                          >
                            {metric.change >= 0 ? "+" : ""}
                            {metric.change} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-2xl border border-[#E5E5E5] p-8 shadow-sm">
                  <h3
                    className="text-[#18212D] mb-4 font-['Manrope',sans-serif]"
                    style={{ fontSize: "20px", lineHeight: "28px" }}
                  >
                    Keep It Up! 🎉
                  </h3>
                  <p className="text-[#6B7280] mb-6 font-['Manrope',sans-serif]">
                    You've made amazing progress this month! Your overall skin
                    health improved by 6 points.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <div className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                        Acne reduced by 10 points
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <div className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                        Hydration improved by 6 points
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#10B981] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <div className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                        Pore visibility decreased by 8 points
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo History Section (dinámico con scanHistory) */}
              <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <CalendarIcon className="w-6 h-6 text-[#FF6B4A]" />
                  <h3
                    className="text-[#18212D] font-['Manrope',sans-serif]"
                    style={{ fontSize: "20px", lineHeight: "28px" }}
                  >
                    Photo History
                  </h3>
                </div>

                {scanHistory.length === 0 ? (
                  <p className="text-sm text-[#6B7280] font-['Manrope',sans-serif]">
                    No scans yet. Once you run your first analysis, it will
                    appear here.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* “Calendario” simple con días con scans */}
                    <div className="flex flex-col">
                      <h4 className="text-[#6B7280] mb-4 font-['Manrope',sans-serif]">
                        Scan Days
                      </h4>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {Array.from(
                          new Map(
                            scanHistory.map((scan) => {
                              const date = new Date(scan.createdAt);
                              const key = date.toDateString();
                              return [key, date];
                            })
                          ).values()
                        ).map((date) => (
                          <span
                            key={date.toISOString()}
                            className="px-3 py-1 rounded-full bg-[#FFE6D7] text-[#FF6B4A]"
                          >
                            {date.toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        ))}
                      </div>
                      <p className="mt-3 text-[10px] text-slate-400 font-['Manrope',sans-serif]">
                        Each pill represents a day with at least one skin
                        analysis.
                      </p>
                    </div>

                    {/* Recent scans list */}
                    <div>
                      <h4 className="text-[#6B7280] mb-4 font-['Manrope',sans-serif]">
                        Recent scans
                      </h4>
                      <div className="space-y-4">
                        {scanHistory.slice(0, 4).map((scan, index) => {
                          const date = new Date(scan.createdAt);
                          return (
                            <div
                              key={scan.id}
                              className="flex items-center gap-4 p-4 bg-[#F5F5F5] rounded-xl hover:bg-[#FFE5DD] transition-colors cursor-pointer group"
                              onClick={onViewResults}
                            >
                              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center">
                                <Camera className="w-7 h-7 text.white" />
                              </div>
                              <div className="flex-1">
                                <div className="text-[#18212D] font-['Manrope',sans-serif]">
                                  Skin analysis #{scanHistory.length - index}
                                </div>
                                <div className="text-sm text-[#6B7280] font-['Manrope',sans-serif]">
                                  {date.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}{" "}
                                  ·{" "}
                                  {scan.source === "camera"
                                    ? "Camera"
                                    : "Upload"}
                                </div>
                                <div className="text-xs text-[#10B981] mt-1 font-['Manrope',sans-serif]">
                                  Score: coming soon
                                </div>
                              </div>
                              <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[#FF6B4A] hover:text-[#E74C3C]">
                                <ChevronRight className="w-6 h-6" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === "recommendations" && (
            <div className="p-8">
              <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 shadow-sm">
                <h3
                  className="text-[#18212D] mb-6 font-['Manrope',sans-serif]"
                  style={{ fontSize: "24px", lineHeight: "32px" }}
                >
                  Your Personalized Skincare Plan
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Morning Routine */}
                  <div className="bg-gradient-to-br from-orange-50/50 to-white rounded-xl border border-[#E5E5E5] p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center">
                        <Sun className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-[#18212D] font-['Manrope',sans-serif]">
                        Morning Routine
                      </h4>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3 border border-[#E5E5E5]">
                        <div className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                          Gentle Cleanser
                        </div>
                        <div className="text-xs text-[#6B7280] font-['Manrope',sans-serif]">
                          Maintain barrier function
                        </div>
                      </div>
                      <div className="bg.white rounded-lg p-3 border border-[#E5E5E5]">
                        <div className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                          Vitamin C Serum 15%
                        </div>
                        <div className="text-xs text-[#6B7280] font-['Manrope',sans-serif]">
                          Antioxidant protection & brightening
                        </div>
                      </div>
                      <div className="bg.white rounded-lg p-3 border border-[#E5E5E5]">
                        <div className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                          Niacinamide 10%
                        </div>
                        <div className="text-xs text-[#6B7280] font-['Manrope',sans-serif]">
                          Pore refinement & oil control
                        </div>
                      </div>
                      <div className="bg.white rounded-lg p-3 border border-[#E5E5E5]">
                        <div className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                          SPF 50+
                        </div>
                        <div className="text-xs text-[#6B7280] font-['Manrope',sans-serif]">
                          UV protection essential
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Evening Routine */}
                  <div className="bg-gradient-to-br from-blue-50/30 to-white rounded-xl border border-[#E5E5E5] p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4A90E2] to-[#357ABD] flex items-center justify-center">
                        <Moon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-[#18212D] font-['Manrope',sans-serif]">
                        Evening Routine
                      </h4>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3 border border-[#E5E5E5]">
                        <div className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                          Oil Cleanser
                        </div>
                        <div className="text-xs text-[#6B7280] font-['Manrope',sans-serif]">
                          Remove sunscreen & impurities
                        </div>
                      </div>
                      <div className="bg.white rounded-lg p-3 border border-[#E5E5E5]">
                        <div className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                          Salicylic Acid 2%
                        </div>
                        <div className="text-xs text-[#6B7280] font-['Manrope',sans-serif]">
                          Acne control & pore care
                        </div>
                      </div>
                      <div className="bg.white rounded-lg p-3 border border-[#E5E5E5]">
                        <div className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                          Retinol 0.5%
                        </div>
                        <div className="text-xs text-[#6B7280] font-['Manrope',sans-serif]">
                          Anti-aging & texture improvement
                        </div>
                      </div>
                      <div className="bg.white rounded-lg p-3 border border-[#E5E5E5]">
                        <div className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                          Ceramide Moisturizer
                        </div>
                        <div className="text-xs text-[#6B7280] font-['Manrope',sans-serif]">
                          Barrier repair overnight
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Treatments */}
                  <div className="bg-gradient-to-br from-purple-50/30 to-white rounded-xl border border-[#E5E5E5] p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#9B59B6] to-[#8E44AD] flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-[#18212D] font-['Manrope',sans-serif]">
                        Weekly Treatments
                      </h4>
                    </div>
                    <div className="space-y-3">
                      <div className="bg.white rounded-lg p-3 border border-[#E5E5E5]">
                        <div className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                          AHA/BHA Peel Mask
                        </div>
                        <div className="text-xs text-[#6B7280] font-['Manrope',sans-serif]">
                          Deep exfoliation for texture
                        </div>
                      </div>
                      <div className="bg.white rounded-lg p-3 border border-[#E5E5E5]">
                        <div className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                          Hydrating Sheet Mask
                        </div>
                        <div className="text-xs text-[#6B7280] font-['Manrope',sans-serif]">
                          Boost hydration levels
                        </div>
                      </div>
                      <div className="bg.white rounded-lg p-3 border border-[#E5E5E5]">
                        <div className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                          Clay Mask (T-zone)
                        </div>
                        <div className="text-xs text-[#6B7280] font-['Manrope',sans-serif]">
                          Oil control & pore cleansing
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lifestyle Tips */}
                  <div className="bg-gradient-to-br from-green-50/30 to-white rounded-xl border border-[#E5E5E5] p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#27AE60] to-[#229954] flex items-center justify-center">
                        <Leaf className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-[#18212D] font-['Manrope',sans-serif]">
                        Lifestyle Tips
                      </h4>
                    </div>
                    <div className="space-y-3">
                      <div className="bg.white rounded-lg p-3 border border-[#E5E5E5]">
                        <div className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                          Hydration Goal
                        </div>
                        <div className="text-xs text-[#6B7280] font-['Manrope',sans-serif]">
                          Drink 8 glasses of water daily
                        </div>
                      </div>
                      <div className="bg.white rounded-lg p-3 border border-[#E5E5E5]">
                        <div className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                          Sleep Quality
                        </div>
                        <div className="text-xs text-[#6B7280] font-['Manrope',sans-serif]">
                          Aim for 7-9 hours nightly
                        </div>
                      </div>
                      <div className="bg.white rounded-lg p-3 border border-[#E5E5E5]">
                        <div className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                          Nutrition
                        </div>
                        <div className="text-xs text-[#6B7280] font-['Manrope',sans-serif]">
                          Focus on antioxidant-rich foods
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="p-8 space-y-6">
              {/* Profile Photo Section */}
              <div className="bg.white rounded-2xl border border-[#E5E5E5] p-8 shadow-sm">
                <h3
                  className="text-[#18212D] mb-6 font-['Manrope',sans-serif]"
                  style={{ fontSize: "20px", lineHeight: "28px" }}
                >
                  Profile Photo
                </h3>
                <div className="flex items-center gap-6">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-[#E5E5E5]"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center">
                      <User className="w-12 h-12 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={profilePhotoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => profilePhotoInputRef.current?.click()}
                      className="bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] hover:from-[#E74C3C] hover:to-[#FF8C42] text-white rounded-xl px-6 py-3 border-0 font-['Manrope',sans-serif]"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      {profilePhoto ? "Change Photo" : "Upload Photo"}
                    </Button>
                    {profilePhoto && (
                      <Button
                        onClick={() => setProfilePhoto(null)}
                        className="ml-3 bg-white hover:bg-[#F5F5F5] text-[#6B7280] hover:text-[#FF6B4A] rounded-xl px-6 py-3 border border-[#E5E5E5] font-['Manrope',sans-serif]"
                      >
                        Remove Photo
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Editable Name */}
                <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3
                      className="text-[#18212D] font-['Manrope',sans-serif]"
                      style={{ fontSize: "20px", lineHeight: "28px" }}
                    >
                      Name
                    </h3>
                    {!isEditingName && (
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="text-[#FF6B4A] hover:text-[#E74C3C] transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {isEditingName ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="w-full h-12 bg-[#F5F5F5] rounded-xl px-4 text-[#18212D] border border-[#E5E5E5] focus:outline-none focus:border-[#FF6B4A] transition-colors font-['Manrope',sans-serif]"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveName}
                          className="flex-1 bg-gradient.to-r from-[#FF6B4A] to-[#FFA94D] hover:from-[#E74C3C] hover:to-[#FF8C42] text-white rounded-xl px-4 py-2 border-0 font-['Manrope',sans-serif]"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          onClick={handleCancelName}
                          className="flex-1 bg-white hover:bg-[#F5F5F5] text-[#6B7280] hover:text-[#FF6B4A] rounded-xl px-4 py-2 border border-[#E5E5E5] font-['Manrope',sans-serif]"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-[#FF6B4A]" />
                      <span className="text-[#18212D] font-['Manrope',sans-serif]">
                        {userName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Editable Email */}
                <div className="bg.white rounded-2xl border border-[#E5E5E5] p-8 shadow-sm">
                  <div className="flex.items-center justify-between mb-6">
                    <h3
                      className="text-[#18212D] font-['Manrope',sans-serif]"
                      style={{ fontSize: "20px", lineHeight: "28px" }}
                    >
                      Email
                    </h3>
                    {!isEditingEmail && (
                      <button
                        onClick={() => setIsEditingEmail(true)}
                        className="text-[#FF6B4A] hover:text-[#E74C3C] transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {isEditingEmail ? (
                    <div className="space-y-3">
                      <input
                        type="email"
                        value={tempEmail}
                        onChange={(e) => setTempEmail(e.target.value)}
                        className="w-full h-12 bg-[#F5F5F5] rounded-xl px-4 text-[#18212D] border border-[#E5E5E5] focus:outline-none focus:border-[#FF6B4A] transition-colors font-['Manrope',sans-serif]"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveEmail}
                          className="flex-1 bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] hover:from-[#E74C3C] hover:to-[#FF8C42] text-white rounded-xl px-4 py-2 border-0 font-['Manrope',sans-serif]"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          onClick={handleCancelEmail}
                          className="flex-1 bg-white hover:bg-[#F5F5F5] text-[#6B7280] hover:text-[#FF6B4A] rounded-xl px-4 py-2 border border-[#E5E5E5] font-['Manrope',sans-serif]"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-[#FF6B4A]" />
                      <span className="text-[#18212D] font-['Manrope',sans-serif]">
                        {userEmail}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Initial Questionnaire Data */}
              <div className="bg.white rounded-2xl border border-[#E5E5E5] p-8 shadow-sm">
                <h3
                  className="text-[#18212D] mb-6 font-['Manrope',sans-serif]"
                  style={{ fontSize: "20px", lineHeight: "28px" }}
                >
                  Your Skin Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="text-sm text-[#6B7280] font-['Manrope',sans-serif]">
                      Skin Type
                    </div>
                    <div className="text-[#18212D] font-['Manrope',sans-serif]">
                      {userQuestionnaire.skinType}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-[#6B7280] font-['Manrope',sans-serif]">
                      Age
                    </div>
                    <div className="text-[#18212D] font-['Manrope',sans-serif]">
                      {userQuestionnaire.age}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-[#6B7280] font-['Manrope',sans-serif]">
                      Main Concerns
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {userQuestionnaire.concerns.map((concern, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-[#FFF5F3] text-[#FF6B4A] rounded-full text-xs font-['Manrope',sans-serif]"
                        >
                          {concern}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-[#6B7280] font-['Manrope',sans-serif]">
                      Allergies
                    </div>
                    <div className="text-[#18212D] font-['Manrope',sans-serif]">
                      {userQuestionnaire.allergies}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-[#6B7280] font-['Manrope',sans-serif]">
                      Current Products
                    </div>
                    <div className="text-[#18212D] font-['Manrope',sans-serif]">
                      {userQuestionnaire.currentProducts}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-[#6B7280] font-['Manrope',sans-serif]">
                      Sun Exposure
                    </div>
                    <div className="text-[#18212D] font-['Manrope',sans-serif]">
                      {userQuestionnaire.sunExposure}
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-2xl border border-[#E5E5E5] p-8 shadow-sm">
                <h3
                  className="text-[#18212D] mb-4 font-['Manrope',sans-serif]"
                  style={{ fontSize: "20px", lineHeight: "28px" }}
                >
                  Account Status
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280] font-['Manrope',sans-serif]">
                      Membership
                    </span>
                    <span className="px-4 py-1 bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] text-white rounded-full text-sm font-['Manrope',sans-serif]">
                      Premium
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280] font-['Manrope',sans-serif]">
                      Member Since
                    </span>
                    <span className="text-[#18212D] font-['Manrope',sans-serif]">
                      {userQuestionnaire.joinDate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7280] font-['Manrope',sans-serif]">
                      Total Scans
                    </span>
                    <span className="text-[#18212D] font-['Manrope',sans-serif]">
                      {scanHistory.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
