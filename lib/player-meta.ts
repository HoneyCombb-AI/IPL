export type PlayerTag = "C" | "VC" | "RTM";

export function extractPlayerMeta(playerName: string): {
  displayName: string;
  tags: PlayerTag[];
} {
  const tags: PlayerTag[] = [];

  if (/\(C\)/i.test(playerName)) {
    tags.push("C");
  }
  if (/\(VC\)/i.test(playerName)) {
    tags.push("VC");
  }
  if (/\(RTM\)/i.test(playerName)) {
    tags.push("RTM");
  }

  const displayName = playerName
    .replace(/\(C\)/gi, "")
    .replace(/\(VC\)/gi, "")
    .replace(/\(RTM\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return { displayName, tags };
}
