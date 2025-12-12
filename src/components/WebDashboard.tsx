// ============================================
// WEB DASHBOARD
// Main dashboard with AI chat, progress tracking, and recommendations
// ============================================

import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { ProgressRadar } from "./results/ProgressRadar";
import { RadarOverview } from "./results/RadarOverview";
import type { SkinMetric } from "../types";
import { skinMetrics, overallHealth } from "../constants/skinAnalysis";
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
  X,
} from "lucide-react";
import bloomLogo from "figma:asset/73a8a80abf64277705c5d856c147464ec33b1a04.png";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { fakeBackend, type ScanRecord } from "../services/fakeBackend";

// ---------- OpenAI Routine Types (mismo formato que en WebResultsScreen) ----------
type RoutineSectionId = "morning" | "evening" | "weekly";

interface RoutineStep {
  id: string;
  title: string;
  subtitle: string;
  concerns: string[];
  usageNotes?: string;
}

interface RoutineSection {
  id: RoutineSectionId;
  title: string;
  steps: RoutineStep[];
}

interface BloomRoutineResponse {
  summary: string;
  mainConcerns: string[];
  sections: RoutineSection[];
  disclaimer: string;
}

interface WebDashboardProps {
  onViewResults: () => void;
  userInfo?: Record<string, any>;
  initialTab?: "progress" | "chat" | "recommendations" | "patient-profile";
  onLogout?: () => void;
  onBackToHome?: () => void;
  onTakeNewScan?: () => void;
}

type TabType = "progress" | "chat" | "recommendations" | "patient-profile";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  image?: string;
};

const BLOOM_SERVER_URL =
  import.meta.env.VITE_BLOOM_SERVER_URL || "http://localhost:8787";


// Mock data for progress tracking (por ahora)
const progressData = [
  { date: "Week 1", acne: 65, hydration: 78, pores: 55, overall: 66 },
  { date: "Week 2", acne: 62, hydration: 80, pores: 58, overall: 68 },
  { date: "Week 3", acne: 58, hydration: 82, pores: 60, overall: 70 },
  { date: "Week 4", acne: 55, hydration: 84, pores: 63, overall: 72 },
];

const currentMetrics = [
  { name: "Acne", value: 55, change: -10, color: "#FF6B4A" },
  { name: "Hydration", value: 84, change: +6, color: "#10B981" },
  { name: "Pores", value: 63, change: +8, color: "#FFA94D" },
  { name: "Redness", value: 70, change: +2, color: "#FF6B4A" },
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

export function WebDashboard({
  onViewResults,
  userInfo,
  initialTab = "progress",
  onBackToHome,
  onTakeNewScan,
}: WebDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const [showDoctorModal, setShowDoctorModal] = useState(false);

  // 🔹 Doctor info (intentamos leer de auth/session)
  const [doctorInfo, setDoctorInfo] = useState<{ fullName: string; email: string }>({
    fullName: "Doctor",
    email: "",
  });
  
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem("bloom_doctor_auth") ||
        localStorage.getItem("bloom_doctor_session_v2");
      if (raw) {
        const data = JSON.parse(raw);
        setDoctorInfo({
          fullName: data.fullName || data.name || "Doctor",
          email: data.email || "",
        });
      }
    } catch {
      // ignore
    }
  }, []);

  // 🔹 Scan history real (desde fakeBackend)
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [latestMetrics, setLatestMetrics] = useState<SkinMetric[] | null>(null);
const [latestOverallHealth, setLatestOverallHealth] = useState(overallHealth);
const [routine, setRoutine] = useState<BloomRoutineResponse | null>(null);
const [routineUpdatedAt, setRoutineUpdatedAt] = useState<string | null>(null);

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

  useEffect(() => {
    try {
      const rawMetrics = localStorage.getItem("bloom_last_scan_metrics");
      const rawOverall = localStorage.getItem("bloom_last_overall_health");
  
      if (rawMetrics) {
        const parsedMetrics = JSON.parse(rawMetrics) as SkinMetric[];
        setLatestMetrics(parsedMetrics);
      }
  
      if (rawOverall) {
        const parsedOverall = JSON.parse(rawOverall);
        setLatestOverallHealth(parsedOverall);
      }
    } catch (error) {
      console.error("Error loading last scan metrics", error);
    }
  }, []);  

  useEffect(() => {
    try {
      const rawRoutine = localStorage.getItem("bloom_last_routine_v1");
      const rawDate = localStorage.getItem(
        "bloom_last_routine_created_at_v1"
      );

      if (rawRoutine) {
        const parsed = JSON.parse(rawRoutine) as BloomRoutineResponse;
        setRoutine(parsed);
      }

      if (rawDate) {
        setRoutineUpdatedAt(rawDate);
      }
    } catch (error) {
      console.error("Error loading last routine", error);
    }
  }, []);

  const hasPhotoOnDate = (date: Date) => {
    return scanHistory.some((scan) => {
      const scanDate = new Date(scan.createdAt);
      return scanDate.toDateString() === date.toDateString();
    });
  };

  // Profile state (coming from initial consultation when available)
  const initialName = userInfo?.fullName || "Bloom User";
  const initialEmail = userInfo?.email || "user@example.com";
  const initialAge = (userInfo?.age as string) || "28";

  // User info from initial questionnaire
  const userQuestionnaire = {
    skinType: userInfo?.skinType || "Combination",
    age: initialAge,
    concerns: userInfo?.skinConcerns || ["Acne", "Large pores", "Oily T-zone"],
    allergies: userInfo?.medicalHistory || "None reported",
    currentProducts:
      userInfo?.currentProducts || "Basic cleanser and moisturizer",
    sunExposure: "Not specified",
    joinDate: "Today",
  };

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [userName, setUserName] = useState(initialName);
  const [userEmail, setUserEmail] = useState(initialEmail);
  const [userAge, setUserAge] = useState(initialAge);

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingAge, setIsEditingAge] = useState(false);

  const [tempName, setTempName] = useState(initialName);
  const [tempEmail, setTempEmail] = useState(initialEmail);
  const [tempAge, setTempAge] = useState(initialAge);

  // Doctor comments (solo visibles para el doctor) + persistencia local
  const doctorNotesStorageKey = userInfo?.id
    ? `bloom_doctor_notes_${userInfo.id}`
    : "bloom_doctor_notes_default";

  const [doctorNotes, setDoctorNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedAt, setNotesSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(doctorNotesStorageKey);
      if (saved) {
        setDoctorNotes(saved);
      }
    } catch {
      // ignore
    }
  }, [doctorNotesStorageKey]);

  const handleSaveDoctorNotes = () => {
    try {
      setIsSavingNotes(true);
      localStorage.setItem(doctorNotesStorageKey, doctorNotes);
      setNotesSavedAt(new Date());
    } catch {
      // ignore
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Editable skin profile state (from onboarding)
  const [skinType, setSkinType] = useState(userQuestionnaire.skinType);
  const [mainConcerns, setMainConcerns] = useState<string[]>(
    userQuestionnaire.concerns
  );
  const [allergies, setAllergies] = useState(userQuestionnaire.allergies);
  const [currentProducts, setCurrentProducts] = useState(
    userQuestionnaire.currentProducts
  );

  const [isEditingSkinType, setIsEditingSkinType] = useState(false);
  const [isEditingMainConcerns, setIsEditingMainConcerns] = useState(false);
  const [isEditingAllergies, setIsEditingAllergies] = useState(false);
  const [isEditingCurrentProducts, setIsEditingCurrentProducts] =
    useState(false);

  const [tempSkinType, setTempSkinType] = useState(userQuestionnaire.skinType);
  const [tempMainConcerns, setTempMainConcerns] = useState(
    userQuestionnaire.concerns.join(", ")
  );
  const [tempAllergies, setTempAllergies] = useState(
    userQuestionnaire.allergies
  );
  const [tempCurrentProducts, setTempCurrentProducts] = useState(
    userQuestionnaire.currentProducts
  );

  const handleSaveSkinType = () => {
    setSkinType(tempSkinType);
    setIsEditingSkinType(false);
  };

  const handleCancelSkinType = () => {
    setTempSkinType(skinType);
    setIsEditingSkinType(false);
  };

  const handleSaveMainConcerns = () => {
    const list = tempMainConcerns
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    setMainConcerns(list);
    setIsEditingMainConcerns(false);
  };

  const handleCancelMainConcerns = () => {
    setTempMainConcerns(mainConcerns.join(", "));
    setIsEditingMainConcerns(false);
  };

  const handleSaveAllergies = () => {
    setAllergies(tempAllergies);
    setIsEditingAllergies(false);
  };

  const handleCancelAllergies = () => {
    setTempAllergies(allergies);
    setIsEditingAllergies(false);
  };

  const handleSaveCurrentProducts = () => {
    setCurrentProducts(tempCurrentProducts);
    setIsEditingCurrentProducts(false);
  };

  const handleCancelCurrentProducts = () => {
    setTempCurrentProducts(currentProducts);
    setIsEditingCurrentProducts(false);
  };

    // Chat state
    const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
    const [chatInput, setChatInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);
  
    const fileInputRef = useRef<HTMLInputElement>(null);
    const profilePhotoInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
    useEffect(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, [messages, isSending]);  

// Preguntas sugeridas dinámicas en función del último scan y el perfil
const buildSuggestedQuestions = (): string[] => {
  const concernsFromRoutine = routine?.mainConcerns ?? [];
  const concernsFromProfile = mainConcerns || [];

  const allConcerns = [...concernsFromRoutine, ...concernsFromProfile]
    .map((c) => c.toLowerCase())
    .filter(Boolean);

  const unique = Array.from(new Set(allConcerns));

  const pretty = (c: string) =>
    c
      .replace(/_/g, " ")
      .replace(/\b\w/g, (ch) => ch.toUpperCase());

  if (!unique.length) {
    return [
      "What products should I use for my acne?",
      "How can I improve my skin hydration?",
      "What's the best routine for my skin type?",
      "How often should I exfoliate?",
    ];
  }

  const main = unique[0];
  const secondary = unique[1];

  const q1 = main
    ? `What is the best routine to improve my ${pretty(main)}?`
    : "What is the best routine for my skin right now?";

  const q2 = secondary
    ? `Which ingredients should I look for if I want to treat ${pretty(
        secondary
      )}?`
    : "Which ingredients are best for strengthening my skin barrier?";

  const q3 = main
    ? `How can I track progress for my ${pretty(
        main
      )} over the next few weeks?`
    : "How can I track my skin progress with Bloom scans?";

  return [q1, q2, q3];
};

// Se recalculan en cada render con el contexto actual
const dynamicSuggestedQuestions = buildSuggestedQuestions();

// Contexto que se manda al backend para personalizar el chat
const buildSkinContext = () => {
  return {
    metrics: latestMetrics ?? skinMetrics,
    overallHealth: latestOverallHealth ?? overallHealth,
    profile: {
      skinType,
      mainConcerns,
      age: userAge,
      allergies,
      currentProducts,
    },
  };
};

// Enviar mensaje al backend (texto libre o pregunta sugerida)
const handleSendMessage = async (forcedContent?: string) => {
  const content = (forcedContent ?? chatInput).trim();
  if (!content || isSending) return;

  setChatError(null);

  const userMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: "user",
    content,
    timestamp: new Date(),
  };

  const historyAfterUser: ChatMessage[] = [...messages, userMessage];
  setMessages(historyAfterUser);

  // Si viene del input, limpiamos el campo
  if (!forcedContent) {
    setChatInput("");
  }

  setIsSending(true);

  try {
    const res = await fetch(`${BLOOM_SERVER_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: historyAfterUser.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        skinContext: buildSkinContext(),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[Bloom Web] Chat backend error:", text);
      throw new Error("Error calling Bloom chat backend");
    }

    const data = await res.json();

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        data.reply ??
        "I'm having trouble accessing your full skin data right now, but I can still share general skincare guidance.",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
  } catch (error) {
    console.error("[Bloom Web] Chat error:", error);
    setChatError(
      "We couldn’t connect to the chat right now. Please try again in a moment."
    );
  } finally {
    setIsSending(false);
  }
};

const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = reader.result as string;

      const imageMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content:
          "I've uploaded a new skin photo. Please take it into account when giving advice.",
        image: imageData,
        timestamp: new Date(),
      };

      // mostramos la foto en el chat
      setMessages((prev) => [...prev, imageMessage]);

      // disparamos una pregunta automática para que el modelo responda
      void handleSendMessage(
        "I just uploaded a new skin photo. Can you review my main concerns based on my latest analysis?"
      );
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

  const handleSaveAge = () => {
    setUserAge(tempAge);
    setIsEditingAge(false);
  };

  const handleCancelAge = () => {
    setTempAge(userAge);
    setIsEditingAge(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-[#E5E5E5] flex flex-col">
        {/* Doctor Account (arriba a la izquierda) */}
        <div className="p-4 border-b border-[#E5E5E5]">
          <button
            onClick={() => {
              if (onBackToHome) onBackToHome();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#F5F5F5] transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                {doctorInfo.fullName || "Doctor"}
              </div>
              <div className="text-xs text-[#6B7280] font-['Manrope',sans-serif]">
                Doctor Account
              </div>
            </div>
            <Settings className="w-5 h-5 text-[#6B7280]" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {/* PROGRESS FIRST */}
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

          {/* CHAT SECOND */}
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

          {/* RECOMMENDATIONS THIRD */}
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

          {/* PATIENT PROFILE FOURTH */}
          <button
            onClick={() => setActiveTab("patient-profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-['Manrope',sans-serif] ${
              activeTab === "patient-profile"
                ? "bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] text-white shadow-lg"
                : "text-[#6B7280] hover:bg-[#F5F5F5]"
            }`}
          >
            <User className="w-5 h-5" />
            <span>Patient Profile</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg.white border-b border-[#E5E5E5] px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h2
                className="text-[#18212D] font-['Manrope',sans-serif]"
                style={{ fontSize: "28px", lineHeight: "36px" }}
              >
                {activeTab === "chat" && "AI Skin Assistant"}
                {activeTab === "progress" && "Your Progress"}
                {activeTab === "recommendations" && "Recommendations"}
                {activeTab === "patient-profile" && "Patient Profile"}
              </h2>
              <p className="text-[#6B7280] mt-1 font-['Manrope',sans-serif]">
                {activeTab === "chat" && "Get personalized skincare advice"}
                {activeTab === "progress" &&
                  "Track your skin improvement and view your scan history"}
                {activeTab === "recommendations" &&
                  "Personalized skincare routine and lifestyle tips"}
                {activeTab === "patient-profile" &&
                  "Personal data, skin profile and doctor comments"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {onTakeNewScan && activeTab === "progress" && (
                <Button
                  onClick={onTakeNewScan}
                  className="h-12 px-6 bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] hover:opacity-90 text-white rounded-xl transition-opacity shadow-lg border-0 font-['Manrope',sans-serif]"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  New Scan
                </Button>
              )}
              <img src={bloomLogo} alt="Bloom" className="h-12" />
            </div>
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
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-2xl rounded-2xl px-6 py-4 ${
              message.role === "user"
                ? "bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] text-white"
                : "bg-white border border-[#E5E5E5]"
            }`}
          >
            {message.image && (
              <img
                src={message.image}
                alt="Uploaded"
                className="rounded-xl mb-3 max-w-sm"
              />
            )}
            <p className="text-sm font-['Manrope',sans-serif] whitespace-pre-line">
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

      {/* Indicador de carga (tres puntitos) */}
      {isSending && !chatError && (
        <div className="flex justify-start">
          <div className="max-w-xs rounded-2xl px-4 py-3 bg-white border border-[#E5E5E5]">
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="w-2.5 h-2.5 rounded-full bg-[#FF6B4A] animate-pulse"
                  style={{ animationDelay: `${dot * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Preguntas sugeridas dinámicas */}
      {messages.length <= 1 && (
        <div className="pt-4">
          <p className="text-sm text-[#6B7280] mb-3 font-['Manrope',sans-serif]">
            Try asking:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {dynamicSuggestedQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(question)}
                className="text-left bg-white border border-[#E5E5E5] rounded-xl px-4 py-3 
                  text-sm text-[#6B7280] hover:border-[#FF6B4A] hover:text-[#FF6B4A] 
                  hover:bg-[#FFF5F3] transition-all font-['Manrope',sans-serif]"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ancla para el auto-scroll */}
      <div ref={messagesEndRef} />
    </div>

    {/* Input Area */}
    <div className="bg-white border-t border-[#E5E5E5] p-6">
      <div className="max-w-4xl mx-auto flex gap-3">
      <input
  type="text"
  value={chatInput}
  onChange={(e) => setChatInput(e.target.value)}
  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
  placeholder="Ask anything about your skin..."
  className="flex-1 h-14 bg-[#F5F5F5] rounded-xl px-6 text-[#18212D] 
    placeholder:text-[#6B7280] border border-[#E5E5E5] 
    focus:outline-none focus:border-[#FF6B4A] transition-colors 
    font-['Manrope',sans-serif]"
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
  className="h-14 w-14 bg-white hover:bg-[#F5F5F5] 
    rounded-xl border border-[#E5E5E5] 
    font-['Manrope',sans-serif] flex items-center justify-center p-0"
>
  <Plus className="w-5 h-5 text-[#FF6B4A]" />
</Button>

<Button
  onClick={() => handleSendMessage()}
  disabled={!chatInput.trim() || isSending}
  className="h-14 px-8 bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] 
    hover:from-[#E74C3C] hover:to-[#FF8C42] text.white rounded-xl shadow-lg 
    border-0 disabled:opacity-50 font-['Manrope',sans-serif]"
>
  <Send className="w-5 h-5" />
</Button>
      </div>

      {chatError && (
        <p className="mt-3 text-xs text-[#EF4444] font-['Manrope',sans-serif]">
          {chatError}
        </p>
      )}
    </div>
  </div>
)}

          {/* Progress Tab */}
          {activeTab === "progress" && (
            <div className="p-8 space-y-6">
              {/* Key Metrics Overview (igual que en la pantalla de resultados) */}
              <RadarOverview
  metrics={latestMetrics ?? skinMetrics}
  overallHealth={latestOverallHealth ?? overallHealth}
/>

              {/* Photo History Section */}
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
                    No scans yet. Once you run your first analysis, it will appear
                    here.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Calendar */}
                    <div className="flex flex-col">
                      <h4 className="text-[#6B7280] mb-4 font-['Manrope',sans-serif]">
                        Scan Calendar
                      </h4>
                      <div className="flex-1 flex items-center justify-center">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          className="rounded-xl border-0"
                          modifiers={{
                            hasPhoto: (date) => hasPhotoOnDate(date),
                          }}
                          modifiersStyles={{
                            hasPhoto: {
                              backgroundColor: "#FFF5F3",
                              border: "2px solid #FF6B4A",
                              fontWeight: "bold",
                              color: "#FF6B4A",
                            },
                          }}
                        />
                      </div>
                      <div className="mt-4 flex.items-center gap-2 text-sm text-[#6B7280] font-['Manrope',sans-serif]">
                        <div className="w-4 h-4 rounded bg-[#FFF5F3] border-2 border-[#FF6B4A]" />
                        <span>Days with scans</span>
                      </div>
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
                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center">
                                {scan.imageData ? (
                                  <img
                                    src={scan.imageData}
                                    alt="Scan"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Camera className="w-7 h-7 text-white" />
                                )}
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
                                  · {scan.source === "camera" ? "Camera" : "Upload"}
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
        className="text-[#18212D] mb-2 font-['Manrope',sans-serif]"
        style={{ fontSize: "24px", lineHeight: "32px" }}
      >
        Your Personalized Skincare Plan
      </h3>

      {routineUpdatedAt && (
        <p className="text-xs text-[#9CA3AF] mb-4 font-['Manrope',sans-serif]">
          Based on your last scan from{" "}
          {new Date(routineUpdatedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      )}

      {/* Si tenemos rutina del último scan → versión dinámica */}
      {routine ? (
        <>
          {/* Resumen */}
          {routine.summary && (
            <p className="text-sm text-[#4B5563] mb-6 max-w-3xl font-['Manrope',sans-serif]">
              {routine.summary}
            </p>
          )}

          {/* Morning / Evening / Weekly desde OpenAI */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(["morning", "evening", "weekly"] as RoutineSectionId[]).map(
              (sectionId) => {
                const section = routine.sections.find(
                  (s) => s.id === sectionId
                );
                if (!section) return null;

                const icon =
                  sectionId === "morning"
                    ? <Sun className="w-6 h-6 text-white" />
                    : sectionId === "evening"
                    ? <Moon className="w-6 h-6 text-white" />
                    : <Sparkles className="w-6 h-6 text-white" />;

                const subtitle =
                  sectionId === "morning"
                    ? "Start your day with light, protective steps."
                    : sectionId === "evening"
                    ? "Support repair and renewal while you sleep."
                    : "Targeted boosts to support your weekly routine.";

                return (
                  <div
                    key={section.id}
                    className="bg-gradient-to-br from-orange-50/40 to-white rounded-xl border border-[#E5E5E5] p-6 flex flex-col"
                  >
                    {/* Header sección */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center">
                        {icon}
                      </div>
                      <div>
                        <h4 className="text-[#18212D] font-['Manrope',sans-serif]">
                          {section.title}
                        </h4>
                        <p className="text-xs text-[#6B7280] font-['Manrope',sans-serif]">
                          {subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-3">
                      {section.steps.map((step) => (
                        <div
                          key={step.id}
                          className="bg-white rounded-lg p-3 border border-[#E5E5E5]"
                        >
                          <div className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                            {step.title}
                          </div>
                          {step.subtitle && (
                            <div className="text-xs text-[#6B7280] mt-1 font-['Manrope',sans-serif]">
                              {step.subtitle}
                            </div>
                          )}
                        </div>
                      ))}

                      {section.steps.length === 0 && (
                        <p className="text-xs text-[#9CA3AF] font-['Manrope',sans-serif]">
                          This section will be updated as we learn more about
                          your skin.
                        </p>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {/* Disclaimer de la rutina */}
          {routine.disclaimer && (
            <p className="mt-6 text-[10px] italic text-[#9CA3AF] max-w-3xl font-['Manrope',sans-serif]">
              * {routine.disclaimer}
            </p>
          )}
        </>
      ) : (
        // 🔸 Fallback: tu bloque estático actual si aún no hay rutina guardada
        <>
          <p className="text-sm text-[#6B7280] mb-6 font-['Manrope',sans-serif]">
            Complete a skin scan to generate a personalized routine. For now,
            here is a general plan based on combination/acne-prone skin.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Morning Routine (estático de antes) */}
            <div className="bg-gradient-to-br from-orange-50/50 to-white rounded-xl border border-[#E5E5E5] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center">
                  <Sun className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-[#18212D] font-['Manrope',sans-serif]">
                  Morning Routine
                </h4>
              </div>
              {/* … puedes dejar aquí tus mismos steps estáticos anteriores … */}
            </div>

            {/* Evening Routine + el resto de bloques estáticos… */}
            {/* Copia aquí tal cual lo que ya tenías si quieres conservarlo */}
          </div>
        </>
      )}
    </div>
  </div>
)}

          {/* Patient Profile Tab */}
          {activeTab === "patient-profile" && (
            <div className="p-8 space-y-6">
              {/* Personal data + Skin profile side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Personal data */}
                <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 shadow-sm h-full">
                  <h3
                    className="text-[#18212D] mb-4 font-['Manrope',sans-serif]"
                    style={{ fontSize: "18px", lineHeight: "26px" }}
                  >
                    Personal data
                  </h3>

                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Profile photo + button */}
                    <div className="flex flex-col.items-center md:items-start gap-3">
                      {profilePhoto ? (
                        <img
                          src={profilePhoto}
                          alt="Profile"
                          className="w-20 h-20 rounded-full object-cover border-4 border-[#FFE0D3]"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center">
                          <User className="w-10 h-10 text-white" />
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <input
                          ref={profilePhotoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePhotoUpload}
                          className="hidden"
                        />
                        <Button
                          onClick={() => profilePhotoInputRef.current?.click()}
                          className="h-9 px-4 bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] hover:from-[#E74C3C] hover:to-[#FF8C42] text-white rounded-full border-0 text-xs font-['Manrope',sans-serif]"
                        >
                          <Camera className="w-4 h-4 mr-1" />
                          {profilePhoto ? "Change photo" : "Upload photo"}
                        </Button>

                        {profilePhoto && (
                          <Button
                            onClick={() => setProfilePhoto(null)}
                            className="h-9 px-4 bg-white hover:bg-[#F5F5F5] text-[#6B7280] hover:text-[#FF6B4A] rounded-full border border-[#E5E5E5] text-xs font-['Manrope',sans-serif]"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Name + Email + Age */}
                    <div className="flex-1 max-w-xl w-full space-y-4">
                      {/* Name */}
                      <div className="rounded-xl border border-[#E5E5E5] px-4 py-3 bg-[#F9FAFB]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs uppercase tracking-wide text-[#9CA3AF] font-['Manrope',sans-serif]">
                            Name
                          </span>
                          {!isEditingName && (
                            <button
                              onClick={() => setIsEditingName(true)}
                              className="text-[#FF6B4A] hover:text-[#E74C3C] transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {isEditingName ? (
                          <div className="space-y-2 mt-1">
                            <input
                              type="text"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              className="w-full h-9 bg-white rounded-lg px-3 text-sm text-[#18212D] border border-[#E5E5E5] focus:outline-none focus:border-[#FF6B4A] font-['Manrope',sans-serif]"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={handleSaveName}
                                className="flex-1 h-9 text-xs bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] hover:from-[#E74C3C] hover:to-[#FF8C42] text-white rounded-lg border-0 font-['Manrope',sans-serif]"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Save
                              </Button>
                              <Button
                                onClick={handleCancelName}
                                className="flex-1 h-9 text-xs bg-white hover:bg-[#F5F5F5] text-[#6B7280] hover:text-[#FF6B4A] rounded-lg border border-[#E5E5E5] font-['Manrope',sans-serif]"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <User className="w-4 h-4 text-[#FF6B4A]" />
                            <span className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                              {userName}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Email */}
                      <div className="rounded-xl border border-[#E5E5E5] px-4 py-3 bg-[#F9FAFB]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs uppercase tracking-wide text-[#9CA3AF] font-['Manrope',sans-serif]">
                            Email
                          </span>
                          {!isEditingEmail && (
                            <button
                              onClick={() => setIsEditingEmail(true)}
                              className="text-[#FF6B4A] hover:text-[#E74C3C] transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {isEditingEmail ? (
                          <div className="space-y-2 mt-1">
                            <input
                              type="email"
                              value={tempEmail}
                              onChange={(e) => setTempEmail(e.target.value)}
                              className="w-full h-9 bg-white rounded-lg px-3 text-sm text-[#18212D] border border-[#E5E5E5] focus:outline-none focus:border-[#FF6B4A] font-['Manrope',sans-serif]"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={handleSaveEmail}
                                className="flex-1 h-9 text-xs bg-gradient.to-r from-[#FF6B4A] to-[#FFA94D] hover:from-[#E74C3C] hover:to-[#FF8C42] text-white rounded-lg border-0 font-['Manrope',sans-serif]"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Save
                              </Button>
                              <Button
                                onClick={handleCancelEmail}
                                className="flex-1 h-9 text-xs bg-white hover:bg-[#F5F5F5] text-[#6B7280] hover:text-[#FF6B4A] rounded-lg border border-[#E5E5E5] font-['Manrope',sans-serif]"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="w-4 h-4 text-[#FF6B4A]" />
                            <span className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                              {userEmail}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Age */}
                      <div className="rounded-xl border border-[#E5E5E5] px-4 py-3 bg-[#F9FAFB]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs uppercase tracking-wide text-[#9CA3AF] font-['Manrope',sans-serif]">
                            Age
                          </span>
                          {!isEditingAge && (
                            <button
                              onClick={() => setIsEditingAge(true)}
                              className="text-[#FF6B4A] hover:text-[#E74C3C] transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {isEditingAge ? (
                          <div className="space-y-2 mt-1">
                            <input
                              type="text"
                              value={tempAge}
                              onChange={(e) => setTempAge(e.target.value)}
                              className="w-full h-9 bg-white rounded-lg px-3 text-sm text-[#18212D] border border-[#E5E5E5] focus:outline.none focus:border-[#FF6B4A] font-['Manrope',sans-serif]"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={handleSaveAge}
                                className="flex-1 h-9 text-xs bg-gradient.to-r from-[#FF6B4A] to-[#FFA94D] hover:from-[#E74C3C] hover:to-[#FF8C42] text-white rounded-lg border-0 font-['Manrope',sans-serif]"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Save
                              </Button>
                              <Button
                                onClick={handleCancelAge}
                                className="flex-1 h-9 text-xs bg-white hover:bg-[#F5F5F5] text-[#6B7280] hover:text-[#FF6B4A] rounded-lg border border-[#E5E5E5] font-['Manrope',sans-serif]"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-[#18212D] font-['Manrope',sans-serif]">
                              {userAge}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Your Skin Profile */}
                <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 shadow-sm h-full">
                  <h3
                    className="text-[#18212D] mb-6 font-['Manrope',sans-serif]"
                    style={{ fontSize: "20px", lineHeight: "28px" }}
                  >
                    Your Skin Profile
                  </h3>

                  <div className="max-w-xl w-full space-y-4">
                    {/* Skin Type */}
                    <div className="rounded-xl border border-[#E5E5E5] px-4 py-3 bg-[#F9FAFB]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs uppercase tracking-wide text-[#9CA3AF] font-['Manrope',sans-serif]">
                          Skin Type
                        </span>
                        {!isEditingSkinType && (
                          <button
                            onClick={() => setIsEditingSkinType(true)}
                            className="text-[#FF6B4A] hover:text-[#E74C3C] transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {isEditingSkinType ? (
                        <div className="space-y-2 mt-1">
                          <input
                            type="text"
                            value={tempSkinType}
                            onChange={(e) => setTempSkinType(e.target.value)}
                            className="w-full h-9 bg-white rounded-lg px-3 text-sm text-[#18212D] border border-[#E5E5E5] focus:outline-none focus:border-[#FF6B4A] font-['Manrope',sans-serif]"
                          />
                          <div className="flex gap-2">
                          <Button
  onClick={handleSaveSkinType}
  className="flex-1 h-9 text-xs bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] 
    hover:from-[#E74C3C] hover:to-[#FF8C42] 
    text-white rounded-lg border-0 
    font-['Manrope',sans-serif]"
>
  <Check className="w-4 h-4 mr-1" />
  Save
</Button>
                            <Button
                              onClick={handleCancelSkinType}
                              className="flex-1 h-9 text-xs bg-white hover:bg-[#F5F5F5] text-[#6B7280] hover:text-[#FF6B4A] rounded-lg border border-[#E5E5E5] font-['Manrope',sans-serif]"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 text-sm text-[#18212D] font-['Manrope',sans-serif]">
                          {skinType}
                        </div>
                      )}
                    </div>

                    {/* Main Concerns */}
                    <div className="rounded-xl border border-[#E5E5E5] px-4 py-3 bg-[#F9FAFB]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs uppercase tracking-wide text-[#9CA3AF] font-['Manrope',sans-serif]">
                          Main concerns
                        </span>
                        {!isEditingMainConcerns && (
                          <button
                            onClick={() => setIsEditingMainConcerns(true)}
                            className="text-[#FF6B4A] hover:text-[#E74C3C] transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {isEditingMainConcerns ? (
                        <div className="space-y-2 mt-1">
                          <input
                            type="text"
                            value={tempMainConcerns}
                            onChange={(e) => setTempMainConcerns(e.target.value)}
                            placeholder="e.g. Acne, Dark spots, Large pores"
                            className="w-full h-9 bg-white rounded-lg px-3 text-sm text-[#18212D] border border-[#E5E5E5] focus:outline-none focus:border-[#FF6B4A] font-['Manrope',sans-serif]"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={handleSaveMainConcerns}
                              className="flex-1 h-9 text-xs bg-gradient.to-r from-[#FF6B4A] to-[#FFA94D] hover:from-[#E74C3C] hover:to-[#FF8C42] text-white rounded-lg border-0 font-['Manrope',sans-serif]"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              onClick={handleCancelMainConcerns}
                              className="flex-1 h-9 text-xs bg-white hover:bg-[#F5F5F5] text-[#6B7280] hover:text-[#FF6B4A] rounded-lg border border-[#E5E5E5] font-['Manrope',sans-serif]"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {mainConcerns.length === 0 ? (
                            <span className="text-sm text-[#9CA3AF] font-['Manrope',sans-serif]">
                              Not specified
                            </span>
                          ) : (
                            mainConcerns.map((concern, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-[#FFF5F3] text-[#FF6B4A] rounded-full text-xs font-['Manrope',sans-serif]"
                              >
                                {concern}
                              </span>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Allergies */}
                    <div className="rounded-xl border border-[#E5E5E5] px-4 py-3 bg-[#F9FAFB]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs uppercase tracking-wide text-[#9CA3AF] font-['Manrope',sans-serif]">
                          Allergies
                        </span>
                        {!isEditingAllergies && (
                          <button
                            onClick={() => setIsEditingAllergies(true)}
                            className="text-[#FF6B4A] hover:text-[#E74C3C] transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {isEditingAllergies ? (
                        <div className="space-y-2 mt-1">
                          <input
                            type="text"
                            value={tempAllergies}
                            onChange={(e) => setTempAllergies(e.target.value)}
                            placeholder="e.g. No known allergies, Sensitive to fragrance..."
                            className="w-full h-9 bg-white rounded-lg px-3 text-sm text-[#18212D] border border-[#E5E5E5] focus:outline-none focus:border-[#FF6B4A] font-['Manrope',sans-serif]"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={handleSaveAllergies}
                              className="flex-1 h-9 text-xs bg-gradient.to-r from-[#FF6B4A] to-[#FFA94D] hover:from-[#E74C3C] hover:to-[#FF8C42] text-white rounded-lg border-0 font-['Manrope',sans-serif]"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              onClick={handleCancelAllergies}
                              className="flex-1 h-9 text-xs bg-white hover:bg-[#F5F5F5] text-[#6B7280] hover:text-[#FF6B4A] rounded-lg border border-[#E5E5E5] font-['Manrope',sans-serif]"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 text-sm text-[#18212D] font-['Manrope',sans-serif]">
                          {allergies}
                        </div>
                      )}
                    </div>

                    {/* Current Products */}
                    <div className="rounded-xl border border-[#E5E5E5] px-4 py-3 bg-[#F9FAFB]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs uppercase tracking-wide text-[#9CA3AF] font-['Manrope',sans-serif]">
                          Current products
                        </span>
                        {!isEditingCurrentProducts && (
                          <button
                            onClick={() => setIsEditingCurrentProducts(true)}
                            className="text-[#FF6B4A] hover:text-[#E74C3C] transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {isEditingCurrentProducts ? (
                        <div className="space-y-2 mt-1">
                          <textarea
                            value={tempCurrentProducts}
                            onChange={(e) => setTempCurrentProducts(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#18212D] resize-vertical focus:outline-none focus:border-[#FF6B4A] font-['Manrope',sans-serif]"
                            placeholder="List of products the patient is currently using..."
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={handleSaveCurrentProducts}
                              className="flex-1 h-9 text-xs bg-gradient.to-r from-[#FF6B4A] to-[#FFA94D] hover:from-[#E74C3C] hover:to-[#FF8C42] text-white rounded-lg border-0 font-['Manrope',sans-serif]"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button
                              onClick={handleCancelCurrentProducts}
                              className="flex-1 h-9 text-xs bg-white hover:bg-[#F5F5F5] text-[#6B7280] hover:text-[#FF6B4A] rounded-lg border border-[#E5E5E5] font-['Manrope',sans-serif]"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1 text-sm text-[#18212D] font-['Manrope',sans-serif] whitespace-pre-line">
                          {currentProducts}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Doctor Comments (lo dejamos igual que ya funciona) */}
<div className="bg-gradient-to-br from-white to-orange-50/30 rounded-2xl border border-[#E5E5E5] p-8 shadow-sm">
  <h3
    className="text-[#18212D] mb-4 font-['Manrope',sans-serif]"
    style={{ fontSize: "20px", lineHeight: "28px" }}
  >
    Doctor comments
  </h3>
  <p className="text-sm text-[#6B7280] mb-4 font-['Manrope',sans-serif]">
    Notes about this patient&apos;s skin, treatment plans or follow-up
    recommendations. Only visible in the doctor dashboard.
  </p>
  <textarea
    value={doctorNotes}
    onChange={(e) => setDoctorNotes(e.target.value)}
    rows={5}
    className="w-full rounded-xl border border-[#E5E5E5] bg-white px-4 py-3 text-sm text-[#18212D] resize-vertical focus:outline-none focus:border-[#FF6B4A] font-['Manrope',sans-serif]"
    placeholder="Add your clinical observations, recommendations or follow-up notes..."
  />
  <div className="mt-4 flex items-center justify-between gap-3">
    <div className="text-xs text-[#6B7280] font-['Manrope',sans-serif]">
      {notesSavedAt &&
        `Last saved at ${notesSavedAt.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })}`}
    </div>

    <Button
      onClick={handleSaveDoctorNotes}
      disabled={isSavingNotes}
      className="h-10 px-6 rounded-xl border-0 text-sm font-['Manrope',sans-serif]
                 bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D]
                 text-white shadow-md
                 hover:from-[#E74C3C] hover:to-[#FF8C42]
                 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isSavingNotes ? "Saving..." : "Save notes"}
    </Button>
  </div>
</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}