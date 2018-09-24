export function formatH(target: number): string {
  return (" " + target.toFixed(2).toString()).slice(-5) + " h";
}
