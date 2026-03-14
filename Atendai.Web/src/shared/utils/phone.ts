export function normalizePhone(value: string) {
  const digits = value.replace(/\D+/g, "");
  if (!digits) {
    return "";
  }

  if (digits.startsWith("55")) {
    return normalizeBrazilianPhone(digits);
  }

  if (digits.length === 10 || digits.length === 11) {
    return normalizeBrazilianPhone(`55${digits}`);
  }

  return digits;
}

function normalizeBrazilianPhone(value: string) {
  if (!value.startsWith("55")) {
    return value;
  }

  if (value.length !== 12 && value.length !== 13) {
    return value;
  }

  const subscriber = value.slice(4);
  if (subscriber.length === 8 && subscriber[0] >= "6") {
    return `${value.slice(0, 4)}9${subscriber}`;
  }

  return value;
}
