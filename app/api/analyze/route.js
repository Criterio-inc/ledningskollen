import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { totalScore, level, dimScores, weakest } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        analysis: generateFallbackAnalysis(totalScore, level, dimScores, weakest),
      });
    }

    const prompt = `Du är en senior managementkonsult specialiserad på digital transformation. Analysera följande resultat från en digital mognadsmätning för en ledningsgrupp. Ge en kort, konkret och handlingsinriktad analys på svenska (max 150 ord).

Resultat:
- Totalpoäng: ${totalScore}/50 (Mognadsnivå: ${level.label})
- ${level.desc}

Dimensionsresultat:
${dimScores.map(d => `- ${d.label}: ${d.score}/${d.max} (${Math.round((d.score / d.max) * 100)}%)`).join("\n")}

Svagaste område: ${weakest.label} (${Math.round((weakest.score / weakest.max) * 100)}%)

Ge analysen i tre korta stycken med rubrikerna **NULÄGET**, **STYRKAN** och **NÄSTA STEG**. Varje rubrik ska stå på en egen rad med ** runtom.

1. NULÄGET: Sammanfattning av nuläget (2-3 meningar)
2. STYRKAN: Viktigaste styrkan (1-2 meningar)
3. NÄSTA STEG: Rekommenderad nästa steg (2-3 meningar)

Var direkt, professionell och undvik tomma floskler. Skriv som ett kort PM till en VD.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error("Anthropic API error:", response.status);
      return NextResponse.json({
        analysis: generateFallbackAnalysis(totalScore, level, dimScores, weakest),
      });
    }

    const data = await response.json();
    const analysis = data.content?.[0]?.text || generateFallbackAnalysis(totalScore, level, dimScores, weakest);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({
      analysis: generateFallbackAnalysis(10, { label: "Okänt" }, [], { label: "Okänt", score: 0, max: 1 }),
    });
  }
}

function generateFallbackAnalysis(totalScore, level, dimScores, weakest) {
  const pct = Math.round((totalScore / 50) * 100);
  const weakPct = Math.round((weakest.score / weakest.max) * 100);

  const strongest = [...dimScores].sort((a, b) => (b.score / b.max) - (a.score / a.max))[0];
  const strongPct = strongest ? Math.round((strongest.score / strongest.max) * 100) : 0;

  let summary = "";
  if (totalScore <= 18) {
    summary = `Er organisation befinner sig i ett tidigt skede av den digitala mognaden med ${pct}% av maxpoäng. Det saknas en gemensam riktning och ledningen har ännu inte tagit ett aktivt ägarskap. Det är viktigt att börja med att skapa en gemensam bild i ledningsgruppen.`;
  } else if (totalScore <= 26) {
    summary = `Medvetenheten om digitaliseringens betydelse finns, men strukturer och styrning saknas (${pct}% av maxpoäng). Enskilda initiativ riskerar att bli isolerade utan en sammanhållen plan.`;
  } else if (totalScore <= 34) {
    summary = `Grunden är lagd med ${pct}% av maxpoäng — ni har strategi och struktur på plats. Utmaningen ligger nu i att omsätta planer till konkret genomförande och mätbara resultat.`;
  } else if (totalScore <= 42) {
    summary = `Med ${pct}% av maxpoäng driver er organisation aktivt sin digitala utveckling. Styrning och kompetens samverkar väl. Fokus bör ligga på att skala framgångsrika initiativ.`;
  } else {
    summary = `Imponerande resultat med ${pct}% av maxpoäng. Er organisation är bland de mest digitalt mogna. Digital utveckling är integrerad i ledarskapet och ni driver förnyelse proaktivt.`;
  }

  const strength = strongest
    ? `Er tydligaste styrka är "${strongest.label}" med ${strongPct}% — detta är en god grund att bygga vidare på.`
    : "";

  const recommendation = `Ert prioriterade utvecklingsområde är "${weakest.label}" (${weakPct}%). Rekommendationen är att genomföra en fördjupad analys inom detta område för att identifiera konkreta åtgärder som skapar störst effekt för er verksamhet.`;

  return `${summary}\n\n${strength}\n\n${recommendation}`;
}
