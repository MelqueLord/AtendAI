import { normalizePhone } from "@shared/utils/phone";

export function resolveCustomerDisplayName(customerPhone: string, ...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    if (isUsableCustomerName(candidate, customerPhone)) {
      return candidate!.trim();
    }
  }

  return formatPhoneLabel(customerPhone);
}

export function isUsableCustomerName(value: string | null | undefined, customerPhone: string) {
  if (!value || !value.trim()) {
    return false;
  }

  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.toLowerCase() === "cliente") {
    return false;
  }

  if (trimmed.includes("@s.whatsapp.net") || trimmed.includes("@c.us") || trimmed.includes("@lid") || trimmed.includes("status@broadcast")) {
    return false;
  }

  if (trimmed.includes(":") && trimmed.includes("@")) {
    return false;
  }

  const normalizedCandidate = normalizePhone(trimmed);
  const normalizedPhone = normalizePhone(customerPhone);
  if (normalizedCandidate && normalizedCandidate.length >= 8 && normalizedCandidate === normalizedPhone) {
    return false;
  }

  return !/^[+\d().\s-]+$/.test(trimmed);
}

export function formatPhoneLabel(value: string) {
  const digits = normalizePhone(value);
  if (!digits) return "Cliente";
  if (digits.length === 13 && digits.startsWith("55")) return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
  if (digits.length === 12 && digits.startsWith("55")) return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return digits.startsWith("55") ? `+${digits}` : digits;
}
