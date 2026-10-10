import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, AppMode } from '../types';

export interface Translations {
  [key: string]: {
    en: string;
    ta: string;
    hi: string;
  };
}

export const UI_TRANSLATIONS: Translations = {
  // App Branding & Modes
  appName: {
    en: 'GenNote AI',
    ta: 'ஜென்நோட் AI',
    hi: 'जेननोट एआई'
  },
  studyMode: {
    en: 'Study Mode',
    ta: 'படிப்பு முறை',
    hi: 'अध्ययन मोड'
  },
  researchMode: {
    en: 'Research Mode',
    ta: 'ஆராய்ச்சி முறை',
    hi: 'शोध मोड'
  },
  studyModeDesc: {
    en: 'Pedagogical, interactive flashcards, revision aids & clear explanations',
    ta: 'படிப்படியான விளக்கம், சுலபமான மீள்பார்வை மற்றும் நினைவூட்டல்கள்',
    hi: 'सरल व्याख्या, फ़्लैशकार्ड, त्वरित पुनरीक्षण एवं अभ्यास'
  },
  researchModeDesc: {
    en: 'Rigorous analysis, precise citations, deep synthesis & methodology review',
    ta: 'ஆழ்ந்த ஆய்வு, துல்லியமான பக்க மேற்கோள்கள் மற்றும் நுணுக்கமான பகுப்பாய்வு',
    hi: 'गहन विश्लेषण, सटीक संदर्भ, विस्तृत शोध एवं शैक्षणिक समीक्षा'
  },

  // Navbar
  myNotebooks: {
    en: 'My Notebooks',
    ta: 'என் குறிப்பேடுகள்',
    hi: 'मेरी नोटबुक'
  },
  newNotebook: {
    en: 'New Notebook',
    ta: 'புதிய குறிப்பேடு',
    hi: 'नई नोटबुक'
  },
  searchPlaceholder: {
    en: 'Search across notes & sources...',
    ta: 'குறிப்புகள் மற்றும் மூலங்களைத் தேடுங்கள்...',
    hi: 'नोट्स और स्रोतों में खोजें...'
  },
  exportCenter: {
    en: 'Export Center',
    ta: 'ஏற்றுமதி மையம்',
    hi: 'निर्यात केंद्र'
  },
  signIn: {
    en: 'Sign In',
    ta: 'உள்நுழைக',
    hi: 'साइन इन करें'
  },
  signOut: {
    en: 'Sign Out',
    ta: 'வெளியேறுக',
    hi: 'साइन आउट'
  },

  // Workspace
  sources: {
    en: 'Sources',
    ta: 'மூலங்கள்',
    hi: 'स्रोत'
  },
  addSource: {
    en: 'Add Source',
    ta: 'மூலத்தைச் சேர்',
    hi: 'स्रोत जोड़ें'
  },
  studio: {
    en: 'Studio',
    ta: 'ஸ்டுடியோ',
    hi: 'स्टूडियो'
  },
  chat: {
    en: 'Chat & Q&A',
    ta: 'உரையாடல் & கேள்வி-பதில்',
    hi: 'चैट और प्रश्नोत्तर'
  },
  noSources: {
    en: 'No sources uploaded yet',
    ta: 'இன்னும் மூலங்கள் பதிவேற்றப்படவில்லை',
    hi: 'अभी तक कोई स्रोत अपलोड नहीं किया गया'
  },
  uploadPrompt: {
    en: 'Upload PDFs, PPTs, Videos, Audios, Images or Web Links to ground AI in your materials.',
    ta: 'உங்கள் பாடங்களைப் பற்றிய AI பதில்களைப் பெற PDF, PPT, வீடியோ, ஆடியோ அல்லது படங்களைப் பதிவேற்றவும்.',
    hi: 'सटीक उत्तर पाने के लिए पीडीएफ, पीपीटी, वीडियो, ऑडियो या नोट्स अपलोड करें।'
  },
  selectAll: {
    en: 'Select All',
    ta: 'அனைத்தையும் தேர்ந்தெடு',
    hi: 'सभी चुनें'
  },
  clearSelection: {
    en: 'Clear Selection',
    ta: 'தேர்வை நீக்கு',
    hi: 'चयन साफ़ करें'
  },
  sourcesSelected: {
    en: 'sources selected for grounding',
    ta: 'மூலங்கள் பதிலுக்காகத் தேர்ந்தெடுக்கப்பட்டன',
    hi: 'स्रोत उत्तर देने हेतु चुने गए'
  },

  // Ingestion & Source Badges
  previewExtracted: {
    en: 'Preview Extracted Content',
    ta: 'பிரித்தெடுக்கப்பட்ட உள்ளடக்கத்தைப் பார்க்கவும்',
    hi: 'निकाली गई सामग्री देखें'
  },
  ocrDetected: {
    en: 'OCR Extracted',
    ta: 'OCR ஸ்கேன் செய்யப்பட்டது',
    hi: 'ओसीआर निकाला गया'
  },
  tablesDetected: {
    en: 'Tables Detected',
    ta: 'அட்டவணைகள் கண்டறியப்பட்டன',
    hi: 'तालिकाएं खोजी गईं'
  },
  videoScenes: {
    en: 'Scenes & Transcript',
    ta: 'காட்சிகள் & உரைப்பதிவு',
    hi: 'दृश्य और ट्रांसक्रिप्ट'
  },
  pageCountLabel: {
    en: 'Pages',
    ta: 'பக்கங்கள்',
    hi: 'पृष्ठ'
  },
  slideCountLabel: {
    en: 'Slides',
    ta: 'ஸ்லைடுகள்',
    hi: 'स्लाइड्स'
  },

  // Chat Panel
  askPlaceholder: {
    en: 'Ask a question grounded strictly in your sources...',
    ta: 'உங்கள் மூலங்களை மட்டுமே அடிப்படையாகக் கொண்ட ஒரு கேள்வியைக் கேளுங்கள்...',
    hi: 'केवल अपने स्रोतों पर आधारित कोई भी प्रश्न पूछें...'
  },
  send: {
    en: 'Send',
    ta: 'அனுப்பு',
    hi: 'भेजें'
  },
  thinking: {
    en: 'GenNote AI is synthesizing answer from verified sources...',
    ta: 'ஜென்நோட் AI சரிபார்க்கப்பட்ட மூலங்களிலிருந்து பதிலை உருவாக்குகிறது...',
    hi: 'जेननोट एआई सत्यापित स्रोतों से उत्तर तैयार कर रहा है...'
  },
  zeroHallucinationNotice: {
    en: 'Strict Grounding: Answers are synthesized strictly from your uploaded sources without invention.',
    ta: 'துல்லிய உத்தரவாதம்: உங்கள் மூல ஆவணங்களிலிருந்து மட்டுமே உண்மையான தகவல்கள் பதிலளிக்கப்படும்.',
    hi: 'सटीक जानकारी: केवल आपके अपलोड किए गए स्रोतों के आधार पर उत्तर दिए जाते हैं।'
  },
  citationsTitle: {
    en: 'Grounded Citations',
    ta: 'ஆதார மேற்கோள்கள்',
    hi: 'सत्यापित संदर्भ'
  },
  clearChat: {
    en: 'Clear Conversation',
    ta: 'உரையாடலை அழிக்கவும்',
    hi: 'बातचीत साफ़ करें'
  },

  // Studio Artifacts
  audioOverview: {
    en: 'Audio Overview',
    ta: 'ஆடியோ சுருக்கம்',
    hi: 'ऑडियो अवलोकन'
  },
  summary: {
    en: 'Summary',
    ta: 'சுருக்கம்',
    hi: 'सारांश'
  },
  slideDeck: {
    en: 'Slide Deck',
    ta: 'ஸ்லைடு விளக்கக்காட்சி',
    hi: 'स्लाइड डेक'
  },
  videoOverview: {
    en: 'Video Overview',
    ta: 'வீடியோ கண்ணோட்டம்',
    hi: 'वीडियो अवलोकन'
  },
  flashcards: {
    en: 'Flashcards',
    ta: 'ஃபிளாஷ் அட்டைகள்',
    hi: 'फ़्लैशकार्ड'
  },
  quiz: {
    en: 'Quiz',
    ta: 'வினாடி வினா',
    hi: 'प्रश्नोत्तरी'
  },
  mindMap: {
    en: 'Mind Map',
    ta: 'மன வரைபடம் (Mind Map)',
    hi: 'माइंड मैप'
  },
  infographic: {
    en: 'Infographic',
    ta: 'விளக்க வரைபடம்',
    hi: 'इन्फोग्राफिक'
  },
  dataTable: {
    en: 'Data Table',
    ta: 'தரவு அட்டவணை',
    hi: 'डेटा तालिका'
  },
  report: {
    en: 'Report',
    ta: 'ஆய்வு அறிக்கை',
    hi: 'रिपोर्ट'
  },
  importantQuestions: {
    en: 'Important Questions',
    ta: 'முக்கிய வினாக்கள்',
    hi: 'महत्वपूर्ण प्रश्न'
  },
  definitions: {
    en: 'Definitions & Terms',
    ta: 'வரையறைகள் & சொற்கள்',
    hi: 'परिभाषाएं और शब्द'
  },
  studyGuide: {
    en: 'Study Guide',
    ta: 'படிப்பு வழிகாட்டி',
    hi: 'अध्ययन गाइड'
  },
  generate: {
    en: 'Generate',
    ta: 'உருவாக்கு',
    hi: 'बनाएं'
  },
  generating: {
    en: 'Generating...',
    ta: 'உருவாக்குகிறது...',
    hi: 'तैयार किया जा रहा है...'
  }
};

interface LanguageModeContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  t: (key: string) => string;
}

const LanguageModeContext = createContext<LanguageModeContextType | undefined>(undefined);

export const LanguageModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('gennote_lang');
    return (saved === 'ta' || saved === 'hi' || saved === 'en') ? saved : 'en';
  });

  const [mode, setModeState] = useState<AppMode>(() => {
    const saved = localStorage.getItem('gennote_mode');
    return (saved === 'study' || saved === 'research') ? saved : 'study';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('gennote_lang', lang);
  };

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
    localStorage.setItem('gennote_mode', newMode);
  };

  const t = (key: string): string => {
    const entry = UI_TRANSLATIONS[key];
    if (!entry) return key;
    return entry[language] || entry.en || key;
  };

  return (
    <LanguageModeContext.Provider value={{ language, setLanguage, mode, setMode, t }}>
      {children}
    </LanguageModeContext.Provider>
  );
};

export const useLanguageMode = (): LanguageModeContextType => {
  const context = useContext(LanguageModeContext);
  if (!context) {
    throw new Error('useLanguageMode must be used within a LanguageModeProvider');
  }
  return context;
};
