// ─────────────────────────────────────────────────────────────
// lib/user-session.ts
// Handles user auth state and assessment history in localStorage
// ─────────────────────────────────────────────────────────────

const USER_KEY       = "mindpulse_user";
const ASSESSMENTS_KEY = "mindpulse_assessments";

// ── User type — extended with auth fields ─────────────────────
export interface User {
  name:      string;   // full_name from API
  email:     string;
  username?: string;   // NEW
  phone?:    string;   // NEW
  token?:    string;   // JWT from /auth/login or /auth/signup
}

// ── Auth helpers ──────────────────────────────────────────────
export const setUser = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = (): User | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

export const clearUser = (): void => {
  localStorage.removeItem(USER_KEY);
};

// ── Assessment types (unchanged) ──────────────────────────────
export interface Assessment {
  id: string;
  createdAt: string;

  // the fields you're actually saving now
  phq9Score: number;
  gad7Score: number;
  depressionSeverity: number;
  anxietySeverity: number;
  riskLevel: string;

  // ← Add this
  aiData?: unknown;           // or Record<string, any> or a proper interface

  // If saveAssessment requires many more fields → make them optional
  user_name?: string;
  user_email?: string;
  age?: number;
  gender?: string;
  // ... make everything else optional if you don't always save it
}

// ── Assessment helpers (unchanged) ───────────────────────────
export const getAssessments = (): Assessment[] => {
  try {
    const raw = localStorage.getItem(ASSESSMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getAssessmentsByEmail = (email: string): Assessment[] =>
  getAssessments().filter((a) => a.user_email === email);

export const saveAssessment = (
  data: Omit<Assessment, "id" | "createdAt">
): Assessment => {
  const entry: Assessment = {
    ...data,
    id:        crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const all = getAssessments();
  all.push(entry);
  localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(all));
  return entry;
};