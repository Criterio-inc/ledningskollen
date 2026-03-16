"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

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

function CircularProgress({ score, maxScore = 50, color, size = 140 }) {
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
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(113,160,198,0.1)" strokeWidth="8" />
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
      <text x={size/2} y={size/2 + 16} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="12">
        av {maxScore}
      </text>
    </svg>
  );
}

function DimensionBar({ label, score, maxScore, color, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth((score / maxScore) * 100), 100 + delay);
    return () => clearTimeout(timer);
  }, [score, maxScore, delay]);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{label}</span>
        <span style={{ fontSize: 13, color, fontWeight: 700 }}>{score}/{maxScore}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "rgba(113,160,198,0.08)" }}>
        <div style={{
          height: "100%", borderRadius: 4, background: color,
          width: `${width}%`, transition: "width 1s cubic-bezier(0.4,0,0.2,1)"
        }} />
      </div>
    </div>
  );
}

export default function Ledningskollen() {
  const [phase, setPhase] = useState("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [slideDir, setSlideDir] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef(null);

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

  const handleAnswer = (qi, val) => {
    setAnswers(prev => ({ ...prev, [qi]: val }));
  };

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
  };

  const level = getLevel(totalScore || 10);

  if (!mounted) return null;

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
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.5 }}>Curago</span>
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

      {/* ── INTRO ── */}
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
            Digitala<br /><span style={{ color: "#D44B36" }}>Ledningskollen</span>
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

      {/* ── QUIZ ── */}
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

      {/* ── RESULT ── */}
      {phase === "result" && (
        <div style={{
          position: "relative", zIndex: 10,
          padding: "40px 24px 60px", maxWidth: 800, margin: "0 auto",
        }}>
          <div style={{
            textAlign: "center", marginBottom: 40,
            animation: "fadeInUp 0.6s ease both",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: level.bg, border: `1px solid ${level.color}33`,
              borderRadius: 100, padding: "6px 16px 6px 12px",
              fontSize: 12, fontWeight: 600, color: level.color, marginBottom: 24,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: level.color }} />
              Er mognadsnivå
            </div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800,
              lineHeight: 1.15, marginBottom: 8,
            }}>
              <span style={{ color: level.color }}>{level.label}</span>
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", maxWidth: 500, margin: "0 auto" }}>
              {level.desc}
            </p>
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24,
            animation: "fadeInUp 0.6s ease 0.15s both",
          }}>
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(113,160,198,0.1)",
              borderRadius: 16, padding: 28,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <CircularProgress score={totalScore} color={level.color} />
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>
                  Totalpoäng
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 20, width: "100%" }}>
                {LEVELS.map(l => (
                  <div key={l.label} style={{
                    flex: 1, textAlign: "center", padding: "6px 2px",
                    background: totalScore >= l.min && totalScore <= l.max ? l.bg : "rgba(255,255,255,0.02)",
                    border: totalScore >= l.min && totalScore <= l.max ? `1px solid ${l.color}44` : "1px solid transparent",
                    borderRadius: 6,
                  }}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: l.color }}>{l.min}–{l.max}</div>
                    <div style={{ fontSize: 7, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{l.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(113,160,198,0.1)",
              borderRadius: 16, padding: "20px 12px",
            }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.5, textAlign: "center", marginBottom: 4 }}>
                Dimensionsprofil
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="rgba(113,160,198,0.1)" />
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
                    stroke={level.color} fill={level.color} fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(113,160,198,0.1)",
            borderRadius: 16, padding: 28, marginBottom: 24,
            animation: "fadeInUp 0.6s ease 0.3s both",
          }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 20 }}>
              Resultat per dimension
            </div>
            {dimScores.map((d, i) => {
              const colors = ["#4ade80", "#60a5fa", "#c084fc", "#D44B36"];
              return <DimensionBar key={d.key} label={d.label} score={d.score} maxScore={d.max} color={colors[i]} delay={i * 150} />;
            })}
          </div>

          {(() => {
            const weakest = [...dimScores].sort((a, b) => (a.score / a.max) - (b.score / b.max))[0];
            const pct = Math.round((weakest.score / weakest.max) * 100);
            return (
              <div style={{
                background: "rgba(212,75,54,0.06)",
                border: "1px solid rgba(212,75,54,0.15)",
                borderRadius: 16, padding: 24, marginBottom: 24,
                animation: "fadeInUp 0.6s ease 0.4s both",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#D44B36", marginBottom: 6 }}>
                  Område att prioritera
                </div>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.6, margin: 0 }}>
                  Er lägsta dimension är <strong style={{ color: "#fff" }}>{weakest.label}</strong> ({pct}%).
                  En fördjupad mognadsmätning kan identifiera de konkreta åtgärder som skapar mest effekt.
                </p>
              </div>
            );
          })()}

          <div style={{
            background: "linear-gradient(135deg, rgba(0,46,91,0.3), rgba(0,46,91,0.1))",
            border: "1px solid rgba(0,46,91,0.3)",
            borderRadius: 16, padding: 32, textAlign: "center",
            animation: "fadeInUp 0.6s ease 0.5s both",
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              Vill ni gå djupare?
            </h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginBottom: 24, maxWidth: 460, margin: "0 auto 24px" }}>
              Boka en fullständig Digital Mognadsmätning med Curago — strukturerade intervjuer, benchmark och en handlingsplan för er ledningsgrupp.
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

          <div style={{ textAlign: "center", marginTop: 24 }}>
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
