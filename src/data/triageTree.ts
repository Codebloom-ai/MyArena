export type SupportedLang = 'ar' | 'fr' | 'en';

export const CONSTANT_QUICK_CHIPS: Record<SupportedLang, string[]> = {
  fr: ["Que faire maintenant ?", "Je n'ai pas compris", "Combien de temps ?"],
  ar: ["اشنو ندير دابا؟", "ما فهمتش", "شحال ديال الوقت؟"],
  en: ["What do I do now?", "I didn't understand", "How long?"],
};

export const ALLOWED_ACTIONS = {
  medical: [
    "Keep person still and warm; do not move them unless in direct danger.",
    "Loosen tight collar or clothing around the neck.",
    "Check if conscious and breathing; shout to nearest steward in yellow vest.",
    "If bleeding, apply firm continuous pressure with clean cloth without releasing.",
    "Keep person covered and calm; do not force them to drink or stand up.",
    "If chest pain or difficulty breathing, keep seated or semi-reclined.",
  ],
  fire_smoke: [
    "Stay low under the smoke and cover mouth and nose with cloth.",
    "Head calmly toward illuminated green emergency exit signs.",
    "Never touch flares or hot incandescent debris.",
    "Follow steward hand signals and instructions.",
  ],
  crowd_crush: [
    "Cross arms over chest to protect ribcage and preserve breathing volume.",
    "Move diagonally with crowd momentum; never fight against the flow.",
    "Stay on feet; never bend down to pick up dropped items.",
    "Look for relief side gates opened by stewards.",
  ],
  security_brawl: [
    "Move calmly back several rows away from the altercation.",
    "Do not film, engage, or provoke.",
    "Stay close to stewards or family safety zones.",
    "Keep stairways and aisles clear for intervention personnel.",
  ],
};

export function getFullLanguageName(lang: SupportedLang): 'French' | 'Arabic' | 'English' {
  switch (lang) {
    case 'ar':
      return 'Arabic';
    case 'en':
      return 'English';
    case 'fr':
    default:
      return 'French';
  }
}
