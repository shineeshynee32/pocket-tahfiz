"use client";

import { useState, useEffect, Suspense, ChangeEvent } from "react";
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
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  CalendarCheck, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Loader2
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  age?: number | string;
  location?: string;
  tilawah_page: number;
  hifz_page: number;
  package_sessions: number;
  completed_sessions: number;
  tuition_status: string;
  fluency_rating?: number | string;
  remarks?: string;
  receipt_url?: string;
}

function StudentPortalContent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("id");

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [signingAttendance, setSigningAttendance] = useState(false);
  const [showGridModal, setShowGridModal] = useState(false);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }

    async function fetchStudent() {
      try {
        const { data, error } = await supabase
          .from("students")
          .select("*")
          .eq("id", studentId)
          .single();

        if (error) throw error;
        setStudent(data);
      } catch (err) {
        console.error("Error fetching student profile:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStudent();
  }, [studentId]);

  // Handle Receipt Upload to Supabase Storage
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
        .update({ 
          receipt_url: publicUrl,
          tuition_status: "Pending Verification" 
        })
        .eq("id", student.id);

      if (updateError) throw updateError;

      setStudent((prev) => prev ? { 
        ...prev, 
        receipt_url: publicUrl, 
        tuition_status: "Pending Verification" 
      } : null);
      
      setUploadSuccess(true);
    } catch (err: any) {
      console.error("Error uploading receipt:", err);
      alert(err.message || "Failed to upload receipt. Please try again.");
    } finally {
      setUploadingReceipt(false);
    }
  };

  // Student Attendance Sign-off
  const handleSignAttendance = async () => {
    if (!student) return;
    setSigningAttendance(true);

    try {
      const newSessionCount = Math.min((student.completed_sessions || 0) + 1, student.package_sessions || 12);
      
      const { error } = await supabase
        .from("students")
        .update({ completed_sessions: newSessionCount })
        .eq("id", student.id);

      if (error) throw error;

      setStudent((prev) => prev ? { ...prev, completed_sessions: newSessionCount } : null);
    } catch (err: any) {
      console.error("Error confirming attendance:", err);
      alert(err.message || "Failed to confirm attendance.");
    } finally {
      setSigningAttendance(false);
    }
  };

  // 1. MINIMALIST BLACK WALLPAPER FALLBACK (No ID or Not Found)
  if (!studentId || (!loading && !student)) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 selection:bg-white selection:text-black">
        <div className="max-w-md w-full flex flex-col items-center text-center space-y-7">
          {/* Subtle Frosted Lock Badge */}
          <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-2xl">
            <Lock className="w-6 h-6 text-neutral-400" />
          </div>

          {/* Minimalist Announcement */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Student Access
            </h1>
            <p className="text-sm text-neutral-400 font-normal leading-relaxed max-w-xs mx-auto">
              To access your student card, please refer to the administration.
            </p>
          </div>

          {/* Action Links */}
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

  // Loading Skeleton
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

  const tilawahPage = student?.tilawah_page || 1;
  const hifzPage = student?.hifz_page || 1;
  const tilawahPercent = Math.min(Math.round((tilawahPage / 604) * 100), 100);
  const hifzPercent = Math.min(Math.round((hifzPage / 604) * 100), 100);
  const totalSessions = student?.package_sessions || 12;
  const completedSessions = student?.completed_sessions || 0;

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white pb-20">
      {/* Top Navbar */}
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
        {/* Student Profile Header Card */}
        <div className="bg-white rounded-3xl p-8 border border-neutral-200/70 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400">
              Personalized Student Ledger
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-950">
              {student?.name}
            </h1>
            <p className="text-xs text-neutral-500 flex items-center gap-2">
              <span>{student?.age ? `Age: ${student.age}` : "Individual Track"}</span>
              {student?.location && (
                <>
                  <span className="w-1 h-1 rounded-full bg-neutral-300" />
                  <span>{student.location}</span>
                </>
              )}
            </p>
          </div>

          {/* Quick Status Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:self-center">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
              student?.tuition_status === "Paid" 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : student?.tuition_status === "Pending Verification"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-neutral-100 text-neutral-700 border-neutral-200"
            }`}>
              Tuition: {student?.tuition_status || "Pending"}
            </span>

            {student?.fluency_rating && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 border border-neutral-200 text-neutral-800">
                Fluency: {student.fluency_rating}
              </span>
            )}
          </div>
        </div>

        {/* 604-Page Quran Density Tracker Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tilawah Progress */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/70 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">
                  Tilawah & Nazirah
                </span>
                <span className="text-xs font-bold font-mono text-neutral-900">
                  {tilawahPercent}%
                </span>
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 mb-1">
                Page {tilawahPage}
                <span className="text-sm font-normal text-neutral-400"> / 604</span>
              </h2>
              <p className="text-xs text-neutral-500">
                Continuous oral recitation with direct tajweed guidance.
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-black h-2 rounded-full transition-all duration-700" 
                  style={{ width: `${tilawahPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>Al-Fatihah</span>
                <span>An-Nas</span>
              </div>
            </div>
          </div>

          {/* Hifz Progress */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/70 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">
                  Hifz & Retention
                </span>
                <span className="text-xs font-bold font-mono text-neutral-900">
                  {hifzPercent}%
                </span>
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 mb-1">
                Page {hifzPage}
                <span className="text-sm font-normal text-neutral-400"> / 604</span>
              </h2>
              <p className="text-xs text-neutral-500">
                Consolidated memorization reviewed under strict retention rubrics.
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-neutral-500 h-2 rounded-full transition-all duration-700" 
                  style={{ width: `${hifzPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>Al-Fatihah</span>
                <span>An-Nas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual 604-Box Micro Grid Trigger */}
        <div className="bg-white rounded-3xl p-6 border border-neutral-200/70 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-sm font-semibold text-neutral-950">
              Interactive 604-Page Density Matrix
            </h3>
            <p className="text-xs text-neutral-500">
              View the entire Mushaf page-by-page progress grid for this student profile.
            </p>
          </div>
          <button
            onClick={() => setShowGridModal(!showGridModal)}
            className="px-5 py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-medium tracking-tight transition cursor-pointer shrink-0"
          >
            {showGridModal ? "Hide 604 Grid" : "Inspect Full 604 Matrix"}
          </button>
        </div>

        {/* Expanded 604 Grid */}
        {showGridModal && (
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/70 shadow-xs transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-neutral-900">
                Mushaf Coverage (Pages 1 to 604)
              </span>
              <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-black inline-block" /> Completed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-neutral-200 inline-block" /> Upcoming
                </span>
              </div>
            </div>

            <div className="grid grid-cols-24 sm:grid-cols-32 md:grid-cols-48 gap-1 p-2 bg-[#f5f5f7] rounded-2xl max-h-72 overflow-y-auto">
              {Array.from({ length: 604 }).map((_, index) => {
                const pageNumber = index + 1;
                const isCompleted = pageNumber <= tilawahPage;
                return (
                  <div
                    key={pageNumber}
                    title={`Page ${pageNumber}`}
                    className={`h-3 rounded-2xs text-[8px] flex items-center justify-center transition-colors ${
                      isCompleted ? "bg-black text-white" : "bg-white border border-neutral-200 text-neutral-300"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Attendance Verification & Billing Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mutual Attendance Card */}
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

            <div className="pt-6 space-y-4">
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
                disabled={signingAttendance || completedSessions >= totalSessions}
                onClick={handleSignAttendance}
                className="w-full py-2.5 rounded-full bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 text-white text-xs font-medium tracking-tight transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {signingAttendance ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Confirm Today's Completed Session</span>
              </button>
            </div>
          </div>

          {/* Transparent Payment & Receipt Upload Card */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/70 shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">
                Tuition & Verification
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

        {/* Tutor Remarks / Feedback Section */}
        {student?.remarks && (
          <div className="bg-white rounded-3xl p-6 border border-neutral-200/70 shadow-xs space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400">
              Tutor Mentorship Log
            </span>
            <h4 className="text-sm font-semibold text-neutral-950">
              Tajweed & Articulation Observations
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed bg-[#f5f5f7] p-4 rounded-2xl border border-neutral-200/60 font-mono">
              &ldquo;{student.remarks}&rdquo;
            </p>
          </div>
        )}
      </main>
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