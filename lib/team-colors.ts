export type TeamPalette = {
  primary: string;
  secondary: string;
  accent: string;
};

export const IPL_TEAM_COLORS: Record<string, TeamPalette> = {
  CSK: { primary: "#E9530D", secondary: "#2B5DA8", accent: "#32A6DE" },
  MI: { primary: "#004B8D", secondary: "#FFD141", accent: "#E1261C" },
  RCB: { primary: "#D71921", secondary: "#000000", accent: "#E5B582" },
  KKR: { primary: "#3A225D", secondary: "#F7D54E", accent: "#1F1733" },
  RR: { primary: "#EA1A85", secondary: "#0E4D92", accent: "#D5A021" },
  SRH: { primary: "#EE7429", secondary: "#FCCB11", accent: "#B02528" },
  DC: { primary: "#2561AE", secondary: "#282968", accent: "#D71921" },
  PBKS: { primary: "#DD1F2D", secondary: "#F2D1A0", accent: "#4960B6" },
  LSG: { primary: "#0057E2", secondary: "#F28B00", accent: "#81BC00" },
  GT: { primary: "#1B2133", secondary: "#DBBE6E", accent: "#FFFFFF" },
};

export const DEFAULT_TEAM_PALETTE: TeamPalette = {
  primary: "#1F2937",
  secondary: "#374151",
  accent: "#9CA3AF",
};
