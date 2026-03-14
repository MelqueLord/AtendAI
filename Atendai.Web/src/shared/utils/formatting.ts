export function formatDate(dateText: string) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function formatSeconds(seconds: number) {
  if (seconds <= 0) {
    return "0s";
  }

  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  return `${(seconds / 60).toFixed(1)} min`;
}

export function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency || "BRL"
  }).format(value);
}

export function splitTags(raw: string) {
  return raw
    .split(/[|,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
