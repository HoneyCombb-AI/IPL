import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IncomingPlayer = {
  id: string;
  player_name: string;
  ipl_team_short_code: string;
};

type IncomingRequestBody = {
  selectedTeam1: string;
  selectedTeam2: string;
  players: IncomingPlayer[];
  screenshots: {
    inning1Batting: string;
    inning1Bowling: string;
    inning2Batting: string;
    inning2Bowling: string;
  };
};

type ExtractedPayload = {
  players?: Array<{
    player_name?: string;
    batting?: {
      runs?: number;
      balls?: number;
      fours?: number;
      sixes?: number;
      dismissed_for_duck?: boolean;
    };
    bowling?: {
      overs?: number;
      maidens?: number;
      runs_conceded?: number;
      wickets?: number;
      dot_balls?: number;
      lbw_bowled_wickets?: number;
      wides?: number;
      no_balls?: number;
    };
    fielding?: {
      catches?: number;
      stumpings?: number;
      runout_direct?: number;
      runout_assist?: number;
    };
  }>;
  warnings?: string[];
};

type ImagePart = {
  mimeType: string;
  data: string;
};

type GeminiRawResponse =
  | { ok: true; payload: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> } }
  | { ok: false; status: number; text: string };

function splitDataUrl(dataUrl: string): { mimeType: string; data: string } | null {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    return null;
  }
  return { mimeType: match[1], data: match[2] };
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= b.length; j += 1) {
    dp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[a.length][b.length];
}

function coerceNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return undefined;
  }
  return Math.max(0, numeric);
}

function mergePayloads(payloads: ExtractedPayload[]): ExtractedPayload {
  const mergedByName = new Map<string, NonNullable<ExtractedPayload["players"]>[number]>();
  const warnings: string[] = [];

  for (const payload of payloads) {
    for (const warning of payload.warnings ?? []) {
      warnings.push(warning);
    }

    for (const player of payload.players ?? []) {
      const name = (player.player_name ?? "").trim();
      if (!name) {
        continue;
      }
      const key = normalizeName(name);
      const existing = mergedByName.get(key);
      if (!existing) {
        mergedByName.set(key, {
          player_name: name,
          batting: {
            runs: coerceNumber(player.batting?.runs) ?? 0,
            balls: coerceNumber(player.batting?.balls) ?? 0,
            fours: coerceNumber(player.batting?.fours) ?? 0,
            sixes: coerceNumber(player.batting?.sixes) ?? 0,
            dismissed_for_duck: Boolean(player.batting?.dismissed_for_duck),
          },
          bowling: {
            overs: coerceNumber(player.bowling?.overs) ?? 0,
            maidens: coerceNumber(player.bowling?.maidens) ?? 0,
            runs_conceded: coerceNumber(player.bowling?.runs_conceded) ?? 0,
            wickets: coerceNumber(player.bowling?.wickets) ?? 0,
            dot_balls: coerceNumber(player.bowling?.dot_balls) ?? 0,
            lbw_bowled_wickets: coerceNumber(player.bowling?.lbw_bowled_wickets) ?? 0,
            wides: coerceNumber(player.bowling?.wides) ?? 0,
            no_balls: coerceNumber(player.bowling?.no_balls) ?? 0,
          },
          fielding: {
            catches: coerceNumber(player.fielding?.catches) ?? 0,
            stumpings: coerceNumber(player.fielding?.stumpings) ?? 0,
            runout_direct: coerceNumber(player.fielding?.runout_direct) ?? 0,
            runout_assist: coerceNumber(player.fielding?.runout_assist) ?? 0,
          },
        });
        continue;
      }

      existing.batting = {
        runs: (existing.batting?.runs ?? 0) + (coerceNumber(player.batting?.runs) ?? 0),
        balls: (existing.batting?.balls ?? 0) + (coerceNumber(player.batting?.balls) ?? 0),
        fours: (existing.batting?.fours ?? 0) + (coerceNumber(player.batting?.fours) ?? 0),
        sixes: (existing.batting?.sixes ?? 0) + (coerceNumber(player.batting?.sixes) ?? 0),
        dismissed_for_duck: Boolean(existing.batting?.dismissed_for_duck || player.batting?.dismissed_for_duck),
      };
      existing.bowling = {
        overs: (existing.bowling?.overs ?? 0) + (coerceNumber(player.bowling?.overs) ?? 0),
        maidens: (existing.bowling?.maidens ?? 0) + (coerceNumber(player.bowling?.maidens) ?? 0),
        runs_conceded:
          (existing.bowling?.runs_conceded ?? 0) + (coerceNumber(player.bowling?.runs_conceded) ?? 0),
        wickets: (existing.bowling?.wickets ?? 0) + (coerceNumber(player.bowling?.wickets) ?? 0),
        dot_balls: (existing.bowling?.dot_balls ?? 0) + (coerceNumber(player.bowling?.dot_balls) ?? 0),
        lbw_bowled_wickets:
          (existing.bowling?.lbw_bowled_wickets ?? 0) +
          (coerceNumber(player.bowling?.lbw_bowled_wickets) ?? 0),
        wides: (existing.bowling?.wides ?? 0) + (coerceNumber(player.bowling?.wides) ?? 0),
        no_balls: (existing.bowling?.no_balls ?? 0) + (coerceNumber(player.bowling?.no_balls) ?? 0),
      };
      existing.fielding = {
        catches: (existing.fielding?.catches ?? 0) + (coerceNumber(player.fielding?.catches) ?? 0),
        stumpings: (existing.fielding?.stumpings ?? 0) + (coerceNumber(player.fielding?.stumpings) ?? 0),
        runout_direct:
          (existing.fielding?.runout_direct ?? 0) + (coerceNumber(player.fielding?.runout_direct) ?? 0),
        runout_assist:
          (existing.fielding?.runout_assist ?? 0) + (coerceNumber(player.fielding?.runout_assist) ?? 0),
      };
    }
  }

  return {
    players: [...mergedByName.values()],
    warnings,
  };
}

function reconcilePlayerName(extractedName: string, availablePlayers: IncomingPlayer[]) {
  const extractedNorm = normalizeName(extractedName);
  if (!extractedNorm) {
    return { matchedName: extractedName, matched: false, warning: "Empty extracted player name." };
  }

  for (const player of availablePlayers) {
    if (normalizeName(player.player_name) === extractedNorm) {
      return { matchedName: player.player_name, matched: true, warning: null };
    }
  }

  let best: { playerName: string; distance: number; maxLen: number } | null = null;
  for (const player of availablePlayers) {
    const candidateNorm = normalizeName(player.player_name);
    if (!candidateNorm) {
      continue;
    }
    const distance = levenshtein(extractedNorm, candidateNorm);
    const maxLen = Math.max(extractedNorm.length, candidateNorm.length);
    if (!best || distance < best.distance) {
      best = { playerName: player.player_name, distance, maxLen };
    }
  }

  if (best) {
    const ratio = best.maxLen === 0 ? 1 : best.distance / best.maxLen;
    if (ratio <= 0.28) {
      return {
        matchedName: best.playerName,
        matched: true,
        warning: `Fuzzy-matched "${extractedName}" to "${best.playerName}".`,
      };
    }
  }

  return {
    matchedName: extractedName,
    matched: false,
    warning: `Could not confidently match extracted player "${extractedName}" to known squads.`,
  };
}

function sanitizeExtracted(payload: ExtractedPayload, availablePlayers: IncomingPlayer[]): ExtractedPayload {
  const warnings: string[] = Array.isArray(payload.warnings)
    ? payload.warnings.filter((item): item is string => typeof item === "string")
    : [];

  return {
    warnings,
    players: Array.isArray(payload.players)
      ? payload.players
          .map((player) => {
            const rawName = typeof player.player_name === "string" ? player.player_name.trim() : "";
            const reconciliation = reconcilePlayerName(rawName, availablePlayers);
            if (reconciliation.warning) {
              warnings.push(reconciliation.warning);
            }
            const wickets = coerceNumber(player.bowling?.wickets) ?? 0;
            const lbwBowled = Math.min(coerceNumber(player.bowling?.lbw_bowled_wickets) ?? 0, wickets);
            return {
              player_name: reconciliation.matchedName,
              batting: {
                runs: coerceNumber(player.batting?.runs) ?? 0,
                balls: coerceNumber(player.batting?.balls) ?? 0,
                fours: coerceNumber(player.batting?.fours) ?? 0,
                sixes: coerceNumber(player.batting?.sixes) ?? 0,
                dismissed_for_duck: Boolean(player.batting?.dismissed_for_duck),
              },
              bowling: {
                overs: coerceNumber(player.bowling?.overs) ?? 0,
                maidens: coerceNumber(player.bowling?.maidens) ?? 0,
                runs_conceded: coerceNumber(player.bowling?.runs_conceded) ?? 0,
                wickets,
                dot_balls: coerceNumber(player.bowling?.dot_balls) ?? 0,
                lbw_bowled_wickets: lbwBowled,
                wides: coerceNumber(player.bowling?.wides) ?? 0,
                no_balls: coerceNumber(player.bowling?.no_balls) ?? 0,
              },
              fielding: {
                catches: coerceNumber(player.fielding?.catches) ?? 0,
                stumpings: coerceNumber(player.fielding?.stumpings) ?? 0,
                runout_direct: coerceNumber(player.fielding?.runout_direct) ?? 0,
                runout_assist: coerceNumber(player.fielding?.runout_assist) ?? 0,
              },
            };
          })
          .filter((player) => player.player_name.length > 0)
      : [],
  };
}

function parseJsonObject(text: string): ExtractedPayload | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = (fenced?.[1] ?? text).trim();
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  const jsonSlice =
    firstBrace >= 0 && lastBrace > firstBrace ? candidate.slice(firstBrace, lastBrace + 1) : candidate;
  try {
    return JSON.parse(jsonSlice) as ExtractedPayload;
  } catch {
    return null;
  }
}

function constrainToTableKind(payload: ExtractedPayload, tableKind: "batting" | "bowling"): ExtractedPayload {
  if (!Array.isArray(payload.players)) {
    return payload;
  }

  if (tableKind === "batting") {
    return {
      ...payload,
      players: payload.players.map((player) => ({
        player_name: player.player_name,
        batting: {
          runs: coerceNumber(player.batting?.runs) ?? 0,
          balls: coerceNumber(player.batting?.balls) ?? 0,
          fours: coerceNumber(player.batting?.fours) ?? 0,
          sixes: coerceNumber(player.batting?.sixes) ?? 0,
          dismissed_for_duck: Boolean(player.batting?.dismissed_for_duck),
        },
        bowling: {
          overs: 0,
          maidens: 0,
          runs_conceded: 0,
          wickets: 0,
          dot_balls: 0,
          lbw_bowled_wickets: coerceNumber(player.bowling?.lbw_bowled_wickets) ?? 0,
          wides: 0,
          no_balls: 0,
        },
        fielding: {
          catches: coerceNumber(player.fielding?.catches) ?? 0,
          stumpings: coerceNumber(player.fielding?.stumpings) ?? 0,
          runout_direct: coerceNumber(player.fielding?.runout_direct) ?? 0,
          runout_assist: coerceNumber(player.fielding?.runout_assist) ?? 0,
        },
      })),
    };
  }

  return {
    ...payload,
    players: payload.players.map((player) => ({
      player_name: player.player_name,
      batting: {
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        dismissed_for_duck: false,
      },
      bowling: {
        overs: coerceNumber(player.bowling?.overs) ?? 0,
        maidens: coerceNumber(player.bowling?.maidens) ?? 0,
        runs_conceded: coerceNumber(player.bowling?.runs_conceded) ?? 0,
        wickets: coerceNumber(player.bowling?.wickets) ?? 0,
        dot_balls: coerceNumber(player.bowling?.dot_balls) ?? 0,
        lbw_bowled_wickets: 0,
        wides: coerceNumber(player.bowling?.wides) ?? 0,
        no_balls: coerceNumber(player.bowling?.no_balls) ?? 0,
      },
      fielding: {
        catches: 0,
        stumpings: 0,
        runout_direct: 0,
        runout_assist: 0,
      },
    })),
  };
}

async function callGeminiExtraction(args: {
  apiKey: string;
  imagePart: ImagePart;
  tableKind: "batting" | "bowling";
  inning: 1 | 2;
  playerHints: string;
}): Promise<ExtractedPayload> {
  const { apiKey, imagePart, tableKind, inning, playerHints } = args;
  const primaryModel = process.env.GEMINI_VISION_PRIMARY_MODEL || "gemini-2.5-pro";
  const fallbackModel = process.env.GEMINI_VISION_FALLBACK_MODEL || "gemini-2.5-flash";
  const modelOrder = [primaryModel, fallbackModel];
  const tableSpecificRules =
    tableKind === "batting"
      ? [
          `This is inning ${inning} batting table.`,
          "Extract batting values: runs, balls, fours, sixes, dismissed_for_duck.",
          "Also infer fielding from dismissal text:",
          "- c <fielder> b <bowler> => catcher gets catches +1",
          "- c&b <bowler> => bowler gets catches +1",
          "- st <keeper> b <bowler> => keeper gets stumpings +1",
          "- run out (A/B) => A and B get runout_assist +1 each",
          "- run out (A) => A gets runout_direct +1",
          "Also infer lbw_bowled_wickets from dismissal text by bowler:",
          "- Count +1 ONLY when dismissal is exactly 'b X' or starts with 'lbw b X'.",
          "- Do NOT count lines like 'c Fielder b X' or 'st Keeper b X' as lbw_bowled_wickets.",
        ]
      : [
          `This is inning ${inning} bowling table.`,
          "Extract bowling values: overs, maidens, runs_conceded, wickets, dot_balls, wides, no_balls.",
          "OS means dot_balls.",
          "Do not invent batting or dismissal-based fielding from this table.",
        ];

  const instructions = [
    "You are extracting IPL fantasy stats from a single scoreboard table image.",
    ...tableSpecificRules,
    "",
    "Strict output rules:",
    "- Return ONLY one JSON object.",
    "- No markdown, no prose, no code fences.",
    "- If uncertain, keep value as 0 and add warning.",
    "",
    "JSON shape:",
    "{",
    '  "players": [{',
    '    "player_name": "string",',
    '    "batting": { "runs": number, "balls": number, "fours": number, "sixes": number, "dismissed_for_duck": boolean },',
    '    "bowling": { "overs": number, "maidens": number, "runs_conceded": number, "wickets": number, "dot_balls": number, "lbw_bowled_wickets": number, "wides": number, "no_balls": number },',
    '    "fielding": { "catches": number, "stumpings": number, "runout_direct": number, "runout_assist": number }',
    "  }],",
    '  "warnings": ["string"]',
    "}",
    "",
    `Likely players in this match: ${playerHints}`,
  ].join("\n");

  async function runModel(model: string): Promise<GeminiRawResponse> {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(
        apiKey,
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
          },
          contents: [
            {
              role: "user",
              parts: [
                { text: instructions },
                {
                  inline_data: {
                    mime_type: imagePart.mimeType,
                    data: imagePart.data,
                  },
                },
              ],
            },
          ],
        }),
      },
    );

    if (!geminiResponse.ok) {
      return { ok: false, status: geminiResponse.status, text: await geminiResponse.text() };
    }

    return {
      ok: true,
      payload: (await geminiResponse.json()) as GeminiRawResponse & {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      },
    };
  }

  const errors: string[] = [];
  for (const model of modelOrder) {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const result = await runModel(model);
      if (!result.ok) {
        const body = result.text.slice(0, 240);
        errors.push(`${model} attempt ${attempt} failed (${result.status}): ${body}`);
        if (result.status === 429 && model === primaryModel && fallbackModel !== primaryModel) {
          break;
        }
        continue;
      }

      const text = result.payload.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text ?? "";
      const parsed = parseJsonObject(text);
      if (parsed) {
        return constrainToTableKind(parsed, tableKind);
      }
      errors.push(`${model} attempt ${attempt} failed: Could not parse model JSON output.`);
    }
  }

  return {
    players: [],
    warnings: [
      `${tableKind} inning ${inning} extraction failed across models: ${errors.join(" | ").slice(0, 800)}`,
    ],
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY in environment." },
      { status: 500 },
    );
  }

  let body: IncomingRequestBody;
  try {
    body = (await request.json()) as IncomingRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const screenshotEntries = [
    body.screenshots?.inning1Batting,
    body.screenshots?.inning1Bowling,
    body.screenshots?.inning2Batting,
    body.screenshots?.inning2Bowling,
  ];
  if (!Array.isArray(body.players) || body.players.length === 0 || screenshotEntries.some((s) => !s)) {
    return NextResponse.json({ error: "Missing players or screenshot inputs." }, { status: 400 });
  }

  const imageParts = screenshotEntries.map((entry) => splitDataUrl(entry)).filter(Boolean) as ImagePart[];
  if (imageParts.length !== 4) {
    return NextResponse.json({ error: "Invalid screenshot format." }, { status: 400 });
  }

  const playerHints = body.players
    .map((player) => `${player.player_name} (${player.ipl_team_short_code})`)
    .join(", ");

  const [
    inning1BattingPayload,
    inning1BowlingPayload,
    inning2BattingPayload,
    inning2BowlingPayload,
  ] = await Promise.all(
    [
      { part: imageParts[0], tableKind: "batting" as const, inning: 1 as const },
      { part: imageParts[1], tableKind: "bowling" as const, inning: 1 as const },
      { part: imageParts[2], tableKind: "batting" as const, inning: 2 as const },
      { part: imageParts[3], tableKind: "bowling" as const, inning: 2 as const },
    ].map((item) =>
      callGeminiExtraction({
        apiKey,
        imagePart: item.part,
        tableKind: item.tableKind,
        inning: item.inning,
        playerHints,
      }),
    ),
  );

  const merged = mergePayloads([
    inning1BattingPayload,
    inning1BowlingPayload,
    inning2BattingPayload,
    inning2BowlingPayload,
  ]);
  const sanitized = sanitizeExtracted(merged, body.players);
  if ((sanitized.players?.length ?? 0) === 0) {
    return NextResponse.json(
      {
        error:
          "Scorecard extraction failed for all tables. This usually means Gemini quota/rate limit hit. Please retry in a bit or switch to a lower-cost model.",
        warnings: sanitized.warnings ?? [],
      },
      { status: 502 },
    );
  }

  return NextResponse.json(sanitized);
}
