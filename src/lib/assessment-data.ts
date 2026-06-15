export const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead or of hurting yourself in some way",
];

export const GAD7_QUESTIONS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it is hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid as if something awful might happen",
];

export const ANSWER_OPTIONS = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" },
];

export const GENDER_OPTIONS = ["Male", "Female", "Non-binary", "Prefer not to say"];
export const EDUCATION_OPTIONS = ["High School", "Some College", "Bachelor's Degree", "Master's Degree", "Doctorate", "Other"];
export const MENTAL_HEALTH_HISTORY_OPTIONS = ["Yes", "No", "Prefer not to say"];

export function getDepressionSeverity(score: number) {
  if (score <= 4) return { label: "Minimal", color: "success" as const };
  if (score <= 9) return { label: "Mild", color: "info" as const };
  if (score <= 14) return { label: "Moderate", color: "warning" as const };
  if (score <= 19) return { label: "Moderately Severe", color: "destructive" as const };
  return { label: "Severe", color: "destructive" as const };
}

export function getAnxietySeverity(score: number) {
  if (score <= 4) return { label: "Minimal", color: "success" as const };
  if (score <= 9) return { label: "Mild", color: "info" as const };
  if (score <= 14) return { label: "Moderate", color: "warning" as const };
  return { label: "Severe", color: "destructive" as const };
}

export function getOverallRisk(phq9: number, gad7: number) {
  const max = Math.max(phq9, gad7);
  if (max <= 4) return { label: "Low", color: "success" as const };
  if (max <= 9) return { label: "Moderate", color: "warning" as const };
  if (max <= 14) return { label: "High", color: "destructive" as const };
  return { label: "Critical", color: "destructive" as const };
}

export interface AssessmentData {
  id?: string;
  userName: string;
  userEmail: string;
  age: string;
  gender: string;
  education: string;
  mentalHealthHistory: string;
  stressfulEvents: string;
  phq9Answers: number[];
  gad7Answers: number[];
  phq9Score: number;
  gad7Score: number;
  depressionSeverity: string;
  anxietySeverity: string;
  riskLevel: string;
  aiReport?: string;
  createdAt?: string;
}