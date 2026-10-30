"use client";

import { useState, useEffect, useRef, useMemo, Suspense, ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { 
  Lock, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Upload, 
  FileText, 
  FileImage, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  CalendarCheck, 
  AlertCircle, 
  ExternalLink, 
  ChevronRight, 
  Loader2, 
  X, 
  Award, 
  BarChart3, 
  RotateCcw 
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  photo_url?: string;
  age?: number | string;
  location?: string;
  tilawah_page: number;
  tilawah_juz?: number;
  hifz_page: number;
  hifz_juz?: number;
  tilawah_pages?: number[];
  read_pages?: any;
  memorized_pages?: number[];
  completed_tilawah_juzs?: number[];
  completed_hifz_juzs?: number[];
  juz_memory_strength?: Record<number, number>;
  pages_read?: number;
  target_page?: number;
  weekly_goal?: number;
  package_sessions: number;
  total_sessions?: number;
  completed_sessions: number;
  tuition_status: string;
  payment_status?: string;
  fluency_rating?: number | string;
  remarks?: string;
  remarks_date?: string;
  receipt_url?: string;
}

// --- PROFICIENCY STYLING (MATCHES ADMIN EXACTLY) ---
type ProficiencyLevel = "low" | "medium" | "good" | "mastery";

const PROFICIENCY_CONFIG: Record<
  ProficiencyLevel,
  { label: string; bg: string; border: string; text: string; badge: string }
> = {
  low: { label: "Low", bg: "bg-rose-50/80", border: "border-rose-200", text: "text-rose-700", badge: "bg-rose-500 text-white" },
  medium: { label: "Medium", bg: "bg-amber-50/80", border: "border-amber-200", text: "text-amber-800", badge: "bg-amber-500 text-white" },
  good: { label: "Good", bg: "bg-emerald-50/80", border: "border-emerald-200", text: "text-emerald-800", badge: "bg-emerald-600 text-white" },
  mastery: { label: "Mastery", bg: "bg-blue-50/80", border: "border-blue-200", text: "text-blue-800", badge: "bg-blue-600 text-white" }
};

const ARABIC_LETTERS = [
  "أ", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", 
  "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", 
  "ق", "ك", "ل", "م", "ن", "هـ", "و", "ي"
];

// --- TAJWEED RULES SPECIFICATION (MATCHES DATABASE EVALUATION IDS) ---
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

const JUZ_PAGE_RANGES = [
  { juz: 1, start: 1, end: 21 },
  { juz: 2, start: 22, end: 41 },
  { juz: 3, start: 42, end: 61 },
  { juz: 4, start: 62, end: 81 },
  { juz: 5, start: 82, end: 101 },
  { juz: 6, start: 102, end: 121 },
  { juz: 7, start: 122, end: 141 },
  { juz: 8, start: 142, end: 161 },
  { juz: 9, start: 162, end: 181 },
  { juz: 10, start: 182, end: 201 },
  { juz: 11, start: 202, end: 221 },
  { juz: 12, start: 222, end: 241 },
  { juz: 13, start: 242, end: 261 },
  { juz: 14, start: 262, end: 281 },
  { juz: 15, start: 282, end: 301 },
  { juz: 16, start: 302, end: 321 },
  { juz: 17, start: 322, end: 341 },
  { juz: 18, start: 342, end: 361 },
  { juz: 19, start: 362, end: 381 },
  { juz: 20, start: 382, end: 401 },
  { juz: 21, start: 402, end: 421 },
  { juz: 22, start: 422, end: 441 },
  { juz: 23, start: 442, end: 461 },
  { juz: 24, start: 462, end: 481 },
  { juz: 25, start: 482, end: 501 },
  { juz: 26, start: 502, end: 521 },
  { juz: 27, start: 522, end: 541 },
  { juz: 28, start: 542, end: 561 },
  { juz: 29, start: 562, end: 581 },
  { juz: 30, start: 582, end: 604 },
];

const getJuzPageRange = (juz: number) => {
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

function parsePagesData(raw: any): number[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(Number).filter((n) => !isNaN(n) && n > 0 && n <= 604);
  if (typeof raw === "object" && raw !== null) {
    return Object.entries(raw).filter(([_, v]) => Boolean(v)).map(([k]) => Number(k)).filter((n) => !isNaN(n) && n > 0 && n <= 604);
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsePagesData(parsed);
    } catch {
      return raw.split(",").map((s) => Number(s.trim())).filter((n) => !isNaN(n) && n > 0 && n <= 604);
    }
  }
  return [];
}

function StudentPortalContent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("id");

  const [student, setStudent] = useState<Student | null>(null);
  const [latestEval, setLatestEval] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [signingAttendance, setSigningAttendance] = useState(false);
  const [revokingAttendance, setRevokingAttendance] = useState(false);
  
  // 1. Defaults 604 grid to open on load
  const [showGridModal, setShowGridModal] = useState(true);

  // 2. 3-Program views: tajweed | hifz | sanad
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTab, setReportTab] = useState<"tajweed" | "hifz" | "sanad">("tajweed");
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    async function fetchStudentAndEvaluation() {
      try {
        // 1. Fetch Student Record
        const { data: stData, error: stError } = await supabase
          .from("students")
          .select("*")
          .eq("id", studentId)
          .single();

        if (stError) throw stError;
        setStudent(stData);

        // 2. Fetch Latest Evaluation Record (Rubric, Fluency & Feedback)
        const { data: evData, error: evError } = await supabase
          .from("student_evaluations")
          .select("*")
          .eq("student_id", studentId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (!evError && evData && evData.length > 0) {
          setLatestEval(evData[0]);
        }
      } catch (err) {
        console.error("Error fetching student profile:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStudentAndEvaluation();
  }, [studentId]);

  const tilawahPagesList = useMemo(() => {
    if (!student) return [];
    return parsePagesData(student.tilawah_pages || student.read_pages);
  }, [student]);

  const tilawahPagesSet = useMemo(() => new Set(tilawahPagesList), [tilawahPagesList]);

  const memorizedPagesList = useMemo(() => {
    if (!student) return [];
    return parsePagesData(student.memorized_pages);
  }, [student]);

  const totalPagesRecited = tilawahPagesList.length > 0 ? tilawahPagesList.length : (student?.pages_read || 0);
  const tilawahMarker = student?.tilawah_page || 1;
  const hifzMarker = student?.hifz_page || 1;
  const tilawahPercentage = ((totalPagesRecited / 604) * 100).toFixed(1);

  // Exact matching KPI formula with Admin Console
  const monthlyTargetPgs = (Number(student?.weekly_goal) || 10) * 4;
  const targetGoalPage = tilawahMarker + monthlyTargetPgs;
  const achievedPgs = totalPagesRecited || tilawahMarker;
  const kpiPercentage = Math.min(100, Math.round((achievedPgs / Math.max(1, monthlyTargetPgs)) * 100));
  const fluencyScore = latestEval?.fluency_score ?? (typeof student?.fluency_rating === "number" ? student.fluency_rating : 80);

  // Sanad / Tilawah file naming mapper
  const getReportLabel = (tab: string) => {
    if (tab === "sanad") return "SANAD_TILAWAH";
    return tab.toUpperCase();
  };

  const handleSignAttendance = async () => {
    if (!student) return;
    setSigningAttendance(true);
    try {
      const maxSessions = student.package_sessions || student.total_sessions || 12;
      const newSessionCount = Math.min((student.completed_sessions || 0) + 1, maxSessions);
      const { error } = await supabase
        .from("students")
        .update({ completed_sessions: newSessionCount })
        .eq("id", student.id);

      if (error) throw error;
      setStudent((prev) => prev ? { ...prev, completed_sessions: newSessionCount } : null);
    } catch (err: any) {
      alert(err.message || "Failed to confirm attendance.");
    } finally {
      setSigningAttendance(false);
    }
  };

  const handleRevokeAttendance = async () => {
    if (!student || (student.completed_sessions || 0) <= 0) return;
    if (!window.confirm("Are you sure you want to revoke the last completed session?")) return;

    setRevokingAttendance(true);
    try {
      const newSessionCount = Math.max(0, (student.completed_sessions || 0) - 1);
      const { error } = await supabase
        .from("students")
        .update({ completed_sessions: newSessionCount })
        .eq("id", student.id);

      if (error) throw error;
      setStudent((prev) => prev ? { ...prev, completed_sessions: newSessionCount } : null);
    } catch (err: any) {
      alert(err.message || "Failed to revoke attendance.");
    } finally {
      setRevokingAttendance(false);
    }
  };

  const handleReceiptUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !student) return;
    setUploadingReceipt(true);
    setUploadSuccess(false);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${student.id}_receipt_${Date.now()}.${fileExt}`;
      const filePath = `receipts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("receipts")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("students")
        .update({ receipt_url: publicUrl, tuition_status: "Pending Verification" })
        .eq("id", student.id);

      if (updateError) throw updateError;

      setStudent((prev) => prev ? { ...prev, receipt_url: publicUrl, tuition_status: "Pending Verification" } : null);
      setUploadSuccess(true);
    } catch (err: any) {
      alert(err.message || "Failed to upload receipt.");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const exportAsPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const html2canvasModule = await import("html2canvas-pro");
      const html2canvas = html2canvasModule.default || html2canvasModule;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollY: 0,
        scrollX: 0,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${student?.name || "Student"}_${getReportLabel(reportTab)}_Report.pdf`);
    } catch (err) {
      console.error("PDF Export failed:", err);
      alert("Failed to export PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsImage = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const html2canvasModule = await import("html2canvas-pro");
      const html2canvas = html2canvasModule.default || html2canvasModule;

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        scrollY: 0,
        scrollX: 0,
      });

      const link = document.createElement("a");
      link.download = `${student?.name || "Student"}_${getReportLabel(reportTab)}_Report.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Image Export failed:", err);
      alert("Failed to export PNG.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!studentId || (!loading && !student)) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 selection:bg-white selection:text-black">
        <div className="max-w-md w-full flex flex-col items-center text-center space-y-7">
          <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-2xl">
            <Lock className="w-6 h-6 text-neutral-400" />
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">Student Access</h1>
            <p className="text-sm text-neutral-400 font-normal leading-relaxed max-w-xs mx-auto">
              To access your student card, please refer to the administration.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <a
              href="https://wa.me/601110000000?text=Assalamu%27alaikum%20Ustaz,%20may%20I%20request%20the%20access%20link%20to%20my%20Pocket%20Tahfiz%20student%20card?"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-7 py-3 rounded-full bg-white text-black hover:bg-neutral-200 text-xs font-semibold tracking-tight transition cursor-pointer"
            >
              Contact Administration
            </a>
            <Link
              href="/"
              className="w-full sm:w-auto px-7 py-3 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-400 hover:text-white transition cursor-pointer"
            >
              Return Home
            </Link>
          </div>
          <div className="pt-8">
            <span className="text-[10px] tracking-widest uppercase font-mono text-neutral-600">
              Pocket Tahfiz Mentorship System
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-500 text-xs font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-neutral-900" />
          <span>Synchronizing student records...</span>
        </div>
      </div>
    );
  }

  const totalSessions = student?.package_sessions || student?.total_sessions || 12;
  const completedSessions = student?.completed_sessions || 0;

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white pb-20">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-neutral-200/60">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-medium text-neutral-500 hover:text-black transition">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Pocket Tahfiz</span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200/80 text-[11px] font-medium text-neutral-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Mentorship Portal</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-10 space-y-6">
        <div className="bg-white rounded-3xl p-8 border border-neutral-200/70 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400">
              Personalized Student Ledger
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-950">
              {student?.name}
            </h1>
            <p className="text-xs text-neutral-500 flex items-center gap-2">
              <span>Age: {student?.age || "N/A"}</span>
              <span className="w-1 h-1 rounded-full bg-neutral-300" />
              <span>{student?.location || "Not specified"}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
              student?.tuition_status === "Paid" || student?.payment_status === "Paid"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : student?.tuition_status === "Pending Verification"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-neutral-100 text-neutral-700 border-neutral-200"
            }`}>
              Tuition: {student?.tuition_status || student?.payment_status || "Pending"}
            </span>

            <button
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-semibold tracking-tight shadow-xs transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Full Report</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/70 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">
                  Tilawah &amp; Nazirah
                </span>
                <span className="text-xs font-bold font-mono text-neutral-900">
                  {tilawahPercentage}%
                </span>
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 mb-1">
                {totalPagesRecited}
                <span className="text-sm font-normal text-neutral-400"> / 604 Pages</span>
              </h2>
              <p className="text-xs text-neutral-500">
                Current Marker: Page {tilawahMarker} (Juz {Math.ceil(tilawahMarker / 20)})
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-black h-2 rounded-full transition-all duration-700" 
                  style={{ width: `${Math.min(Number(tilawahPercentage), 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>Al-Fatihah (p. 1)</span>
                <span>Surah An-Nas (p. 604)</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-neutral-200/70 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">
                  Hifz &amp; Retention
                </span>
                <span className="text-xs font-bold font-mono text-neutral-900">
                  {memorizedPagesList.length > 0 ? ((memorizedPagesList.length / 604) * 100).toFixed(1) : ((hifzMarker / 604) * 100).toFixed(1)}%
                </span>
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 mb-1">
                Page {hifzMarker}
                <span className="text-sm font-normal text-neutral-400"> / 604</span>
              </h2>
              <p className="text-xs text-neutral-500">
                Memorized: {memorizedPagesList.length} pages recorded
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-neutral-500 h-2 rounded-full transition-all duration-700" 
                  style={{ width: `${Math.min((((memorizedPagesList.length || hifzMarker) / 604) * 100), 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>Al-Fatihah (p. 1)</span>
                <span>Surah An-Nas (p. 604)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-neutral-200/70 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-sm font-semibold text-neutral-950">
              Interactive 604-Page Density Matrix
            </h3>
            <p className="text-xs text-neutral-500">
              {totalPagesRecited} of 604 pages verified in session ({tilawahPercentage}% complete).
            </p>
          </div>
          <button
            onClick={() => setShowGridModal(!showGridModal)}
            className="px-5 py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-medium tracking-tight transition cursor-pointer shrink-0"
          >
            {showGridModal ? "Hide 604 Matrix" : "Inspect Full 604 Matrix"}
          </button>
        </div>

        {showGridModal && (
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/70 shadow-xs transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-neutral-950">
                Mushaf Coverage ({totalPagesRecited} / 604 Completed)
              </span>
              <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-black inline-block" /> Completed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-neutral-200 inline-block" /> Pending
                </span>
              </div>
            </div>

            <div className="grid grid-cols-24 sm:grid-cols-32 md:grid-cols-48 gap-1 p-2 bg-[#f5f5f7] rounded-2xl max-h-72 overflow-y-auto">
              {Array.from({ length: 604 }).map((_, index) => {
                const pageNum = index + 1;
                const isCompleted = tilawahPagesSet.has(pageNum);
                return (
                  <div
                    key={pageNum}
                    title={`Page ${pageNum} ${isCompleted ? "- Recited" : "- Pending"}`}
                    className={`h-3 rounded-2xs text-[8px] flex items-center justify-center transition-colors ${
                      isCompleted ? "bg-black text-white font-semibold" : "bg-white border border-neutral-200 text-neutral-300"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/70 shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">
                  Mutual Session Log
                </span>
                <span className="text-xs font-medium text-neutral-500">
                  {completedSessions} of {totalSessions} Complete
                </span>
              </div>
              <h3 className="text-lg font-semibold text-neutral-950">
                Attendance Verification
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Confirm session completion alongside the tutor. Keep records clear with zero scheduling disputes.
              </p>
            </div>

            <div className="pt-6 space-y-3">
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: totalSessions }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-7 rounded-xl flex items-center justify-center text-[10px] font-mono font-medium border ${
                      i < completedSessions
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-neutral-50 border-neutral-200 text-neutral-400"
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>

              <button
                disabled={signingAttendance || revokingAttendance || completedSessions >= totalSessions}
                onClick={handleSignAttendance}
                className="w-full py-2.5 rounded-full bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 text-white text-xs font-medium tracking-tight transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {signingAttendance ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Confirm Today's Completed Session</span>
              </button>

              {completedSessions > 0 && (
                <button
                  type="button"
                  disabled={revokingAttendance || signingAttendance}
                  onClick={handleRevokeAttendance}
                  className="w-full py-2 rounded-full border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-50 text-neutral-600 hover:text-neutral-950 text-xs font-medium tracking-tight transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {revokingAttendance ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3 text-neutral-400" />}
                  <span>Revoke Last Session (-1)</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-neutral-200/70 shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">
                Tuition &amp; Verification
              </span>
              <h3 className="text-lg font-semibold text-neutral-950">
                Payment Verification
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Upload your monthly transfer slip directly. Receipts are reviewed and stamped directly inside the console.
              </p>
            </div>

            <div className="pt-6 space-y-4">
              {student?.receipt_url ? (
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-neutral-700">
                    <FileText className="w-4 h-4 text-neutral-500" />
                    <span className="font-medium truncate max-w-[170px]">Uploaded Receipt</span>
                  </div>
                  <a
                    href={student.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-900 hover:underline"
                  >
                    <span>View Slip</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <label className="border-2 border-dashed border-neutral-200 hover:border-neutral-400 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition bg-[#fafafa]">
                  <Upload className="w-4 h-4 text-neutral-400" />
                  <span className="text-xs font-medium text-neutral-700">
                    {uploadingReceipt ? "Uploading receipt..." : "Upload Transfer Slip (PDF/JPG)"}
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleReceiptUpload}
                    disabled={uploadingReceipt}
                    className="hidden"
                  />
                </label>
              )}

              {uploadSuccess && (
                <p className="text-[11px] text-emerald-600 font-medium text-center">
                  Receipt uploaded successfully! Awaiting tutor confirmation.
                </p>
              )}

              <div className="p-3 rounded-2xl bg-[#f5f5f7] border border-neutral-200/70 text-[11px] text-neutral-500 space-y-1">
                <span className="font-semibold text-neutral-900 block">Tuition Transfer Details:</span>
                <p>Maybank: <span className="font-mono font-medium text-neutral-800">164221345678</span></p>
                <p>Recipient: <span className="font-medium text-neutral-800">Salman Bin Zulkifle</span></p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3-PROGRAM REPORT MODAL: 1-TO-1 MATCH WITH ADMIN CONSOLE                   */}
      {/* ========================================================================= */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto p-3 sm:p-4 flex justify-center items-start">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-neutral-200 shadow-2xl overflow-hidden my-4 sm:my-8">
            
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-[#f5f5f7]">
              <div className="inline-flex p-1 rounded-full bg-neutral-200/70 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setReportTab("tajweed")}
                  className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                    reportTab === "tajweed" ? "bg-white text-neutral-950 shadow-xs" : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  Tajweed Core
                </button>
                <button
                  type="button"
                  onClick={() => setReportTab("hifz")}
                  className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                    reportTab === "hifz" ? "bg-white text-neutral-950 shadow-xs" : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  Hifz Program
                </button>
                <button
                  type="button"
                  onClick={() => setReportTab("sanad")}
                  className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                    reportTab === "sanad" ? "bg-white text-neutral-950 shadow-xs" : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  Tilawah Report
                </button>
              </div>

              <button
                onClick={() => setShowReportModal(false)}
                className="p-2 rounded-full hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div ref={reportRef} className="p-5 sm:p-8 space-y-6 bg-white">
              
              <div className="flex items-start justify-between pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 text-neutral-900 font-bold flex items-center justify-center text-lg">
                    {student?.name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                      Salman Zulkifle Mentorship
                    </span>
                    <h2 className="text-xl font-black text-neutral-950 tracking-tight">
                      {student?.name}
                    </h2>
                    <p className="text-xs text-neutral-400">
                      Age: {student?.age || "N/A"} • Location: {student?.location || "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    student?.tuition_status === "Paid" || student?.payment_status === "Paid"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    Tuition: {student?.tuition_status || student?.payment_status || "Pending"}
                  </span>
                  <p className="text-xs font-bold text-neutral-900 mt-2">
                    {completedSessions} / {totalSessions} Sessions
                  </p>
                </div>
              </div>

              {/* TAB 1: TAJWEED CORE (EXACT MATCH WITH ADMIN CONSOLE) */}
              {reportTab === "tajweed" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-4">
                    <div className="bg-blue-50/50 p-3.5 rounded-2xl border border-blue-200 flex flex-col justify-between">
                      <div>
                        <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Tilawah Recitation</span>
                        <span className="font-extrabold text-blue-900 block text-base mt-0.5">Pg {tilawahMarker}</span>
                      </div>
                      <span className="text-[10px] text-blue-700 font-medium block mt-1">
                        {formatJuzRanges(student?.completed_tilawah_juzs)} ({totalPagesRecited}/604 Pgs)
                      </span>
                    </div>

                    <div className="bg-purple-50/50 p-3.5 rounded-2xl border border-purple-200 flex flex-col justify-between">
                      <div>
                        <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Hifz Memorization</span>
                        <span className="font-extrabold text-purple-900 block text-base mt-0.5">Pg {hifzMarker}</span>
                      </div>
                      <span className="text-[10px] text-purple-700 font-medium block mt-1">
                        {formatJuzRanges(student?.completed_hifz_juzs)}
                      </span>
                    </div>

                    <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200 flex flex-col justify-between space-y-1.5">
                      <span className="text-emerald-800 font-bold text-[10px] uppercase tracking-wider block">
                        Monthly Target vs KPI
                      </span>

                      <div className="flex items-baseline justify-between pt-0.5">
                        <div>
                          <span className="text-[9px] text-neutral-400 block font-medium uppercase">Target Goal</span>
                          <span className="font-black text-neutral-950 text-sm">Pg {targetGoalPage}</span>
                          <span className="text-[9px] text-neutral-500 block">({monthlyTargetPgs} pgs/mo)</span>
                        </div>
                        <span className="text-neutral-300 font-light text-base px-1">/</span>
                        <div className="text-right">
                          <span className="text-[9px] text-neutral-400 block font-medium uppercase">Achieved</span>
                          <span className="font-black text-emerald-700 text-sm">{achievedPgs} Pages</span>
                          <span className="text-[9px] text-emerald-600 font-bold block">{kpiPercentage}% of KPI</span>
                        </div>
                      </div>

                      <div className="w-full bg-emerald-100/90 h-1.5 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300" 
                          style={{ width: `${kpiPercentage}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* 28-LETTER MAKHRAJ PRONUNCIATION GRID (DYNAMIC RATINGS) */}
                  <div className="bg-[#F8F9FB] border border-neutral-200 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                        Makhraj Pronunciation Grid
                      </span>
                      <span className="text-[10px] font-bold text-neutral-600">
                        Fluency: {fluencyScore}%
                      </span>
                    </div>

                    <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-14 gap-1.5">
                      {ARABIC_LETTERS.map((letter) => {
                        const rawLvl = latestEval?.alphabet_ratings?.[letter] || "good";
                        const lvl = (rawLvl in PROFICIENCY_CONFIG ? rawLvl : "good") as ProficiencyLevel;
                        const cfg = PROFICIENCY_CONFIG[lvl];

                        return (
                          <div
                            key={letter}
                            className={`w-full h-8 rounded-lg border font-serif font-bold text-sm flex items-center justify-center ${cfg.bg} ${cfg.border} ${cfg.text}`}
                          >
                            {letter}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* TAJWEED RULES BREAKDOWN (DYNAMIC DATABASE RATINGS) */}
                  <div className="bg-[#F8F9FB] border border-neutral-200 rounded-2xl p-4 text-xs space-y-2">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block border-b border-neutral-200 pb-1.5">
                      Tajweed Rules Breakdown
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {TAJWEED_CATEGORIES.flatMap((cat) => cat.items).map((item) => {
                        const rawLvl = latestEval?.rule_ratings?.[item.id] || latestEval?.rule_ratings?.[item.label] || "good";
                        const lvl = (rawLvl in PROFICIENCY_CONFIG ? rawLvl : "good") as ProficiencyLevel;
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
              )}

              {/* TAB 2: HIFZ PROGRAM */}
              {reportTab === "hifz" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-xs mb-4">
                    <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200">
                      <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Pages Memorized</span>
                      <span className="font-extrabold text-neutral-950 block text-base mt-0.5">
                        {memorizedPagesList.length} / 604
                      </span>
                      <span className="text-[10px] text-neutral-600 font-medium block mt-0.5">
                        {(((memorizedPagesList.length) / 604) * 100).toFixed(1)}% Completed
                      </span>
                    </div>

                    <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200">
                      <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Active Hifz Page</span>
                      <span className="font-extrabold text-neutral-950 block text-base mt-0.5">Pg {hifzMarker}</span>
                      <span className="text-[10px] text-neutral-600 font-medium block mt-0.5">Juz {student?.hifz_juz || Math.ceil(hifzMarker / 20)}</span>
                    </div>

                    <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200">
                      <span className="text-neutral-400 block text-[10px] uppercase font-semibold">Completed Juz</span>
                      <span className="font-extrabold text-neutral-950 block text-base mt-0.5">
                        {student?.completed_hifz_juzs?.length || 0} Juzes
                      </span>
                      <span className="text-[10px] text-neutral-600 font-medium block mt-0.5">
                        {formatJuzRanges(student?.completed_hifz_juzs)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-neutral-200/80 pb-2.5">
                      <div>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Hifz Retention Ledger</span>
                        <span className="text-xs font-bold text-neutral-950">30 Juz Progression Grid</span>
                      </div>
                      <span className="text-[10px] font-bold text-neutral-700 bg-white px-2.5 py-1 rounded-full border border-neutral-200 shadow-2xs">
                        {memorizedPagesList.length} / 604 Pages
                      </span>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 pt-1">
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNum) => {
                        const { start, end } = getJuzPageRange(juzNum);
                        const totalInJuz = end - start + 1;
                        
                        let count = 0;
                        for (let p = start; p <= end; p++) {
                          if (memorizedPagesList.includes(p)) count++;
                        }
                        
                        const isManualTicked = (student?.completed_hifz_juzs || []).includes(juzNum);
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

                  <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-2.5">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Juz Memory Retention &amp; Itqan Status</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(student?.completed_hifz_juzs && student.completed_hifz_juzs.length > 0 
                        ? student.completed_hifz_juzs 
                        : [1]
                      ).map((juzNum) => {
                        const score = student?.juz_memory_strength?.[juzNum] ?? 80;
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
              )}

              {/* TAB 3: TILAWAH REPORT */}
              {reportTab === "sanad" && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-[#eff6ff] border border-blue-200/70 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-blue-950">
                          Khatm al-Quran &amp; Recitation Program
                        </h4>
                        <p className="text-[11px] text-blue-700">
                          Tracks complete oral recitation of the 604 Madinah Mushaf pages.
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold tracking-tight">
                      {totalPagesRecited} / 604 Completed
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-[#fafafa] border border-neutral-200/70">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 block mb-1">
                        Total Pages Recited
                      </span>
                      <div className="text-lg font-bold text-neutral-950">
                        {totalPagesRecited} Pages
                      </div>
                      <span className="text-[11px] text-neutral-500">
                        {tilawahPercentage}% of Mushaf
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#fafafa] border border-neutral-200/70">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 block mb-1">
                        Current Tilawah Marker
                      </span>
                      <div className="text-lg font-bold text-neutral-950">
                        Pg {tilawahMarker}
                      </div>
                      <span className="text-[11px] text-neutral-500">
                        Juz {Math.ceil(tilawahMarker / 20)}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#fafafa] border border-neutral-200/70">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 block mb-1">
                        Read Juzes
                      </span>
                      <div className="text-lg font-bold text-neutral-950">
                        {Math.floor(totalPagesRecited / 20)} Juzes
                      </div>
                      <span className="text-[11px] text-neutral-500">
                        {formatJuzRanges(student?.completed_tilawah_juzs)}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl border border-neutral-200/80 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-xs font-bold text-neutral-950 block">
                          604 Traditional Mushaf Ledger
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          Every page recited in session with Ustaz
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-1.5 font-medium text-neutral-700">
                          <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" /> Recited
                        </span>
                        <span className="flex items-center gap-1.5 font-medium text-neutral-400">
                          <span className="w-2.5 h-2.5 rounded-xs bg-neutral-200 inline-block" /> Pending
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-24 sm:grid-cols-32 gap-1 p-3 bg-[#f5f5f7] rounded-xl max-h-64 overflow-y-auto">
                      {Array.from({ length: 604 }).map((_, index) => {
                        const pageNum = index + 1;
                        const isCompleted = tilawahPagesSet.has(pageNum);
                        return (
                          <div
                            key={pageNum}
                            title={`Page ${pageNum}`}
                            className={`h-3 rounded-2xs transition-colors ${
                              isCompleted ? "bg-blue-600" : "bg-white border border-neutral-200/60"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* USTAZ'S FEEDBACK & RECOMMENDATIONS */}
              <div className="bg-[#F8F9FB] border border-neutral-200/90 rounded-2xl p-4 text-xs space-y-1.5 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      Ustaz&apos;s Feedback &amp; Recommendations
                    </span>
                  </div>
                  {(latestEval?.eval_date || student?.remarks_date) && (
                    <span className="text-[10px] text-neutral-400 font-medium">
                      Date: {latestEval?.eval_date || student?.remarks_date}
                    </span>
                  )}
                </div>

                <div className="pt-1">
                  <p className="text-neutral-800 text-xs leading-relaxed font-medium bg-white p-3 rounded-xl border border-neutral-200/70">
                    &ldquo;{latestEval?.tutor_notes || student?.remarks || "Good recitation, need more time spent to become more eloquent."}&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER WITH SAFE FILENAME EXPORT */}
            <div className="p-4 border-t border-neutral-100 bg-[#f5f5f7] flex items-center gap-3">
              <button
                disabled={isExporting}
                onClick={exportAsPDF}
                className="flex-1 py-3 rounded-full bg-black hover:bg-neutral-800 disabled:bg-neutral-300 text-white text-xs font-semibold tracking-tight transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                <span>Download {reportTab === "sanad" ? "Tilawah" : reportTab === "hifz" ? "Hifz" : "Tajweed"} Report (PDF)</span>
              </button>

              <button
                disabled={isExporting}
                onClick={exportAsImage}
                className="flex-1 py-3 rounded-full bg-white hover:bg-neutral-100 disabled:bg-neutral-200 text-neutral-900 border border-neutral-200 text-xs font-semibold tracking-tight transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileImage className="w-4 h-4 text-neutral-600" />}
                <span>Download {reportTab === "sanad" ? "Tilawah" : reportTab === "hifz" ? "Hifz" : "Tajweed"} Report (PNG)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentPortalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
      </div>
    }>
      <StudentPortalContent />
    </Suspense>
  );
}