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
  BookOpen, 
  Loader2, 
  Camera, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  Users,
  Award,
  Lock
} from "lucide-react";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { supabase } from "@/lib/supabase";

// --- TYPES ---
type Track = "Recitation (Tilawah / Nazirah)" | "Memorization (Hifz)";
type ProficiencyLevel = "low" | "medium" | "good" | "mastery";
type PaymentStatus = "Paid" | "Pending" | "Unpaid";

interface TajweedEvaluation {
  id?: string;
  student_id?: string;
  eval_date: string;
  tracks: Track[];
  fluencyScore: number;
  fluencyFocus: string[];
  alphabetRatings: Record<string, ProficiencyLevel>;
  ruleRatings: Record<string, ProficiencyLevel>;
  tutorNotes: string;
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
  tilawahPages: number[];
  hifzJuz: number;
  hifzPage: number;
  completedHifzJuzs: number[];
  memorizedPages: number[];
  juzMemoryStrength: Record<number, number>;
  weeklyGoal: number;
  paymentStatus: PaymentStatus;
  completedSessions: number;
  totalSessions: number;
  status: string;
  startDate: string;
  latestEvaluation?: TajweedEvaluation;
}

const getJuzPageRange = (juz: number): { start: number; end: number } => {
  if (juz === 1) return { start: 1, end: 21 };
  if (juz === 30) return { start: 582, end: 604 };
  const start = 22 + (juz - 2) * 20;
  return { start, end: start + 19 };
};

const formatJuzRanges = (juzs?: number[]) => {
  if (!juzs || juzs.length === 0) return "None";
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

const getMemoryHueStyle = (score: number) => {
  const safe = Math.max(0, Math.min(100, score));
  if (safe <= 35) {
    return { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", bar: "bg-rose-500", label: "Needs Revision" };
  } else if (safe <= 69) {
    return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", bar: "bg-amber-500", label: "Moderate" };
  } else {
    return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", bar: "bg-emerald-600", label: "Mutqin" };
  }
};

const PROFICIENCY_CONFIG: Record<ProficiencyLevel, { label: string; bg: string; border: string; text: string; badge: string; pillActive: string }> = {
  low: { label: "Low", bg: "bg-rose-50/80", border: "border-rose-200", text: "text-rose-700", badge: "bg-rose-500 text-white", pillActive: "bg-rose-600 text-white border-rose-600 font-bold" },
  medium: { label: "Medium", bg: "bg-amber-50/80", border: "border-amber-200", text: "text-amber-800", badge: "bg-amber-500 text-white", pillActive: "bg-amber-500 text-white border-amber-500 font-bold" },
  good: { label: "Good", bg: "bg-emerald-50/80", border: "border-emerald-200", text: "text-emerald-800", badge: "bg-emerald-600 text-white", pillActive: "bg-emerald-600 text-white border-emerald-600 font-bold" },
  mastery: { label: "Mastery", bg: "bg-blue-50/80", border: "border-blue-200", text: "text-blue-800", badge: "bg-blue-600 text-white", pillActive: "bg-blue-600 text-white border-blue-600 font-bold" }
};

const ARABIC_ALPHABETS = [
  "أ", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", 
  "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", 
  "ق", "ك", "ل", "م", "ن", "هـ", "و", "ي"
];

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
  // --- PIN LOCK SYSTEM ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("pocket_admin_auth") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === "1234") {
      sessionStorage.setItem("pocket_admin_auth", "true");
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [quickPageStudent, setQuickPageStudent] = useState<Student | null>(null);
  const [evaluatingStudent, setEvaluatingStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Attendance Modal
  const [sessionStudent, setSessionStudent] = useState<Student | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [studentSessions, setStudentSessions] = useState<any[]>([]);

  // 3 Program Views in Report: Tajweed Core | Hifz Program | Tilawah Report
  const [reportTab, setReportTab] = useState<"tajweed" | "hifz" | "sanad">("tajweed");
  const [progressModalTab, setProgressModalTab] = useState<"tilawah" | "hifz">("tilawah");

  // Add Form
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

  // Rubric Form
  const [evalTracks, setEvalTracks] = useState<Track[]>([]);
  const [evalFluency, setEvalFluency] = useState(80);
  const [evalFocus, setEvalFocus] = useState<string[]>(["Breath Management"]);
  const [evalAlphabets, setEvalAlphabets] = useState<Record<string, ProficiencyLevel>>({});
  const [evalRules, setEvalRules] = useState<Record<string, ProficiencyLevel>>({});
  const [evalNotes, setEvalNotes] = useState("");

  const reportRef = useRef<HTMLDivElement>(null);

  const loadSupabaseData = async () => {
    setLoading(true);
    try {
      const { data: stData, error: stError } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (stError) throw stError;

      const { data: evData, error: evError } = await supabase
        .from("student_evaluations")
        .select("*")
        .order("created_at", { ascending: false });

      if (evError) throw evError;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedStudents: Student[] = (stData || []).map((row: any) => {
        const studentEvals = (evData || [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((e: any) => e.student_id === row.id)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((e: any) => ({
            id: e.id,
            student_id: e.student_id,
            eval_date: e.eval_date || e.created_at?.split("T")[0],
            tracks: e.tracks || [],
            fluencyScore: e.fluency_score,
            fluencyFocus: e.fluency_focus || [],
            alphabetRatings: e.alphabet_ratings || {},
            ruleRatings: e.rule_ratings || {},
            tutorNotes: e.tutor_notes || ""
          }));

        return {
          id: row.id,
          name: row.name,
          photoUrl: row.photo_url,
          age: row.age,
          location: row.location,
          tracks: row.tracks || ["Recitation (Tilawah / Nazirah)"],
          tilawahJuz: row.tilawah_juz,
          tilawahPage: row.tilawah_page,
          completedTilawahJuzs: row.completed_tilawah_juzs || [row.tilawah_juz],
          tilawahPages: row.tilawah_pages || [],
          hifzJuz: row.hifz_juz,
          hifzPage: row.hifz_page,
          completedHifzJuzs: row.completed_hifz_juzs || [row.hifz_juz],
          memorizedPages: row.memorized_pages || [],
          juzMemoryStrength: row.juz_memory_strength || {},
          weeklyGoal: row.weekly_goal,
          paymentStatus: row.payment_status as PaymentStatus,
          completedSessions: row.completed_sessions,
          totalSessions: row.total_sessions,
          status: row.status,
          startDate: row.start_date,
          latestEvaluation: studentEvals[0] || undefined
        };
      });

      setStudents(mappedStudents);
    } catch (err) {
      console.error("Failed to load Supabase records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupabaseData();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const payload = {
      name: newName,
      photo_url: newPhoto,
      age: newAge || "N/A",
      location: newLocation || "Not specified",
      tracks: newTracks,
      tilawah_juz: newTilawahJuz,
      tilawah_page: newTilawahPage,
      completed_tilawah_juzs: [newTilawahJuz],
      tilawah_pages: [],
      hifz_juz: newHifzJuz,
      hifz_page: newHifzPage,
      completed_hifz_juzs: [newHifzJuz],
      memorized_pages: [],
      juz_memory_strength: {},
      weekly_goal: newWeeklyGoal,
      payment_status: newPaymentStatus,
      completed_sessions: newCompletedSessions,
      total_sessions: newTotalSessions,
      status: "Active"
    };

    const { error } = await supabase.from("students").insert(payload);
    if (error) {
      alert("Error adding student: " + error.message);
      return;
    }

    setIsAddOpen(false);
    setNewName("");
    setNewPhoto(undefined);
    await loadSupabaseData();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const { error } = await supabase
      .from("students")
      .update({
        name: editingStudent.name,
        photo_url: editingStudent.photoUrl,
        age: editingStudent.age,
        location: editingStudent.location,
        tracks: editingStudent.tracks,
        payment_status: editingStudent.paymentStatus,
        weekly_goal: editingStudent.weeklyGoal,
        completed_sessions: editingStudent.completedSessions,
        total_sessions: editingStudent.totalSessions
      })
      .eq("id", editingStudent.id);

    if (error) {
      alert("Error updating student: " + error.message);
      return;
    }

    if (selectedStudent?.id === editingStudent.id) {
      setSelectedStudent(editingStudent);
    }

    setEditingStudent(null);
    await loadSupabaseData();
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete ${studentName}? This will permanently remove their records.`)) {
      return;
    }
    const { error } = await supabase.from("students").delete().eq("id", studentId);
    if (error) {
      alert("Failed to delete student: " + error.message);
      return;
    }
    setStudents(students.filter(s => s.id !== studentId));
    if (selectedStudent?.id === studentId) setSelectedStudent(null);
    if (editingStudent?.id === studentId) setEditingStudent(null);
    if (quickPageStudent?.id === studentId) setQuickPageStudent(null);
    if (evaluatingStudent?.id === studentId) setEvaluatingStudent(null);
    if (sessionStudent?.id === studentId) setSessionStudent(null);
    await loadSupabaseData();
  };

  const openSessionsModal = async (student: Student) => {
    setSessionStudent(student);
    const defaultSessions = Array.from({ length: student.totalSessions || 12 }, (_, i) => ({
      id: `temp-${student.id}-${i + 1}`,
      student_id: student.id,
      session_number: i + 1,
      session_date: new Date().toISOString().split("T")[0],
      tutor_verified: i < (student.completedSessions || 0),
      student_verified: i < (student.completedSessions || 0),
      status: i < (student.completedSessions || 0) ? "done" : "pending"
    }));
    setStudentSessions(defaultSessions);

    try {
      const { data, error } = await supabase
        .from("class_sessions")
        .select("*")
        .eq("student_id", student.id)
        .order("session_number", { ascending: true });

      if (!error && data && data.length > 0) {
        setStudentSessions(data);
      }
    } catch {
      // Fallback
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleTutorToggleSession = async (session: any, action: "verify" | "cancel") => {
    const willBeTutorVerified = action === "verify" ? !session.tutor_verified : false;
    const isNowFullyDone = willBeTutorVerified && session.student_verified;
    const newStatus = action === "cancel" 
      ? (session.status === "cancelled" ? "pending" : "cancelled")
      : (isNowFullyDone ? "done" : willBeTutorVerified ? "awaiting_confirmation" : "pending");

    const updatedList = studentSessions.map((s) => {
      if (s.id === session.id || s.session_number === session.session_number) {
        return {
          ...s,
          tutor_verified: willBeTutorVerified,
          tutor_verified_at: willBeTutorVerified ? new Date().toISOString() : null,
          status: newStatus
        };
      }
      return s;
    });
    setStudentSessions(updatedList);

    const doneCount = updatedList.filter(s => s.tutor_verified && s.student_verified).length;
    if (sessionStudent) {
      setStudents(students.map(st => st.id === sessionStudent.id ? { ...st, completedSessions: doneCount } : st));
      await supabase.from("students").update({ completed_sessions: doneCount }).eq("id", sessionStudent.id);
    }

    try {
      if (!String(session.id).startsWith("temp-")) {
        await supabase
          .from("class_sessions")
          .update({
            tutor_verified: willBeTutorVerified,
            tutor_verified_at: willBeTutorVerified ? new Date().toISOString() : null,
            status: newStatus
          })
          .eq("id", session.id);
      }
    } catch (err) {
      console.error("Session sync note:", err);
    }
  };

  const handleSaveQuickPages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPageStudent) return;

    const { error } = await supabase
      .from("students")
      .update({
        tilawah_juz: quickPageStudent.tilawahJuz,
        tilawah_page: quickPageStudent.tilawahPage,
        completed_tilawah_juzs: quickPageStudent.completedTilawahJuzs,
        tilawah_pages: quickPageStudent.tilawahPages,
        hifz_juz: quickPageStudent.hifzJuz,
        hifz_page: quickPageStudent.hifzPage,
        completed_hifz_juzs: quickPageStudent.completedHifzJuzs,
        memorized_pages: quickPageStudent.memorizedPages,
        juz_memory_strength: quickPageStudent.juzMemoryStrength
      })
      .eq("id", quickPageStudent.id);

    if (error) {
      alert("Error saving progress: " + error.message);
      return;
    }

    setQuickPageStudent(null);
    await loadSupabaseData();
  };

  const toggleTilawahPage = (pageNum: number) => {
    if (!quickPageStudent) return;
    const current = quickPageStudent.tilawahPages || [];
    const updated = current.includes(pageNum)
      ? current.filter((p) => p !== pageNum)
      : [...current, pageNum].sort((a, b) => a - b);
    setQuickPageStudent({ ...quickPageStudent, tilawahPages: updated });
  };

  const toggleTilawahJuzPages = (juzNum: number) => {
    if (!quickPageStudent) return;
    const { start, end } = getJuzPageRange(juzNum);
    const pagesInJuz: number[] = [];
    for (let p = start; p <= end; p++) pagesInJuz.push(p);

    const current = quickPageStudent.tilawahPages || [];
    const allAlreadyRead = pagesInJuz.every((p) => current.includes(p));

    let updatedPages: number[];
    if (allAlreadyRead) {
      updatedPages = current.filter((p) => !pagesInJuz.includes(p));
    } else {
      updatedPages = Array.from(new Set([...current, ...pagesInJuz])).sort((a, b) => a - b);
    }

    const currentJuzs = quickPageStudent.completedTilawahJuzs || [];
    const updatedJuzs = allAlreadyRead 
      ? currentJuzs.filter((j) => j !== juzNum)
      : Array.from(new Set([...currentJuzs, juzNum])).sort((a, b) => a - b);

    setQuickPageStudent({
      ...quickPageStudent,
      tilawahPages: updatedPages,
      completedTilawahJuzs: updatedJuzs
    });
  };

  const toggleHifzPage = (pageNum: number) => {
    if (!quickPageStudent) return;
    const current = quickPageStudent.memorizedPages || [];
    const updated = current.includes(pageNum)
      ? current.filter((p) => p !== pageNum)
      : [...current, pageNum].sort((a, b) => a - b);
    setQuickPageStudent({ ...quickPageStudent, memorizedPages: updated });
  };

  const toggleHifzJuzPages = (juzNum: number) => {
    if (!quickPageStudent) return;
    const { start, end } = getJuzPageRange(juzNum);
    const pagesInJuz: number[] = [];
    for (let p = start; p <= end; p++) pagesInJuz.push(p);

    const current = quickPageStudent.memorizedPages || [];
    const allAlreadyMemorized = pagesInJuz.every((p) => current.includes(p));

    let updatedPages: number[];
    if (allAlreadyMemorized) {
      updatedPages = current.filter((p) => !pagesInJuz.includes(p));
    } else {
      updatedPages = Array.from(new Set([...current, ...pagesInJuz])).sort((a, b) => a - b);
    }

    const currentJuzs = quickPageStudent.completedHifzJuzs || [];
    const updatedJuzs = allAlreadyMemorized 
      ? currentJuzs.filter((j) => j !== juzNum)
      : Array.from(new Set([...currentJuzs, juzNum])).sort((a, b) => a - b);

    const currentStrengths = { ...(quickPageStudent.juzMemoryStrength || {}) };
    if (!allAlreadyMemorized && !currentStrengths[juzNum]) {
      currentStrengths[juzNum] = 80;
    }

    setQuickPageStudent({
      ...quickPageStudent,
      memorizedPages: updatedPages,
      completedHifzJuzs: updatedJuzs,
      juzMemoryStrength: currentStrengths
    });
  };

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingStudent) return;

    const { error } = await supabase.from("student_evaluations").insert({
      student_id: evaluatingStudent.id,
      eval_date: new Date().toISOString().split("T")[0],
      tracks: evalTracks,
      fluency_score: evalFluency,
      fluency_focus: evalFocus,
      alphabet_ratings: evalAlphabets,
      rule_ratings: evalRules,
      tutor_notes: evalNotes
    });

    if (error) {
      alert("Error saving evaluation: " + error.message);
      return;
    }

    setEvaluatingStudent(null);
    await loadSupabaseData();
  };

  const exportAsImage = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: "#ffffff" });
      const img = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = img;
      a.download = `${selectedStudent?.name}_${reportTab.toUpperCase()}_Report.png`;
      a.click();
    } catch (err) {
      alert("Failed to export image: " + String(err));
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const PDFConstructor = (jsPDF as any).default || jsPDF;
      const pdf = new PDFConstructor("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 10, imgWidth, imgHeight);
      pdf.save(`${selectedStudent?.name}_${reportTab.toUpperCase()}_Report.pdf`);
    } catch (err) {
      alert("Failed to export PDF: " + String(err));
    } finally {
      setIsExporting(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- BOUNCER: IF NOT PIN-AUTHENTICATED, SHOW LOCK SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <form onSubmit={handlePinSubmit} className="bg-white border border-neutral-200 p-8 rounded-3xl shadow-xl max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 bg-neutral-950 text-white rounded-2xl flex items-center justify-center mx-auto text-xl font-bold shadow-xs">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-950">Ustaz Admin Access</h2>
            <p className="text-xs text-neutral-400 mt-1">Enter your security PIN to access the management console.</p>
          </div>
          <input
            type="password"
            maxLength={8}
            placeholder="Enter PIN"
            value={adminPin}
            onChange={(e) => setAdminPin(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-center text-lg font-bold tracking-widest focus:bg-white focus:outline-none focus:border-neutral-950"
          />
          {pinError && <p className="text-xs text-rose-600 font-medium">Incorrect PIN. Try again.</p>}
          <button type="submit" className="w-full bg-black text-white text-xs font-bold py-3 rounded-full hover:bg-neutral-800 transition cursor-pointer shadow-xs">
            Unlock Dashboard
          </button>
        </form>
      </div>
    );
  }

  // --- UNLOCKED ADMIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-neutral-900 font-sans antialiased">
      {/* Header */}
      <header className="border-b border-neutral-200/80 bg-white px-6 py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = "/portal";
                }
              }}
              className="p-2 text-neutral-500 hover:text-black bg-neutral-100 hover:bg-neutral-200 rounded-full transition-colors cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-neutral-900" />
                <h1 className="text-base font-bold tracking-tight text-neutral-950">Tutor Admin Console</h1>
              </div>
              <p className="text-[11px] font-medium text-neutral-400">Salman Zulkifle Mentorship System</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/portal"
              className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-semibold px-3.5 py-2 rounded-full transition-all flex items-center gap-1.5 border border-neutral-200"
            >
              <span>Student Portal View</span>
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </Link>
            <button 
              onClick={() => setIsAddOpen(true)}
              className="bg-black hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Student</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-4">
        
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-neutral-200/80 rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Enrolled Students Roster</h2>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-950 text-white rounded-full text-xs font-bold shadow-xs">
              <Users className="w-3.5 h-3.5 text-neutral-300" />
              <span>{students.length} Students Total</span>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by name or location..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-full pl-9 pr-4 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-950 focus:bg-white shadow-2xs"
            />
          </div>
        </div>

        {/* Student Roster Table */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFB] text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-200/80">
                <tr>
                  <th className="p-4 pl-6 w-12 text-neutral-400 font-semibold">#</th>
                  <th className="p-4">Student Profile</th>
                  <th className="p-4">Tuition</th>
                  <th className="p-4">Package Sessions</th>
                  <th className="p-4">Tilawah (Recitation)</th>
                  <th className="p-4">Hifz (Memorization)</th>
                  <th className="p-4">Fluency</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-neutral-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-neutral-800" />
                      Syncing with database...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-neutral-400">
                      No students found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => {
                    const tilawahReadCount = student.tilawahPages?.length || 0;
                    const tilawahPercent = ((tilawahReadCount / 604) * 100).toFixed(0);

                    const hifzMemorizedCount = student.memorizedPages?.length || 0;
                    const hifzPercent = ((hifzMemorizedCount / 604) * 100).toFixed(0);

                    const evalData = student.latestEvaluation;
                    const fluencyStyle = evalData ? getFluencyHueStyle(evalData.fluencyScore) : null;

                    return (
                      <tr key={student.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="p-4 pl-6 font-bold text-neutral-400 text-xs">
                          {index + 1}.
                        </td>

                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <button 
                              type="button"
                              onClick={() => {
                                setSelectedStudent(student);
                                setReportTab("tajweed");
                              }}
                              className="flex items-center gap-3 text-left group cursor-pointer"
                              title="Click to view report & edit profile"
                            >
                              {student.photoUrl ? (
                                <img src={student.photoUrl} alt={student.name} className="w-10 h-10 rounded-2xl object-cover border border-neutral-200 shrink-0" />
                              ) : (
                                <div className="w-10 h-10 rounded-2xl bg-neutral-100 text-neutral-900 font-bold text-xs flex items-center justify-center shrink-0 border border-neutral-200">
                                  {student.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-neutral-950 group-hover:underline tracking-tight">{student.name}</div>
                                <div className="text-[11px] text-neutral-400 font-normal">Age: {student.age} • {student.location}</div>
                              </div>
                            </button>

                            {/* English Portal Link & WhatsApp Buttons */}
                            <div className="flex items-center gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => {
                                  const url = `${window.location.origin}/portal?id=${student.id}`;
                                  navigator.clipboard.writeText(url);
                                  alert(`Portal link for ${student.name} copied to clipboard:\n${url}`);
                                }}
                                className="text-[10px] font-bold text-neutral-600 hover:text-black bg-neutral-100 hover:bg-neutral-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                              >
                                🔗 Copy Portal Link
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const url = `${window.location.origin}/portal?id=${student.id}`;
                                  const msg = encodeURIComponent(
                                    `Assalamualaikum ${student.name},\n\nHere is your official Pocket Tahfiz portal link to review your memorization progress, class schedule, and tuition receipts:\n${url}`
                                  );
                                  window.open(`https://wa.me/?text=${msg}`, "_blank");
                                }}
                                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md transition cursor-pointer"
                              >
                                📱 Share to WhatsApp
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            student.paymentStatus === "Paid" 
                              ? "bg-neutral-950 text-white border-neutral-950" 
                              : "bg-white text-neutral-500 border-neutral-300"
                          }`}>
                            {student.paymentStatus}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="inline-flex flex-col gap-1.5">
                            <span className="font-semibold text-neutral-900 text-[11px]">
                              {student.completedSessions} / {student.totalSessions} Sessions
                            </span>
                            <div className="w-24 bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-neutral-950 h-full rounded-full" 
                                style={{ width: `${Math.min(100, (student.completedSessions / Math.max(1, student.totalSessions)) * 100)}%` }} 
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => openSessionsModal(student)}
                              className="mt-0.5 text-[10px] font-bold text-neutral-950 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-0.5 rounded-md border border-neutral-300 w-fit inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              <Clock className="w-3 h-3 text-neutral-800" />
                              <span>✍️ Sign as Ustaz</span>
                            </button>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="inline-flex flex-col gap-1 bg-blue-50/50 border border-blue-200/80 px-3 py-1.5 rounded-xl text-blue-950">
                            <div className="flex justify-between items-center gap-2">
                              <span className="font-bold text-xs">Pg {student.tilawahPage}</span>
                              <span className="text-[10px] text-blue-700 font-semibold">{tilawahReadCount}/604 ({tilawahPercent}%)</span>
                            </div>
                            <div className="w-24 bg-blue-100 h-1 rounded-full overflow-hidden">
                              <div className="bg-blue-600 h-full rounded-full" style={{ width: `${tilawahPercent}%` }} />
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="inline-flex flex-col gap-1 bg-purple-50/50 border border-purple-200/80 px-3 py-1.5 rounded-xl text-purple-950">
                            <div className="flex justify-between items-center gap-2">
                              <span className="font-bold text-xs">Pg {student.hifzPage}</span>
                              <span className="text-[10px] text-purple-700 font-semibold">{hifzMemorizedCount}/604 ({hifzPercent}%)</span>
                            </div>
                            <div className="w-24 bg-purple-100 h-1 rounded-full overflow-hidden">
                              <div className="bg-purple-600 h-full rounded-full" style={{ width: `${hifzPercent}%` }} />
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          {evalData && fluencyStyle ? (
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
                            type="button"
                            onClick={() => {
                              setQuickPageStudent(student);
                              setProgressModalTab("tilawah");
                            }}
                            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 px-3 py-1 rounded-full font-semibold text-[11px] inline-flex items-center gap-1 transition cursor-pointer"
                            title="Open Tilawah & Hifz 604 Grids"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>604 Grid</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              setEvaluatingStudent(student);
                              setEvalTracks(student.latestEvaluation?.tracks || student.tracks);
                              setEvalFluency(student.latestEvaluation?.fluencyScore ?? 80);
                              setEvalFocus(student.latestEvaluation?.fluencyFocus || ["Breath Management"]);
                              setEvalAlphabets(student.latestEvaluation?.alphabetRatings || {});
                              setEvalRules(student.latestEvaluation?.ruleRatings || {});
                              setEvalNotes(student.latestEvaluation?.tutorNotes || "");
                            }}
                            className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 px-3 py-1 rounded-full font-semibold text-[11px] transition cursor-pointer"
                          >
                            Rubric
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* --- ADD NEW STUDENT MODAL --- */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl shadow-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsAddOpen(false)} className="absolute top-5 right-5 text-neutral-400 hover:text-black cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-neutral-950 mb-0.5">Add New Student</h3>
            <p className="text-xs text-neutral-400 mb-5">Set up student details, enrolled tracks, and baseline targets.</p>

            <form onSubmit={handleAddStudent} className="space-y-3.5 text-xs">
              <div className="flex items-center gap-3 bg-neutral-50 p-3 rounded-2xl border border-neutral-200">
                {newPhoto ? (
                  <img src={newPhoto} alt="Avatar" className="w-12 h-12 rounded-2xl object-cover border border-neutral-200" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-400">
                    <Camera className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <label className="block font-semibold text-neutral-800 mb-0.5">Student Photo</label>
                  <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, (base64) => setNewPhoto(base64))} className="text-[10px] text-neutral-500" />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 font-medium mb-1">Student Name</label>
                <input type="text" required placeholder="e.g. Muadz Danial" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-950 focus:bg-white focus:outline-none" />
              </div>

              <div>
                <label className="block text-neutral-600 font-medium mb-1.5">Enrolled Tracks</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newTracks.includes("Recitation (Tilawah / Nazirah)")}
                      onChange={() => {
                        const tr = "Recitation (Tilawah / Nazirah)";
                        if (newTracks.includes(tr)) {
                          if (newTracks.length > 1) setNewTracks(newTracks.filter(t => t !== tr));
                        } else {
                          setNewTracks([...newTracks, tr]);
                        }
                      }}
                      className="rounded text-black accent-black cursor-pointer" 
                    />
                    <span className="font-medium text-[11px]">Tilawah</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newTracks.includes("Memorization (Hifz)")}
                      onChange={() => {
                        const tr = "Memorization (Hifz)";
                        if (newTracks.includes(tr)) {
                          if (newTracks.length > 1) setNewTracks(newTracks.filter(t => t !== tr));
                        } else {
                          setNewTracks([...newTracks, tr]);
                        }
                      }}
                      className="rounded text-black accent-black cursor-pointer" 
                    />
                    <span className="font-medium text-[11px]">Hifz</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Age</label>
                  <input type="text" placeholder="e.g. 14" value={newAge} onChange={(e) => setNewAge(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5" />
                </div>
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Location</label>
                  <input type="text" placeholder="e.g. Kuala Lumpur" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5" />
                </div>
              </div>

              {newTracks.includes("Recitation (Tilawah / Nazirah)") && (
                <div className="bg-blue-50/40 p-3.5 rounded-2xl border border-blue-200 space-y-2">
                  <p className="font-bold text-blue-900 text-[11px]">Tilawah Recitation Progress</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-blue-600 font-medium">Juz (1–30)</span>
                      <input type="number" min="1" max="30" value={newTilawahJuz} onChange={(e) => setNewTilawahJuz(Number(e.target.value))} className="bg-white border border-blue-200 rounded-lg p-2 w-full font-bold" />
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-600 font-medium">Page (1–604)</span>
                      <input type="number" min="1" max="604" value={newTilawahPage} onChange={(e) => setNewTilawahPage(Number(e.target.value))} className="bg-white border border-blue-200 rounded-lg p-2 w-full font-bold" />
                    </div>
                  </div>
                </div>
              )}

              {newTracks.includes("Memorization (Hifz)") && (
                <div className="bg-purple-50/40 p-3.5 rounded-2xl border border-purple-200 space-y-2">
                  <p className="font-bold text-purple-900 text-[11px]">Hifz Memorization Progress</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-purple-600 font-medium">Juz (1–30)</span>
                      <input type="number" min="1" max="30" value={newHifzJuz} onChange={(e) => setNewHifzJuz(Number(e.target.value))} className="bg-white border border-purple-200 rounded-lg p-2 w-full font-bold" />
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-600 font-medium">Page (1–604)</span>
                      <input type="number" min="1" max="604" value={newHifzPage} onChange={(e) => setNewHifzPage(Number(e.target.value))} className="bg-white border border-purple-200 rounded-lg p-2 w-full font-bold" />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Weekly Pages Goal</label>
                  <input type="number" value={newWeeklyGoal} onChange={(e) => setNewWeeklyGoal(Number(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-bold" />
                </div>
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Payment Status</label>
                  <select value={newPaymentStatus} onChange={(e) => setNewPaymentStatus(e.target.value as PaymentStatus)} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-bold">
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button type="button" onClick={() => setIsAddOpen(false)} className="w-1/2 bg-neutral-100 text-neutral-700 py-2.5 rounded-full font-medium cursor-pointer">Cancel</button>
                <button type="submit" className="w-1/2 bg-black text-white py-2.5 rounded-full font-semibold shadow-xs cursor-pointer">Save Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT STUDENT MODAL --- */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl shadow-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setEditingStudent(null)} className="absolute top-5 right-5 text-neutral-400 hover:text-black cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-neutral-950 mb-0.5">Edit Student Profile</h3>
            <p className="text-xs text-neutral-400 mb-5">Update personal data, attendance, and fee status.</p>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="flex items-center gap-3 bg-neutral-50 p-3 rounded-2xl border border-neutral-200">
                {editingStudent.photoUrl ? (
                  <img src={editingStudent.photoUrl} alt="Avatar" className="w-12 h-12 rounded-2xl object-cover border border-neutral-200" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-400">
                    <Camera className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <label className="block font-semibold text-neutral-800 mb-0.5">Change Photo</label>
                  <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, (base64) => setEditingStudent({ ...editingStudent, photoUrl: base64 }))} className="text-[10px] text-neutral-500" />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 font-medium mb-1">Student Name</label>
                <input type="text" required value={editingStudent.name} onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-neutral-900 font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Age</label>
                  <input type="text" value={editingStudent.age} onChange={(e) => setEditingStudent({ ...editingStudent, age: e.target.value })} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5" />
                </div>
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Location</label>
                  <input type="text" value={editingStudent.location} onChange={(e) => setEditingStudent({ ...editingStudent, location: e.target.value })} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Payment Status</label>
                  <select value={editingStudent.paymentStatus} onChange={(e) => setEditingStudent({ ...editingStudent, paymentStatus: e.target.value as PaymentStatus })} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-bold">
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Weekly Goal (Pages)</label>
                  <input type="number" value={editingStudent.weeklyGoal} onChange={(e) => setEditingStudent({ ...editingStudent, weeklyGoal: Number(e.target.value) })} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Completed Sessions</label>
                  <input type="number" value={editingStudent.completedSessions} onChange={(e) => setEditingStudent({ ...editingStudent, completedSessions: Number(e.target.value) })} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5" />
                </div>
                <div>
                  <label className="block text-neutral-600 font-medium mb-1">Total Sessions</label>
                  <input type="number" value={editingStudent.totalSessions} onChange={(e) => setEditingStudent({ ...editingStudent, totalSessions: Number(e.target.value) })} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5" />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button 
                  type="button" 
                  onClick={() => handleDeleteStudent(editingStudent.id, editingStudent.name)} 
                  className="w-1/3 bg-rose-50 hover:bg-rose-100 text-rose-700 py-2.5 rounded-full font-semibold border border-rose-200 transition cursor-pointer"
                >
                  Delete
                </button>
                <button type="button" onClick={() => setEditingStudent(null)} className="w-1/3 bg-neutral-100 text-neutral-700 py-2.5 rounded-full font-medium cursor-pointer">Cancel</button>
                <button type="submit" className="w-1/3 bg-black text-white py-2.5 rounded-full font-semibold shadow-xs cursor-pointer">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TRADITIONAL 604 GRID MODAL --- */}
      {quickPageStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl shadow-2xl max-w-3xl w-full p-6 relative max-h-[92vh] overflow-y-auto">
            <button onClick={() => setQuickPageStudent(null)} className="absolute top-5 right-5 text-neutral-400 hover:text-black cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-neutral-950 mb-0.5">Syllabus Progress Tracker</h3>
            <p className="text-xs text-neutral-400 mb-4">604-page ledger and quick-tick tools for {quickPageStudent.name}.</p>

            <div className="flex gap-2 p-1 bg-neutral-100 rounded-full w-fit mb-5">
              <button 
                type="button"
                onClick={() => setProgressModalTab("tilawah")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${progressModalTab === "tilawah" ? "bg-black text-white shadow-xs" : "text-neutral-600 hover:text-black"}`}
              >
                Tilawah (604 Reading Grid)
              </button>
              <button 
                type="button"
                onClick={() => setProgressModalTab("hifz")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${progressModalTab === "hifz" ? "bg-black text-white shadow-xs" : "text-neutral-600 hover:text-black"}`}
              >
                Hifz (604 Memorization Grid)
              </button>
            </div>

            <form onSubmit={handleSaveQuickPages} className="space-y-6 text-xs">
              {progressModalTab === "tilawah" ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3 bg-blue-50/40 p-3.5 rounded-2xl border border-blue-200">
                    <div>
                      <label className="text-[10px] text-blue-700 font-semibold">Current Tilawah Juz (1–30)</label>
                      <input type="number" min="1" max="30" value={quickPageStudent.tilawahJuz} onChange={(e) => setQuickPageStudent({ ...quickPageStudent, tilawahJuz: Number(e.target.value) })} className="w-full bg-white border border-blue-200 p-2 rounded-xl font-bold mt-1" />
                    </div>
                    <div>
                      <label className="text-[10px] text-blue-700 font-semibold">Current Reading Page (1–604)</label>
                      <input type="number" min="1" max="604" value={quickPageStudent.tilawahPage} onChange={(e) => setQuickPageStudent({ ...quickPageStudent, tilawahPage: Number(e.target.value) })} className="w-full bg-white border border-blue-200 p-2 rounded-xl font-bold mt-1" />
                    </div>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-200/80 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-blue-950 text-xs">30 Quick-Tick Juz Buttons (Click to toggle ~20 pages read)</span>
                      <span className="text-[10px] text-blue-800 bg-blue-100 font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                        {formatJuzRanges(quickPageStudent.completedTilawahJuzs)}
                      </span>
                    </div>
                    <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNum) => {
                        const { start, end } = getJuzPageRange(juzNum);
                        const isRead = (quickPageStudent.completedTilawahJuzs || []).includes(juzNum);

                        return (
                          <button
                            key={juzNum}
                            type="button"
                            onClick={() => toggleTilawahJuzPages(juzNum)}
                            className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                              isRead ? "bg-blue-600 text-white border-blue-600 shadow-xs" : "bg-white text-neutral-700 border-neutral-200 hover:border-blue-300"
                            }`}
                            title={`Juz ${juzNum} (Pages ${start}–${end})`}
                          >
                            <span className="text-[10px] font-bold block">Juz {juzNum}</span>
                            <span className="text-[8px] opacity-75 block">{start}–{end}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-neutral-900 text-xs">Traditional 604 Individual Reading Tick Boxes</span>
                      <span className="text-[10px] font-bold text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                        {quickPageStudent.tilawahPages?.length || 0} / 604 Pages Read
                      </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto p-2 bg-white rounded-xl border border-neutral-200">
                      <div className="grid grid-cols-10 sm:grid-cols-16 md:grid-cols-20 gap-1">
                        {Array.from({ length: 604 }, (_, i) => i + 1).map((pageNum) => {
                          const isChecked = (quickPageStudent.tilawahPages || []).includes(pageNum);
                          return (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => toggleTilawahPage(pageNum)}
                              className={`h-6 text-[9px] font-bold rounded flex items-center justify-center transition-all border cursor-pointer ${
                                isChecked 
                                  ? "bg-blue-600 text-white border-blue-600" 
                                  : "bg-white text-neutral-400 border-neutral-200 hover:border-blue-300"
                              }`}
                              title={`Page ${pageNum}`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3 bg-purple-50/40 p-3.5 rounded-2xl border border-purple-200">
                    <div>
                      <label className="text-[10px] text-purple-700 font-semibold">Current Hifz Juz (1–30)</label>
                      <input type="number" min="1" max="30" value={quickPageStudent.hifzJuz} onChange={(e) => setQuickPageStudent({ ...quickPageStudent, hifzJuz: Number(e.target.value) })} className="w-full bg-white border border-purple-200 p-2 rounded-xl font-bold mt-1" />
                    </div>
                    <div>
                      <label className="text-[10px] text-purple-700 font-semibold">Current Memorization Page (1–604)</label>
                      <input type="number" min="1" max="604" value={quickPageStudent.hifzPage} onChange={(e) => setQuickPageStudent({ ...quickPageStudent, hifzPage: Number(e.target.value) })} className="w-full bg-white border border-purple-200 p-2 rounded-xl font-bold mt-1" />
                    </div>
                  </div>

                  <div className="bg-purple-50/50 border border-purple-200/80 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-purple-950 text-xs">30 Quick-Tick Juz Buttons (Click to toggle ~20 pages memorized)</span>
                      <span className="text-[10px] text-purple-700 bg-purple-100 font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
                        {formatJuzRanges(quickPageStudent.completedHifzJuzs)}
                      </span>
                    </div>
                    <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNum) => {
                        const { start, end } = getJuzPageRange(juzNum);
                        const isMemorized = (quickPageStudent.completedHifzJuzs || []).includes(juzNum);

                        return (
                          <button
                            key={juzNum}
                            type="button"
                            onClick={() => toggleHifzJuzPages(juzNum)}
                            className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                              isMemorized ? "bg-purple-600 text-white border-purple-600 shadow-xs" : "bg-white text-neutral-700 border-neutral-200 hover:border-purple-300"
                            }`}
                            title={`Juz ${juzNum} (Pages ${start}–${end})`}
                          >
                            <span className="text-[10px] font-bold block">Juz {juzNum}</span>
                            <span className="text-[8px] opacity-75 block">{start}–{end}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-neutral-900 text-xs">Traditional 604 Individual Memorization Tick Boxes</span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {quickPageStudent.memorizedPages?.length || 0} / 604 Pages Memorized
                      </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto p-2 bg-white rounded-xl border border-neutral-200">
                      <div className="grid grid-cols-10 sm:grid-cols-16 md:grid-cols-20 gap-1">
                        {Array.from({ length: 604 }, (_, i) => i + 1).map((pageNum) => {
                          const isChecked = (quickPageStudent.memorizedPages || []).includes(pageNum);
                          return (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => toggleHifzPage(pageNum)}
                              className={`h-6 text-[9px] font-bold rounded flex items-center justify-center transition-all border cursor-pointer ${
                                isChecked 
                                  ? "bg-neutral-950 text-white border-neutral-950" 
                                  : "bg-white text-neutral-400 border-neutral-200 hover:border-black"
                              }`}
                              title={`Page ${pageNum}`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-2xl space-y-3">
                    <span className="font-bold text-neutral-900 text-xs block">Juz Memory Retention Sliders (Red $\rightarrow$ Yellow $\rightarrow$ Green)</span>
                    <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                      {(quickPageStudent.completedHifzJuzs && quickPageStudent.completedHifzJuzs.length > 0 
                        ? quickPageStudent.completedHifzJuzs 
                        : [1]
                      ).map((juzNum) => {
                        const score = quickPageStudent.juzMemoryStrength?.[juzNum] ?? 80;
                        const style = getMemoryHueStyle(score);

                        return (
                          <div key={juzNum} className="p-3 bg-white rounded-xl border border-neutral-200 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-neutral-950 text-xs">Juz {juzNum} Memory Score</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${style.bg} ${style.border} ${style.text}`}>
                                {score}% • {style.label}
                              </span>
                            </div>
                            <input 
                              type="range" min="0" max="100" 
                              value={score}
                              onChange={(e) => {
                                const updated = { ...(quickPageStudent.juzMemoryStrength || {}), [juzNum]: Number(e.target.value) };
                                setQuickPageStudent({ ...quickPageStudent, juzMemoryStrength: updated });
                              }}
                              className="w-full accent-black cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setQuickPageStudent(null)} className="w-1/2 bg-neutral-100 text-neutral-700 py-2.5 rounded-full font-medium cursor-pointer">Cancel</button>
                <button type="submit" className="w-1/2 bg-black text-white py-2.5 rounded-full font-bold shadow-xs cursor-pointer">Save Progress Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TWO-WAY ATTENDANCE DRAWER --- */}
      {sessionStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl shadow-2xl max-w-xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSessionStudent(null)} className="absolute top-5 right-5 text-neutral-400 hover:text-black cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-neutral-950">Package Attendance Ledger</h3>
            <p className="text-xs text-neutral-400 mb-5">
              Two-way sign off for {sessionStudent.name}. Both Ustaz and Student must confirm for status to lock as &quot;Done&quot;.
            </p>

            <div className="space-y-3 text-xs">
              {studentSessions.map((sess) => {
                const isFullyDone = sess.tutor_verified && sess.student_verified;
                return (
                  <div key={sess.id} className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900">Session {sess.session_number}</span>
                        {isFullyDone ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Verified Done
                          </span>
                        ) : sess.status === "cancelled" ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            Cancelled
                          </span>
                        ) : sess.tutor_verified ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Awaiting Student Sign-Off
                          </span>
                        ) : sess.student_verified ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            Student Confirmed (Needs Ustaz)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 text-neutral-600">
                            Pending
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5 flex gap-3">
                        <span>Ustaz: {sess.tutor_verified ? "Signed ✓" : "Not signed"}</span>
                        <span>Student: {sess.student_verified ? "Confirmed ✓" : "Waiting confirmation"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTutorToggleSession(sess, "verify")}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                          sess.tutor_verified 
                            ? "bg-neutral-200 text-neutral-700 hover:bg-neutral-300" 
                            : "bg-black text-white hover:bg-neutral-800 shadow-xs"
                        }`}
                      >
                        {sess.tutor_verified ? (
                          <span>Revoke Sign</span>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Sign as Ustaz</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTutorToggleSession(sess, "cancel")}
                        className="px-2.5 py-1.5 rounded-full text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- TAJWEED EVALUATION DRAWER --- */}
      {evaluatingStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white border-l border-neutral-200 w-full max-w-2xl h-full overflow-y-auto p-8 shadow-2xl relative flex flex-col">
            <button onClick={() => setEvaluatingStudent(null)} className="absolute top-6 right-6 text-neutral-400 hover:text-black cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-neutral-200 pb-5 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Mastery Assessment</span>
              <h3 className="text-2xl font-extrabold tracking-tight text-neutral-950 mt-1">{evaluatingStudent.name}</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Rate fluency meter and evaluate specific Tajweed rules and 28 letters.</p>
            </div>

            <form onSubmit={handleSaveEvaluation} className="space-y-6 text-xs flex-1">
              <div>
                <label className="block font-bold text-neutral-900 mb-2">1. Enrolled Track Focus</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(["Recitation (Tilawah / Nazirah)", "Memorization (Hifz)"] as Track[]).map((tr) => (
                    <button
                      key={tr}
                      type="button"
                      onClick={() => {
                        if (evalTracks.includes(tr)) {
                          if (evalTracks.length > 1) setEvalTracks(evalTracks.filter((t) => t !== tr));
                        } else {
                          setEvalTracks([...evalTracks, tr]);
                        }
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        evalTracks.includes(tr) 
                          ? "bg-black border-black text-white font-semibold" 
                          : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:border-neutral-400"
                      }`}
                    >
                      {tr}
                    </button>
                  ))}
                </div>
              </div>

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

                <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-2xl space-y-3">
                  <input 
                    type="range" min="1" max="100" 
                    value={evalFluency}
                    onChange={(e) => setEvalFluency(Number(e.target.value))}
                    className="w-full accent-black cursor-pointer h-2 bg-neutral-200 rounded-lg"
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
                      onClick={() => {
                        if (evalFocus.includes(focus)) setEvalFocus(evalFocus.filter((f) => f !== focus));
                        else setEvalFocus([...evalFocus, focus]);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                        evalFocus.includes(focus) ? "bg-black text-white border-black" : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                      }`}
                    >
                      {focus}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-900 mb-2">3. Makhraj Pronunciation Grid (28 Letters)</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 bg-neutral-50 border border-neutral-200 p-3.5 rounded-2xl">
                  {ARABIC_ALPHABETS.map((letter) => {
                    const current = evalAlphabets[letter] || "good";
                    return (
                      <div key={letter} className="bg-white border border-neutral-200 rounded-xl p-2 text-center shadow-xs">
                        <span className="text-base font-bold block mb-1 font-serif text-neutral-950">{letter}</span>
                        <div className="flex justify-center gap-1">
                          {(["low", "medium", "good", "mastery"] as ProficiencyLevel[]).map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setEvalAlphabets({ ...evalAlphabets, [letter]: lvl })}
                              className={`w-2.5 h-2.5 rounded-full border cursor-pointer ${current === lvl ? PROFICIENCY_CONFIG[lvl].badge : "bg-neutral-100 border-neutral-300"}`}
                              title={`${letter}: ${PROFICIENCY_CONFIG[lvl].label}`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block font-bold text-neutral-900">4. Tajweed Rules Breakdown</label>
                {TAJWEED_CATEGORIES.map((cat) => (
                  <div key={cat.group} className="bg-neutral-50 border border-neutral-200 p-4 rounded-2xl">
                    <h4 className="font-bold text-neutral-400 text-[10px] mb-2.5 uppercase tracking-wider">{cat.group}</h4>
                    <div className="space-y-2">
                      {cat.items.map((item) => {
                        const currentLvl = evalRules[item.id] || "good";
                        return (
                          <div key={item.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-neutral-200">
                            <span className="font-semibold text-neutral-900 text-[11px]">{item.label}</span>
                            <div className="flex gap-1">
                              {(["low", "medium", "good", "mastery"] as ProficiencyLevel[]).map((lvl) => (
                                <button
                                  key={lvl}
                                  type="button"
                                  onClick={() => setEvalRules({ ...evalRules, [item.id]: lvl })}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                    currentLvl === lvl ? PROFICIENCY_CONFIG[lvl].pillActive : "bg-neutral-50 text-neutral-400 border-neutral-200"
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

              <div>
                <label className="block font-bold text-neutral-900 mb-1">5. Tutor Custom Notes</label>
                <textarea 
                  rows={3}
                  value={evalNotes}
                  onChange={(e) => setEvalNotes(e.target.value)}
                  placeholder="e.g. Focus on throat articulation during Friday sessions..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-3 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-neutral-200 flex gap-2">
                <button type="button" onClick={() => setEvaluatingStudent(null)} className="w-1/2 bg-neutral-100 text-neutral-700 py-3 rounded-full font-medium cursor-pointer">Cancel</button>
                <button type="submit" className="w-1/2 bg-black text-white py-3 rounded-full font-bold shadow-xs cursor-pointer">Save Rubric</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- STUDENT REPORT MODAL --- */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-3xl shadow-2xl max-w-2xl w-full p-6 relative max-h-[92vh] overflow-y-auto">
            <button onClick={() => setSelectedStudent(null)} className="absolute top-5 right-5 text-neutral-400 hover:text-black cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            {/* Top Bar with Edit & Delete */}
            <div className="flex flex-wrap items-center justify-between pr-8 mb-4 gap-3">
              <div>
                <h3 className="text-base font-bold text-neutral-950">Student Performance Report</h3>
                <p className="text-xs text-neutral-400">High-resolution export generator across the 3 curriculum tracks.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => setEditingStudent(selectedStudent)}
                  className="bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 transition cursor-pointer"
                  title="Edit Student Info"
                >
                  <Pencil className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Edit</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => handleDeleteStudent(selectedStudent.id, selectedStudent.name)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-rose-200 transition cursor-pointer"
                  title="Delete Student Record"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete</span>
                </button>

                {/* 3 Program Tabs */}
                <div className="flex gap-1 p-1 bg-neutral-100 rounded-full ml-1">
                  <button 
                    onClick={() => setReportTab("tajweed")}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      reportTab === "tajweed" ? "bg-black text-white shadow-xs" : "text-neutral-600 hover:text-black"
                    }`}
                  >
                    Tajweed Core
                  </button>
                  <button 
                    onClick={() => setReportTab("hifz")}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      reportTab === "hifz" ? "bg-black text-white shadow-xs" : "text-neutral-600 hover:text-black"
                    }`}
                  >
                    Hifz Program
                  </button>
                  <button 
                    onClick={() => setReportTab("sanad")}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      reportTab === "sanad" ? "bg-black text-white shadow-xs" : "text-neutral-600 hover:text-black"
                    }`}
                  >
                    Tilawah Report
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-3xl p-6 mb-6" ref={reportRef} style={{ backgroundColor: "#ffffff" }}>
              <div className="flex justify-between items-start border-b border-neutral-200 pb-5 mb-5">
                <div className="flex items-center gap-3.5">
                  {selectedStudent.photoUrl ? (
                    <img src={selectedStudent.photoUrl} alt="Avatar" className="w-12 h-12 rounded-2xl object-cover border border-neutral-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-900 font-bold text-sm flex items-center justify-center border border-neutral-200">
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
                    selectedStudent.paymentStatus === "Paid" 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    Tuition: {selectedStudent.paymentStatus}
                  </span>
                  <p className="text-xs font-bold text-neutral-900 mt-2">{selectedStudent.completedSessions} / {selectedStudent.totalSessions} Sessions</p>
                </div>
              </div>

              {/* PROGRAM 1: TAJWEED CORE TAB */}
              {reportTab === "tajweed" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-4">
                    <div className="bg-blue-50/50 p-3.5 rounded-2xl border border-blue-200 flex flex-col justify-between">
                      <div>
                        <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Tilawah Recitation</span>
                        <span className="font-extrabold text-blue-900 block text-base mt-0.5">Pg {selectedStudent.tilawahPage}</span>
                      </div>
                      <span className="text-[10px] text-blue-700 font-medium block mt-1">
                        {formatJuzRanges(selectedStudent.completedTilawahJuzs)} ({selectedStudent.tilawahPages?.length || 0}/604 Pgs)
                      </span>
                    </div>

                    <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-200 flex flex-col justify-between">
                      <div>
                        <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Hifz Memorization</span>
                        <span className="font-extrabold text-purple-900 block text-base mt-0.5">Pg {selectedStudent.hifzPage}</span>
                      </div>
                      <span className="text-[10px] text-purple-700 font-medium block mt-1">
                        {formatJuzRanges(selectedStudent.completedHifzJuzs)}
                      </span>
                    </div>

                    {/* Clean Monthly Target vs KPI */}
                    {(() => {
                      const monthlyTargetPgs = (selectedStudent.weeklyGoal || 10) * 4;
                      const targetPage = selectedStudent.tilawahPage + monthlyTargetPgs;
                      const achievedPgs = selectedStudent.tilawahPages?.length || Math.min(monthlyTargetPgs, selectedStudent.tilawahPage);
                      const kpiPercent = Math.min(100, Math.round((achievedPgs / Math.max(1, monthlyTargetPgs)) * 100));

                      return (
                        <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200 flex flex-col justify-between space-y-1.5">
                          <span className="text-emerald-800 font-bold text-[10px] uppercase tracking-wider block">
                            Monthly Target vs KPI
                          </span>

                          <div className="flex items-baseline justify-between pt-0.5">
                            <div>
                              <span className="text-[9px] text-neutral-400 block font-medium uppercase">Target Goal</span>
                              <span className="font-black text-neutral-950 text-sm">Pg {targetPage}</span>
                              <span className="text-[9px] text-neutral-500 block">({monthlyTargetPgs} pgs/mo)</span>
                            </div>
                            <span className="text-neutral-300 font-light text-base px-1">/</span>
                            <div className="text-right">
                              <span className="text-[9px] text-neutral-400 block font-medium uppercase">Achieved</span>
                              <span className="font-black text-emerald-700 text-sm">{achievedPgs} Pages</span>
                              <span className="text-[9px] text-emerald-600 font-bold block">{kpiPercent}% of KPI</span>
                            </div>
                          </div>

                          <div className="w-full bg-emerald-100/90 h-1.5 rounded-full overflow-hidden mt-1">
                            <div 
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                              style={{ width: `${kpiPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="bg-[#F8F9FB] border border-neutral-200 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Makhraj Pronunciation Grid</span>
                      {selectedStudent.latestEvaluation && (
                        <span className="text-[10px] font-bold text-neutral-600">
                          Fluency: {selectedStudent.latestEvaluation.fluencyScore}%
                        </span>
                      )}
                    </div>
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

                  <div className="bg-[#F8F9FB] border border-neutral-200 rounded-2xl p-4 text-xs space-y-2">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block border-b border-neutral-200 pb-1.5">Tajweed Rules Breakdown</span>
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
              ) : reportTab === "hifz" ? (
                /* PROGRAM 2: HIFZ PROGRAM TAB */
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-xs mb-4">
                    <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200">
                      <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Pages Memorized</span>
                      <span className="font-extrabold text-neutral-950 block text-base mt-0.5">
                        {selectedStudent.memorizedPages?.length || 0} / 604
                      </span>
                      <span className="text-[10px] text-neutral-600 font-medium block mt-0.5">
                        {(((selectedStudent.memorizedPages?.length || 0) / 604) * 100).toFixed(1)}% Completed
                      </span>
                    </div>

                    <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200">
                      <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Active Hifz Page</span>
                      <span className="font-extrabold text-neutral-950 block text-base mt-0.5">Pg {selectedStudent.hifzPage}</span>
                      <span className="text-[10px] text-neutral-600 font-medium block mt-0.5">Juz {selectedStudent.hifzJuz}</span>
                    </div>

                    <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200">
                      <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Completed Juz</span>
                      <span className="font-extrabold text-neutral-950 block text-base mt-0.5">
                        {selectedStudent.completedHifzJuzs?.length || 0} Juzes
                      </span>
                      <span className="text-[10px] text-neutral-600 font-medium block mt-0.5">
                        {formatJuzRanges(selectedStudent.completedHifzJuzs)}
                      </span>
                    </div>
                  </div>

                  {/* SLICK, COMPACT 30 JUZ CARDS */}
                  <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-neutral-200/80 pb-2.5">
                      <div>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Hifz Retention Ledger</span>
                        <span className="text-xs font-bold text-neutral-950">30 Juz Progression Grid</span>
                      </div>
                      <span className="text-[10px] font-bold text-neutral-700 bg-white px-2.5 py-1 rounded-full border border-neutral-200 shadow-2xs">
                        {selectedStudent.memorizedPages?.length || 0} / 604 Pages
                      </span>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 pt-1">
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNum) => {
                        const { start, end } = getJuzPageRange(juzNum);
                        const totalInJuz = end - start + 1;
                        
                        const memorizedList = selectedStudent.memorizedPages || [];
                        let count = 0;
                        for (let p = start; p <= end; p++) {
                          if (memorizedList.includes(p)) count++;
                        }
                        
                        const isManualTicked = (selectedStudent.completedHifzJuzs || []).includes(juzNum);
                        const effectiveCount = (count === 0 && isManualTicked) ? totalInJuz : count;
                        const percent = totalInJuz > 0 ? Math.min(100, Math.round((effectiveCount / totalInJuz) * 100)) : 0;
                        const isCompleted = percent === 100;
                        const hasProgress = effectiveCount > 0;

                        return (
                          <div key={juzNum} className="flex flex-col items-center">
                            <span className={`text-[9px] font-extrabold mb-1 tracking-tight ${
                              isCompleted 
                                ? "text-emerald-700" 
                                : hasProgress 
                                ? "text-neutral-900" 
                                : "text-neutral-300"
                            }`}>
                              JUZ {juzNum}
                            </span>

                            <div 
                              className={`relative w-full h-8 rounded-md overflow-hidden border transition-all ${
                                isCompleted
                                  ? "bg-emerald-500 border-neutral-900 shadow-2xs"
                                  : hasProgress
                                  ? "bg-white border-neutral-900 shadow-2xs"
                                  : "bg-neutral-100/60 border-neutral-200/80 opacity-40 blur-[0.2px]"
                              }`}
                              title={`Juz ${juzNum}: ${effectiveCount}/${totalInJuz} pages (${percent}%)`}
                            >
                              {hasProgress && !isCompleted && (
                                <div 
                                  className="absolute top-0 bottom-0 left-0 bg-emerald-500 border-r border-neutral-900 transition-all duration-300"
                                  style={{ width: `${percent}%` }}
                                />
                              )}

                              {!isCompleted && hasProgress && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                  <span className="text-neutral-950 font-black text-[9px] tracking-tight">
                                    {percent}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Juz Retention Meters */}
                  <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-2.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Juz Memory Retention &amp; Itqan Status</span>
                    <div className="grid grid-cols-2 gap-2">
                      {(selectedStudent.completedHifzJuzs && selectedStudent.completedHifzJuzs.length > 0 
                        ? selectedStudent.completedHifzJuzs 
                        : [1]
                      ).map((juzNum) => {
                        const score = selectedStudent.juzMemoryStrength?.[juzNum] ?? 80;
                        const style = getMemoryHueStyle(score);

                        return (
                          <div key={juzNum} className="p-2.5 bg-white rounded-xl border border-neutral-200 space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-neutral-950 text-[11px]">Juz {juzNum}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${style.bg} ${style.text}`}>
                                {score}% • {style.label}
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                              <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${score}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* PROGRAM 3: TILAWAH REPORT TAB */
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50/60 to-indigo-50/60 border border-blue-200 p-4 rounded-2xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                        <Award className="w-4 h-4 text-blue-600" />
                        <span>Khatm al-Quran &amp; Recitation Program</span>
                      </div>
                      <p className="text-[11px] text-blue-800">
                        Tracks complete oral recitation of the 604 Madinah Mushaf pages for Tajweed validation.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shrink-0 shadow-2xs">
                      {selectedStudent.tilawahPages?.length || 0} / 604 Completed
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200">
                      <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Total Pages Recited</span>
                      <span className="font-extrabold text-neutral-950 block text-base mt-0.5">
                        {selectedStudent.tilawahPages?.length || 0} Pages
                      </span>
                      <span className="text-[10px] text-blue-700 font-medium block mt-0.5">
                        {(((selectedStudent.tilawahPages?.length || 0) / 604) * 100).toFixed(1)}% of Mushaf
                      </span>
                    </div>

                    <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200">
                      <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Current Tilawah Marker</span>
                      <span className="font-extrabold text-neutral-950 block text-base mt-0.5">Pg {selectedStudent.tilawahPage}</span>
                      <span className="text-[10px] text-neutral-600 font-medium block mt-0.5">Juz {selectedStudent.tilawahJuz}</span>
                    </div>

                    <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200">
                      <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Read Juzes</span>
                      <span className="font-extrabold text-neutral-950 block text-base mt-0.5">
                        {selectedStudent.completedTilawahJuzs?.length || 0} Juzes
                      </span>
                      <span className="text-[10px] text-neutral-600 font-medium block mt-0.5">
                        {formatJuzRanges(selectedStudent.completedTilawahJuzs)}
                      </span>
                    </div>
                  </div>

                  {/* 604 Mushaf Grid */}
                  <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-2.5">
                    <div className="flex justify-between items-center border-b border-neutral-200/80 pb-2">
                      <div>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">604 Traditional Mushaf Ledger</span>
                        <span className="text-xs font-bold text-neutral-950">Every page recited in session with Ustaz</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-semibold text-neutral-600">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" /> Recited
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-xs bg-neutral-200 inline-block" /> Pending
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-20 gap-0.5 p-2 bg-white rounded-xl border border-neutral-200">
                      {Array.from({ length: 604 }, (_, i) => i + 1).map((pageNum) => {
                        const isRead = (selectedStudent.tilawahPages || []).includes(pageNum);
                        return (
                          <div
                            key={pageNum}
                            title={`Page ${pageNum} ${isRead ? "(Recited)" : "(Pending)"}`}
                            className={`h-2.5 rounded-2xs transition-colors ${
                              isRead ? "bg-blue-600" : "bg-neutral-100"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Ustaz Feedback & Recommendations */}
              <div className="bg-[#F8F9FB] border border-neutral-200/90 rounded-2xl p-4 text-xs space-y-1.5 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      Ustaz's Feedback &amp; Recommendations
                    </span>
                  </div>
                  {selectedStudent.latestEvaluation?.eval_date && (
                    <span className="text-[10px] text-neutral-400 font-medium">
                      Date: {selectedStudent.latestEvaluation.eval_date}
                    </span>
                  )}
                </div>

                <div className="pt-1">
                  {selectedStudent.latestEvaluation?.tutorNotes ? (
                    <p className="text-neutral-800 text-xs leading-relaxed font-medium bg-white p-3 rounded-xl border border-neutral-200/70">
                      &ldquo;{selectedStudent.latestEvaluation.tutorNotes}&rdquo;
                    </p>
                  ) : (
                    <div className="bg-white p-3 rounded-xl border border-dashed border-neutral-200 text-neutral-400 italic text-[11px] flex items-center justify-between">
                      <span>No specific notes entered yet. Click &quot;Rubric&quot; on the roster to add notes.</span>
                      <button
                        type="button"
                        onClick={() => {
                          const st = selectedStudent;
                          setSelectedStudent(null);
                          setEvaluatingStudent(st);
                          setEvalTracks(st.latestEvaluation?.tracks || st.tracks);
                          setEvalFluency(st.latestEvaluation?.fluencyScore ?? 80);
                          setEvalFocus(st.latestEvaluation?.fluencyFocus || ["Breath Management"]);
                          setEvalAlphabets(st.latestEvaluation?.alphabetRatings || {});
                          setEvalRules(st.latestEvaluation?.ruleRatings || {});
                          setEvalNotes(st.latestEvaluation?.tutorNotes || "");
                        }}
                        className="text-neutral-900 font-bold underline not-italic ml-2 cursor-pointer"
                      >
                        Add Remarks
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2">
              <button disabled={isExporting} onClick={exportAsPDF} className="w-1/2 bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white text-xs py-3 rounded-full font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs">
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                <span>Download {reportTab === "sanad" ? "Tilawah Report" : `${reportTab.toUpperCase()} Report`} (PDF)</span>
              </button>
              <button disabled={isExporting} onClick={exportAsImage} className="w-1/2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs py-3 rounded-full font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer">
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileImage className="w-3.5 h-3.5 text-neutral-800" />}
                <span>Download {reportTab === "sanad" ? "Tilawah Report" : `${reportTab.toUpperCase()} Report`} (PNG)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}