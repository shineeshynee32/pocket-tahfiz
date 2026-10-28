"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  UserPlus, 
  FileText, 
  Search,
  Sparkles,
  X,
  FileImage,
  Pencil,
  ArrowRight,
  BookOpen,
  Loader2,
  Camera
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// --- TYPES ---
type Track = "Recitation (Tilawah / Nazirah)" | "Memorization (Hifz)";
type ProficiencyLevel = "low" | "medium" | "good" | "mastery";
type PaymentStatus = "Paid" | "Pending" | "Unpaid";

interface TajweedEvaluation {
  tracks: Track[];
  fluencyScore: number; // 0 to 100%
  fluencyFocus: string[];
  alphabetRatings: Record<string, ProficiencyLevel>;
  ruleRatings: Record<string, ProficiencyLevel>;
  tutorNotes: string;
  updatedAt: string;
}

interface Student {
  id: string;
  name: string;
  photoUrl?: string;
  age: number | string;
  location: string;
  tracks: Track[];
  
  tilawahJuz: number;
  tilawahPage: number;
  completedTilawahJuzs: number[];

  hifzJuz: number;
  hifzPage: number;
  completedHifzJuzs: number[];

  weeklyGoal: number;
  paymentStatus: PaymentStatus;
  completedSessions: number;
  totalSessions: number;
  status: string;
  startDate: string;
  latestEvaluation?: TajweedEvaluation;
}

const formatJuzRanges = (juzs?: number[]) => {
  if (!juzs || juzs.length === 0) return "No Juz Selected";
  const sorted = Array.from(new Set(juzs)).sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let end = start;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}–${end}`);
      start = sorted[i];
      end = start;
    }
  }
  ranges.push(start === end ? `${start}` : `${start}–${end}`);
  return `Juz ${ranges.join(", ")}`;
};

const getFluencyHueStyle = (score: number) => {
  const safeScore = Math.max(0, Math.min(100, score));
  let hue = 0;
  if (safeScore <= 30) hue = (safeScore / 30) * 25;
  else if (safeScore <= 60) hue = 25 + ((safeScore - 30) / 30) * 35;
  else if (safeScore <= 90) hue = 60 + ((safeScore - 60) / 30) * 75;
  else hue = 135 + ((safeScore - 90) / 10) * 80;

  return {
    backgroundColor: `hsl(${hue}, 85%, 96%)`,
    borderColor: `hsl(${hue}, 60%, 80%)`,
    color: `hsl(${hue}, 90%, 25%)`,
    barColor: `hsl(${hue}, 85%, 45%)`,
    label: safeScore <= 30 ? "Low" : safeScore <= 60 ? "Medium" : safeScore <= 90 ? "Good" : "Mastery"
  };
};

const PROFICIENCY_CONFIG: Record<ProficiencyLevel, { label: string; bg: string; border: string; text: string; badge: string; pillActive: string }> = {
  low: { label: "Low", bg: "bg-rose-50/70", border: "border-rose-200/80", text: "text-rose-700", badge: "bg-rose-500 text-white", pillActive: "bg-rose-600 text-white border-rose-600 shadow-xs" },
  medium: { label: "Medium", bg: "bg-amber-50/70", border: "border-amber-200/80", text: "text-amber-800", badge: "bg-amber-500 text-white", pillActive: "bg-amber-500 text-white border-amber-500 shadow-xs" },
  good: { label: "Good", bg: "bg-emerald-50/70", border: "border-emerald-200/80", text: "text-emerald-800", badge: "bg-emerald-600 text-white", pillActive: "bg-emerald-600 text-white border-emerald-600 shadow-xs" },
  mastery: { label: "Mastery", bg: "bg-blue-50/70", border: "border-blue-200/80", text: "text-blue-800", badge: "bg-blue-600 text-white", pillActive: "bg-blue-600 text-white border-blue-600 shadow-xs" }
};

const ARABIC_ALPHABETS = [
  "أ", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", 
  "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", 
  "ق", "ك", "ل", "م", "ن", "هـ", "و", "ي"
];

// CLEANED TAJWEED CATEGORIES (English translations removed)
const TAJWEED_CATEGORIES = [
  {
    group: "Itmam al-Harakah & Ahkam ar-Ra",
    items: [
      { id: "harakah_fathah", label: "Fathah" },
      { id: "harakah_kasrah", label: "Kasrah" },
      { id: "harakah_dhammah", label: "Dhammah" },
      { id: "ra_tarqiq", label: "Ra: Tarqiq" },
      { id: "ra_tafkhim", label: "Ra: Tafkhim" },
    ]
  },
  {
    group: "Nun Sakinah & Tanwin",
    items: [
      { id: "nun_izhar", label: "Izhar Halqi" },
      { id: "nun_ikhfa_mufakhham", label: "Ikhfa al-Mufakhkham (ص ض ط ظ ق)" },
      { id: "nun_ikhfa_muraqqaq", label: "Ikhfa al-Muraqqaq" },
      { id: "nun_idgham_bila", label: "Idgham Bi La Ghunnah (ل ر)" },
      { id: "nun_idgham_maal", label: "Idgham Ma'al Ghunnah (ي ن م و)" },
      { id: "nun_iqlab", label: "Iqlab" },
    ]
  },
  {
    group: "Mim Sakinah",
    items: [
      { id: "mim_izhar", label: "Izhar Syafawi" },
      { id: "mim_ikhfa", label: "Ikhfa Syafawi" },
      { id: "mim_idgham", label: "Idgham Syafawi / Mithlain" },
    ]
  },
  {
    group: "Mudud (Rules of Elongation)",
    items: [
      { id: "mad_harfi_muthaqqal", label: "Mad Lazim Harfi Muthaqqal" },
      { id: "mad_harfi_mukhaffaf", label: "Mad Lazim Harfi Mukhaffaf" },
      { id: "mad_kalimi_muthaqqal", label: "Mad Lazim Kalimi Muthaqqal" },
      { id: "mad_kalimi_mukhaffaf", label: "Mad Lazim Kalimi Mukhaffaf" },
      { id: "mad_muttasil", label: "Mad Muttasil" },
      { id: "mad_munfasil", label: "Mad Munfasil" },
      { id: "mad_lin", label: "Mad Lin" },
      { id: "mad_arid", label: "Mad 'Arid Lissukoon" },
    ]
  }
];

export default function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("salman_tutor_students_v5");
    if (saved) {
      try {
        setStudents(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved students", e);
      }
    } else {
      setStudents([
        {
          id: "1",
          name: "Muadz Danial",
          age: 14,
          location: "Kuala Lumpur",
          tracks: ["Recitation (Tilawah / Nazirah)", "Memorization (Hifz)"],
          tilawahJuz: 30,
          tilawahPage: 135,
          completedTilawahJuzs: [28, 29, 30],
          hifzJuz: 30,
          hifzPage: 4,
          completedHifzJuzs: [1, 26, 27, 28, 29, 30],
          weeklyGoal: 10,
          paymentStatus: "Paid",
          completedSessions: 3,
          totalSessions: 12,
          status: "Active",
          startDate: "2026-08-10",
          latestEvaluation: {
            tracks: ["Recitation (Tilawah / Nazirah)", "Memorization (Hifz)"],
            fluencyScore: 82,
            fluencyFocus: ["Breath Management", "Stopping (Waqf)"],
            alphabetRatings: { "أ": "mastery", "ع": "low", "ح": "medium", "خ": "medium", "ق": "good" },
            ruleRatings: { "harakah_fathah": "mastery", "nun_izhar": "good", "nun_ikhfa_mufakhham": "low" },
            tutorNotes: "Memorized Juz 1 and 26–30. Excellent pace and active revision.",
            updatedAt: "2026-08-10"
          }
        }
      ]);
    }
  }, []);

  const saveAndSync = (updated: Student[]) => {
    setStudents(updated);
    localStorage.setItem("salman_tutor_students_v5", JSON.stringify(updated));
  };

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [quickPageStudent, setQuickPageStudent] = useState<Student | null>(null);
  const [evaluatingStudent, setEvaluatingStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [, setReportRange] = useState<string>("entire");

  // Add Form State
  const [newName, setNewName] = useState("");
  const [newPhoto, setNewPhoto] = useState<string | undefined>();
  const [newAge, setNewAge] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newTracks, setNewTracks] = useState<Track[]>(["Recitation (Tilawah / Nazirah)"]);
  const [newTilawahJuz, setNewTilawahJuz] = useState(1);
  const [newTilawahPage, setNewTilawahPage] = useState(1);
  const [newHifzJuz, setNewHifzJuz] = useState(1);
  const [newHifzPage, setNewHifzPage] = useState(1);
  const [newWeeklyGoal, setNewWeeklyGoal] = useState(10);
  const [newPaymentStatus, setNewPaymentStatus] = useState<PaymentStatus>("Paid");
  const [newCompletedSessions, setNewCompletedSessions] = useState(0);
  const [newTotalSessions, setNewTotalSessions] = useState(12);

  // Evaluation Form State
  const [evalTracks, setEvalTracks] = useState<Track[]>([]);
  const [evalFluency, setEvalFluency] = useState(80);
  const [evalFocus, setEvalFocus] = useState<string[]>(["Breath Management"]);
  const [evalAlphabets, setEvalAlphabets] = useState<Record<string, ProficiencyLevel>>({});
  const [evalRules, setEvalRules] = useState<Record<string, ProficiencyLevel>>({});
  const [evalNotes, setEvalNotes] = useState("");

  const reportRef = useRef<HTMLDivElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const newStudent: Student = {
      id: Date.now().toString(),
      name: newName,
      photoUrl: newPhoto,
      age: newAge || "N/A",
      location: newLocation || "Not specified",
      tracks: newTracks.length > 0 ? newTracks : ["Recitation (Tilawah / Nazirah)"],
      tilawahJuz: newTilawahJuz,
      tilawahPage: newTilawahPage,
      completedTilawahJuzs: [newTilawahJuz],
      hifzJuz: newHifzJuz,
      hifzPage: newHifzPage,
      completedHifzJuzs: [newHifzJuz],
      weeklyGoal: newWeeklyGoal,
      paymentStatus: newPaymentStatus,
      completedSessions: newCompletedSessions,
      totalSessions: newTotalSessions,
      status: "Active",
      startDate: new Date().toISOString().split("T")[0]
    };

    saveAndSync([...students, newStudent]);
    setIsAddOpen(false);
    setNewName("");
    setNewPhoto(undefined);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    saveAndSync(students.map((s) => (s.id === editingStudent.id ? editingStudent : s)));
    setEditingStudent(null);
  };

  const handleSaveQuickPages = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPageStudent) return;
    saveAndSync(students.map((s) => (s.id === quickPageStudent.id ? quickPageStudent : s)));
    setQuickPageStudent(null);
  };

  const openEvaluationModal = (student: Student) => {
    setEvaluatingStudent(student);
    setEvalTracks(student.latestEvaluation?.tracks || student.tracks);
    setEvalFluency(student.latestEvaluation?.fluencyScore ?? 80);
    setEvalFocus(student.latestEvaluation?.fluencyFocus || ["Breath Management"]);
    setEvalAlphabets(student.latestEvaluation?.alphabetRatings || {});
    setEvalRules(student.latestEvaluation?.ruleRatings || {});
    setEvalNotes(student.latestEvaluation?.tutorNotes || "");
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingStudent) return;

    const newEval: TajweedEvaluation = {
      tracks: evalTracks,
      fluencyScore: evalFluency,
      fluencyFocus: evalFocus,
      alphabetRatings: evalAlphabets,
      ruleRatings: evalRules,
      tutorNotes: evalNotes,
      updatedAt: new Date().toISOString().split("T")[0]
    };

    saveAndSync(students.map((s) => (s.id === evaluatingStudent.id ? { ...s, tracks: evalTracks, latestEvaluation: newEval } : s)));
    setEvaluatingStudent(null);
  };

  const toggleTrackSelection = (tr: Track, currentList: Track[], setList: (val: Track[]) => void) => {
    if (currentList.includes(tr)) {
      if (currentList.length > 1) setList(currentList.filter((t) => t !== tr));
    } else {
      setList([...currentList, tr]);
    }
  };

  const toggleFocusPoint = (item: string) => {
    if (evalFocus.includes(item)) setEvalFocus(evalFocus.filter((f) => f !== item));
    else setEvalFocus([...evalFocus, item]);
  };

  const exportAsImage = async (rangeLabel: string) => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const img = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = img;
      a.download = `${selectedStudent?.name}_Report_${rangeLabel}.png`;
      a.click();
    } catch {
      alert("Failed to export image.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPDF = async (rangeLabel: string) => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 10, imgWidth, imgHeight);
      pdf.save(`${selectedStudent?.name}_Report_${rangeLabel}.pdf`);
    } catch {
      alert("Failed to export PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-neutral-800 font-sans antialiased">
      {/* Top Header */}
      <header className="border-b border-black/[0.04] bg-white/80 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Link href="/" className="p-2 text-neutral-400 hover:text-neutral-900 bg-neutral-100/70 hover:bg-neutral-100 rounded-full transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-neutral-900" />
                <h1 className="text-base font-bold tracking-tight text-neutral-950">Tutor Admin Console</h1>
              </div>
              <p className="text-[11px] font-medium text-neutral-400">Salman Zulkifle Mentorship System</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAddOpen(true)}
            className="bg-neutral-950 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        
        {/* Metric Cards - Neo-Fintech Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-black/[0.04] p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Active Roster</p>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-neutral-100 text-neutral-600">Active</span>
            </div>
            <div className="my-3">
              <p className="text-3xl font-extrabold tracking-tight text-neutral-950">{students.length} Student{students.length !== 1 ? "s" : ""}</p>
              <p className="text-xs text-neutral-400 mt-0.5">Enrolled mentorship profiles</p>
            </div>
            <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-neutral-900 rounded-full w-[80%]" />
            </div>
          </div>

          <div className="bg-white border border-black/[0.04] p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Monthly Projection</p>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600">Formula</span>
            </div>
            <div className="my-3">
              <p className="text-xl font-bold tracking-tight text-neutral-900">Current + (Goal × 4)</p>
              <p className="text-xs text-neutral-400 mt-0.5">4-week rolling target calculation</p>
            </div>
            <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full w-[65%]" />
            </div>
          </div>

          <div className="bg-white border border-black/[0.04] p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Quran Syllabus</p>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-600">30 Juz Grid</span>
            </div>
            <div className="my-3">
              <p className="text-3xl font-extrabold tracking-tight text-neutral-950">Non-Linear</p>
              <p className="text-xs text-neutral-400 mt-0.5">Granular multi-juz tracking</p>
            </div>
            <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-600 rounded-full w-[100%]" />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Enrolled Students Roster</h2>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search student..." 
                className="bg-white border border-black/[0.06] rounded-full pl-9 pr-4 py-1.5 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-black/30 shadow-xs"
              />
            </div>
          </div>

          {/* Student Roster Table Card */}
          <div className="bg-white border border-black/[0.04] rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFB] text-neutral-400 uppercase tracking-wider font-semibold border-b border-black/[0.04]">
                  <tr>
                    <th className="p-4 pl-6">Student Profile</th>
                    <th className="p-4">Tuition</th>
                    <th className="p-4">Package Sessions</th>
                    <th className="p-4">Tilawah</th>
                    <th className="p-4">Hifz</th>
                    <th className="p-4">Target (4-Wk)</th>
                    <th className="p-4">Fluency</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.03] text-neutral-700">
                  {students.map((student) => {
                    const evalData = student.latestEvaluation;
                    const fluencyStyle = evalData ? getFluencyHueStyle(evalData.fluencyScore) : null;
                    const targetPage = student.tilawahPage + (student.weeklyGoal * 4);

                    return (
                      <tr key={student.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="p-4 pl-6">
                          <button 
                            onClick={() => setSelectedStudent(student)}
                            className="flex items-center gap-3 text-left group"
                            title="Click to view full report and export"
                          >
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt={student.name} className="w-10 h-10 rounded-2xl object-cover border border-black/[0.05] shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-2xl bg-neutral-100 text-neutral-800 font-bold text-xs flex items-center justify-center shrink-0 border border-black/[0.04]">
                                {student.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-neutral-900 group-hover:text-blue-600 transition-colors tracking-tight">{student.name}</div>
                              <div className="text-[11px] text-neutral-400 font-normal">Age: {student.age} • {student.location}</div>
                            </div>
                          </button>
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            student.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            student.paymentStatus === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-rose-50 text-rose-700 border-rose-200"
                          }`}>
                            {student.paymentStatus}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="inline-flex flex-col gap-1">
                            <span className="font-semibold text-neutral-800 text-[11px]">{student.completedSessions} / {student.totalSessions} Sessions</span>
                            <div className="w-20 bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-neutral-900 h-full rounded-full" 
                                style={{ width: `${Math.min(100, (student.completedSessions / Math.max(1, student.totalSessions)) * 100)}%` }} 
                              />
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="inline-flex flex-col gap-0.5 bg-blue-50/50 border border-blue-100 px-2.5 py-1 rounded-xl text-blue-900">
                            <div className="flex items-center gap-1 font-bold">
                              <BookOpen className="w-3 h-3 text-blue-600" />
                              <span>Pg {student.tilawahPage}</span>
                            </div>
                            <span className="text-[10px] text-blue-700 font-medium">
                              {formatJuzRanges(student.completedTilawahJuzs || [student.tilawahJuz])}
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="inline-flex flex-col gap-0.5 bg-purple-50/50 border border-purple-100 px-2.5 py-1 rounded-xl text-purple-900">
                            <div className="flex items-center gap-1 font-bold">
                              <BookOpen className="w-3 h-3 text-purple-600" />
                              <span>Pg {student.hifzPage}</span>
                            </div>
                            <span className="text-[10px] text-purple-700 font-medium">
                              {formatJuzRanges(student.completedHifzJuzs || [student.hifzJuz])}
                            </span>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="inline-flex items-center gap-1 font-medium text-neutral-600">
                            <span>Pg {student.tilawahPage}</span>
                            <ArrowRight className="w-3 h-3 text-neutral-300" />
                            <span className="font-bold text-neutral-900">Pg {targetPage}</span>
                            <span className="text-[10px] text-neutral-400">({student.weeklyGoal}/wk)</span>
                          </div>
                        </td>

                        <td className="p-4">
                          {fluencyStyle && evalData ? (
                            <span className="px-2.5 py-0.5 rounded-full border font-bold text-[10px]" style={{
                              backgroundColor: fluencyStyle.backgroundColor,
                              borderColor: fluencyStyle.borderColor,
                              color: fluencyStyle.color
                            }}>
                              {evalData.fluencyScore}%
                            </span>
                          ) : (
                            <span className="text-neutral-400 italic text-[11px]">Unrated</span>
                          )}
                        </td>

                        <td className="p-4 pr-6 text-right space-x-1.5">
                          <button 
                            onClick={() => setQuickPageStudent(student)}
                            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-2.5 py-1 rounded-full font-semibold text-[11px] inline-flex items-center gap-1 transition"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>Pages</span>
                          </button>
                          <button 
                            onClick={() => openEvaluationModal(student)}
                            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-2.5 py-1 rounded-full font-semibold text-[11px] transition"
                          >
                            Rubric
                          </button>
                          <button 
                            onClick={() => setEditingStudent(student)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-full inline-flex transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* --- ADD STUDENT MODAL --- */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-black/[0.06] rounded-3xl shadow-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsAddOpen(false)} className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-700">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-neutral-950 mb-0.5">Add New Student</h3>
            <p className="text-xs text-neutral-400 mb-5">Set up student details, enrolled tracks, and baseline targets.</p>

            <form onSubmit={handleAddStudent} className="space-y-3.5 text-xs">
              <div className="flex items-center gap-3 bg-[#F8F9FB] p-3 rounded-2xl border border-black/[0.04]">
                {newPhoto ? (
                  <img src={newPhoto} alt="Avatar" className="w-12 h-12 rounded-2xl object-cover border" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-white border border-black/[0.06] flex items-center justify-center text-neutral-400">
                    <Camera className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <label className="block font-semibold text-neutral-700 mb-0.5">Student Photo</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, (base64) => setNewPhoto(base64))}
                    className="text-[10px] text-neutral-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 font-medium mb-1">Student Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Muadz Danial"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#F8F9FB] border border-black/[0.06] rounded-xl p-2.5 text-neutral-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-600 font-medium mb-1.5">Enrolled Tracks</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["Recitation (Tilawah / Nazirah)", "Memorization (Hifz)"] as Track[]).map((tr) => (
                    <label key={tr} className="flex items-center gap-2 p-2.5 bg-[#F8F9FB] border border-black/[0.04] rounded-xl cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={newTracks.includes(tr)}
                        onChange={() => toggleTrackSelection(tr, newTracks, setNewTracks)}
                        className="rounded text-neutral-900 accent-neutral-900"
                      />
                      <span className="font-medium text-[11px]">{tr.includes("Memorization") ? "Hifz" : "Tilawah"}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Age</label>
                  <input type="text" placeholder="e.g. 14" value={newAge} onChange={(e) => setNewAge(e.target.value)} className="w-full bg-[#F8F9FB] border border-black/[0.06] rounded-xl p-2.5" />
                </div>
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Location</label>
                  <input type="text" placeholder="e.g. Kuala Lumpur" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} className="w-full bg-[#F8F9FB] border border-black/[0.06] rounded-xl p-2.5" />
                </div>
              </div>

              <div className="bg-blue-50/40 p-3.5 rounded-2xl border border-blue-100 space-y-2">
                <p className="font-bold text-blue-900 text-[11px]">Tilawah Recitation Progress</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Juz (1-30)" value={newTilawahJuz} onChange={(e) => setNewTilawahJuz(Number(e.target.value))} className="bg-white border border-blue-200 rounded-lg p-2" />
                  <input type="number" placeholder="Page (1-604)" value={newTilawahPage} onChange={(e) => setNewTilawahPage(Number(e.target.value))} className="bg-white border border-blue-200 rounded-lg p-2" />
                </div>
              </div>

              <div className="bg-purple-50/40 p-3.5 rounded-2xl border border-purple-100 space-y-2">
                <p className="font-bold text-purple-900 text-[11px]">Hifz Memorization Progress</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Juz (1-30)" value={newHifzJuz} onChange={(e) => setNewHifzJuz(Number(e.target.value))} className="bg-white border border-purple-200 rounded-lg p-2" />
                  <input type="number" placeholder="Page (1-604)" value={newHifzPage} onChange={(e) => setNewHifzPage(Number(e.target.value))} className="bg-white border border-purple-200 rounded-lg p-2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Weekly Pages Goal</label>
                  <input type="number" value={newWeeklyGoal} onChange={(e) => setNewWeeklyGoal(Number(e.target.value))} className="w-full bg-[#F8F9FB] border border-black/[0.06] rounded-xl p-2.5 font-bold" />
                </div>
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Payment Status</label>
                  <select value={newPaymentStatus} onChange={(e) => setNewPaymentStatus(e.target.value as PaymentStatus)} className="w-full bg-[#F8F9FB] border border-black/[0.06] rounded-xl p-2.5 font-bold">
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Completed Sessions</label>
                  <input type="number" value={newCompletedSessions} onChange={(e) => setNewCompletedSessions(Number(e.target.value))} className="w-full bg-[#F8F9FB] border border-black/[0.06] rounded-xl p-2.5" />
                </div>
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Total Package Sessions</label>
                  <input type="number" value={newTotalSessions} onChange={(e) => setNewTotalSessions(Number(e.target.value))} className="w-full bg-[#F8F9FB] border border-black/[0.06] rounded-xl p-2.5" />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button type="button" onClick={() => setIsAddOpen(false)} className="w-1/2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-2.5 rounded-full font-medium">Cancel</button>
                <button type="submit" className="w-1/2 bg-neutral-950 hover:bg-black text-white py-2.5 rounded-full font-semibold shadow-xs">Save Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- QUICK PAGE & 1-30 JUZ TRACKER --- */}
      {quickPageStudent && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-black/[0.06] rounded-3xl shadow-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setQuickPageStudent(null)} className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-700">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-neutral-950 mb-0.5">Syllabus & Page Progress</h3>
            <p className="text-xs text-neutral-400 mb-5">Set current reading page and toggle completed Juz for {quickPageStudent.name}.</p>

            <form onSubmit={handleSaveQuickPages} className="space-y-4 text-xs">
              {/* Tilawah */}
              <div className="bg-[#F8F9FB] border border-black/[0.04] p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-neutral-900 text-xs">Tilawah (Recitation)</span>
                  <span className="text-[10px] text-blue-700 bg-blue-50 font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                    {formatJuzRanges(quickPageStudent.completedTilawahJuzs)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-400 font-medium">Current Juz (1–30)</label>
                    <input type="number" min="1" max="30" value={quickPageStudent.tilawahJuz} onChange={(e) => setQuickPageStudent({ ...quickPageStudent, tilawahJuz: Number(e.target.value) })} className="w-full bg-white border border-black/[0.06] p-2 rounded-xl font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 font-medium">Current Page (1–604)</label>
                    <input type="number" min="1" max="604" value={quickPageStudent.tilawahPage} onChange={(e) => setQuickPageStudent({ ...quickPageStudent, tilawahPage: Number(e.target.value) })} className="w-full bg-white border border-black/[0.06] p-2 rounded-xl font-bold" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Completed / Read Juzes:</label>
                  <div className="grid grid-cols-10 gap-1">
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNum) => {
                      const isSelected = quickPageStudent.completedTilawahJuzs?.includes(juzNum);
                      return (
                        <button
                          key={juzNum}
                          type="button"
                          onClick={() => {
                            const list = quickPageStudent.completedTilawahJuzs || [];
                            const updated = isSelected ? list.filter((j) => j !== juzNum) : [...list, juzNum].sort((a,b) => a-b);
                            setQuickPageStudent({ ...quickPageStudent, completedTilawahJuzs: updated });
                          }}
                          className={`h-7 text-[10px] font-bold rounded-lg border transition-all flex items-center justify-center ${
                            isSelected ? "bg-neutral-900 text-white border-neutral-900 shadow-xs" : "bg-white text-neutral-600 border-black/[0.06] hover:border-black/20"
                          }`}
                        >
                          {juzNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Hifz */}
              <div className="bg-[#F8F9FB] border border-black/[0.04] p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-neutral-900 text-xs">Hifz (Memorization)</span>
                  <span className="text-[10px] text-purple-700 bg-purple-50 font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
                    {formatJuzRanges(quickPageStudent.completedHifzJuzs)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-400 font-medium">Current Juz (1–30)</label>
                    <input type="number" min="1" max="30" value={quickPageStudent.hifzJuz} onChange={(e) => setQuickPageStudent({ ...quickPageStudent, hifzJuz: Number(e.target.value) })} className="w-full bg-white border border-black/[0.06] p-2 rounded-xl font-bold" />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 font-medium">Current Page (1–604)</label>
                    <input type="number" min="1" max="604" value={quickPageStudent.hifzPage} onChange={(e) => setQuickPageStudent({ ...quickPageStudent, hifzPage: Number(e.target.value) })} className="w-full bg-white border border-black/[0.06] p-2 rounded-xl font-bold" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Memorized Juzes:</label>
                  <div className="grid grid-cols-10 gap-1">
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNum) => {
                      const isSelected = quickPageStudent.completedHifzJuzs?.includes(juzNum);
                      return (
                        <button
                          key={juzNum}
                          type="button"
                          onClick={() => {
                            const list = quickPageStudent.completedHifzJuzs || [];
                            const updated = isSelected ? list.filter((j) => j !== juzNum) : [...list, juzNum].sort((a,b) => a-b);
                            setQuickPageStudent({ ...quickPageStudent, completedHifzJuzs: updated });
                          }}
                          className={`h-7 text-[10px] font-bold rounded-lg border transition-all flex items-center justify-center ${
                            isSelected ? "bg-purple-600 text-white border-purple-600 shadow-xs" : "bg-white text-neutral-600 border-black/[0.06] hover:border-purple-200"
                          }`}
                        >
                          {juzNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setQuickPageStudent(null)} className="w-1/2 bg-neutral-100 text-neutral-700 py-2.5 rounded-full font-medium">Cancel</button>
                <button type="submit" className="w-1/2 bg-neutral-950 text-white py-2.5 rounded-full font-bold shadow-xs">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT STUDENT MODAL --- */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-black/[0.06] rounded-3xl shadow-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setEditingStudent(null)} className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-700">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-neutral-950 mb-0.5">Edit Student Profile</h3>
            <p className="text-xs text-neutral-400 mb-5">Update personal data, attendance, and fee status.</p>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="flex items-center gap-3 bg-[#F8F9FB] p-3 rounded-2xl border border-black/[0.04]">
                {editingStudent.photoUrl ? (
                  <img src={editingStudent.photoUrl} alt="Avatar" className="w-12 h-12 rounded-2xl object-cover border" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-white border flex items-center justify-center text-neutral-400">
                    <Camera className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <label className="block font-semibold text-neutral-700 mb-0.5">Change Photo</label>
                  <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, (base64) => setEditingStudent({ ...editingStudent, photoUrl: base64 }))} className="text-[10px] text-neutral-500" />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 font-medium mb-1">Student Name</label>
                <input type="text" required value={editingStudent.name} onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })} className="w-full bg-[#F8F9FB] border border-black/[0.06] rounded-xl p-2.5 text-neutral-900" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Payment Status</label>
                  <select value={editingStudent.paymentStatus} onChange={(e) => setEditingStudent({ ...editingStudent, paymentStatus: e.target.value as PaymentStatus })} className="w-full bg-[#F8F9FB] border border-black/[0.06] rounded-xl p-2.5 font-bold">
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Weekly Goal (Pages)</label>
                  <input type="number" value={editingStudent.weeklyGoal} onChange={(e) => setEditingStudent({ ...editingStudent, weeklyGoal: Number(e.target.value) })} className="w-full bg-[#F8F9FB] border border-black/[0.06] rounded-xl p-2.5 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Completed Sessions</label>
                  <input type="number" value={editingStudent.completedSessions} onChange={(e) => setEditingStudent({ ...editingStudent, completedSessions: Number(e.target.value) })} className="w-full bg-[#F8F9FB] border border-black/[0.06] rounded-xl p-2.5" />
                </div>
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Total Sessions</label>
                  <input type="number" value={editingStudent.totalSessions} onChange={(e) => setEditingStudent({ ...editingStudent, totalSessions: Number(e.target.value) })} className="w-full bg-[#F8F9FB] border border-black/[0.06] rounded-xl p-2.5" />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button type="button" onClick={() => setEditingStudent(null)} className="w-1/2 bg-neutral-100 text-neutral-700 py-2.5 rounded-full font-medium">Cancel</button>
                <button type="submit" className="w-1/2 bg-neutral-950 text-white py-2.5 rounded-full font-semibold shadow-xs">Update Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EVALUATION RUBRIC DRAWER --- */}
      {evaluatingStudent && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white border-l border-black/[0.06] w-full max-w-2xl h-full overflow-y-auto p-8 shadow-2xl relative flex flex-col">
            <button onClick={() => setEvaluatingStudent(null)} className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-700">
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-black/[0.05] pb-5 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Mastery Assessment</span>
              <h3 className="text-2xl font-extrabold tracking-tight text-neutral-950 mt-1">{evaluatingStudent.name}</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Rate fluency meter and evaluate specific Tajweed rules and letters.</p>
            </div>

            <form onSubmit={handleSaveEvaluation} className="space-y-6 text-xs flex-1">
              {/* Tracks */}
              <div>
                <label className="block font-bold text-neutral-900 mb-2">1. Enrolled Track Focus</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(["Recitation (Tilawah / Nazirah)", "Memorization (Hifz)"] as Track[]).map((tr) => (
                    <button
                      key={tr}
                      type="button"
                      onClick={() => toggleTrackSelection(tr, evalTracks, setEvalTracks)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        evalTracks.includes(tr) 
                          ? "bg-neutral-950 border-neutral-950 text-white font-semibold shadow-sm" 
                          : "bg-[#F8F9FB] border-black/[0.04] text-neutral-600 hover:border-black/20"
                      }`}
                    >
                      {tr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fluency Meter */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block font-bold text-neutral-900">2. Fluency Meter ({evalFluency}%)</label>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border" style={{
                    backgroundColor: getFluencyHueStyle(evalFluency).backgroundColor,
                    borderColor: getFluencyHueStyle(evalFluency).borderColor,
                    color: getFluencyHueStyle(evalFluency).color
                  }}>
                    {getFluencyHueStyle(evalFluency).label} ({evalFluency}%)
                  </span>
                </div>

                <div className="bg-[#F8F9FB] border border-black/[0.04] p-4 rounded-2xl space-y-3">
                  <input 
                    type="range" min="1" max="100" 
                    value={evalFluency}
                    onChange={(e) => setEvalFluency(Number(e.target.value))}
                    className="w-full accent-neutral-900 cursor-pointer h-2 bg-neutral-200 rounded-lg"
                  />
                  <div className="w-full h-2 rounded-full overflow-hidden bg-neutral-200">
                    <div className="h-full transition-all duration-200" style={{ width: `${evalFluency}%`, backgroundColor: getFluencyHueStyle(evalFluency).barColor }} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {["Hesitation Frequency", "Breath Management", "Stopping (Waqf)", "Starting (Ibtida')"].map((focus) => (
                    <button
                      key={focus}
                      type="button"
                      onClick={() => toggleFocusPoint(focus)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        evalFocus.includes(focus) ? "bg-neutral-900 text-white border-neutral-900" : "bg-[#F8F9FB] text-neutral-600 border-black/[0.04] hover:bg-neutral-100"
                      }`}
                    >
                      {focus}
                    </button>
                  ))}
                </div>
              </div>

              {/* Makhraj 28 Alphabets */}
              <div>
                <label className="block font-bold text-neutral-900 mb-2">3. Makhraj Pronunciation Grid (28 Letters)</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 bg-[#F8F9FB] border border-black/[0.04] p-3.5 rounded-2xl">
                  {ARABIC_ALPHABETS.map((letter) => {
                    const current = evalAlphabets[letter] || "good";
                    return (
                      <div key={letter} className="bg-white border border-black/[0.04] rounded-xl p-2 text-center shadow-xs">
                        <span className="text-base font-bold block mb-1 font-serif">{letter}</span>
                        <div className="flex justify-center gap-1">
                          {(["low", "medium", "good", "mastery"] as ProficiencyLevel[]).map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setEvalAlphabets({ ...evalAlphabets, [letter]: lvl })}
                              className={`w-2.5 h-2.5 rounded-full border ${current === lvl ? PROFICIENCY_CONFIG[lvl].badge : "bg-neutral-100 border-neutral-200"}`}
                              title={`${letter}: ${PROFICIENCY_CONFIG[lvl].label}`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tajweed Rules Breakdown (Translations Removed) */}
              <div className="space-y-4">
                <label className="block font-bold text-neutral-900">4. Tajweed Rules Breakdown</label>
                {TAJWEED_CATEGORIES.map((cat) => (
                  <div key={cat.group} className="bg-[#F8F9FB] border border-black/[0.04] p-4 rounded-2xl">
                    <h4 className="font-bold text-neutral-400 text-[10px] mb-2.5 uppercase tracking-wider">{cat.group}</h4>
                    <div className="space-y-2">
                      {cat.items.map((item) => {
                        const currentLvl = evalRules[item.id] || "good";
                        return (
                          <div key={item.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-black/[0.04]">
                            <span className="font-semibold text-neutral-800 text-[11px]">{item.label}</span>
                            <div className="flex gap-1">
                              {(["low", "medium", "good", "mastery"] as ProficiencyLevel[]).map((lvl) => (
                                <button
                                  key={lvl}
                                  type="button"
                                  onClick={() => setEvalRules({ ...evalRules, [item.id]: lvl })}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                                    currentLvl === lvl ? PROFICIENCY_CONFIG[lvl].pillActive : "bg-neutral-50 text-neutral-400 border-neutral-200/70"
                                  }`}
                                >
                                  {PROFICIENCY_CONFIG[lvl].label}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Comments */}
              <div>
                <label className="block font-bold text-neutral-900 mb-1">5. Tutor Custom Notes</label>
                <textarea 
                  rows={3}
                  value={evalNotes}
                  onChange={(e) => setEvalNotes(e.target.value)}
                  placeholder="e.g. Focus on throat articulation during Friday sessions..."
                  className="w-full bg-[#F8F9FB] border border-black/[0.06] rounded-2xl p-3 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-black/[0.05] flex gap-2">
                <button type="button" onClick={() => setEvaluatingStudent(null)} className="w-1/2 bg-neutral-100 text-neutral-700 py-3 rounded-full font-medium">Cancel</button>
                <button type="submit" className="w-1/2 bg-neutral-950 text-white py-3 rounded-full font-bold shadow-xs">Save Rubric</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DETAILED VIEW & EXPORT MODAL --- */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-black/[0.06] rounded-3xl shadow-2xl max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedStudent(null)} className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-700">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-neutral-950 mb-0.5">Student Performance Report</h3>
            <p className="text-xs text-neutral-400 mb-5">High-resolution export generator for parents and students.</p>

            {/* PREVIEW CONTAINER TO CAPTURE */}
            <div className="bg-white border border-neutral-200 rounded-3xl p-6 mb-6 shadow-xs" ref={reportRef} style={{ backgroundColor: "#ffffff" }}>
              <div className="flex justify-between items-start border-b border-neutral-100 pb-5 mb-5">
                <div className="flex items-center gap-3.5">
                  {selectedStudent.photoUrl ? (
                    <img src={selectedStudent.photoUrl} alt="Avatar" className="w-12 h-12 rounded-2xl object-cover border" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-800 font-bold text-sm flex items-center justify-center border">
                      {selectedStudent.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Salman Zulkifle Mentorship</p>
                    <h4 className="text-xl font-black text-neutral-950 tracking-tight">{selectedStudent.name}</h4>
                    <p className="text-xs text-neutral-400">Age: {selectedStudent.age} • Location: {selectedStudent.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    selectedStudent.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    Tuition: {selectedStudent.paymentStatus}
                  </span>
                  <p className="text-xs font-bold text-neutral-800 mt-2">{selectedStudent.completedSessions} / {selectedStudent.totalSessions} Sessions</p>
                </div>
              </div>

              {/* OVERVIEW STATS */}
              <div className="grid grid-cols-3 gap-3 text-xs mb-4">
                <div className="bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100">
                  <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Tilawah Recitation</span>
                  <span className="font-extrabold text-blue-900 block text-base mt-0.5">Pg {selectedStudent.tilawahPage}</span>
                  <span className="text-[10px] text-blue-700 font-medium block mt-0.5">
                    {formatJuzRanges(selectedStudent.completedTilawahJuzs || [selectedStudent.tilawahJuz])}
                  </span>
                </div>
                <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-100">
                  <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Hifz Memorization</span>
                  <span className="font-extrabold text-purple-900 block text-base mt-0.5">Pg {selectedStudent.hifzPage}</span>
                  <span className="text-[10px] text-purple-700 font-medium block mt-0.5">
                    {formatJuzRanges(selectedStudent.completedHifzJuzs || [selectedStudent.hifzJuz])}
                  </span>
                </div>
                <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
                  <span className="text-neutral-400 block text-[10px] uppercase font-semibold">4-Week Target</span>
                  <span className="font-extrabold text-emerald-900 block text-base mt-0.5">Page {selectedStudent.tilawahPage + (selectedStudent.weeklyGoal * 4)}</span>
                  <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">({selectedStudent.weeklyGoal} pgs / wk)</span>
                </div>
              </div>

              {/* MAKHRAJ ALPHABET GRID */}
              <div className="bg-[#F8F9FB] border border-black/[0.04] rounded-2xl p-4 mb-4">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2.5">Makhraj Pronunciation Grid</span>
                <div className="flex flex-wrap gap-1.5">
                  {ARABIC_ALPHABETS.map((letter) => {
                    const lvl = selectedStudent.latestEvaluation?.alphabetRatings[letter] || "good";
                    const cfg = PROFICIENCY_CONFIG[lvl];
                    return (
                      <div key={letter} className={`w-7 h-8 rounded-lg border font-serif font-bold text-sm flex items-center justify-center ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                        {letter}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TAJWEED RULES (Cleaned) */}
              <div className="bg-[#F8F9FB] border border-black/[0.04] rounded-2xl p-4 text-xs space-y-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block border-b border-black/[0.04] pb-1.5">Tajweed Rules Breakdown</span>
                <div className="grid grid-cols-2 gap-2">
                  {TAJWEED_CATEGORIES.flatMap((cat) => cat.items).map((item) => {
                    const lvl = selectedStudent.latestEvaluation?.ruleRatings[item.id] || "good";
                    const cfg = PROFICIENCY_CONFIG[lvl];
                    return (
                      <div key={item.id} className={`p-2.5 rounded-xl border flex justify-between items-center ${cfg.bg} ${cfg.border}`}>
                        <span className={`font-semibold text-[11px] ${cfg.text}`}>{item.label}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* EXPORT BUTTONS */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-2">1. Export Document (PDF)</label>
                <div className="grid grid-cols-3 gap-2">
                  <button disabled={isExporting} onClick={() => { setReportRange("Entire Report"); exportAsPDF("Entire"); }} className="bg-neutral-900 hover:bg-black disabled:bg-neutral-400 text-white text-xs py-2.5 px-3 rounded-full font-semibold flex items-center justify-center gap-1.5 shadow-xs transition">
                    {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                    <span>Entire Report</span>
                  </button>
                  <button disabled={isExporting} onClick={() => { setReportRange("Last Month"); exportAsPDF("Last_Month"); }} className="bg-neutral-900 hover:bg-black disabled:bg-neutral-400 text-white text-xs py-2.5 px-3 rounded-full font-semibold flex items-center justify-center gap-1.5 shadow-xs transition">
                    {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                    <span>Last Month</span>
                  </button>
                  <button disabled={isExporting} onClick={() => { setReportRange("Last Week"); exportAsPDF("Last_Week"); }} className="bg-neutral-900 hover:bg-black disabled:bg-neutral-400 text-white text-xs py-2.5 px-3 rounded-full font-semibold flex items-center justify-center gap-1.5 shadow-xs transition">
                    {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                    <span>Last Week</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-2">2. Export Picture (PNG)</label>
                <div className="grid grid-cols-3 gap-2">
                  <button disabled={isExporting} onClick={() => { setReportRange("Latest Day"); exportAsImage("Latest_Day"); }} className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs py-2.5 px-3 rounded-full font-semibold flex items-center justify-center gap-1.5 transition">
                    {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileImage className="w-3.5 h-3.5 text-neutral-700" />}
                    <span>Latest (Day)</span>
                  </button>
                  <button disabled={isExporting} onClick={() => { setReportRange("Last Week"); exportAsImage("Last_Week"); }} className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs py-2.5 px-3 rounded-full font-semibold flex items-center justify-center gap-1.5 transition">
                    {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileImage className="w-3.5 h-3.5 text-neutral-700" />}
                    <span>Last Week</span>
                  </button>
                  <button disabled={isExporting} onClick={() => { setReportRange("Last Month"); exportAsImage("Last_Month"); }} className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs py-2.5 px-3 rounded-full font-semibold flex items-center justify-center gap-1.5 transition">
                    {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileImage className="w-3.5 h-3.5 text-neutral-700" />}
                    <span>Last Month</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}