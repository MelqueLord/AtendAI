export function validateLoginInput(email: string, password: string) {
  if (!email.trim() || !password.trim()) {
    return "Informe email e senha para entrar.";
  }

  return null;
}
