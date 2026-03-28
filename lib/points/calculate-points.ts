export type PlayerPointsInput = {
  playerRole: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dismissedForDuck: boolean;
  overs: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  dotBalls: number;
  lbwBowledWickets: number;
  catches: number;
  stumpings: number;
  runoutDirect: number;
  runoutAssist: number;
  playedInMatch: boolean;
  isCaptain: boolean;
  isViceCaptain: boolean;
};

export type PlayerPointsResult = {
  basePoints: number;
  multiplier: number;
  totalPoints: number;
  breakdown: Record<string, number>;
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function oversToBalls(overs: number): number {
  const wholeOvers = Math.floor(overs);
  const fractional = overs - wholeOvers;
  const balls = Math.round(fractional * 10);
  return wholeOvers * 6 + balls;
}

function economyFromOvers(overs: number, runsConceded: number): number | null {
  const balls = oversToBalls(overs);
  if (balls <= 0) {
    return null;
  }
  return (runsConceded * 6) / balls;
}

function strikeRate(runs: number, balls: number): number | null {
  if (balls <= 0) {
    return null;
  }
  return (runs / balls) * 100;
}

function isBowlerRole(playerRole: string): boolean {
  return playerRole.toLowerCase().includes("bowler");
}

function isOnlyBowlerRole(playerRole: string): boolean {
  const normalized = playerRole.toLowerCase();
  return normalized.includes("bowler") && !normalized.includes("all");
}

function getEconomyPoints(input: PlayerPointsInput): number {
  if (oversToBalls(input.overs) < 12) {
    return 0;
  }

  const economy = economyFromOvers(input.overs, input.runsConceded);
  if (economy === null) {
    return 0;
  }

  // Dream11 T20-style economy brackets.
  if (economy < 5) {
    return 6;
  }
  if (economy >= 5 && economy <= 5.99) {
    return 4;
  }
  if (economy >= 6 && economy <= 7) {
    return 2;
  }
  if (economy >= 10 && economy <= 11) {
    return -2;
  }
  if (economy > 11 && economy <= 12) {
    return -4;
  }
  if (economy > 12) {
    return -6;
  }

  return 0;
}

function getStrikeRatePoints(input: PlayerPointsInput): number {
  if (input.balls < 10 || isOnlyBowlerRole(input.playerRole)) {
    return 0;
  }

  const sr = strikeRate(input.runs, input.balls);
  if (sr === null) {
    return 0;
  }

  if (sr > 170) {
    return 6;
  }
  if (sr > 150 && sr <= 170) {
    return 4;
  }
  if (sr >= 130 && sr <= 150) {
    return 2;
  }
  if (sr >= 60 && sr <= 70) {
    return -2;
  }
  if (sr >= 50 && sr < 60) {
    return -4;
  }
  if (sr < 50) {
    return -6;
  }

  return 0;
}

export function calculatePlayerPoints(input: PlayerPointsInput): PlayerPointsResult {
  const breakdown: Record<string, number> = {};
  const milestoneBonus =
    input.runs >= 100 ? 16 : input.runs >= 75 ? 12 : input.runs >= 50 ? 8 : input.runs >= 25 ? 4 : 0;
  const wicketBonus =
    input.wickets >= 5 ? 12 : input.wickets >= 4 ? 8 : input.wickets >= 3 ? 4 : 0;
  const lbwBowledCount = Math.min(input.wickets, Math.max(0, input.lbwBowledWickets));
  const duckApplies = input.dismissedForDuck && !isBowlerRole(input.playerRole);

  breakdown.runs = input.runs * 1;
  breakdown.boundaries = input.fours * 4;
  breakdown.sixes = input.sixes * 6;
  breakdown.milestoneBonus = milestoneBonus;
  breakdown.duck = duckApplies ? -2 : 0;

  breakdown.wickets = input.wickets * 30;
  breakdown.dotBalls = input.dotBalls * 1;
  breakdown.lbwBowledBonus = lbwBowledCount * 8;
  breakdown.wicketHaulBonus = wicketBonus;
  breakdown.maidens = input.maidens * 12;

  breakdown.catches = input.catches * 8;
  breakdown.threeCatchBonus = input.catches >= 3 ? 4 : 0;
  breakdown.stumpings = input.stumpings * 12;
  breakdown.runoutDirect = input.runoutDirect * 12;
  breakdown.runoutAssist = input.runoutAssist * 6;

  breakdown.lineup = input.playedInMatch ? 4 : 0;
  breakdown.economy = getEconomyPoints(input);
  breakdown.strikeRate = getStrikeRatePoints(input);

  const basePoints = round2(
    Object.values(breakdown).reduce((sum, value) => sum + value, 0),
  );

  const multiplier = input.isCaptain ? 2 : input.isViceCaptain ? 1.5 : 1;
  const totalPoints = round2(basePoints * multiplier);

  return {
    basePoints,
    multiplier,
    totalPoints,
    breakdown,
  };
}
