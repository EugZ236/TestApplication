export function buildTeamInviteQrUri(inviteCode: string, size = 220): string {
  const code = String(inviteCode ?? "").trim();
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(code)}`;
}
