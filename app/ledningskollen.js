"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";

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
const DIM_COLORS = ["#4ade80", "#60a5fa", "#c084fc", "#D44B36"];

function getLevel(score) {
  return LEVELS.find(l => score >= l.min && score <= l.max) || LEVELS[0];
}

/* Pure SVG radar/spider chart */
function SpiderChart({ data, color, size = 260 }) {
  const padding = 50; // space for labels
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - padding * 2) / 2;
  const n = data.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const getPoint = (index, value) => {
    const angle = startAngle + index * angleStep;
    const dist = (value / 100) * r;
    return [cx + dist * Math.cos(angle), cy + dist * Math.sin(angle)];
  };

  const gridLevels = [20, 40, 60, 80, 100];

  // Label positioning with manual offsets per quadrant
  const getLabelAnchor = (index) => {
    const angle = startAngle + index * angleStep;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    // Top/bottom vs left/right
    if (Math.abs(sin) < 0.3) return "middle"; // top or bottom
    return cos > 0 ? "start" : "end";
  };

  return (
    <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: size }}>
      {/* Filled grid rings for depth */}
      {gridLevels.map((level, li) => {
        const points = Array.from({ length: n }, (_, i) => getPoint(i, level));
        return (
          <polygon
            key={level}
            points={points.map(p => p.join(",")).join(" ")}
            fill={li === 0 ? "rgba(113,160,198,0.03)" : "none"}
            stroke="rgba(113,160,198,0.12)"
            strokeWidth="0.7"
            strokeDasharray={li < gridLevels.length - 1 ? "2,3" : "none"}
          />
        );
      })}
      {/* Axis lines */}
      {Array.from({ length: n }, (_, i) => {
        const [ex, ey] = getPoint(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke="rgba(113,160,198,0.08)" strokeWidth="0.7" />;
      })}
      {/* Data area fill */}
      <polygon
        points={data.map((d, i) => getPoint(i, d.value).join(",")).join(" ")}
        fill={color}
        fillOpacity="0.15"
        stroke="none"
      />
      {/* Data area stroke */}
      <polygon
        points={data.map((d, i) => getPoint(i, d.value).join(",")).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Data points with glow */}
      {data.map((d, i) => {
        const [px, py] = getPoint(i, d.value);
        return (
          <g key={i}>
            <circle cx={px} cy={py} r="6" fill={color} fillOpacity="0.15" />
            <circle cx={px} cy={py} r="3" fill={color} />
            <circle cx={px} cy={py} r="1.5" fill="#fff" fillOpacity="0.6" />
          </g>
        );
      })}
      {/* Value labels on data points */}
      {data.map((d, i) => {
        const angle = startAngle + i * angleStep;
        const valueDist = Math.max(d.value + 12, 25);
        const vx = cx + ((valueDist) / 100) * r * Math.cos(angle);
        const vy = cy + ((valueDist) / 100) * r * Math.sin(angle);
        return (
          <text
            key={`val-${i}`} x={vx} y={vy}
            textAnchor="middle" dominantBaseline="middle"
            fill={color} fontSize="9" fontWeight="700"
            fontFamily="'Trebuchet MS', sans-serif"
          >
            {d.value}%
          </text>
        );
      })}
      {/* Dimension labels */}
      {data.map((d, i) => {
        const angle = startAngle + i * angleStep;
        const labelDist = r + 22;
        const lx = cx + labelDist * Math.cos(angle);
        const ly = cy + labelDist * Math.sin(angle);
        const anchor = getLabelAnchor(i);

        const words = d.subject.split(" ");
        let lines;
        if (words.length >= 2) {
          lines = words.length === 2
            ? [words[0], words[1]]
            : [words.slice(0, Math.ceil(words.length / 2)).join(" "), words.slice(Math.ceil(words.length / 2)).join(" ")];
        } else {
          lines = [d.subject];
        }

        return (
          <text
            key={i} x={lx} y={ly}
            textAnchor={anchor} dominantBaseline="middle"
            fill="rgba(255,255,255,0.6)" fontSize="10" fontWeight="500"
            fontFamily="'Trebuchet MS', sans-serif"
          >
            {lines.map((line, li) => (
              <tspan key={li} x={lx} dy={li === 0 ? -(lines.length - 1) * 6 : 13}>
                {line}
              </tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
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
      <text x={size/2} y={size/2 - 6} textAnchor="middle" fill={color} fontSize="32" fontWeight="800"
        fontFamily="'Trebuchet MS', sans-serif">
        {animatedScore}
      </text>
      <text x={size/2} y={size/2 + 16} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="12"
        fontFamily="'Trebuchet MS', sans-serif">
        av {maxScore}
      </text>
    </svg>
  );
}

function CuragoLogo({ height = 20 }) {
  return (
    <svg height={height} viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="25" fontFamily="'Trebuchet MS', Arial, sans-serif" fontSize="28" fontWeight="800" letterSpacing="-0.5">
        <tspan fill="#ffffff">Cura</tspan>
        <tspan fill="#3B7DD8">go</tspan>
      </text>
    </svg>
  );
}

function formatAiAnalysis(text) {
  if (!text) return null;
  const paragraphs = text.split("\n").filter(line => line.trim());
  return paragraphs.map((para, i) => {
    const parts = para.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={i} style={{ marginBottom: i < paragraphs.length - 1 ? 12 : 0 }}>
        {parts.map((part, j) =>
          j % 2 === 1 ? (
            <strong key={j} style={{ fontWeight: 700, color: "#fff", display: "block", fontSize: 15, marginBottom: 4, marginTop: i > 0 ? 8 : 0 }}>
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

/* ---- PDF Export via jsPDF direct drawing ---- */
async function generatePDF(totalScore, level, dimScores, radarData, weakest, aiAnalysis) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF("p", "mm", "a4");
  const W = 210;
  const margin = 20;
  const contentW = W - 2 * margin;
  let y = 15;

  const font = "helvetica";

  // Helper: hex to RGB
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  }

  // Background
  pdf.setFillColor(245, 245, 245);
  pdf.rect(0, 0, 210, 297, "F");

  // Header bar
  pdf.setFillColor(0, 46, 91);
  pdf.rect(0, 0, W, 18, "F");
  pdf.setFont(font, "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text("Ledningspuls", margin, 12);
  pdf.setFont(font, "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(180, 200, 220);
  pdf.text("Digital mognadsmätning  •  Curago", W - margin, 12, { align: "right" });

  y = 28;

  // Level badge
  const [lr, lg, lb] = hexToRgb(level.color);
  pdf.setFillColor(lr, lg, lb);
  const badgeText = `Er mognadsnivå: ${level.label}`;
  const badgeW = pdf.getStringUnitWidth(badgeText) * 10 / pdf.internal.scaleFactor + 12;
  pdf.roundedRect(W / 2 - badgeW / 2, y, badgeW, 8, 4, 4, "F");
  pdf.setFont(font, "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.text(badgeText, W / 2, y + 5.5, { align: "center" });
  y += 14;

  // Level name
  pdf.setFont(font, "bold");
  pdf.setFontSize(28);
  pdf.setTextColor(lr, lg, lb);
  pdf.text(level.label, W / 2, y + 8, { align: "center" });
  y += 16;

  // Level description
  pdf.setFont(font, "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(80, 80, 80);
  const descLines = pdf.splitTextToSize(level.desc, contentW - 20);
  pdf.text(descLines, W / 2, y, { align: "center", maxWidth: contentW - 20 });
  y += descLines.length * 5 + 8;

  // ---- Two-column section: Score circle + Radar chart ----
  const colW = (contentW - 10) / 2;
  const boxH = 70;

  // Left box: Total score
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(margin, y, colW, boxH, 3, 3, "F");
  pdf.setDrawColor(220, 220, 220);
  pdf.roundedRect(margin, y, colW, boxH, 3, 3, "S");

  // Draw circular progress
  const ccx = margin + colW / 2;
  const ccy = y + 30;
  const cr = 18;
  // Background circle
  pdf.setDrawColor(230, 230, 230);
  pdf.setLineWidth(2);
  pdf.circle(ccx, ccy, cr, "S");
  // Score arc
  pdf.setDrawColor(lr, lg, lb);
  pdf.setLineWidth(2.5);
  const pct = totalScore / 50;
  const segments = Math.round(pct * 60);
  for (let i = 0; i < segments; i++) {
    const a1 = -Math.PI / 2 + (i / 60) * 2 * Math.PI;
    const a2 = -Math.PI / 2 + ((i + 1) / 60) * 2 * Math.PI;
    const x1 = ccx + cr * Math.cos(a1);
    const y1 = ccy + cr * Math.sin(a1);
    const x2 = ccx + cr * Math.cos(a2);
    const y2 = ccy + cr * Math.sin(a2);
    pdf.line(x1, y1, x2, y2);
  }
  // Score text
  pdf.setFont(font, "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(lr, lg, lb);
  pdf.text(String(totalScore), ccx, ccy + 1, { align: "center" });
  pdf.setFont(font, "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text("av 50", ccx, ccy + 7, { align: "center" });

  // Label
  pdf.setFont(font, "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text("TOTALPOÄNG", ccx, y + boxH - 8, { align: "center" });

  // Level scale
  const scaleY = y + boxH - 4;
  const scaleW = colW - 10;
  const segW = scaleW / LEVELS.length;
  LEVELS.forEach((l, i) => {
    const sx = margin + 5 + i * segW;
    const [sr, sg, sb] = hexToRgb(l.color);
    const isActive = totalScore >= l.min && totalScore <= l.max;
    if (isActive) {
      pdf.setFillColor(sr, sg, sb);
      pdf.roundedRect(sx, scaleY, segW - 1, 5, 1, 1, "F");
      pdf.setFontSize(5);
      pdf.setTextColor(255, 255, 255);
    } else {
      pdf.setFillColor(235, 235, 235);
      pdf.roundedRect(sx, scaleY, segW - 1, 5, 1, 1, "F");
      pdf.setFontSize(5);
      pdf.setTextColor(150, 150, 150);
    }
    pdf.text(`${l.min}-${l.max}`, sx + (segW - 1) / 2, scaleY + 3.5, { align: "center" });
  });

  // Right box: Radar chart
  const radarX = margin + colW + 10;
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(radarX, y, colW, boxH, 3, 3, "F");
  pdf.setDrawColor(220, 220, 220);
  pdf.roundedRect(radarX, y, colW, boxH, 3, 3, "S");

  pdf.setFont(font, "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text("DIMENSIONSPROFIL", radarX + colW / 2, y + 8, { align: "center" });

  // Draw radar/spider
  const rcx = radarX + colW / 2;
  const rcy = y + 40;
  const rr = 22;
  const n = radarData.length;
  const radarAngleStep = (2 * Math.PI) / n;
  const radarStart = -Math.PI / 2;

  const getRadarPoint = (idx, val) => {
    const angle = radarStart + idx * radarAngleStep;
    const dist = (val / 100) * rr;
    return [rcx + dist * Math.cos(angle), rcy + dist * Math.sin(angle)];
  };

  // Grid
  pdf.setDrawColor(200, 210, 220);
  pdf.setLineWidth(0.2);
  [25, 50, 75, 100].forEach(lev => {
    for (let i = 0; i < n; i++) {
      const [x1, y1] = getRadarPoint(i, lev);
      const [x2, y2] = getRadarPoint((i + 1) % n, lev);
      pdf.line(x1, y1, x2, y2);
    }
  });
  // Axes
  for (let i = 0; i < n; i++) {
    const [ex, ey] = getRadarPoint(i, 100);
    pdf.line(rcx, rcy, ex, ey);
  }

  // Data polygon - draw as lines
  pdf.setDrawColor(lr, lg, lb);
  pdf.setLineWidth(0.8);
  // Fill
  pdf.setFillColor(lr, lg, lb);
  // We can't easily fill a polygon in jsPDF so we draw lines and a light overlay
  for (let i = 0; i < n; i++) {
    const [x1, y1] = getRadarPoint(i, radarData[i].value);
    const [x2, y2] = getRadarPoint((i + 1) % n, radarData[(i + 1) % n].value);
    pdf.line(x1, y1, x2, y2);
  }
  // Data points
  radarData.forEach((d, i) => {
    const [px, py] = getRadarPoint(i, d.value);
    pdf.setFillColor(lr, lg, lb);
    pdf.circle(px, py, 1.2, "F");
  });
  // Labels
  pdf.setFont(font, "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(80, 80, 80);
  radarData.forEach((d, i) => {
    const [lx, ly] = getRadarPoint(i, 140);
    const words = d.subject.split(" ");
    if (d.subject.length > 12 && words.length >= 2) {
      const mid = Math.ceil(words.length / 2);
      pdf.text(words.slice(0, mid).join(" "), lx, ly - 2, { align: "center" });
      pdf.text(words.slice(mid).join(" "), lx, ly + 2, { align: "center" });
    } else {
      pdf.text(d.subject, lx, ly, { align: "center" });
    }
  });

  y += boxH + 8;

  // ---- Dimension bars ----
  pdf.setFillColor(255, 255, 255);
  const barsH = 12 * dimScores.length + 16;
  pdf.roundedRect(margin, y, contentW, barsH, 3, 3, "F");
  pdf.setDrawColor(220, 220, 220);
  pdf.roundedRect(margin, y, contentW, barsH, 3, 3, "S");

  pdf.setFont(font, "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text("RESULTAT PER DIMENSION", margin + 8, y + 8);
  let barY = y + 14;

  dimScores.forEach((d, i) => {
    const [dr, dg, db] = hexToRgb(DIM_COLORS[i]);
    // Label
    pdf.setFont(font, "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    pdf.text(d.label, margin + 8, barY + 3);
    // Score
    pdf.setFont(font, "bold");
    pdf.setTextColor(dr, dg, db);
    pdf.text(`${d.score}/${d.max}`, margin + contentW - 8, barY + 3, { align: "right" });
    // Bar background
    const barX = margin + 8;
    const barW = contentW - 16;
    pdf.setFillColor(235, 235, 235);
    pdf.roundedRect(barX, barY + 5, barW, 3, 1.5, 1.5, "F");
    // Bar fill
    pdf.setFillColor(dr, dg, db);
    const fillW = Math.max(2, (d.score / d.max) * barW);
    pdf.roundedRect(barX, barY + 5, fillW, 3, 1.5, 1.5, "F");
    barY += 12;
  });

  y += barsH + 6;

  // ---- Priority area ----
  const weakPct = Math.round((weakest.score / weakest.max) * 100);
  pdf.setFillColor(255, 240, 238);
  pdf.roundedRect(margin, y, contentW, 18, 3, 3, "F");
  pdf.setFont(font, "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(212, 75, 54);
  pdf.text("Område att prioritera", margin + 8, y + 7);
  pdf.setFont(font, "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(80, 80, 80);
  const prioText = `Er lägsta dimension är ${weakest.label} (${weakPct}%). En fördjupad mognadsmätning kan identifiera de konkreta åtgärder som skapar mest effekt.`;
  const prioLines = pdf.splitTextToSize(prioText, contentW - 16);
  pdf.text(prioLines, margin + 8, y + 13);
  y += 18 + (prioLines.length > 1 ? prioLines.length * 4 : 0) + 4;

  // Check if we need a new page
  if (y > 240) {
    pdf.addPage();
    pdf.setFillColor(245, 245, 245);
    pdf.rect(0, 0, 210, 297, "F");
    y = 20;
  }

  // ---- AI Analysis ----
  if (aiAnalysis) {
    const cleanText = aiAnalysis.replace(/\*\*/g, "");
    pdf.setFillColor(255, 255, 255);
    const aiLines = pdf.splitTextToSize(cleanText, contentW - 16);
    const aiH = Math.max(30, aiLines.length * 4.5 + 18);
    pdf.roundedRect(margin, y, contentW, aiH, 3, 3, "F");
    pdf.setDrawColor(220, 220, 220);
    pdf.roundedRect(margin, y, contentW, aiH, 3, 3, "S");

    pdf.setFont(font, "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text("AI-ANALYS AV ERT RESULTAT", margin + 8, y + 8);

    pdf.setFont(font, "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);

    // Parse bold sections
    let textY = y + 15;
    const paragraphs = aiAnalysis.split("\n").filter(l => l.trim());
    paragraphs.forEach(para => {
      const parts = para.split(/\*\*(.*?)\*\*/g);
      parts.forEach((part, j) => {
        if (!part.trim()) return;
        if (j % 2 === 1) {
          // Bold heading
          pdf.setFont(font, "bold");
          pdf.setFontSize(10);
          pdf.setTextColor(0, 46, 91);
          if (textY > y + 16) textY += 2;
          pdf.text(part, margin + 8, textY);
          textY += 5;
        } else {
          pdf.setFont(font, "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(60, 60, 60);
          const wrapped = pdf.splitTextToSize(part.trim(), contentW - 16);
          wrapped.forEach(line => {
            if (textY > 280) {
              pdf.addPage();
              pdf.setFillColor(245, 245, 245);
              pdf.rect(0, 0, 210, 297, "F");
              textY = 20;
            }
            pdf.text(line, margin + 8, textY);
            textY += 4.5;
          });
        }
      });
    });
    y = textY + 6;
  }

  // Check page
  if (y > 250) {
    pdf.addPage();
    pdf.setFillColor(245, 245, 245);
    pdf.rect(0, 0, 210, 297, "F");
    y = 20;
  }

  // ---- CTA box ----
  pdf.setFillColor(0, 46, 91);
  pdf.roundedRect(margin, y, contentW, 40, 3, 3, "F");
  pdf.setFont(font, "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text("Vill ni gå djupare?", margin + contentW / 2, y + 12, { align: "center" });
  pdf.setFont(font, "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(200, 215, 230);
  const ctaText = "Kontakta oss på Curago för en dialog om er utmaning och hur vi kan hjälpa er att accelerera er digitala utvecklingsförmåga.";
  const ctaLines = pdf.splitTextToSize(ctaText, contentW - 30);
  pdf.text(ctaLines, margin + contentW / 2, y + 19, { align: "center", maxWidth: contentW - 30 });
  pdf.setFont(font, "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(212, 75, 54);
  pdf.text("info@curago.se", margin + contentW / 2, y + 34, { align: "center" });

  // Footer
  pdf.setFont(font, "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(150, 150, 150);
  const date = new Date().toISOString().split("T")[0];
  pdf.text(`Genererad ${date}  •  Ledningspuls av Curago  •  curago.se`, W / 2, 290, { align: "center" });

  pdf.save(`ledningspuls-resultat-${date}.pdf`);
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
        body: JSON.stringify({ totalScore: score, level: lvl, dimScores: dims, weakest: weak }),
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
      setTimeout(() => { setCurrentQ(prev => prev + 1); setIsTransitioning(false); }, 300);
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
    setTimeout(() => { setCurrentQ(prev => prev - 1); setIsTransitioning(false); }, 300);
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
      await generatePDF(totalScore, level, dimScores, radarData, weakest, aiAnalysis);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  const level = getLevel(totalScore || 10);

  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#03070C", color: "#fff", position: "relative", overflow: "hidden" }}>
      {/* Ambient glow */}
      <div style={{ position: "fixed", top: "-30%", right: "-20%", width: "60vw", height: "60vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,46,91,0.15) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "-20%", left: "-10%", width: "40vw", height: "40vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(212,75,54,0.08) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Header */}
      <div style={{
        position: "relative", zIndex: 10, padding: "16px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(113,160,198,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <CuragoLogo height={22} />
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)" }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: 0.3 }}>Ledningspuls</span>
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
          minHeight: "calc(100vh - 57px)", padding: "40px 24px", textAlign: "center",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(212,75,54,0.1)", border: "1px solid rgba(212,75,54,0.2)",
            borderRadius: 100, padding: "6px 16px 6px 12px",
            fontSize: 12, fontWeight: 600, color: "#D44B36", marginBottom: 32,
            animation: "fadeInUp 0.6s ease both",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#D44B36" }} />
            Kostnadsfritt verktyg med AI-analys
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

          <div style={{ display: "flex", gap: 32, marginTop: 48, animation: "fadeInUp 0.6s ease 0.4s both" }}>
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
          minHeight: "calc(100vh - 59px)", padding: "40px 24px",
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
              lineHeight: 1.4, marginBottom: 40, color: "#fff", minHeight: 80,
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
                      fontSize: 14, fontWeight: 700, transition: "all 0.2s ease",
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
              }}>← Tillbaka</button>

              <button onClick={nextQuestion} disabled={answers[currentQ] === undefined} style={{
                background: answers[currentQ] !== undefined
                  ? "linear-gradient(135deg, #D44B36, #e8654f)" : "rgba(113,160,198,0.08)",
                border: "none",
                color: answers[currentQ] !== undefined ? "#fff" : "rgba(255,255,255,0.2)",
                padding: "12px 32px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: answers[currentQ] !== undefined ? "pointer" : "default",
                boxShadow: answers[currentQ] !== undefined ? "0 4px 16px rgba(212,75,54,0.25)" : "none",
              }}>
                {currentQ === QUESTIONS.length - 1 ? "Visa resultat →" : "Nästa →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULT */}
      {phase === "result" && (
        <div style={{ position: "relative", zIndex: 10, padding: "40px 24px 60px", maxWidth: 800, margin: "0 auto" }}>
          {/* Export button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16, animation: "fadeInUp 0.6s ease both" }}>
            <button onClick={exportPDF} disabled={exporting} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(113,160,198,0.15)",
              color: "rgba(255,255,255,0.7)", padding: "10px 20px",
              borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: exporting ? "wait" : "pointer",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {exporting ? "Exporterar..." : "Exportera PDF"}
            </button>
          </div>

          {/* Level header */}
          <div style={{ textAlign: "center", marginBottom: 40, animation: "fadeInUp 0.6s ease both" }}>
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
              fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, lineHeight: 1.15, marginBottom: 8,
            }}>
              <span style={{ color: level.color }}>{level.label}</span>
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", maxWidth: 500, margin: "0 auto" }}>
              {level.desc}
            </p>
          </div>

          {/* Score + Spider chart */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24, animation: "fadeInUp 0.6s ease 0.15s both" }}>
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(113,160,198,0.1)",
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
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(113,160,198,0.1)",
              borderRadius: 16, padding: "20px 12px",
              display: "flex", flexDirection: "column", alignItems: "center",
            }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.5, textAlign: "center", marginBottom: 4 }}>
                Dimensionsprofil
              </div>
              <SpiderChart data={radarData} color={level.color} size={280} />
            </div>
          </div>

          {/* Dimension bars */}
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(113,160,198,0.1)",
            borderRadius: 16, padding: 28, marginBottom: 24,
            animation: "fadeInUp 0.6s ease 0.3s both",
          }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 20 }}>
              Resultat per dimension
            </div>
            {dimScores.map((d, i) => (
              <div key={d.key} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{d.label}</span>
                  <span style={{ fontSize: 13, color: DIM_COLORS[i], fontWeight: 700 }}>{d.score}/{d.max}</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "rgba(113,160,198,0.08)" }}>
                  <div style={{
                    height: "100%", borderRadius: 4, background: DIM_COLORS[i],
                    width: `${(d.score / d.max) * 100}%`, transition: "width 1s cubic-bezier(0.4,0,0.2,1)"
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Priority area */}
          {(() => {
            const pct = Math.round((weakest.score / weakest.max) * 100);
            return (
              <div style={{
                background: "rgba(212,75,54,0.06)", border: "1px solid rgba(212,75,54,0.15)",
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

          {/* AI Analysis */}
          <div style={{
            background: "rgba(113,160,198,0.05)", border: "1px solid rgba(113,160,198,0.15)",
            borderRadius: 16, padding: 28, marginBottom: 24,
            animation: "fadeInUp 0.6s ease 0.5s both",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L12 22" />
                <path d="M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93" />
                <path d="M16 16h2a2 2 0 0 1 0 4h-2" />
                <path d="M8 16H6a2 2 0 0 0 0 4h2" />
                <path d="M9 12h6" />
              </svg>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.5 }}>
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

          {/* CTA */}
          <div style={{
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
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ background: "#fff", borderRadius: 12, padding: 12 }}>
                <QRCodeSVG value="mailto:info@curago.se" size={100} bgColor="#ffffff" fgColor="#03070C" level="M" />
              </div>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>info@curago.se</span>
            </div>
          </div>

          {/* Restart */}
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
