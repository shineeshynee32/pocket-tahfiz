"use client";

import Link from "next/link";
import { 
  Lock, 
  ArrowRight, 
  BookOpen, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  CalendarCheck,
  CreditCard,
  ChevronRight
} from "lucide-react";

// Import global language context hook
import { useLanguage, Language } from "@/context/LanguageContext";

interface TranslationContent {
  nav: {
    instructors: string;
    goals: string;
    portal: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    ctaPortal: string;
    ctaGoals: string;
  };
  bento: {
    card1: {
      tag: string;
      title: string;
      desc: string;
      meta: string;
    };
    card2: {
      tag: string;
      title: string;
      desc: string;
      stat: string;
      statLabel: string;
    };
    card3: {
      tag: string;
      title: string;
      desc: string;
      status1: string;
      status2: string;
    };
  };
  footer: {
    about: string;
    rights: string;
  };
}

const translations: Record<Language, TranslationContent> = {
  en: {
    nav: {
      instructors: "Instructors",
      goals: "Our Goals",
      portal: "Student Portal"
    },
    hero: {
      badge: "A New Standard for Quranic Mentorship",
      title: "Master the Quran with Precision.",
      subtitle: "Personalized 1-on-1 talaqqi combining classical tajweed mastery with an effortless modern student tracking portal.",
      ctaPortal: "Open Student Portal",
      ctaGoals: "Explore Our Goals"
    },
    bento: {
      card1: {
        tag: "Classical Talaqqi",
        title: "1-on-1 Mentorship & Sanad",
        desc: "Direct recitation with certified tutors. Focused articulation of makhraj, siffat, and waqf rules at your personal learning pace.",
        meta: "Mutah University & Classical Qira'at Background"
      },
      card2: {
        tag: "Interactive Mushaf",
        title: "604-Page Quran Density Tracker",
        desc: "Every single page of the Mushaf mapped visually. Track completed tilawah, revision intervals, and hifz retention page-by-page.",
        stat: "604 Pages",
        statLabel: "Live visual milestone mapping"
      },
      card3: {
        tag: "Zero Ambiguity",
        title: "Mutual Attendance & Clear Billing",
        desc: "Both tutor and student confirm session completion. Upload monthly transfer slips directly to eliminate payment disputes.",
        status1: "Two-Way Attendance Verified",
        status2: "Direct Slip Verification"
      }
    },
    footer: {
      about: "Pocket Tahfiz elevates traditional Quranic education with modern clarity, structure, and respect.",
      rights: "All rights reserved."
    }
  },
  ms: {
    nav: {
      instructors: "Tenaga Pengajar",
      goals: "Matlamat Kami",
      portal: "Portal Pelajar"
    },
    hero: {
      badge: "Piawaian Baharu Bimbingan Al-Quran",
      title: "Kuasai Al-Quran dengan Tepat & Bertajwid.",
      subtitle: "Bimbingan talaqqi 1-lawan-1 yang menggabungkan disiplin ilmu tajwid sanad dengan portal pemantauan prestasi moden.",
      ctaPortal: "Buka Portal Pelajar",
      ctaGoals: "Ketahui Matlamat Kami"
    },
    bento: {
      card1: {
        tag: "Talaqqi Mu'tabar",
        title: "Bimbingan 1-on-1 & Sanad",
        desc: "Bacaan bersemuka secara langsung bersama pendidik bertauliah. Perincian makhraj, sifat huruf, dan waqf mengikut rentak anda.",
        meta: "Lulusan Universiti Mu'tah & Khusus Qiraat"
      },
      card2: {
        tag: "Mushaf Interaktif",
        title: "Pemetaan 604 Muka Surat Al-Quran",
        desc: "Setiap helaian mushaf direkod secara visual. Pantau tilawah harian, giliran muraja'ah, dan mutqin hafazan secara terus.",
        stat: "604 Muka Surat",
        statLabel: "Pemantauan kemajuan masa nyata"
      },
      card3: {
        tag: "Integriti Penuh",
        title: "Pengesahan Dua Hala & Yuran Telus",
        desc: "Kedua-dua guru dan pelajar mengesahkan kehadiran setiap sesi. Muat naik resit yuran secara terus tanpa kekeliruan.",
        status1: "Kehadiran Disahkan Bersama",
        status2: "Pengesahan Resit Mudah"
      }
    },
    footer: {
      about: "Pocket Tahfiz memartabatkan tradisi talaqqi Al-Quran dengan kejelasan teknologi dan integriti.",
      rights: "Hak cipta terpelihara."
    }
  },
  ar: {
    nav: {
      instructors: "المعلمون",
      goals: "أهدافنا",
      portal: "بوابة الطالب"
    },
    hero: {
      badge: "معيار جديد لإتقان القرآن الكريم",
      title: "إتقان تلاوة القرآن الكريم وضبطه.",
      subtitle: "تلقٍ فردي مباشر يجمع بين أصول التجويد والإسناد، ونظام رقمي حديث لمتابعة الحفظ والإنجاز بدقة وسلاسة.",
      ctaPortal: "دخول بوابة الطالب",
      ctaGoals: "استكشف أهدافنا"
    },
    bento: {
      card1: {
        tag: "أصالة التلقي",
        title: "تلقٍ ومشافهة فردية بالسند",
        desc: "عرض القرآن الكريم على شيوخ مجازين مع العناية بمخارج الحروف وصفاتها وأحكام الوقف والابتداء وفق قدرة الطالب.",
        meta: "خريجو جامعة مؤتة ومتخصصو القراءات"
      },
      card2: {
        tag: "مصحف تفاعلي",
        title: "خريطة إنجاز المصحف (٦٠٤ صفحة)",
        desc: "متابعة بصرية دقيقة لكل صفحة من صفحات المصحف الشريف، تشمل التلاوة اليومية وتثبيت الحفظ والمراجعة الدورية.",
        stat: "٦٠٤ صفحات",
        statLabel: "لوحة بيانية دقيقة لكل خطوة"
      },
      card3: {
        tag: "وضوح وأمانة",
        title: "توثيق الحضور والرسوم بكل شفافية",
        desc: "تأكيد مشترك لكل حصة من المعلم والطالب معًا، مع إمكانية رفع إيصالات التحويل لضمان الدقة والاطمئنان.",
        status1: "حضور مؤكد من الطرفين",
        status2: "توثيق مباشر للإيصالات"
      }
    },
    footer: {
      about: "بوكيت تحفيظ: الارتقاء بتعليم كتاب الله بالجمع بين أصالة الإسناد ووضوح التقنية.",
      rights: "جميع الحقوق محفوظة."
    }
  }
};

export default function LandingPage() {
  const { lang, setLanguage, isRTL } = useLanguage();
  const t = translations[lang] || translations.en;

  return (
    <div 
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white"
    >
      {/* 1. Frosted Glass Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-neutral-200/40 transition-all">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 rounded-lg bg-black text-white flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-neutral-950 group-hover:opacity-80 transition">
              Pocket Tahfiz
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-xs font-normal text-neutral-500">
            <Link href="/instructors" className="hover:text-black transition">
              {t.nav.instructors}
            </Link>
            <Link href="/goals" className="hover:text-black transition">
              {t.nav.goals}
            </Link>
            <Link href="/portal" className="hover:text-black transition">
              {t.nav.portal}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Toggle Segmented Pill */}
            <div className="inline-flex p-0.5 rounded-full bg-neutral-100 border border-neutral-200/60 text-[11px] font-medium">
              {(["en", "ms", "ar"] as Language[]).map((locale) => (
                <button
                  key={locale}
                  type="button"
                  onClick={() => setLanguage(locale)}
                  className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                    lang === locale
                      ? "bg-white text-neutral-950 shadow-xs font-semibold"
                      : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  {locale === "en" ? "EN" : locale === "ms" ? "BM" : "عربي"}
                </button>
              ))}
            </div>

            {/* Admin Lock Shortcut */}
            <Link 
              href="/admin" 
              title="Admin Portal"
              className="p-2 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition"
            >
              <Lock className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <header className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200/60 text-[11px] font-medium tracking-tight text-neutral-600 mb-8">
          <Sparkles className="w-3 h-3 text-neutral-900" />
          <span>{t.hero.badge}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-neutral-950 leading-[1.08] max-w-3xl mb-6">
          {t.hero.title}
        </h1>

        <p className="text-base sm:text-lg text-neutral-500 font-normal leading-relaxed max-w-xl mb-10">
          {t.hero.subtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/portal"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-black text-white hover:bg-neutral-800 text-xs font-medium tracking-tight transition cursor-pointer"
          >
            <span>{t.hero.ctaPortal}</span>
            <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? "rotate-180" : ""}`} />
          </Link>
          <Link
            href="/goals"
            className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3 rounded-full bg-[#f5f5f7] hover:bg-neutral-200/80 text-neutral-900 text-xs font-medium tracking-tight transition cursor-pointer"
          >
            {t.hero.ctaGoals}
          </Link>
        </div>
      </header>

      {/* 3. Apple-Style Bento Grid */}
      <section className="max-w-6xl mx-auto px-6 pb-28">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Talaqqi */}
          <div className="bg-[#f5f5f7] rounded-3xl p-8 border border-neutral-200/60 flex flex-col justify-between hover:border-neutral-300 transition-all duration-300">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-neutral-400 block mb-2">
                {t.bento.card1.tag}
              </span>
              <h3 className="text-xl font-semibold text-neutral-950 tracking-tight mb-3">
                {t.bento.card1.title}
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {t.bento.card1.desc}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-200/60 flex items-center gap-2.5 text-neutral-900">
              <ShieldCheck className="w-4 h-4 shrink-0 text-neutral-800" />
              <span className="text-[11px] font-medium text-neutral-700">
                {t.bento.card1.meta}
              </span>
            </div>
          </div>

          {/* Card 2: 604-Page Density Grid */}
          <div className="md:col-span-2 bg-[#f5f5f7] rounded-3xl p-8 border border-neutral-200/60 flex flex-col justify-between hover:border-neutral-300 transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-neutral-400 block mb-2">
                  {t.bento.card2.tag}
                </span>
                <h3 className="text-xl font-semibold text-neutral-950 tracking-tight mb-2">
                  {t.bento.card2.title}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed max-w-md">
                  {t.bento.card2.desc}
                </p>
              </div>
              <div className="text-right sm:shrink-0">
                <span className="text-2xl font-semibold tracking-tight text-neutral-950 block">
                  {t.bento.card2.stat}
                </span>
                <span className="text-[10px] text-neutral-400 font-medium">
                  {t.bento.card2.statLabel}
                </span>
              </div>
            </div>

            {/* Visual Micro Density Map Simulation */}
            <div className="p-4 bg-white rounded-2xl border border-neutral-200/70 shadow-2xs">
              <div className="grid grid-cols-24 sm:grid-cols-32 gap-1">
                {Array.from({ length: 96 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-2xs transition-colors duration-500 ${
                      i < 34 
                        ? "bg-neutral-950" 
                        : i < 52 
                        ? "bg-neutral-400" 
                        : "bg-neutral-100"
                    }`}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-neutral-400 px-0.5">
                <span>Al-Fatihah (p. 1)</span>
                <span className="font-mono text-neutral-600">Surah An-Nas (p. 604)</span>
              </div>
            </div>
          </div>

          {/* Card 3: Dual Attendance & Transparent Billing */}
          <div className="md:col-span-3 bg-[#f5f5f7] rounded-3xl p-8 border border-neutral-200/60 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-neutral-300 transition-all duration-300">
            <div className="max-w-xl">
              <span className="text-[10px] uppercase tracking-widest font-semibold text-neutral-400 block mb-2">
                {t.bento.card3.tag}
              </span>
              <h3 className="text-xl font-semibold text-neutral-950 tracking-tight mb-2">
                {t.bento.card3.title}
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                {t.bento.card3.desc}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <div className="px-4 py-3 rounded-2xl bg-white border border-neutral-200/70 flex items-center gap-3">
                <CalendarCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-medium text-neutral-800">
                  {t.bento.card3.status1}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>

              <div className="px-4 py-3 rounded-2xl bg-white border border-neutral-200/70 flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-neutral-900" />
                <span className="text-xs font-medium text-neutral-800">
                  {t.bento.card3.status2}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Minimalist Apple-Style Footer */}
      <footer className="border-t border-neutral-200/40 bg-[#f5f5f7] py-14">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-xs font-semibold text-neutral-900 tracking-tight block">
              Pocket Tahfiz
            </span>
            <p className="text-[11px] text-neutral-400 max-w-sm">
              {t.footer.about}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-500">
            <Link href="/instructors" className="hover:text-black transition">
              {t.nav.instructors}
            </Link>
            <Link href="/goals" className="hover:text-black transition">
              {t.nav.goals}
            </Link>
            <Link href="/portal" className="hover:text-black transition">
              {t.nav.portal}
            </Link>
            <Link href="/admin" className="hover:text-black transition inline-flex items-center gap-1">
              <span>Admin</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 mt-8 pt-6 border-t border-neutral-200/40 text-center text-[10px] text-neutral-400">
          © {new Date().getFullYear()} Pocket Tahfiz. {t.footer.rights}
        </div>
      </footer>
    </div>
  );
}
