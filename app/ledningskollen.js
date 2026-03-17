"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { QRCodeSVG } from "qrcode.react";

const RadarChart = dynamic(() => import("recharts").then(m => m.RadarChart), { ssr: false });
const PolarGrid = dynamic(() => import("recharts").then(m => m.PolarGrid), { ssr: false });
const PolarAngleAxis = dynamic(() => import("recharts").then(m => m.PolarAngleAxis), { ssr: false });
const PolarRadiusAxis = dynamic(() => import("recharts").then(m => m.PolarRadiusAxis), { ssr: false });
const Radar = dynamic(() => import("recharts").then(m => m.Radar), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });

const QUESTIONS = [
  { id: 1, text: "Vår ledningsgrupp har en gemensam bild av vad digitalisering innebär för vår verksamhet.", dim: 0 },
  { id: 2, text: "Vi har en tydlig digital strategi som är kopplad till våra övergripande verksamhetsmål.", dim: 0 },
  { id: 3, text: "Digitaliseringsfrågor är en stående punkt på ledningsgruppens agenda.", dim: 0 },
  { id: 4, text: "Vi kan prioritera mellan digitala initiativ baserat på tydliga kriterier.", dim: 1 },
  { id: 5, text: "Det finns en utsedd funktion som äger den digitala utvecklingen.", dim: 1 },
  { id: 6, text: "Vi mäter och följer upp effekterna av våra digitala satsningar.", dim: 2 },
  { id: 7, text: "Vår organisation har tillräcklig kompetens för att leda digital förändring.", dim: 2 },
  { id: 8, text: "Vi har en plan för hur AI ska användas i vår verksamhet.", dim: 3 },
  { id: 9, text: "Vi förstår hur regelverk som GDPR, AI-förordningen och NIS2 påverkar vår digitala utveckling.", dim: 3 },
  { id: 10, text: "Vi har förmåga att genomföra beslutade digitala förändringar i praktiken.", dim: 3 },
];

const DIMENSIONS = [
  { key: "gemensam", label: "Gemensam bild", questions: [0, 1, 2] },
  { key: "strategisk", label: "Strategisk koppling", questions: [3, 4] },
  { key: "prioritering", label: "Prioritering & beslut", questions: [5, 6] },
  { key: "genomforande", label: "Genomförandeförmåga", questions: [7, 8, 9] },
];

const LEVELS = [
  { min: 10, max: 18, label: "Startläge", color: "#f87171", bg: "rgba(239,68,68,0.12)", desc: "Digitaliseringen drivs reaktivt. Det saknas en gemensam riktning och ledningen har ännu inte tagit ett aktivt ägarskap för den digitala utvecklingen." },
  { min: 19, max: 26, label: "Medveten", color: "#fb923c", bg: "rgba(251,146,60,0.12)", desc: "Insikten finns men strukturerna saknas. Enskilda initiativ pågår utan sammanhållen styrning. Risken är att energi sprids utan att skapa varaktig förflyttning." },
  { min: 27, max: 34, label: "Strukturerad", color: "#c084fc", bg: "rgba(168,85,247,0.12)", desc: "Grunden är lagd med strategi och roller, men genomförandet haltar. Gapet mellan plan och praktik behöver överbryggas." },
  { min: 35, max: 42, label: "Drivande", color: "#60a5fa", bg: "rgba(59,130,246,0.12)", desc: "Organisationen leder aktivt sin digitala förflyttning. Styrning, kompetens och uppföljning samverkar. Fokus bör nu ligga på att skala och förfina." },
  { min: 43, max: 50, label: "Ledande", color: "#4ade80", bg: "rgba(34,197,94,0.12)", desc: "Digital mognad är integrerad i ledarskapet. Organisationen driver förnyelse proaktivt och anpassar sig snabbt till nya förutsättningar." },
];

const SCALE_LABELS = ["Instämmer inte alls", "Instämmer i låg grad", "Delvis", "Instämmer i hög grad", "Instämmer helt"];

function getLevel(score) {
  return LEVELS.find(l => score >= l.min && score <= l.max) || LEVELS[0];
}

function CircularProgress({ score, maxScore = 50, color, size = 140, lightMode = false }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = animatedScore / maxScore;

  useEffect(() => {
    let frame;
    const start = performance.now();
    const duration = 1200;
    const animate = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setAnimatedScore(Math.round(score * ease));
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={lightMode ? "#e5e7eb" : "rgba(113,160,198,0.1)"} strokeWidth="8" />
      <circle
        cx={size/2} cy={size/2} r={radius} fill="none"
        stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - pct)}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 0.1s ease" }}
      />
      <text x={size/2} y={size/2 - 6} textAnchor="middle" fill={color} fontSize="32" fontWeight="800">
        {animatedScore}
      </text>
      <text x={size/2} y={size/2 + 16} textAnchor="middle" fill={lightMode ? "#71A0C6" : "rgba(255,255,255,0.4)"} fontSize="12">
        av {maxScore}
      </text>
    </svg>
  );
}

function DimensionBar({ label, score, maxScore, color, delay = 0, lightMode = false }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth((score / maxScore) * 100), 100 + delay);
    return () => clearTimeout(timer);
  }, [score, maxScore, delay]);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: lightMode ? "#424242" : "rgba(255,255,255,0.7)" }}>{label}</span>
        <span style={{ fontSize: 13, color, fontWeight: 700 }}>{score}/{maxScore}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: lightMode ? "#e5e7eb" : "rgba(113,160,198,0.08)" }}>
        <div style={{
          height: "100%", borderRadius: 4, background: color,
          width: `${width}%`, transition: "width 1s cubic-bezier(0.4,0,0.2,1)"
        }} />
      </div>
    </div>
  );
}

function formatAiAnalysis(text) {
  if (!text) return null;
  // Replace **TEXT** with bold spans, split into paragraphs
  const paragraphs = text.split("\n").filter(line => line.trim());
  return paragraphs.map((para, i) => {
    // Replace **...** with bold text
    const parts = para.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} style={{ marginBottom: i < paragraphs.length - 1 ? 12 : 0 }}>
        {parts.map((part, j) =>
          j % 2 === 1 ? (
            <strong key={j} style={{ fontWeight: 700, color: "#fff", display: "block", fontSize: 15, marginBottom: 4 }}>
              {part}
            </strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
      </p>
    );
  });
}

export default function Ledningskollen() {
  const [phase, setPhase] = useState("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [slideDir, setSlideDir] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const containerRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);

  const dimScores = DIMENSIONS.map(d => {
    const sum = d.questions.reduce((acc, qi) => acc + (answers[qi] || 0), 0);
    const max = d.questions.length * 5;
    return { ...d, score: sum, max };
  });

  const radarData = dimScores.map(d => ({
    subject: d.label,
    value: Math.round((d.score / d.max) * 100),
    fullMark: 100,
  }));

  const weakest = [...dimScores].sort((a, b) => (a.score / a.max) - (b.score / b.max))[0];

  const handleAnswer = (qi, val) => {
    setAnswers(prev => ({ ...prev, [qi]: val }));
  };

  const fetchAiAnalysis = useCallback(async (score, lvl, dims, weak) => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalScore: score,
          level: lvl,
          dimScores: dims,
          weakest: weak,
        }),
      });
      const data = await res.json();
      setAiAnalysis(data.analysis);
    } catch {
      setAiAnalysis("Analysen kunde inte genereras just nu. Kontakta info@curago.se för en personlig genomgång av ert resultat.");
    } finally {
      setAiLoading(false);
    }
  }, []);

  const nextQuestion = () => {
    if (isTransitioning) return;
    if (answers[currentQ] === undefined) return;
    if (currentQ < QUESTIONS.length - 1) {
      setSlideDir(1);
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQ(prev => prev + 1);
        setIsTransitioning(false);
      }, 300);
    } else {
      setPhase("result");
      const score = Object.values(answers).reduce((a, b) => a + b, 0);
      const lvl = getLevel(score);
      const dims = DIMENSIONS.map(d => {
        const sum = d.questions.reduce((acc, qi) => acc + (answers[qi] || 0), 0);
        const max = d.questions.length * 5;
        return { ...d, score: sum, max };
      });
      const weak = [...dims].sort((a, b) => (a.score / a.max) - (b.score / b.max))[0];
      fetchAiAnalysis(score, lvl, dims, weak);
    }
  };

  const prevQuestion = () => {
    if (isTransitioning || currentQ === 0) return;
    setSlideDir(-1);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentQ(prev => prev - 1);
      setIsTransitioning(false);
    }, 300);
  };

  const restart = () => {
    setPhase("intro");
    setCurrentQ(0);
    setAnswers({});
    setAiAnalysis(null);
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const el = resultRef.current;
      if (!el) return;

      // Apply light mode class for PDF capture
      el.setAttribute("data-pdf-export", "true");

      // Wait for re-render
      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(el, {
        backgroundColor: "#F2F2F2",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // Remove light mode
      el.removeAttribute("data-pdf-export");

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF("p", "mm", "a4");
      const pageHeight = 297;

      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      } else {
        let position = 0;
        let remaining = imgHeight;
        while (remaining > 0) {
          if (position > 0) pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, -position, imgWidth, imgHeight);
          position += pageHeight;
          remaining -= pageHeight;
        }
      }

      const date = new Date().toISOString().split("T")[0];
      pdf.save(`ledningspuls-resultat-${date}.pdf`);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  const level = getLevel(totalScore || 10);

  if (!mounted) return null;

  // Check if we're in PDF export mode via data attribute
  const isPdfExport = false; // This is for initial render; the actual PDF uses data-attribute CSS

  return (
    <div ref={containerRef} style={{
      minHeight: "100vh", background: "#03070C", color: "#fff",
      position: "relative", overflow: "hidden",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: "-30%", right: "-20%", width: "60vw", height: "60vw",
        borderRadius: "50%", background: "radial-gradient(circle, rgba(0,46,91,0.15) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: "-20%", left: "-10%", width: "40vw", height: "40vw",
        borderRadius: "50%", background: "radial-gradient(circle, rgba(212,75,54,0.08) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Header */}
      <div style={{
        position: "relative", zIndex: 10, padding: "20px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(113,160,198,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #002E5B, #0a4a8a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: 1,
          }}>C</div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.5 }}>Ledningspuls</span>
        </div>
        {phase === "quiz" && (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
            {currentQ + 1} av {QUESTIONS.length}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {phase === "quiz" && (
        <div style={{ height: 2, background: "rgba(113,160,198,0.06)" }}>
          <div style={{
            height: "100%", background: "linear-gradient(90deg, #D44B36, #e8654f)",
            width: `${((currentQ + 1) / QUESTIONS.length) * 100}%`,
            transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
          }} />
        </div>
      )}

      {/* INTRO */}
      {phase === "intro" && (
        <div style={{
          position: "relative", zIndex: 10,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          minHeight: "calc(100vh - 73px)", padding: "40px 24px", textAlign: "center",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(212,75,54,0.1)", border: "1px solid rgba(212,75,54,0.2)",
            borderRadius: 100, padding: "6px 16px 6px 12px",
            fontSize: 12, fontWeight: 600, color: "#D44B36", marginBottom: 32,
            animation: "fadeInUp 0.6s ease both",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#D44B36" }} />
            Gratis verktyg
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 20,
            animation: "fadeInUp 0.6s ease 0.1s both",
          }}>
            <span style={{ color: "#D44B36" }}>Ledningspuls</span>
          </h1>

          <p style={{
            fontSize: "clamp(15px, 1.6vw, 18px)", color: "rgba(255,255,255,0.55)",
            lineHeight: 1.6, maxWidth: 520, marginBottom: 40,
            animation: "fadeInUp 0.6s ease 0.2s both",
          }}>
            På 5 minuter får ni en bild av er digitala styrförmåga.
            10 påståenden, omedelbart resultat med er mognadsprofil.
          </p>

          <button onClick={() => setPhase("quiz")} style={{
            background: "linear-gradient(135deg, #D44B36, #e8654f)",
            border: "none", color: "#fff", padding: "16px 48px",
            borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer",
            letterSpacing: 0.5,
            boxShadow: "0 4px 24px rgba(212,75,54,0.3)",
            transition: "all 0.25s ease",
            animation: "fadeInUp 0.6s ease 0.3s both",
          }}>
            Starta testet →
          </button>

          <div style={{
            display: "flex", gap: 32, marginTop: 48,
            animation: "fadeInUp 0.6s ease 0.4s both",
          }}>
            {[["5 min", "Tidsåtgång"], ["10", "Påståenden"], ["Direkt", "Resultat"]].map(([val, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>{val}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUIZ */}
      {phase === "quiz" && (
        <div style={{
          position: "relative", zIndex: 10,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          minHeight: "calc(100vh - 75px)", padding: "40px 24px",
        }}>
          <div style={{
            width: "100%", maxWidth: 640,
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? `translateX(${-slideDir * 30}px)` : "translateX(0)",
            transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(113,160,198,0.08)", borderRadius: 100,
              padding: "6px 16px", marginBottom: 24,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#D44B36" }}>Fråga {currentQ + 1}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>av {QUESTIONS.length}</span>
            </div>

            <h2 style={{
              fontSize: "clamp(20px, 2.5vw, 28px)", fontWeight: 600,
              lineHeight: 1.4, marginBottom: 40, color: "#fff",
              minHeight: 80,
            }}>
              {QUESTIONS[currentQ].text}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3, 4, 5].map(val => {
                const selected = answers[currentQ] === val;
                return (
                  <button key={val} onClick={() => handleAnswer(currentQ, val)} style={{
                    display: "flex", alignItems: "center", gap: 16,
                    width: "100%", padding: "16px 20px", borderRadius: 12,
                    border: selected ? "1.5px solid rgba(212,75,54,0.6)" : "1px solid rgba(113,160,198,0.1)",
                    background: selected ? "rgba(212,75,54,0.1)" : "rgba(255,255,255,0.02)",
                    color: "#fff", cursor: "pointer", textAlign: "left",
                    transition: "all 0.2s ease",
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: selected ? "#D44B36" : "rgba(113,160,198,0.08)",
                      fontSize: 14, fontWeight: 700,
                      transition: "all 0.2s ease",
                    }}>{val}</div>
                    <span style={{ fontSize: 14, color: selected ? "#fff" : "rgba(255,255,255,0.6)" }}>
                      {SCALE_LABELS[val - 1]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
              <button onClick={prevQuestion} disabled={currentQ === 0} style={{
                background: "transparent", border: "1px solid rgba(113,160,198,0.15)",
                color: currentQ === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.6)",
                padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: currentQ === 0 ? "default" : "pointer",
                transition: "all 0.2s ease",
              }}>← Tillbaka</button>

              <button onClick={nextQuestion} disabled={answers[currentQ] === undefined} style={{
                background: answers[currentQ] !== undefined
                  ? "linear-gradient(135deg, #D44B36, #e8654f)" : "rgba(113,160,198,0.08)",
                border: "none",
                color: answers[currentQ] !== undefined ? "#fff" : "rgba(255,255,255,0.2)",
                padding: "12px 32px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: answers[currentQ] !== undefined ? "pointer" : "default",
                boxShadow: answers[currentQ] !== undefined ? "0 4px 16px rgba(212,75,54,0.25)" : "none",
                transition: "all 0.25s ease",
              }}>
                {currentQ === QUESTIONS.length - 1 ? "Visa resultat →" : "Nästa →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULT */}
      {phase === "result" && (
        <div style={{
          position: "relative", zIndex: 10,
          padding: "40px 24px 60px", maxWidth: 800, margin: "0 auto",
        }}>
          {/* Export button top */}
          <div style={{
            display: "flex", justifyContent: "flex-end", marginBottom: 16,
            animation: "fadeInUp 0.6s ease both",
          }}>
            <button onClick={exportPDF} disabled={exporting} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(113,160,198,0.15)",
              color: "rgba(255,255,255,0.7)", padding: "10px 20px",
              borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: exporting ? "wait" : "pointer",
              transition: "all 0.2s ease",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {exporting ? "Exporterar..." : "Exportera PDF"}
            </button>
          </div>

          {/* Exportable content - uses data-pdf-export attribute for light mode during capture */}
          <style>{`
            [data-pdf-export="true"] {
              background: #F2F2F2 !important;
              color: #424242 !important;
              padding: 32px !important;
              border-radius: 0 !important;
            }
            [data-pdf-export="true"] * {
              color: #424242 !important;
            }
            [data-pdf-export="true"] [data-pdf-heading] {
              color: #002E5B !important;
            }
            [data-pdf-export="true"] [data-pdf-level-color] {
              color: var(--level-color) !important;
            }
            [data-pdf-export="true"] [data-pdf-card] {
              background: #ffffff !important;
              border-color: #e5e7eb !important;
            }
            [data-pdf-export="true"] [data-pdf-label] {
              color: #71A0C6 !important;
            }
            [data-pdf-export="true"] [data-pdf-muted] {
              color: #71A0C6 !important;
            }
            [data-pdf-export="true"] [data-pdf-bar-bg] {
              background: #e5e7eb !important;
            }
            [data-pdf-export="true"] [data-pdf-cta] {
              background: #002E5B !important;
              border-color: #002E5B !important;
            }
            [data-pdf-export="true"] [data-pdf-cta] * {
              color: #fff !important;
            }
            [data-pdf-export="true"] [data-pdf-bold] {
              color: #002E5B !important;
            }
            [data-pdf-export="true"] [data-pdf-accent] {
              color: #D44B36 !important;
            }
            [data-pdf-export="true"] [data-pdf-header] {
              color: #002E5B !important;
              font-weight: 700 !important;
            }
          `}</style>
          <div ref={resultRef}>
            {/* PDF Header - only visible in export */}
            <div data-pdf-heading style={{
              textAlign: "center", marginBottom: 8, display: "none",
            }}>
              <style>{`
                [data-pdf-export="true"] [data-pdf-title-bar] {
                  display: block !important;
                  text-align: center;
                  margin-bottom: 24px;
                  padding-bottom: 16px;
                  border-bottom: 2px solid #002E5B;
                }
              `}</style>
              <div data-pdf-title-bar style={{ display: "none" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#002E5B", fontFamily: "'Playfair Display', serif" }}>
                  Ledningspuls
                </div>
                <div style={{ fontSize: 11, color: "#71A0C6", marginTop: 4 }}>
                  Digital mognadsmätning &bull; Curago
                </div>
              </div>
            </div>

            <div style={{
              textAlign: "center", marginBottom: 40,
              animation: "fadeInUp 0.6s ease both",
            }}>
              <div data-pdf-label style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: level.bg, border: `1px solid ${level.color}33`,
                borderRadius: 100, padding: "6px 16px 6px 12px",
                fontSize: 12, fontWeight: 600, color: level.color, marginBottom: 24,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: level.color }} />
                Er mognadsnivå
              </div>
              <h2 data-pdf-level-color style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800,
                lineHeight: 1.15, marginBottom: 8,
                "--level-color": level.color,
              }}>
                <span style={{ color: level.color }}>{level.label}</span>
              </h2>
              <p data-pdf-muted style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", maxWidth: 500, margin: "0 auto" }}>
                {level.desc}
              </p>
            </div>

            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24,
              animation: "fadeInUp 0.6s ease 0.15s both",
            }}>
              <div data-pdf-card style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(113,160,198,0.1)",
                borderRadius: 16, padding: 28,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              }}>
                <CircularProgress score={totalScore} color={level.color} />
                <div style={{ marginTop: 16, textAlign: "center" }}>
                  <div data-pdf-label style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>
                    Totalpoäng
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 20, width: "100%" }}>
                  {LEVELS.map(l => (
                    <div key={l.label} data-pdf-card style={{
                      flex: 1, textAlign: "center", padding: "6px 2px",
                      background: totalScore >= l.min && totalScore <= l.max ? l.bg : "rgba(255,255,255,0.02)",
                      border: totalScore >= l.min && totalScore <= l.max ? `1px solid ${l.color}44` : "1px solid transparent",
                      borderRadius: 6,
                    }}>
                      <div data-pdf-accent style={{ fontSize: 8, fontWeight: 700, color: l.color }}>{l.min}–{l.max}</div>
                      <div data-pdf-muted style={{ fontSize: 7, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{l.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div data-pdf-card style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(113,160,198,0.1)",
                borderRadius: 16, padding: "20px 12px",
              }}>
                <div data-pdf-label style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.5, textAlign: "center", marginBottom: 4 }}>
                  Dimensionsprofil
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="rgba(113,160,198,0.2)" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                    />
                    <PolarRadiusAxis
                      angle={90} domain={[0, 100]}
                      tick={false} axisLine={false}
                    />
                    <Radar
                      name="Resultat" dataKey="value"
                      stroke={level.color} fill={level.color} fillOpacity={0.25}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div data-pdf-card style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(113,160,198,0.1)",
              borderRadius: 16, padding: 28, marginBottom: 24,
              animation: "fadeInUp 0.6s ease 0.3s both",
            }}>
              <div data-pdf-label style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 20 }}>
                Resultat per dimension
              </div>
              {dimScores.map((d, i) => {
                const colors = ["#4ade80", "#60a5fa", "#c084fc", "#D44B36"];
                return (
                  <div key={d.key} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{d.label}</span>
                      <span style={{ fontSize: 13, color: colors[i], fontWeight: 700 }}>{d.score}/{d.max}</span>
                    </div>
                    <div data-pdf-bar-bg style={{ height: 8, borderRadius: 4, background: "rgba(113,160,198,0.08)" }}>
                      <div style={{
                        height: "100%", borderRadius: 4, background: colors[i],
                        width: `${(d.score / d.max) * 100}%`, transition: "width 1s cubic-bezier(0.4,0,0.2,1)"
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {(() => {
              const pct = Math.round((weakest.score / weakest.max) * 100);
              return (
                <div data-pdf-card style={{
                  background: "rgba(212,75,54,0.06)",
                  border: "1px solid rgba(212,75,54,0.15)",
                  borderRadius: 16, padding: 24, marginBottom: 24,
                  animation: "fadeInUp 0.6s ease 0.4s both",
                }}>
                  <div data-pdf-accent style={{ fontSize: 13, fontWeight: 600, color: "#D44B36", marginBottom: 6 }}>
                    Område att prioritera
                  </div>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, margin: 0 }}>
                    Er lägsta dimension är <strong data-pdf-bold style={{ color: "#fff" }}>{weakest.label}</strong> ({pct}%).
                    En fördjupad mognadsmätning kan identifiera de konkreta åtgärder som skapar mest effekt.
                  </p>
                </div>
              );
            })()}

            {/* AI Analysis */}
            <div data-pdf-card style={{
              background: "rgba(113,160,198,0.05)",
              border: "1px solid rgba(113,160,198,0.15)",
              borderRadius: 16, padding: 28, marginBottom: 24,
              animation: "fadeInUp 0.6s ease 0.5s both",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L12 22" />
                  <path d="M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93" />
                  <path d="M16 16h2a2 2 0 0 1 0 4h-2" />
                  <path d="M8 16H6a2 2 0 0 0 0 4h2" />
                  <path d="M9 12h6" />
                </svg>
                <div data-pdf-label style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.5 }}>
                  AI-analys av ert resultat
                </div>
              </div>
              {aiLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
                  <div style={{
                    width: 20, height: 20, border: "2px solid rgba(96,165,250,0.3)",
                    borderTopColor: "#60a5fa", borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }} />
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Analyserar ert resultat...</span>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : aiAnalysis ? (
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>
                  {formatAiAnalysis(aiAnalysis)}
                </div>
              ) : null}
            </div>

            {/* Contact CTA with QR code */}
            <div data-pdf-cta style={{
              background: "linear-gradient(135deg, rgba(0,46,91,0.3), rgba(0,46,91,0.1))",
              border: "1px solid rgba(0,46,91,0.3)",
              borderRadius: 16, padding: 32,
              display: "flex", alignItems: "center", gap: 32,
              animation: "fadeInUp 0.6s ease 0.6s both",
            }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                  Vill ni gå djupare?
                </h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginBottom: 24, maxWidth: 460, margin: "0 auto 24px" }}>
                  Vill ni ta er digitala utvecklingsförmåga vidare och accelerera? Kontakta oss på Curago för en dialog om er utmaning, vilka nyttor vi kan hjälpa er att skapa och vad det kan ge för fördelar åt er verksamhet.
                </p>
                <a href="mailto:info@curago.se" style={{
                  display: "inline-block",
                  background: "linear-gradient(135deg, #D44B36, #e8654f)",
                  color: "#fff", padding: "14px 40px", borderRadius: 12,
                  fontSize: 15, fontWeight: 700, textDecoration: "none",
                  boxShadow: "0 4px 24px rgba(212,75,54,0.3)",
                }}>
                  Kontakta Curago →
                </a>
              </div>
              <div style={{
                flexShrink: 0, display: "flex", flexDirection: "column",
                alignItems: "center", gap: 8,
              }}>
                <div style={{
                  background: "#fff", borderRadius: 12, padding: 12,
                }}>
                  <QRCodeSVG
                    value="mailto:info@curago.se"
                    size={100}
                    bgColor="#ffffff"
                    fgColor="#03070C"
                    level="M"
                  />
                </div>
                <span data-pdf-muted style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                  info@curago.se
                </span>
              </div>
            </div>
          </div>

          {/* Non-exportable buttons */}
          <div style={{ textAlign: "center", marginTop: 24, display: "flex", justifyContent: "center", gap: 16 }}>
            <button onClick={restart} style={{
              background: "transparent", border: "none",
              color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer",
            }}>
              ↺ Gör om testet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
