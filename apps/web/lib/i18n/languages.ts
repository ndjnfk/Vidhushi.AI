export interface Language {
  code: string;
  label: string; // English name, for reference in code/logs
  native: string; // shown to the user in the switcher
}

export const LANGUAGES: Language[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
];

export const DEFAULT_LOCALE = "en";
