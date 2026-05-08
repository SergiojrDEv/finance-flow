import type { SignupProfile } from "../shared/applicationTypes.js";

export function onlyDigits(value: unknown): string {
  return String(value || "").replace(/\D/g, "");
}

export function parseLocalDate(value: unknown): Date {
  const [year, month, day] = String(value || "").split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function isAdult(dateValue: unknown, today = new Date()): boolean {
  const birth = parseLocalDate(dateValue);
  if (Number.isNaN(birth.getTime())) return false;
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 18;
}

export function isValidCpf(value: unknown): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  const calcDigit = (base: string): number => {
    let sum = 0;
    for (let index = 0; index < base.length; index += 1) {
      sum += Number(base[index]) * (base.length + 1 - index);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calcDigit(cpf.slice(0, 9)) === Number(cpf[9]) && calcDigit(cpf.slice(0, 10)) === Number(cpf[10]);
}

export function validateAuthInput(email?: string, password?: string): string {
  if (!email || !password) return "Informe e-mail e senha.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Informe um e-mail valido.";
  if (password.length < 6) return "A senha deve ter pelo menos 6 caracteres.";
  return "";
}

export function validateSignupProfile(
  profile?: Partial<SignupProfile>,
  { today = new Date() }: { today?: Date } = {},
): string {
  if (!profile?.fullName || profile.fullName.trim().split(/\s+/).length < 2) return "Informe seu nome completo.";
  if (!isValidCpf(profile.cpf)) return "Informe um CPF valido.";
  if (onlyDigits(profile.phone).length < 10) return "Informe um telefone valido.";
  if (!profile.birthdate) return "Informe sua data de nascimento.";
  if (!isAdult(profile.birthdate, today)) return "Cadastro permitido apenas para maiores de 18 anos.";
  return validateAuthInput(profile.email, profile.password);
}
