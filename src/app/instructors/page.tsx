"use client";

import Link from "next/link";
import { 
  Lock, 
  BookOpen, 
  Award, 
  GraduationCap, 
  CheckCircle2, 
  Sparkles, 
  Layers,
  ChevronRight
} from "lucide-react";

// 1. Import our global memory box hook instead of React's useState
import { useLanguage, Language } from "@/context/LanguageContext";

interface InstructorContent {
  nav: { instructors: string; goals: string; portal: string };
  badge: string;
  title: string;
  subtitle: string;
  instructorName: string;
  instructorRole: string;
  instructorDegree: string;
  instructorBio: string;
  highlightsTitle: string;
  highlights: { title: string; desc: string }[];
  methodologyTitle: string;
  methodologyDesc: string;
  footerAbout: string;
  footerRights: string;
}

const translations: Record<Language, InstructorContent> = {
  en: {
    nav: { instructors: "Instructors", goals: "Our Goals", portal: "Student Portal" },
    badge: "Faculty & Credentials",
    title: "Rooted in Tradition. Guided with Care.",
    subtitle: "Direct oral transmission (talaqqi musyafahah) led by qualified scholars trained in classical Arabic and Quranic recitation sciences.",
    instructorName: "Ustaz Salman Zulkifle",
    instructorRole: "Founder & Lead Quran Mentor",
    instructorDegree: "Bachelor of Arts in Islamic Studies, Mutah University (Jordan)",
    instructorBio: "Trained abroad in the heart of Jordan's academic and traditional recitation circles, Ustaz Salman specializes in bridging classical tajweed discipline with a structured, individualized approach tailored for modern students.",
    highlightsTitle: "Qualifications & Core Strengths",
    highlights: [
      {
        title: "Mutah University Graduate",
        desc: "Comprehensive training in classical Arabic linguistics, shariah foundations, and quranic sciences in Karak, Jordan."
      },
      {
        title: "Classical Talaqqi & Sanad Focus",
        desc: "Rigorous attention to makharij al-huruf (points of articulation), siffat (phonetic qualities), and accurate waqf & ibtida' application."
      },
      {
        title: "Individualized Student Pacing",
        desc: "Adapting instruction to the student's unique learning rhythm—whether building foundational literacy or refining advanced memorization."
      }
    ],
    methodologyTitle: "The Teaching Philosophy",
    methodologyDesc: "Every student's relationship with the Quran is personal. We replace rigid, intimidating classrooms with calm, continuous encouragement and measurable milestones, ensuring precision without burnout.",
    footerAbout: "Pocket Tahfiz elevates traditional Quranic education with modern clarity, structure, and respect.",
    footerRights: "All rights reserved."
  },
  ms: {
    nav: { instructors: "Tenaga Pengajar", goals: "Matlamat Kami", portal: "Portal Pelajar" },
    badge: "Kelayakan & Guru",
    title: "Berakar pada Tradisi. Dibimbing Penuh Dedikasi.",
    subtitle: "Pembelajaran bersemuka secara talaqqi dan musyafahah bersama pendidik berkelulusan ilmu pengajian Islam dan qira'at.",
    instructorName: "Ustaz Salman Zulkifle",
    instructorRole: "Pengasas & Pembimbing Utama",
    instructorDegree: "Sarjana Muda Pengajian Islam, Universiti Mu'tah (Jordan)",
    instructorBio: "Mendapat pendidikan di Jordan dalam pengajian Islam dan lingkungan talaqqi tradisi. Menggabungkan ketelitian tajwid sanad dengan pendekatan pengajaran moden yang membina keyakinan pelajar.",
    highlightsTitle: "Kelayakan & Kekuatan Utama",
    highlights: [
      {
        title: "Lulusan Universiti Mu'tah, Jordan",
        desc: "Latihan intensif dalam pengajian bahasa Arab klasik, syariah, dan disiplin ilmu tafsir serta qiraat di bumi Jordan."
      },
      {
        title: "Penekanan Talaqqi & Musyafahah",
        desc: "Tumpuan mendalam terhadap makhraj huruf, sifat sebutan, dan hukum wakaf & ibtida' secara bersemuka."
      },
      {
        title: "Bimbingan Mengikut Rentak Murid",
        desc: "Pendekatan tersuai untuk setiap pelajar, sama ada memantapkan tilawah asas mahupun hafazan juzuk lanjutan."
      }
    ],
    methodologyTitle: "Falsafah Pengajaran",
    methodologyDesc: "Hubungan setiap insan dengan Al-Quran adalah unik. Kami menggantikan suasana kelas yang tegang dengan dorongan sabar dan pemantauan berjadual demi melahirkan bacaan bertajwid dan mutqin.",
    footerAbout: "Pocket Tahfiz memartabatkan tradisi talaqqi Al-Quran dengan kejelasan teknologi dan integriti.",
    footerRights: "Hak cipta terpelihara."
  },
  ar: {
    nav: { instructors: "المعلمون", goals: "أهدافنا", portal: "بوابة الطالب" },
    badge: "الهيئة التعليمية والمؤهلات",
    title: "أصالة في السند. عناية في التوجيه.",
    subtitle: "تلقٍ ومشافهة مباشرة بإشراف معلمين متخصصين في علوم الشريعة وأصول القراءات والتجويد.",
    instructorName: "الأستاذ سلمان ذو الكفل",
    instructorRole: "المؤسس والمشرف التعليمي",
    instructorDegree: "بكالوريوس في الدراسات الإسلامية، جامعة مؤتة (الأردن)",
    instructorBio: "تلقى علومه الشرعية والقرآنية في الأردن على أيدي شيوخ وأكاديميين معتمدين، جامعًا بين دقة الضبط التجويدي وأسلوب التعليم الفردي المحفّز.",
    highlightsTitle: "المؤهلات وأبرز الركائز",
    highlights: [
      {
        title: "خريج جامعة مؤتة - الأردن",
        desc: "دراسة أكاديمية متعمقة في العلوم الإسلامية واللغة العربية وعلوم القرآن والتفسير."
      },
      {
        title: "العناية بالمشافهة والضبط",
        desc: "تصحيح مخارج الحروف وصفاتها وأحكام الوقف والابتداء وفق أصول التلاوة السليمة."
      },
      {
        title: "مراعاة الفروق الفردية",
        desc: "تحديد مسار تعليمي خاص بكل طالب يناسب مستواه وسرعة استيعابه في التلاوة والحفظ."
      }
    ],
    methodologyTitle: "فلسفة التعليم",
    methodologyDesc: "نؤمن بأن حفظ القرآن وإتقانه يتطلب الصبر والمتابعة المستمرة. نهدف إلى غرس محبة كتاب الله في نفوس الطلاب من خلال بيئة تعليمية وقورة ومنظمة.",
    footerAbout: "بوكيت تحفيظ: الارتقاء بتعليم كتاب الله بالجمع بين أصالة الإسناد ووضوح التقنية.",
    footerRights: "جميع الحقوق محفوظة."
  }
};

export default function InstructorsPage() {
  // 2. We use our global language hook instead of local React useState
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
            <Link href="/instructors" className="text-black font-semibold">
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
            {/* Global Language Switcher Buttons */}
            <div className="inline-flex p-0.5 rounded-full bg-neutral-100 border border-neutral-200/60 text-[11px] font-medium">
              {(["en", "ms", "ar"] as Language[]).map((locale) => (
                <button
                  key={locale}
                  type="button"
                  // 3. We call setLanguage from our global hook here!
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
          <Sparkles className="w-3 h-3 text-neutral-900" />
          <span>{t.badge}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-neutral-950 leading-tight max-w-2xl mb-4">
          {t.title}
        </h1>
        <p className="text-sm sm:text-base text-neutral-500 max-w-xl leading-relaxed">
          {t.subtitle}
        </p>
      </header>

      {/* Instructor Profile Card */}
      <section className="max-w-5xl mx-auto px-6 pb-24 space-y-8">
        <div className="bg-[#f5f5f7] rounded-3xl p-8 sm:p-12 border border-neutral-200/60 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-neutral-950 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Award className="w-10 h-10 text-neutral-200" />
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                <span>{t.instructorRole}</span>
                <span className="w-1 h-1 rounded-full bg-neutral-300" />
                <span className="inline-flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="w-3 h-3" /> Certified
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-950">
                {t.instructorName}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-neutral-600 flex items-center gap-1.5 mt-1">
                <GraduationCap className="w-4 h-4 text-neutral-800" />
                <span>{t.instructorDegree}</span>
              </p>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed pt-2 border-t border-neutral-200/60">
              {t.instructorBio}
            </p>
          </div>
        </div>

        {/* Bento Grid Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {t.highlights.map((h, i) => (
            <div key={i} className="bg-[#f5f5f7] rounded-3xl p-6 border border-neutral-200/60 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-neutral-400 block mb-3">0{i + 1}</span>
                <h3 className="text-base font-semibold text-neutral-950 tracking-tight mb-2">
                  {h.title}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {h.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Teaching Philosophy Banner */}
        <div className="bg-[#f5f5f7] rounded-3xl p-8 border border-neutral-200/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900">
              <Layers className="w-4 h-4" />
              <span>{t.methodologyTitle}</span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              {t.methodologyDesc}
            </p>
          </div>

          <Link
            href="/portal"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-black text-white hover:bg-neutral-800 text-xs font-medium tracking-tight transition shrink-0 cursor-pointer"
          >
            <span>{t.nav.portal}</span>
            <ChevronRight className={`w-3.5 h-3.5 ${isRTL ? "rotate-180" : ""}`} />
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
            <Link href="/goals" className="hover:text-black transition">{t.nav.goals}</Link>
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
