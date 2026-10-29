"use client";

import Link from "next/link";
import { 
  Lock, 
  BookOpen, 
  Target, 
  CheckCircle2, 
  ShieldCheck, 
  Compass, 
  BarChart3, 
  Sparkles,
  ArrowRight
} from "lucide-react";

// 1. We import the global language memory hook here
import { useLanguage, Language } from "@/context/LanguageContext";

interface GoalContent {
  nav: { instructors: string; goals: string; portal: string };
  badge: string;
  title: string;
  subtitle: string;
  missionHeading: string;
  missionText: string;
  pillarsTitle: string;
  pillars: { num: string; tag: string; title: string; desc: string }[];
  commitmentTitle: string;
  commitmentDesc: string;
  ctaText: string;
  footerAbout: string;
  footerRights: string;
}

const translations: Record<Language, GoalContent> = {
  en: {
    nav: { instructors: "Instructors", goals: "Our Goals", portal: "Student Portal" },
    badge: "Mission & Architecture",
    title: "Clarity, Mastery, and Respect.",
    subtitle: "Reimagining Quranic instruction by uniting authentic oral tradition with modern, accountable learning workflows.",
    missionHeading: "The Vision Behind Pocket Tahfiz",
    missionText: "Traditional talaqqi is irreplaceable. What was missing was an effortless system that honors the student's progress: eliminating scattered communication, making lesson attendance completely transparent, and visualizing every memorized page with absolute clarity.",
    pillarsTitle: "The Three Core Pillars",
    pillars: [
      {
        num: "01",
        tag: "Authenticity",
        title: "Rigorous Oral Talaqqi",
        desc: "Preserving the chain of oral transmission with uncompromising standards in makhraj, siffat, and tajweed theory."
      },
      {
        num: "02",
        tag: "Measurability",
        title: "604-Page Visual Accountability",
        desc: "Every single page of the Mushaf has an exact state. Students and parents see continuous, visible progression instead of guesswork."
      },
      {
        num: "03",
        tag: "Dignity & Structure",
        title: "Mutual Trust & Respect",
        desc: "Two-way attendance sign-offs and straightforward tuition verification honor both the student's dedication and the teacher's livelihood."
      }
    ],
    commitmentTitle: "A Lifelong Commitment to the Quran",
    commitmentDesc: "Whether reciting page 1 or revising page 604, we are committed to building confident reciters who carry the Quran with deep technical mastery and spiritual reverence.",
    ctaText: "Begin Your Learning Journey",
    footerAbout: "Pocket Tahfiz elevates traditional Quranic education with modern clarity, structure, and respect.",
    footerRights: "All rights reserved."
  },
  ms: {
    nav: { instructors: "Tenaga Pengajar", goals: "Matlamat Kami", portal: "Portal Pelajar" },
    badge: "Misi & Visi",
    title: "Kejelasan, Mutqin, dan Integriti.",
    subtitle: "Membina semula ekosistem bimbingan Al-Quran dengan menggabungkan tradisi talaqqi muktabar bersama sistem pemantauan moden yang telus.",
    missionHeading: "Visi di Sebalik Pocket Tahfiz",
    missionText: "Kaedah talaqqi bersanad tidak dapat diganti. Namun, apa yang diperlukan ialah sistem yang memudahkan pelajar dan ibu bapa: menghapuskan kekeliruan jadual, merekod kehadiran secara telus, dan memetakan setiap halaman hafazan dengan jelas.",
    pillarsTitle: "Tiga Tonggak Utama",
    pillars: [
      {
        num: "01",
        tag: "Keaslian",
        title: "Talaqqi Musyafahah yang Teliti",
        desc: "Memelihara tradisi sanad bacaan dengan disiplin ketat dalam sebutan makhraj, sifat huruf, dan kefahaman tajwid."
      },
      {
        num: "02",
        tag: "Kebolehukuran",
        title: "Pemetaan Visual 604 Muka Surat",
        desc: "Setiap halaman mushaf dipantau statusnya. Murid dan waris dapat melihat peningkatan secara nyata, bukan sekadar anggaran."
      },
      {
        num: "03",
        tag: "Integriti & Ihsan",
        title: "Amanah Bersama Guru dan Pelajar",
        desc: "Pengesahan kehadiran dua hala dan pengurusan yuran yang mudah memuliakan usaha murid serta menghargai khidmat pendidik."
      }
    ],
    commitmentTitle: "Komitmen Sepanjang Hayat Bersama Al-Quran",
    commitmentDesc: "Daripada surah Al-Fatihah hingga khatam 30 juzuk, matlamat kami adalah melahirkan generasi pembaca yang membaca dengan yakin, tepat, dan beradab.",
    ctaText: "Akses Portal Pelajar",
    footerAbout: "Pocket Tahfiz memartabatkan tradisi talaqqi Al-Quran dengan kejelasan teknologi dan integriti.",
    footerRights: "Hak cipta terpelihara."
  },
  ar: {
    nav: { instructors: "المعلمون", goals: "أهدافنا", portal: "بوابة الطالب" },
    badge: "الرؤية والمنهج",
    title: "وضوح، إتقان، وأمانة.",
    subtitle: "الارتقاء بتعليم القرآن الكريم من خلال الجمع بين أصالة المشاهة وأحدث تقنيات المتابعة والتوثيق.",
    missionHeading: "الرؤية التي انطلق منها بوكيت تحفيظ",
    missionText: "لا غنى عن التلقي والمشافهة وجهًا لوجه. هدفنا توفير بيئة تعليمية ذكية تحفظ حق الطالب والمعلم: من خلال إزالة أي لبس في الحضور، والشفافية الكاملة في المتابعة، والتمثيل البصري الدقيق لمراحل الختم والإتقان.",
    pillarsTitle: "الركائز الأساسية الثلاث",
    pillars: [
      {
        num: "٠١",
        tag: "الأصالة",
        title: "تلقٍ متصل السند والضبط",
        desc: "المحافظة على أصول التلاوة مع العناية بمخارج الحروف وصفاتها والوقف والابتداء دون تهاون."
      },
      {
        num: "٠٢",
        tag: "الدقة",
        title: "متابعة بصرية لـ ٦٠٤ صفحات",
        desc: "كل صفحة من صفحات المصحف موثقة بحالتها الدقيقة، ليرى الطالب وولي أمره ثمرة الجهد خطوة بخطوة."
      },
      {
        num: "٠٣",
        tag: "الأمانة",
        title: "ثقة متبادلة وتوثيق منظم",
        desc: "توثيق الحضور والرسوم برضا وشفافية بين المعلم والطالب صونًا لوقت الجميع وحفظًا للحقوق."
      }
    ],
    commitmentTitle: "عهد دائم مع كتاب الله",
    commitmentDesc: "من الصفحة الأولى إلى الختام، نسعى لتخريج قرّاء وحفّاظ يحملون كتاب الله إتقانًا وعملًا ووقارًا.",
    ctaText: "دخول بوابة الطالب",
    footerAbout: "بوكيت تحفيظ: الارتقاء بتعليم كتاب الله بالجمع بين أصالة الإسناد ووضوح التقنية.",
    footerRights: "جميع الحقوق محفوظة."
  }
};

export default function GoalsPage() {
  // 2. Listen to global language context instead of local state
  const { lang, setLanguage, isRTL } = useLanguage();
  const t = translations[lang] || translations.en;

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      {/* Frosted Glass Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-neutral-200/40">
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
            <Link href="/goals" className="text-black font-semibold">
              {t.nav.goals}
            </Link>
            <Link href="/portal" className="hover:text-black transition">
              {t.nav.portal}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Global Language Switcher Buttons */}
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

            <Link href="/admin" title="Admin Portal" className="p-2 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition">
              <Lock className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 border border-neutral-200/60 text-[11px] font-medium tracking-tight text-neutral-600 mb-6">
          <Target className="w-3 h-3 text-neutral-900" />
          <span>{t.badge}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-neutral-950 leading-tight max-w-2xl mb-4">
          {t.title}
        </h1>
        <p className="text-sm sm:text-base text-neutral-500 max-w-xl leading-relaxed">
          {t.subtitle}
        </p>
      </header>

      {/* Mission Statement Block */}
      <section className="max-w-5xl mx-auto px-6 pb-24 space-y-12">
        <div className="bg-[#f5f5f7] rounded-3xl p-8 sm:p-12 border border-neutral-200/60">
          <span className="text-[10px] uppercase tracking-widest font-semibold text-neutral-400 block mb-3">
            {t.missionHeading}
          </span>
          <p className="text-base sm:text-lg text-neutral-800 leading-relaxed font-normal">
            &ldquo;{t.missionText}&rdquo;
          </p>
        </div>

        {/* The 3 Pillars */}
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-950 mb-6 text-center sm:text-left">
            {t.pillarsTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.pillars.map((p) => (
              <div key={p.num} className="bg-[#f5f5f7] rounded-3xl p-8 border border-neutral-200/60 flex flex-col justify-between hover:border-neutral-300 transition-all duration-300">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-neutral-400">{p.num}</span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold bg-white px-2.5 py-0.5 rounded-full border border-neutral-200/60 text-neutral-600">
                      {p.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-950 tracking-tight mb-2">
                    {p.title}
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commitment Banner */}
        <div className="bg-neutral-950 text-white rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
          <div className="max-w-xl space-y-2">
            <h3 className="text-xl font-semibold tracking-tight text-white">
              {t.commitmentTitle}
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t.commitmentDesc}
            </p>
          </div>

          <Link
            href="/portal"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-neutral-950 hover:bg-neutral-100 text-xs font-semibold tracking-tight transition shrink-0 cursor-pointer"
          >
            <span>{t.ctaText}</span>
            <ArrowRight className={`w-3.5 h-3.5 ${isRTL ? "rotate-180" : ""}`} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200/40 bg-[#f5f5f7] py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-xs font-semibold text-neutral-900 tracking-tight block">Pocket Tahfiz</span>
            <p className="text-[11px] text-neutral-400 max-w-sm">{t.footerAbout}</p>
          </div>
          <div className="flex items-center gap-6 text-xs text-neutral-500">
            <Link href="/" className="hover:text-black transition">Home</Link>
            <Link href="/instructors" className="hover:text-black transition">{t.nav.instructors}</Link>
            <Link href="/portal" className="hover:text-black transition">{t.nav.portal}</Link>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-6 pt-6 border-t border-neutral-200/40 text-center text-[10px] text-neutral-400">
          © {new Date().getFullYear()} Pocket Tahfiz. {t.footerRights}
        </div>
      </footer>
    </div>
  );
}
