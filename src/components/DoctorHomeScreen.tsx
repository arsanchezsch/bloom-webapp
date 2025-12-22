// src/components/DoctorHomeScreen.tsx
import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import {
  User,
  Building2,
  Mail,
  Calendar,
  Plus,
  Users,
  ChevronRight,
  LogOut,
  Edit,
  Check,
  X,
  Search,
} from "lucide-react";
import bloomLogo from "figma:asset/73a8a80abf64277705c5d856c147464ec33b1a04.png";

interface DoctorHomeScreenProps {
  onNewConsultation: () => void;
  onSelectPatient: (patientId: string) => void;
  onLogout: () => void;
}

interface Patient {
  id: string; // id de la última consulta del paciente
  fullName: string;
  email: string;
  skinType: string;
  age: string;
  timestamp: string;
}

export function DoctorHomeScreen({
  onNewConsultation,
  onSelectPatient,
  onLogout,
}: DoctorHomeScreenProps) {
  const [doctorInfo, setDoctorInfo] = useState({
    fullName: "Doctor",
    email: "",
    clinic: "",
    timestamp: "",
    profilePhoto: "",
    authenticated: true,
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [tempPhoto, setTempPhoto] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Cargar doctor + pacientes desde localStorage
  useEffect(() => {
    const authData = localStorage.getItem("bloom_doctor_session_v2");
    if (authData) {
      const data = JSON.parse(authData);
      const merged = {
        fullName: data.fullName || "Doctor",
        email: data.email || "",
        clinic: data.clinic || "",
        timestamp: data.timestamp || "",
        profilePhoto: data.profilePhoto || "",
        authenticated: data.authenticated ?? true,
      };
      setDoctorInfo(merged);
      setTempName(merged.fullName);
      setTempEmail(merged.email);
      setTempPhoto(merged.profilePhoto || "");
    }

    const patientsData = localStorage.getItem("bloom_patients");
    if (patientsData) {
      const loadedPatients = JSON.parse(patientsData) as Patient[];
      loadedPatients.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setPatients(loadedPatients);
    }
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTempPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    // ✅ Cierra primero (UI instantánea)
    setIsEditModalOpen(false);

    const updatedInfo = {
      ...doctorInfo,
      fullName: tempName || doctorInfo.fullName,
      email: tempEmail || doctorInfo.email,
      profilePhoto: tempPhoto,
    };

    setDoctorInfo(updatedInfo);
    localStorage.setItem("bloom_doctor_session_v2", JSON.stringify(updatedInfo));

    // ✅ Mantener temps sincronizados
    setTempName(updatedInfo.fullName);
    setTempEmail(updatedInfo.email);
    setTempPhoto(updatedInfo.profilePhoto || "");

    // ✅ Safety: por si algo lo reabre en el mismo ciclo
    setTimeout(() => setIsEditModalOpen(false), 0);
  };

  const handleCancelEdit = () => {
    setTempName(doctorInfo.fullName);
    setTempEmail(doctorInfo.email);
    setTempPhoto(doctorInfo.profilePhoto || "");
    setIsEditModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("bloom_doctor_session_v2");
    onLogout();
  };

  const filteredPatients = patients.filter((patient) =>
    patient.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <img src={bloomLogo} alt="Bloom" className="h-12" />
          <Button
            type="button"
            onClick={handleLogout}
            className="h-12 px-6 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="flex flex-row gap-8 items-start">
          {/* Left Sidebar - Doctor Profile */}
          <div className="w-[320px] flex-shrink-0">
            <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6">
              {/* Doctor Info */}
              <div className="flex flex-col items-center text-center mb-6">
                {doctorInfo.profilePhoto ? (
                  <img
                    src={doctorInfo.profilePhoto}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#E5E5E5] mb-3"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center mb-3">
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
                <h3 className="text-[#2D2D2D] mb-1 truncate">
                  {doctorInfo.fullName || "Doctor"}
                </h3>
                <p className="text-xs text-[#7A7A7A]">
                  {doctorInfo.email || "Doctor Account"}
                </p>
              </div>

              {/* Doctor Details */}
              <div className="space-y-3 mb-6 text-xs text-[#7A7A7A]">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {doctorInfo.email || "No email added"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {doctorInfo.timestamp
                      ? new Date(doctorInfo.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })
                      : "Today"}
                  </span>
                </div>
              </div>

              {/* Edit Button */}
              <Button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="w-full h-10 bg-white hover:bg-[#F5F5F5] text-[#6B7280] border border-[#E5E5E5] rounded-xl transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>

          {/* Right Content - Patients List */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-[#2D2D2D] text-2xl mb-1">Your Patients</h2>
                  <p className="text-[#7A7A7A] text-sm">
                    {patients.length}{" "}
                    {patients.length === 1
                      ? "patient registered"
                      : "patients registered"}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={onNewConsultation}
                  className="h-12 px-6 bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] hover:opacity-90 text-white rounded-xl transition-opacity shadow-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  New Consultation
                </Button>
              </div>

              {/* Search bar */}
              {patients.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#F7F7F7] border border-[#E8E0DA] rounded-xl focus-within:ring-2 focus-within:ring-[#FF6B4A]">
                    <Search className="w-4 h-4 text-[#7A7A7A] flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search patients..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-[#333] placeholder-[#AFAFAF] outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Patients List / Empty states */}
              {patients.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-[#ADADAD]" />
                  </div>
                  <p className="text-[#7A7A7A] mb-2">No patients yet</p>
                  <p className="text-sm text-[#ADADAD]">
                    Click &quot;New Consultation&quot; to register your first patient
                  </p>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-[#F5F5F5] flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-[#ADADAD]" />
                  </div>
                  <p className="text-[#7A7A7A] mb-2">No patients found</p>
                  <p className="text-sm text-[#ADADAD]">
                    Try searching with a different name
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPatients.map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => onSelectPatient(patient.id)}
                      className="w-full flex items-center gap-4 px-5 py-5 bg-[#F7F7F7] hover:bg-[#FFE5DD] rounded-2xl transition-all group border border-[#E8E0DA] hover:border-[#FF6B4A]"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-[#2D2D2D] font-medium truncate">
                          {patient.fullName}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#7A7A7A] group-hover:text-[#FF6B4A] transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <h2 className="text-[#2D2D2D] text-2xl mb-6">Edit Profile</h2>

            {/* Photo Upload */}
            <div className="flex flex-col items-center mb-6">
              <div className="mb-3">
                {tempPhoto ? (
                  <img
                    src={tempPhoto}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-[#E5E5E5]"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF6B4A] to-[#FFA94D] flex items-center justify-center">
                    <User className="w-12 h-12 text-white" />
                  </div>
                )}
              </div>

              {/* Solo texto */}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="text-sm text-[#FF6B4A] hover:underline font-medium"
              >
                Edit Photo
              </button>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            {/* Form Fields */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm text-[#7A7A7A] mb-2 block">
                  Full Name
                </label>
                <div className="flex items-center gap-3 px-4 py-3 bg-[#F5F5F5] rounded-xl focus-within:bg-white focus-within:ring-2 focus-within:ring-[#FF6B4A] transition-all">
                  <User className="w-5 h-5 text-[#7A7A7A] flex-shrink-0" />
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="flex-1 bg-transparent text-[#2D2D2D] outline-none"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-[#7A7A7A] mb-2 block">
                  Email Address
                </label>
                <div className="flex items-center gap-3 px-4 py-3 bg-[#F5F5F5] rounded-xl focus-within:bg-white focus-within:ring-2 focus-within:ring-[#FF6B4A] transition-all">
                  <Mail className="w-5 h-5 text-[#7A7A7A] flex-shrink-0" />
                  <input
                    type="email"
                    value={tempEmail}
                    onChange={(e) => setTempEmail(e.target.value)}
                    className="flex-1 bg-transparent text-[#2D2D2D] outline-none"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {doctorInfo.clinic && (
                <div>
                  <label className="text-sm text-[#7A7A7A] mb-2 block">
                    Clinic
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#F5F5F5] rounded-xl">
                    <Building2 className="w-5 h-5 text-[#7A7A7A] flex-shrink-0" />
                    <span className="text-[#2D2D2D]">{doctorInfo.clinic}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleSaveProfile}
                className="flex-1 h-12 bg-gradient-to-r from-[#FF6B4A] to-[#FFA94D] hover:opacity-90 text-white rounded-xl transition-opacity"
              >
                <Check className="w-5 h-5 mr-2" />
                Save Changes
              </Button>
              <Button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 h-12 bg-white hover:bg-[#F5F5F5] text-[#6B7280] border border-[#E5E5E5] rounded-xl transition-colors"
              >
                <X className="w-5 h-5 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
