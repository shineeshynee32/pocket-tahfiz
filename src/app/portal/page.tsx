"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Video,
  Award,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  ExternalLink,
  UploadCloud,
  Receipt,
  Star,
  Check,
  AlertCircle,
  Sparkles,
  BookOpen
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";

// Translation Dictionary for English, Bahasa Melayu, and Arabic
const translations = {
  en: {
    portalTitle: "Pocket Tahfiz Parent & Student Portal",
    activeMentorship: "Active Mentorship",
    liveClassroom: "1-on-1 Online Classroom",
    liveClassroomTitle: "Live Classroom Link",
    enterMeeting: "Enter Google Meet / Zoom",
    performanceTitle: "Student Performance & Evaluation",
    fluencyTitle: "Recitation Fluency & Mastery",
    remarksTitle: "Ustaz's Remarks & Advice",
    invoiceTitle: "Tuition Fee Invoice",
    receiptUpload: "Upload Transfer Receipt",
    verifiedDone: "Completed",
    attendanceTitle: "Attendance & Session Sign-Off Ledger",
    quranMapTitle: "604-Page Quran Progress Map",
    tilawah: "Tilawah",
    hifz: "Hifz",
    reviewTitle: "Teacher Evaluation & Feedback",
    submitReview: "Submit Review",
    confirmAttended: "Confirm Attended",
    revoke: "Revoke"
  },
  ms: {
    portalTitle: "Portal Ibu Bapa & Pelajar Pocket Tahfiz",
    activeMentorship: "Bimbingan Aktif",
    liveClassroom: "Kelas Dalam Talian 1-ke-1",
    liveClassroomTitle: "Pautan Kelas Langsung",
    enterMeeting: "Masuk Google Meet / Zoom",
    performanceTitle: "Prestasi & Penilaian Pelajar",
    fluencyTitle: "Kelancaran & Penguasaan Tajwid",
    remarksTitle: "Ulasan & Nasihat Ustaz",
    invoiceTitle: "Invois Yuran Pengajian",
    receiptUpload: "Muat Naik Resit Pembayaran",
    verifiedDone: "Selesai",
    attendanceTitle: "Lejar Pengesahan Kehadiran & Sesi",
    quranMapTitle: "Peta Kemajuan 604 Muka Surat Al-Quran",
    tilawah: "Tilawah",
    hifz: "Hifz",
    reviewTitle: "Penilaian & Maklum Balas Guru",
    submitReview: "Hantar Ulasan",
    confirmAttended: "Sahkan Hadir",
    revoke: "Batal Pengesahan"
  },
  ar: {
    portalTitle: "بوابة الطالب وأولياء الأمور - بوكيت تحفيظ",
    activeMentorship: "إشراف نشط",
    liveClassroom: "فصل دراسي فردي عبر الإنترنت",
    liveClassroomTitle: "رابط الفصل المباشر",
    enterMeeting: "الدخول إلى Google Meet / Zoom",
    performanceTitle: "أداء وتقييم الطالب",
    fluencyTitle: "طلاقة التلاوة وإتقان التجويد",
    remarksTitle: "ملاحظات وتوجيهات الأستاذ",
    invoiceTitle: "فاتورة الرسوم الدراسية",
    receiptUpload: "رفع إيصال التحويل",
    verifiedDone: "مكتمل",
    attendanceTitle: "سجل تأكيد الحضور والجلسات",
    quranMapTitle: "خريطة تقدم صفحات القرآن (604 صفحة)",
    tilawah: "تلاوة",
    hifz: "حفظ",
    reviewTitle: "تقييم المعلم والملاحظات",
    submitReview: "إرسال التقييم",
    confirmAttended: "تأكيد الحضور",
    revoke: "إلغاء التأكيد"
  }
};

interface SessionItem {
  id: string;
  session_number: number;
  session_date: string;
  tutor_verified?: boolean;
  student_verified?: boolean;
  status: "done" | "pending" | "cancelled" | "awaiting_confirmation";
  notes?: string;
}

interface InvoiceItem {
  id: string;
  invoice_number: string;
  amount?: number;
  due_date: string;
  status: "paid" | "unpaid" | "verifying";
  receipt_url?: string;
  payment_method?: string;
}

interface StudentEvaluation {
  eval_date: string;
  fluencyScore: number;
  fluencyFocus: string[];
  tutorNotes: string;
}

interface StudentPortalData {
  id: string;
  name: string;
  age: string;
  location: string;
  class_link: string;
  teacher_name: string;
  teacher_credentials: string;
  total_sessions: number;
  completed_sessions: number;
  tilawah_page: number;
  tilawah_pages: number[];
  hifz_page: number;
  memorized_pages: number[];
}

const getFluencyStyle = (score: number) => {
  const safeScore = Math.max(0, Math.min(100, score));
  let hue = 0;
  if (safeScore <= 30) hue = (safeScore / 30) * 25;
  else if (safeScore <= 60) hue = 25 + ((safeScore - 30) / 30) * 35;
  else if (safeScore <= 90) hue = 60 + ((safeScore - 60) / 30) * 75;
  else hue = 135 + ((safeScore - 90) / 10) * 80;

  return {
    bg: `hsl(${hue}, 85%, 96%)`,
    border: `hsl(${hue}, 60%, 80%)`,
    text: `hsl(${hue}, 90%, 25%)`,
    barColor: `hsl(${hue}, 85%, 45%)`,
    label: safeScore <= 30 ? "Developing" : safeScore <= 60 ? "Intermediate" : safeScore <= 90 ? "Good" : "Mastery"
  };
};

function PortalContent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("id");

  // Consume our persisted language context memory box
  const { lang, setLanguage, isRTL } = useLanguage();
  const t = translations[lang] || translations.en;

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentPortalData | null>(null);
  const [evaluation, setEvaluation] = useState<StudentEvaluation | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [activeTab, setActiveTab] = useState<"tilawah" | "hifz">("tilawah");

  const [invoice, setInvoice] = useState<InvoiceItem | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    async function loadPortal() {
      if (!studentId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data: stData, error: stError } = await supabase
          .from("students")
          .select("*")
          .eq("id", studentId)
          .single();

        if (stError || !stData) {
          setStudent(null);
          setLoading(false);
          return;
        }

        setStudent({
          id: stData.id,
          name: stData.name,
          age: stData.age,
          location: stData.location,
          class_link: stData.class_link || "https://meet.google.com/",
          teacher_name: stData.teacher_name || "Ustaz Salman Zulkifle",
          teacher_credentials: stData.teacher_credentials || "B.A. Islamic Studies (Mu'tah University), Classical Qira'at Specialist",
          total_sessions: stData.total_sessions || 12,
          completed_sessions: stData.completed_sessions || 0,
          tilawah_page: stData.tilawah_page || 1,
          tilawah_pages: stData.tilawah_pages || [],
          hifz_page: stData.hifz_page || 1,
          memorized_pages: stData.memorized_pages || []
        });

        const { data: evData } = await supabase
          .from("student_evaluations")
          .select("*")
          .eq("student_id", stData.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (evData) {
          setEvaluation({
            eval_date: evData.eval_date || evData.created_at?.split("T")[0],
            fluencyScore: evData.fluency_score || 80,
            fluencyFocus: evData.fluency_focus || [],
            tutorNotes: evData.tutor_notes || ""
          });
        }

        const { data: sessData } = await supabase
          .from("class_sessions")
          .select("*")
          .eq("student_id", stData.id)
          .order("session_number", { ascending: true });

        if (sessData && sessData.length > 0) {
          setSessions(sessData);
        } else {
          const defaults: SessionItem[] = Array.from({ length: stData.total_sessions || 12 }, (_, i) => ({
            id: String(i + 1),
            session_number: i + 1,
            session_date: new Date().toISOString().split("T")[0],
            tutor_verified: i < (stData.completed_sessions || 0),
            student_verified: i < (stData.completed_sessions || 0),
            status: i < (stData.completed_sessions || 0) ? "done" : "pending"
          }));
          setSessions(defaults);
        }

        const { data: invData } = await supabase
          .from("invoices")
          .select("*")
          .eq("student_id", stData.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (invData) {
          setInvoice(invData);
        } else {
          const newInvoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
          const defaultInv = {
            student_id: stData.id,
            invoice_number: newInvoiceNumber,
            status: (stData.payment_status === "Paid" ? "paid" : "unpaid") as "paid" | "unpaid",
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
          };
          const { data: createdInv } = await supabase.from("invoices").insert(defaultInv).select().single();
          if (createdInv) setInvoice(createdInv);
        }
      } catch (err) {
        console.error("Portal fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPortal();
  }, [studentId]);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !student || !invoice) return;
    setUploadingReceipt(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${student.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage
        .from("receipts")
        .getPublicUrl(fileName);
      const receiptUrl = publicData.publicUrl;
      await supabase
        .from("invoices")
        .update({ receipt_url: receiptUrl, status: "verifying" })
        .eq("id", invoice.id);
      setInvoice({ ...invoice, receipt_url: receiptUrl, status: "verifying" });
      alert("Receipt uploaded successfully.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert("Failed to upload receipt: " + message);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setSubmittingReview(true);
    try {
      const { error } = await supabase.from("parent_reviews").insert({
        student_id: student.id,
        teacher_name: student.teacher_name,
        rating,
        comment: reviewComment
      });
      if (error) throw error;
      setReviewSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert("Error submitting review: " + message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-neutral-500">
        <Loader2 className="w-6 h-6 animate-spin mb-3 text-neutral-900" />
        <p className="text-xs font-medium">Opening Pocket Tahfiz Student Portal...</p>
      </div>
    );
  }

  if (!studentId || !student) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6 text-rose-600" />
        </div>
        <h2 className="text-base font-bold text-neutral-950 mb-1">Invalid or Missing Link</h2>
        <p className="text-xs text-neutral-500 max-w-sm mb-4">
          Please open the official link sent by your teacher on WhatsApp to access your dashboard.
        </p>
        <Link href="/" className="text-xs font-bold text-neutral-900 underline hover:text-black">
          Return to Home
        </Link>
      </div>
    );
  }

  const verifiedDoneCount = sessions.filter((s) => s.tutor_verified && s.student_verified).length;
  const fluencyInfo = evaluation ? getFluencyStyle(evaluation.fluencyScore) : null;

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-[#F8F9FA] text-neutral-900 font-sans antialiased pb-20">
      {/* Top Navbar with Language Controls */}
      <nav className="border-b border-neutral-200/80 bg-white sticky top-0 z-40 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 text-neutral-400 hover:text-neutral-900 bg-neutral-100 rounded-full transition cursor-pointer">
              <ArrowLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
            </Link>
            <div>
              <span className="text-xs font-bold text-neutral-950 block leading-tight">{student.name}</span>
              <span className="text-[10px] text-neutral-400 font-medium">{t.portalTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Persisted Language Switcher */}
            <div className="flex items-center bg-neutral-100 rounded-full p-1 border border-neutral-200">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
                  lang === "en" ? "bg-white text-black shadow-xs" : "text-neutral-500 hover:text-black"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("ms")}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
                  lang === "ms" ? "bg-white text-black shadow-xs" : "text-neutral-500 hover:text-black"
                }`}
              >
                BM
              </button>
              <button
                type="button"
                onClick={() => setLanguage("ar")}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
                  lang === "ar" ? "bg-white text-black shadow-xs" : "text-neutral-500 hover:text-black"
                }`}
              >
                العربية
              </button>
            </div>

            <span className="hidden sm:inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-neutral-100 border border-neutral-200 text-neutral-800">
              {t.activeMentorship}
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-8 space-y-6">
        {/* 1. Live Google Meet / Online Classroom */}
        <div className="bg-neutral-950 text-white p-6 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-neutral-300">
              <Video className="w-3 h-3 text-emerald-400" />
              <span>{t.liveClassroom}</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">{t.liveClassroomTitle}</h2>
            <p className="text-xs text-neutral-400">
              Classes are conducted via Google Meet / Zoom. Click below to enter your session.
            </p>
          </div>
          <a
            href={student.class_link}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white hover:bg-neutral-100 text-neutral-950 px-6 py-3 rounded-full text-xs font-bold inline-flex items-center justify-center gap-2 transition shadow-xs shrink-0 cursor-pointer"
          >
            <span>{t.enterMeeting}</span>
            <ExternalLink className={`w-3.5 h-3.5 ${isRTL ? "rotate-180" : ""}`} />
          </a>
        </div>

        {/* 2. Performance Report */}
        <div className="bg-white border border-neutral-200/80 p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-neutral-900" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-950">{t.performanceTitle}</h3>
                <p className="text-[11px] text-neutral-400">Official progress summary and feedback from Ustaz</p>
              </div>
            </div>
            {evaluation?.eval_date && (
              <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200 w-fit">
                Evaluated: {evaluation.eval_date}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-3">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">{t.fluencyTitle}</span>
              {fluencyInfo && evaluation ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-800">Tajweed Fluency Rating</span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                      style={{ backgroundColor: fluencyInfo.bg, borderColor: fluencyInfo.border, color: fluencyInfo.text }}
                    >
                      {evaluation.fluencyScore}% • {fluencyInfo.label}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${evaluation.fluencyScore}%`, backgroundColor: fluencyInfo.barColor }}
                    />
                  </div>
                  {evaluation.fluencyFocus && evaluation.fluencyFocus.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] text-neutral-500 font-semibold block mb-1.5">Key Focus Areas:</span>
                      <div className="flex flex-wrap gap-1">
                        {evaluation.fluencyFocus.map((f) => (
                          <span key={f} className="text-[10px] font-bold bg-white text-neutral-800 px-2.5 py-0.5 rounded-full border border-neutral-200">
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-neutral-400 italic text-xs py-2">
                  No rubric evaluation entered yet.
                </div>
              )}
            </div>
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 flex flex-col justify-between space-y-2">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">
                  {t.remarksTitle}
                </span>
                {evaluation?.tutorNotes ? (
                  <p className="text-xs text-neutral-800 leading-relaxed italic bg-white p-3 rounded-xl border border-neutral-200">
                    &ldquo;{evaluation.tutorNotes}&rdquo;
                  </p>
                ) : (
                  <p className="text-xs text-neutral-400 italic bg-white p-3 rounded-xl border border-dashed border-neutral-200">
                    Keep up the steady recitation. Focus on clear makhraj articulation during each practice.
                  </p>
                )}
              </div>
              <div className="text-[10px] text-neutral-400 pt-1 flex justify-between">
                <span>Mentor: {student.teacher_name}</span>
                <span>Active Track: Tilawah &amp; Hifz</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Invoicing & Receipt Hub */}
        {invoice && (
          <div className="bg-white border border-neutral-200/80 p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-neutral-900" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-950">{t.invoiceTitle}</h3>
                  <p className="text-[11px] text-neutral-400">Invoice: {invoice.invoice_number}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold w-fit border ${
                invoice.status === "paid"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : invoice.status === "verifying"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}>
                {invoice.status === "paid" ? "Paid ✓" : invoice.status === "verifying" ? "Receipt Under Verification" : "Outstanding / Unpaid"}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Payment Information</span>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-neutral-600">Monthly Mentorship Package:</span>
                  <span className="text-xs font-bold text-neutral-950 bg-white px-2.5 py-1 rounded-md border border-neutral-200">
                    Agreed Student Rate
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 pt-1 border-t border-neutral-200/60 flex justify-between">
                  <span>Due Date:</span>
                  <span className="font-semibold text-neutral-800">{invoice.due_date}</span>
                </div>
                <div className="text-[10px] text-neutral-500 bg-white p-2.5 rounded-xl border border-neutral-200 mt-2">
                  <strong>Online Transfer / DuitNow:</strong><br />
                  Bank: Maybank Berhad<br />
                  Account No: <strong>1640 1234 5678</strong> (Salman Zulkifle)
                </div>
              </div>
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                    {t.receiptUpload}
                  </span>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Once payment is completed, upload your screenshot or PDF slip here.
                  </p>
                </div>
                {invoice.receipt_url ? (
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-neutral-200">
                    <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      Receipt Uploaded
                    </span>
                    <a
                      href={invoice.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold underline text-neutral-900"
                    >
                      View Slip
                    </a>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-neutral-300 hover:border-black bg-white rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5">
                    {uploadingReceipt ? (
                      <Loader2 className="w-5 h-5 animate-spin text-neutral-900" />
                    ) : (
                      <>
                        <UploadCloud className="w-5 h-5 text-neutral-500" />
                        <span className="text-xs font-bold text-neutral-900">Select Receipt Slip (Image / PDF)</span>
                        <span className="text-[10px] text-neutral-400">PNG, JPG, or PDF (max 5MB)</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={uploadingReceipt}
                      onChange={handleReceiptUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. Teacher Credentials */}
        <div className="bg-white border border-neutral-200/80 p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-neutral-900" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Certified Mentor</span>
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-900" />
            </div>
            <h3 className="text-base font-bold text-neutral-950">{student.teacher_name}</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">{student.teacher_credentials}</p>
          </div>
        </div>

        {/* 5. Attendance Ledger */}
        <div className="bg-white border border-neutral-200/80 p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-950">{t.attendanceTitle}</h3>
              <p className="text-[11px] text-neutral-400">Mutual sign-off required between teacher and student</p>
            </div>
            <div className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800">
              {verifiedDoneCount} / {sessions.length} {t.verifiedDone}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {sessions.map((sess) => {
              const isFullyVerified = sess.tutor_verified && sess.student_verified;
              return (
                <div
                  key={sess.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                    isFullyVerified
                      ? "bg-emerald-50/50 border-emerald-200"
                      : sess.status === "cancelled"
                      ? "bg-rose-50/50 border-rose-200"
                      : "bg-neutral-50 border-neutral-200"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-xs text-neutral-950">
                      <span>Session {sess.session_number}</span>
                      {isFullyVerified ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : sess.status === "cancelled" ? (
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-1 space-y-0.5">
                      <div>Teacher: {sess.tutor_verified ? "Verified ✓" : "Pending"}</div>
                      <div>Student: {sess.student_verified ? "Confirmed ✓" : "Not yet"}</div>
                    </div>
                  </div>
                  {!isFullyVerified && sess.status !== "cancelled" && (
                    <button
                      type="button"
                      onClick={async () => {
                        const nextStudentVerified = !sess.student_verified;
                        const isNowDone = sess.tutor_verified && nextStudentVerified;
                        await supabase
                          .from("class_sessions")
                          .update({
                            student_verified: nextStudentVerified,
                            student_verified_at: nextStudentVerified ? new Date().toISOString() : null,
                            status: isNowDone ? "done" : "awaiting_confirmation"
                          })
                          .eq("id", sess.id);
                        setSessions(sessions.map((s) => s.id === sess.id ? {
                          ...s,
                          student_verified: nextStudentVerified,
                          status: isNowDone ? "done" : "awaiting_confirmation"
                        } : s));
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 cursor-pointer ${
                        sess.student_verified
                          ? "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                          : "bg-black text-white hover:bg-neutral-800"
                      }`}
                    >
                      {sess.student_verified ? t.revoke : t.confirmAttended}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. 604-Box Progress Density Map */}
        <div className="bg-white border border-neutral-200/80 p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-neutral-900" />
              <div>
                <h3 className="text-sm font-bold text-neutral-950">{t.quranMapTitle}</h3>
                <p className="text-[11px] text-neutral-400">Track your recitation and memorization milestones</p>
              </div>
            </div>
            <div className="flex gap-1.5 p-1 bg-neutral-100 rounded-full">
              <button
                onClick={() => setActiveTab("tilawah")}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                  activeTab === "tilawah" ? "bg-black text-white" : "text-neutral-500 hover:text-black"
                }`}
              >
                {t.tilawah} ({student.tilawah_pages.length}/604)
              </button>
              <button
                onClick={() => setActiveTab("hifz")}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                  activeTab === "hifz" ? "bg-black text-white" : "text-neutral-500 hover:text-black"
                }`}
              >
                {t.hifz} ({student.memorized_pages.length}/604)
              </button>
            </div>
          </div>
          <div className="grid grid-cols-20 gap-0.5 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
            {Array.from({ length: 604 }, (_, i) => i + 1).map((pageNum) => {
              const isFilled = activeTab === "tilawah"
                ? student.tilawah_pages.includes(pageNum)
                : student.memorized_pages.includes(pageNum);
              return (
                <div
                  key={pageNum}
                  title={`Page ${pageNum}`}
                  className={`h-2.5 rounded-2xs transition-colors ${
                    isFilled
                      ? activeTab === "tilawah" ? "bg-blue-600" : "bg-neutral-950"
                      : "bg-neutral-200/70"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* 7. Teacher Evaluation & Review */}
        <div className="bg-white border border-neutral-200/80 p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <h3 className="text-sm font-bold text-neutral-950">{t.reviewTitle}</h3>
            <p className="text-[11px] text-neutral-400">Leave a review for {student.teacher_name} to help improve mentorship quality.</p>
          </div>
          {reviewSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
              <p className="text-xs font-bold text-emerald-900">Thank you for your feedback!</p>
              <p className="text-[11px] text-emerald-700">Your review has been recorded in the system.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800 block">Rating:</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-neutral-300 hover:text-amber-400 transition cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          (hoverRating || rating) >= star
                            ? "fill-amber-400 text-amber-400"
                            : "text-neutral-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-neutral-700 ml-2">
                    {rating} of 5 Stars
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-800 block">Comments / Feedback:</label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="e.g. Ustaz Salman is patient and very thorough with tajweed rules..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-950 focus:bg-white transition"
                />
              </div>
              <button
                type="submit"
                disabled={submittingReview}
                className="bg-black hover:bg-neutral-800 text-white text-xs font-bold px-6 py-2.5 rounded-full transition shadow-xs disabled:bg-neutral-300 cursor-pointer"
              >
                {submittingReview ? "Submitting..." : t.submitReview}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default function StudentPortal() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-neutral-500">
        <Loader2 className="w-6 h-6 animate-spin mb-3 text-neutral-900" />
        <p className="text-xs font-medium">Loading Pocket Tahfiz...</p>
      </div>
    }>
      <PortalContent />
    </Suspense>
  );
}
