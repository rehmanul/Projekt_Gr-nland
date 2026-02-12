export function normalizeEmailAddress(email: string): string {
  return email.trim().toLowerCase();
}

export function canonicalizeEmailForMatch(email: string): string {
  const normalized = normalizeEmailAddress(email);
  const atIndex = normalized.indexOf("@");
  if (atIndex <= 0) {
    return normalized;
  }

  const localPart = normalized.slice(0, atIndex);
  const domainPart = normalized.slice(atIndex + 1);
  const plusIndex = localPart.indexOf("+");
  const baseLocalPart = plusIndex >= 0 ? localPart.slice(0, plusIndex) : localPart;
  return `${baseLocalPart}@${domainPart}`;
}

export function emailsMatch(a: string, b: string): boolean {
  return canonicalizeEmailForMatch(a) === canonicalizeEmailForMatch(b);
}
