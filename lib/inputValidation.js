// Input validation module for CareerBOT
// Handles harmful content detection and profanity filtering

import { Filter } from "bad-words";
import removeAccents from "remove-accents";
import deWords from "naughty-words/de.json";

// Harmful content patterns - requests for dangerous information
const harmfulPatterns = [
  // Weapons and explosives (English)
  /\b(bomb|explosive|dynamite|grenade|molotov|improvised weapon|make bomb|create bomb)\b/i,
  /\b(weapon|gun|firearm|rifle|pistol|how to make|build weapon)\b/i,
  
  // Weapons and explosives (German)
  /\b(bombe|sprengstoff|dynamit|granate|molotowcocktail|waffe|gewehr|pistole|bombe bauen|waffe herstellen)\b/i,
  /\b(sprengkörper|handgranate|schusswaffe|feuerwaffe|revolver)\b/i,
  
  // Drugs and illegal substances (English)
  /\b(how to make|manufacture|produce|synthesize|create)\s+(drug|meth|cocaine|heroin|lsd|mdma)\b/i,
  /\b(drug recipe|make illegal|substance synthesis|narcotic production)\b/i,
  
  // Drugs and illegal substances (German)
  /\b(wie macht man|herstellen|produzieren|synthetisieren|kreieren)\s+(droge|meth|kokain|heroin|lsd|mdma)\b/i,
  /\b(drogenrezept|illegale herstellung|drogensynthese|narkotikaproduktion)\b/i,
  
  // Self-harm and violence (English)
  /\b(how to kill|suicide|self-harm|hurt myself|commit suicide)\b/i,
  /\b(murder|kill someone|how to harm|violent attack|assault)\b/i,
  
  // Self-harm and violence (German)
  /\b(wie man tötet|selbstmord|selbstverletzung|mir wehtun|suizid begehen)\b/i,
  /\b(mord|jemanden töten|wie man schadet|gewalttätiger angriff|überfall)\b/i,
  
  // Hacking and cybercrime (English)
  /\b(hack|breach|steal data|phishing|malware|virus|ransomware)\s+(tutorial|guide|how to)\b/i,
  /\b(illegal hack|cybercrime|identity theft|credit card fraud)\b/i,
  /\b(help me hack|how do i hack|hack someone|hack account)\b/i,
  /\b(crack password|hack system|hack network|email hack)\b/i,
  
  // Hacking and cybercrime (German)
  /\b(hacken|datendiebstahl|phishing|malware|virus|ransomware)\s+(anleitung|leitfaden|wie man)\b/i,
  /\b(illegaler hack|cyberkriminalität|identitätsdiebstahl|kreditkartenbetrug)\b/i,
  /\b(hilf mir hacken|hilfe beim hacken|wie hacke ich|jemanden hacken)\b/i,
  /\b(passwort knacken|account hacken|system hacken|netzwerk hacken)\b/i,
  /\b(helfen zu hacken|hilft beim hacken|geholfen zu hacken)\b/i,
  
  // Fraud and scams (English)
  /\b(how to scam|fraud|fake|counterfeit|money laundering)\b/i,
  /\b(pyramid scheme|ponzi|investment fraud)\b/i,
  
  // Fraud and scams (German)
  /\b(wie man betrügt|betrug|fälschung|falschgeld|geldwäsche)\b/i,
  /\b(pyramidensystem|schneeballsystem|investmentbetrug)\b/i,
  
  // Dangerous activities (English)
  /\b(how to|instructions for|guide to)\s+(arson|sabotage|vandalism|terrorism)\b/i,
  /\b(dangerous experiment|harmful prank|illegal activity)\b/i,
  
  // Dangerous activities (German)
  /\b(wie man|anleitung für|leitfaden zu)\s+(brandstiftung|sabotage|vandalismus|terrorismus)\b/i,
  /\b(gefährliches experiment|schädlicher streich|illegale aktivität)\b/i,
  
  // Personal data exploitation (English)
  /\b(dox|doxxing|personal information|private data|stalk|harass)\b/i,
  /\b(reveal private|share personal|expose someone)\b/i,
  
  // Personal data exploitation (German)
  /\b(dox|doxxing|personeninformationen|private daten|stalken|belästigen)\b/i,
  /\b(private informationen preisgeben|personendaten teilen|jemanden bloßstellen)\b/i,
];

const profanityFilter = new Filter();

profanityFilter.addWords(...deWords);

function normalizeForProfanity(text) {
  let t = (text ?? "").toString().toLowerCase();

  // normalize accents: ä->a, ö->o, ü->u
  t = removeAccents(t);

  // normalize German ß -> ss
  t = t.replace(/ß/g, "ss");

  // collapse whitespace
  t = t.replace(/\s+/g, " ").trim();

  // basic leetspeak substitutions (extend if needed)
  t = t
    .replace(/[@]/g, "a")
    .replace(/[!1]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[0]/g, "o")
    .replace(/\$/g, "s");

  return t;
}

/**
 * Filters profanity from text
 * @param {string} input
 * @returns {{ filteredText: string, hasProfanity: boolean, detectedWords: string[] }}
 */
export function filterProfanity(input) {
  const normalized = normalizeForProfanity(input);

  const hasProfanity = profanityFilter.isProfane(normalized);
  if (!hasProfanity) {
    return { filteredText: input, hasProfanity: false, detectedWords: [] };
  }

  // bad-words doesn't return exact matches, so we approximate by checking tokens
  const tokens = normalized.split(/[^a-z0-9]+/i).filter(Boolean);
  const detectedWords = [
    ...new Set(tokens.filter((w) => profanityFilter.isProfane(w))),
  ];

  const filteredText = profanityFilter.clean(normalized);

  return { filteredText, hasProfanity: true, detectedWords };
}

/**
 * Detects if input is in German language
 * @param {string} input - User input text
 * @returns {boolean} - True if German detected
 */
export function detectGermanLanguage(input) {
  const text = input.toLowerCase();
  
  // Count German specific indicators
  const germanChars = (text.match(/[äöüßÄÖÜ]/g) || []).length;
  
  // Common German words (more specific to avoid false positives)
  const germanWords = /\b(ich|du|er|sie|es|wir|ihr|der|die|das|nicht|mit|für|auf|von|zu|den|dem|des|ein|eine|was|wie|warum|wann|wo|kann|muss|soll|wird|habe|bist|sind|haben|habt|dich|mich|ihn|ihnen|mir|dir|uns|euch|aber|oder|wenn|dann|weil|dass|dieser|diese|dieses|jener|jene|jenes|mein|dein|sein|ihr|unser|euer)\b/i;
  
  const germanWordMatches = (text.match(germanWords) || []).length;
  
  // Require stronger evidence for German detection
  // Either German characters OR multiple German words
  const isGerman = germanChars > 0 || germanWordMatches >= 2;
  
  return isGerman;
}

/**
 * Detects if input contains requests for harmful information
 * @param {string} input - User input text
 * @returns {boolean} - True if harmful content detected
 */
export function detectHarmfulContent(input) {
  const text = input.toLowerCase();
  
  return harmfulPatterns.some(pattern => pattern.test(text));
}

/**
 * Validates user input and returns appropriate response
 * @param {string} input - User input text
 * @returns {object} - Validation result with appropriate action
 */
export function validateInput(input) {
  const isGerman = detectGermanLanguage(input);
  
  // Check for harmful content first
  if (detectHarmfulContent(input)) {
    const harmfulResponse = isGerman 
      ? "Ich kann keine Informationen bereitstellen, die potenziell schädlich sein oder für gefährliche Zwecke missbraucht werden könnten. Dies umfasst Anweisungen zu Waffen, illegalen Aktivitäten, Selbstverletzung oder Inhalte, die anderen schaden könnten. Wenn Sie mit schädlichen Gedanken zu kämpfen haben, wenden Sie sich bitte an einen Psychologen oder eine Krisenhotline in Ihrer Nähe."
      : "I cannot provide information that could potentially harm individuals or be used for dangerous purposes. This includes instructions related to weapons, illegal activities, self-harm, or any content that could cause harm to others. If you're struggling with harmful thoughts, please reach out to a mental health professional or crisis helpline in your area.";
    
    return {
      isValid: false,
      type: 'harmful',
      response: harmfulResponse,
      filteredText: input
    };
  }

  // Check for profanity
  const profanityResult = filterProfanity(input);
  if (profanityResult.hasProfanity) {
    const profanityResponse = isGerman
      ? "Ich kann dich nicht verstehen, wenn du solche Wörter verwendest. Bitte kommuniziere respektvoll, damit ich dir helfen kann."
      : "I can't understand you when you use words like that. Please communicate respectfully so I can help you.";
    
    return {
      isValid: true,
      type: 'profanity',
      response: profanityResponse,
      filteredText: profanityResult.filteredText,
      detectedWords: profanityResult.detectedWords
    };
  }

  // Input is clean
  return {
    isValid: true,
    type: 'clean',
    response: null,
    filteredText: input
  };
}

export function addProfanityWords(words) {
  const cleaned = (words ?? [])
    .map((w) => (w ?? "").toString().trim().toLowerCase())
    .filter(Boolean);
  profanityFilter.addWords(...cleaned);
}

/**
 * Add new harmful content patterns
 * @param {RegExp[]} patterns - Array of regex patterns to add
 */
export function addHarmfulPatterns(patterns) {
  harmfulPatterns.push(...patterns);
}

export function getProfanityWords() {
  // bad-words exposes the list as `.list`
  return [...(profanityFilter.list ?? [])];
}

/**
 * Get current harmful patterns (for management purposes)
 * @returns {RegExp[]} - Current harmful patterns
 */
export function getHarmfulPatterns() {
  return [...harmfulPatterns];
}
