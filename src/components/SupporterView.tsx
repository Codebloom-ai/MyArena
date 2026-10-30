import React, { useState, useEffect, useRef } from 'react';
import { 
  IncidentType, 
  StadiumZone, 
  ChatMessage, 
  Incident,
  REGISTERED_TICKET,
  getLocalizedTicketSeat
} from '../types/stadium';
import { 
  HeartPulse, 
  ShieldAlert, 
  Flame, 
  MapPin, 
  Mic, 
  MicOff, 
  Send, 
  Clock, 
  Shield, 
  Volume2,
  VolumeX,
  Sparkles,
  Ticket,
  RotateCcw,
  CheckCircle2,
  X
} from 'lucide-react';
import { SupportedLang, CONSTANT_QUICK_CHIPS, getFullLanguageName } from '../data/triageTree';

interface SupporterViewProps {
  onTriggerOneTapAlert: (alert: {
    type: IncidentType;
    zone: StadiumZone;
    seat: string;
    language: string;
  }) => Promise<{
    incidentId: string;
    incident: Incident;
    firstAssistantMessage: { text: string; quickReplies: string[] };
  }>;
  onSendSupporterChatReply: (
    incidentId: string,
    replyText: string,
    lockedLanguage: string
  ) => Promise<{
    assistantReply: { text: string; quickReplies: string[]; needs_escalation?: boolean };
  }>;
  onRegenerateLanguage?: (
    incidentId: string,
    newLang: SupportedLang
  ) => Promise<{
    assistantReply: { text: string; quickReplies: string[] };
  }>;
  activeIncident: Incident | null;
  onClearActiveEmergency: () => void;
  lang: SupportedLang;
  onSelectLang: (lang: SupportedLang) => void;
  onChangePerspective?: () => void;
}

export const SupporterView: React.FC<SupporterViewProps> = ({
  onTriggerOneTapAlert,
  onSendSupporterChatReply,
  onRegenerateLanguage,
  activeIncident,
  onClearActiveEmergency,
  lang,
  onSelectLang,
  onChangePerspective,
}) => {
  // Input and Chat state
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [modelQuickReplies, setModelQuickReplies] = useState<string[]>([]);
  const [usedChips, setUsedChips] = useState<Set<string>>(new Set());

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedTranscript, setRecordedTranscript] = useState('');
  const [recordingWaveform, setRecordingWaveform] = useState<number[]>([12, 24, 8, 30, 16, 22, 10, 28]);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Audio speech output
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSpokenWordIdx, setCurrentSpokenWordIdx] = useState<number>(-1);
  const [latestAiText, setLatestAiText] = useState<string>('');

  // Arrival timer countdown (seconds)
  const [arrivalSeconds, setArrivalSeconds] = useState(120);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wordTickerRef = useRef<NodeJS.Timeout | null>(null);
  const currentAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenMessageIdRef = useRef<string | null>(null);
  const playSessionIdRef = useRef<number>(0);
  const ttsAbortControllerRef = useRef<AbortController | null>(null);

  const isRTL = lang === 'ar';

  // UI Translations strictly adhering to user instructions
  const t = {
    en: {
      appName: "MyArena",
      appSubtitle: "Stadium Safety Assistant",
      changePerspective: "← Change perspective",
      scannedTicket: "Scanned from your ticket",
      urgentQuestion: "Need urgent help?",
      urgentSubtitle: "Tap once. Your location is detected from your ticket.",
      medicalTitle: "Medical",
      medicalDesc: "Someone is hurt, collapsed, or feels unwell",
      medicalSub: "Faint, injury, trauma • Medical team",
      securityTitle: "Security",
      securityDesc: "Fight, physical threat, theft, or harassment",
      securitySub: "Brawl, aggression, violence • Security team",
      fireTitle: "Fire / Crush",
      fireDesc: "Fire, dense smoke, blocked turnstile, crowd surge",
      fireSub: "Flares, smoke, crush • Fire & Safety team",
      somethingElse: "Something else like lost and found or general inquiry",
      helpOnWay: "Help is on the way",
      estimatedEta: "Estimated ETA",
      assignedUnit: "Assigned Team",
      aiSpeaking: "Safety Steward Speaking...",
      aiTitle: "MyArena Emergency Intercom",
      hearAgain: "Tap to hear safety advice again",
      stepReceived: "Received",
      stepDispatched: "Team assigned",
      stepEnRoute: "On the way",
      quickTileTitle: "A) Quick Messages",
      quickTileDesc: "Tap an immediate reply",
      voiceTileTitle: "B) Voice Intercom",
      voiceTileDesc: "Speak directly in English, French or Darija",
      recordBtn: "Tap to Record Voice",
      stopRecordBtn: "Stop & Send Audio",
      recordingStatus: "Recording voice alert...",
      transcribing: "Transcribing with AI...",
      cancel: "Cancel",
      rerecord: "Re-record",
      sendVoice: "Send Voice",
      textTileTitle: "C) Silent Text",
      typePlaceholder: "Type details to safety responders...",
      safeNow: "I am safe now / Cancel alert",
      ref: "INCIDENT",
      activeSeat: "REGISTERED SEAT",
      oneTapBadge: "1-Tap Alert",
      medicalTag: "Medical Emergency",
      securityTag: "Security & Brawl",
      fireTag: "Fire & Crowd Surge",
      verifiedBadge: "VERIFIED",
      safetyLeadLabel: "Safety Steward",
      securityCommandLabel: "Security Command",
      youLabel: "You",
    },
    fr: {
      appName: "MyArena",
      appSubtitle: "Assistant de sécurité du stade",
      changePerspective: "← Changer de perspective",
      scannedTicket: "Scanné depuis votre billet",
      urgentQuestion: "Besoin d'aide urgente ?",
      urgentSubtitle: "Appuyez une fois. Votre localisation est détectée depuis votre billet.",
      medicalTitle: "Médical",
      medicalDesc: "Quelqu'un est blessé, s'est évanoui ou se sent mal",
      medicalSub: "Malaise, perte de connaissance • Équipe médicale",
      securityTitle: "Sécurité",
      securityDesc: "Bagarre, menace physique, agression ou vol",
      securitySub: "Affrontement, projectiles • Équipe de sécurité",
      fireTitle: "Feu / Bousculade",
      fireDesc: "Fumigène, incendie, passage bloqué ou mouvement de foule",
      fireSub: "Fumée, bousculade • Équipe pompiers & sécurité",
      somethingElse: "Autre signalement (objet perdu, renseignement)",
      helpOnWay: "Les secours arrivent",
      estimatedEta: "Arrivée estimée",
      assignedUnit: "Équipe déployée",
      aiSpeaking: "L'officier de sécurité IA vous parle...",
      aiTitle: "Interphone d'urgence MyArena",
      hearAgain: "Réécouter les instructions de sécurité",
      stepReceived: "Reçu",
      stepDispatched: "Équipe assignée",
      stepEnRoute: "En route",
      quickTileTitle: "A) Messages rapides",
      quickTileDesc: "Réponse immédiate en un tap",
      voiceTileTitle: "B) Message vocal",
      voiceTileDesc: "Parlez en Français, Darija ou Arabe",
      recordBtn: "Appuyer pour enregistrer la voix",
      stopRecordBtn: "Arrêter & Envoyer",
      recordingStatus: "Enregistrement vocal en cours...",
      transcribing: "Transcription IA en cours...",
      cancel: "Annuler",
      rerecord: "Réenregistrer",
      sendVoice: "Envoyer le vocal",
      textTileTitle: "C) Écrit silencieux",
      typePlaceholder: "Écrivez aux stadiers de sécurité ici...",
      safeNow: "Je suis en sécurité / Clôturer l'alerte",
      ref: "INCIDENT",
      activeSeat: "PLACE ENREGISTRÉE",
      oneTapBadge: "Alerte 1-Clic",
      medicalTag: "Urgence Médicale",
      securityTag: "Sécurité & Bagarre",
      fireTag: "Incendie & Bousculade",
      verifiedBadge: "VÉRIFIÉ",
      safetyLeadLabel: "Stadier de Sécurité",
      securityCommandLabel: "Poste de Sécurité",
      youLabel: "Vous",
    },
    ar: {
      appName: "MyArena",
      appSubtitle: "مساعد الأمان في الملعب",
      changePerspective: "← تغيير المنظور",
      scannedTicket: "تم المسح من تذكرتك",
      urgentQuestion: "محتاج مساعدة مستعجلة؟",
      urgentSubtitle: "اضغط مرة واحدة. مكانك محدد تلقائياً من التذكرة ديالك.",
      medicalTitle: "طبي",
      medicalDesc: "شي واحد مصاب، مغمى عليه أو عيان بزاف",
      medicalSub: "إغماء، إصابة، صعوبة تنفس • الطاقم الطبي",
      securityTitle: "أمن",
      securityDesc: "شجار، تهديد جسدي، عنف أو سرقة",
      securitySub: "شجار، كراسى كيتلاحو • فريق الأمن",
      fireTitle: "حريق / تدافع",
      fireDesc: "دخان كثيف، عافية، باب مبلوكي أو تدافع",
      fireSub: "فيميجان، دخان كحل • فريق الإطفاء والسلامة",
      somethingElse: "شيء آخر بحال غرض مفقود أو استفسار عام",
      helpOnWay: "فريق المساعدة في الطريق إليك",
      estimatedEta: "الوصول التقديري",
      assignedUnit: "الفرقة الموجهة",
      aiSpeaking: "مسؤول السلامة يتحدث إليك الآن...",
      aiTitle: "مكبر الطوارئ الذكي MyArena",
      hearAgain: "إعادة الاستماع لتعليمات السلامة",
      stepReceived: "تم التوصل",
      stepDispatched: "تم توجيه الفرقة",
      stepEnRoute: "في الطريق إليك",
      quickTileTitle: "أ) رسائل سريعة جاهزة",
      quickTileDesc: "إجابة فورية بنقرة واحدة",
      voiceTileTitle: "ب) رسالة صوتية",
      voiceTileDesc: "تكلم بالدارجة، العربية أو الفرنسية",
      recordBtn: "انقر للتسجيل الصوتي",
      stopRecordBtn: "إيقاف وإرسال الصوت",
      recordingStatus: "جاري التسجيل الصوتي المباشر...",
      transcribing: "جاري تفريغ الصوت بالذكاء الاصطناعي...",
      cancel: "إلغاء",
      rerecord: "إعادة التسجيل",
      sendVoice: "إرسال الصوت",
      textTileTitle: "ج) كتابة صامتة",
      typePlaceholder: "كتب للمسعفين بهدوء هنا...",
      safeNow: "أنا في أمان دابا / إنهاء البلاغ",
      ref: "رقم البلاغ",
      activeSeat: "المقعد المسجل",
      oneTapBadge: "إنذار بنقرة واحدة",
      medicalTag: "طوارئ طبية",
      securityTag: "أمن وشجار",
      fireTag: "حريق وتدافع",
      verifiedBadge: "مؤكد",
      safetyLeadLabel: "مسؤول السلامة",
      securityCommandLabel: "غرفة العمليات",
      youLabel: "أنت",
    },
  }[lang];

  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          voicesRef.current = v;
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Stop active speech or audio element completely
  const stopAudio = () => {
    playSessionIdRef.current += 1;
    if (ttsAbortControllerRef.current) {
      try {
        ttsAbortControllerRef.current.abort();
      } catch (_) {}
      ttsAbortControllerRef.current = null;
    }
    if (currentAudioElementRef.current) {
      try {
        currentAudioElementRef.current.pause();
        currentAudioElementRef.current.currentTime = 0;
        currentAudioElementRef.current.src = '';
      } catch (_) {}
      currentAudioElementRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
    if (wordTickerRef.current) {
      clearInterval(wordTickerRef.current);
      wordTickerRef.current = null;
    }
    setIsSpeaking(false);
    setCurrentSpokenWordIdx(-1);
  };

  // Helper to ensure authentic native voice (never a French system voice speaking English)
  const getNativeVoice = (targetLang: SupportedLang): SpeechSynthesisVoice | null => {
    const available = voicesRef.current.length > 0
      ? voicesRef.current
      : typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis.getVoices()
      : [];
    if (!available || available.length === 0) return null;

    if (targetLang === 'en') {
      const preferredEnglishNames = [
        'google us english',
        'samantha',
        'alex',
        'daniel',
        'karen',
        'oliver',
        'serena',
        'google uk english female',
        'google uk english male',
        'microsoft david',
        'microsoft zira',
        'microsoft mark',
        'microsoft george',
        'microsoft hazel',
        'en-us',
        'en-gb',
      ];

      for (const pref of preferredEnglishNames) {
        const match = available.find(
          (v) =>
            v.name.toLowerCase().includes(pref) &&
            !v.name.toLowerCase().includes('french') &&
            !v.name.toLowerCase().includes('français') &&
            !v.lang.toLowerCase().startsWith('fr')
        );
        if (match) return match;
      }

      const strictEn = available.find(
        (v) =>
          (v.lang.toLowerCase() === 'en-us' || v.lang.toLowerCase() === 'en-gb') &&
          !v.name.toLowerCase().includes('french') &&
          !v.name.toLowerCase().includes('français') &&
          !v.lang.toLowerCase().startsWith('fr')
      );
      if (strictEn) return strictEn;

      const anyEn = available.find(
        (v) =>
          v.lang.toLowerCase().startsWith('en') &&
          !v.name.toLowerCase().includes('french') &&
          !v.name.toLowerCase().includes('français') &&
          !v.lang.toLowerCase().startsWith('fr')
      );
      if (anyEn) return anyEn;
    } else if (targetLang === 'fr') {
      const match = available.find((v) => v.lang.toLowerCase().startsWith('fr'));
      if (match) return match;
    } else if (targetLang === 'ar') {
      const match = available.find((v) => v.lang.toLowerCase().startsWith('ar'));
      if (match) return match;
    }

    return null;
  };

  // Speech Output: Gemini TTS first, with fallback to browser speechSynthesis
  const playSpeech = async (textToSpeak: string, targetLang: SupportedLang) => {
    if (isMuted || !textToSpeak) return;
    stopAudio();

    const currentSession = playSessionIdRef.current;
    const controller = new AbortController();
    ttsAbortControllerRef.current = controller;

    const fullLang = getFullLanguageName(targetLang);

    // 1. Try Gemini TTS API first
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
          language: fullLang,
        }),
        signal: controller.signal,
      });

      // Discard if stopAudio or another playSpeech was called while fetching
      if (currentSession !== playSessionIdRef.current) return;

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (currentSession !== playSessionIdRef.current) return;

        if (data.audioBase64) {
          const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
          currentAudioElementRef.current = audio;
          setIsSpeaking(true);

          const words = textToSpeak.split(/\s+/).filter(Boolean);
          if (words.length > 0) {
            const approxWordDurationMs = Math.max(200, Math.floor((textToSpeak.length * 60) / words.length));
            let idx = 0;
            if (wordTickerRef.current) clearInterval(wordTickerRef.current);
            wordTickerRef.current = setInterval(() => {
              if (currentSession !== playSessionIdRef.current) {
                if (wordTickerRef.current) clearInterval(wordTickerRef.current);
                return;
              }
              idx += 1;
              if (idx < words.length) {
                setCurrentSpokenWordIdx(idx);
              } else {
                if (wordTickerRef.current) clearInterval(wordTickerRef.current);
              }
            }, approxWordDurationMs);
          }

          audio.onended = () => {
            if (currentSession === playSessionIdRef.current) {
              setIsSpeaking(false);
              setCurrentSpokenWordIdx(-1);
              if (wordTickerRef.current) clearInterval(wordTickerRef.current);
            }
          };

          audio.onerror = () => {
            if (currentSession === playSessionIdRef.current) {
              setIsSpeaking(false);
              setCurrentSpokenWordIdx(-1);
              if (wordTickerRef.current) clearInterval(wordTickerRef.current);
            }
          };

          await audio.play();
          return;
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || currentSession !== playSessionIdRef.current) {
        return;
      }
      // Seamlessly proceeds to browser speechSynthesis fallback
    }

    if (currentSession !== playSessionIdRef.current) return;

    // 2. Fallback: Browser SpeechSynthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        const targetLangCode = targetLang === 'ar' ? 'ar-SA' : targetLang === 'fr' ? 'fr-FR' : 'en-US';
        const nativeVoice = getNativeVoice(targetLang);

        if (nativeVoice) {
          utterance.voice = nativeVoice;
          utterance.lang = nativeVoice.lang || targetLangCode;
        } else {
          utterance.lang = targetLangCode;
        }

        const words = textToSpeak.split(/\s+/).filter(Boolean);
        utterance.onstart = () => {
          if (currentSession !== playSessionIdRef.current) {
            window.speechSynthesis.cancel();
            return;
          }
          setIsSpeaking(true);
          if (words.length > 0) {
            const approxWordDurationMs = Math.max(220, Math.floor((textToSpeak.length * 65) / words.length));
            let idx = 0;
            if (wordTickerRef.current) clearInterval(wordTickerRef.current);
            wordTickerRef.current = setInterval(() => {
              if (currentSession !== playSessionIdRef.current) {
                if (wordTickerRef.current) clearInterval(wordTickerRef.current);
                return;
              }
              idx += 1;
              if (idx < words.length) {
                setCurrentSpokenWordIdx(idx);
              } else {
                if (wordTickerRef.current) clearInterval(wordTickerRef.current);
              }
            }, approxWordDurationMs);
          }
        };

        utterance.onend = () => {
          if (currentSession === playSessionIdRef.current) {
            setIsSpeaking(false);
            setCurrentSpokenWordIdx(-1);
            if (wordTickerRef.current) clearInterval(wordTickerRef.current);
          }
        };

        utterance.onerror = () => {
          if (currentSession === playSessionIdRef.current) {
            setIsSpeaking(false);
            setCurrentSpokenWordIdx(-1);
            if (wordTickerRef.current) clearInterval(wordTickerRef.current);
          }
        };

        window.speechSynthesis.speak(utterance);
      } catch (synthErr) {
        console.warn('SpeechSynthesis error:', synthErr);
      }
    }
  };

  // Sync latest AI message whenever incident chat updates
  useEffect(() => {
    if (!activeIncident || activeIncident.chatMessages.length === 0) {
      stopAudio();
      return;
    }

    const messages = activeIncident.chatMessages;
    const lastMsg = messages[messages.length - 1];

    if (lastMsg && (lastMsg.sender === 'ai' || lastMsg.sender === 'operator')) {
      if (lastMsg.quickReplies && lastMsg.quickReplies.length > 0) {
        setModelQuickReplies(lastMsg.quickReplies);
      }
      setLatestAiText(lastMsg.text);

      // Play speech ONLY if this exact message has not been spoken yet
      if (lastSpokenMessageIdRef.current !== lastMsg.id) {
        lastSpokenMessageIdRef.current = lastMsg.id;
        playSpeech(lastMsg.text, lang);
      }
    } else if (lastMsg && lastMsg.sender === 'supporter') {
      // Supporter just sent a message: stop any ongoing audio immediately, do not repeat old AI message
      stopAudio();
    }
  }, [activeIncident?.chatMessages, lang]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeIncident?.chatMessages, isAiTyping]);

  // Estimated arrival countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeIncident && arrivalSeconds > 10) {
      timer = setInterval(() => {
        setArrivalSeconds((prev) => Math.max(10, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeIncident, arrivalSeconds]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Handler for language switch
  const handleLanguageChange = async (newLang: SupportedLang) => {
    if (newLang === lang) return;
    stopAudio();
    onSelectLang(newLang);

    // If an incident is active, regenerate opening line and continue in new language immediately
    if (activeIncident && onRegenerateLanguage) {
      setIsAiTyping(true);
      try {
        const res = await onRegenerateLanguage(activeIncident.id, newLang);
        if (res.assistantReply?.quickReplies) {
          setModelQuickReplies(res.assistantReply.quickReplies);
        }
        if (res.assistantReply?.text) {
          setLatestAiText(res.assistantReply.text);
        }
      } finally {
        setIsAiTyping(false);
      }
    }
  };

  // 1. ONE-TAP EMERGENCY TRIGGER
  const handleButtonPress = async (type: IncidentType) => {
    stopAudio();
    setIsSending(true);
    setIsAiTyping(true);
    const lockedLangName = getFullLanguageName(lang);

    try {
      const res = await onTriggerOneTapAlert({
        type,
        zone: REGISTERED_TICKET.zone,
        seat: getLocalizedTicketSeat(lang),
        language: lockedLangName,
      });

      if (res.firstAssistantMessage?.quickReplies) {
        setModelQuickReplies(res.firstAssistantMessage.quickReplies);
      }
      if (res.firstAssistantMessage?.text) {
        setLatestAiText(res.firstAssistantMessage.text);
      }
    } catch (err) {
      console.error('One-tap trigger failed:', err);
    } finally {
      setIsSending(false);
      setIsAiTyping(false);
    }
  };

  // 2. SEND USER MESSAGE (EITHER FROM QUICK CHIP OR TEXT OR VOICE)
  const submitSupporterText = async (text: string) => {
    if (!activeIncident || isSending || !text.trim()) return;
    stopAudio();
    setIsSending(true);
    setIsAiTyping(true);

    // Mark chip as used
    setUsedChips((prev) => new Set([...prev, text.trim().toLowerCase()]));

    const lockedLangName = getFullLanguageName(lang);

    try {
      const res = await onSendSupporterChatReply(activeIncident.id, text.trim(), lockedLangName);
      if (res.assistantReply?.quickReplies) {
        setModelQuickReplies(res.assistantReply.quickReplies);
      }
      if (res.assistantReply?.text) {
        setLatestAiText(res.assistantReply.text);
      }
    } finally {
      setIsSending(false);
      setIsAiTyping(false);
    }
  };

  // 3. VOICE RECORDING VIA MEDIARECORDER + GEMINI MULTIMODAL TRANSCRIBE
  const startRecording = async () => {
    stopAudio();
    setRecordedTranscript('');
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
        setRecordingWaveform([
          Math.floor(Math.random() * 26) + 6,
          Math.floor(Math.random() * 32) + 8,
          Math.floor(Math.random() * 28) + 10,
          Math.floor(Math.random() * 36) + 12,
          Math.floor(Math.random() * 30) + 8,
          Math.floor(Math.random() * 24) + 6,
          Math.floor(Math.random() * 34) + 10,
          Math.floor(Math.random() * 20) + 6,
        ]);
      }, 200);
    } catch (err) {
      console.warn('Microphone permission denied or MediaRecorder unsupported:', err);
      // Fallback message
      const fallbackVoice = lang === 'ar' ? 'كنحتاج مساعدة عاجلة هنا' : lang === 'fr' ? 'Besoin d’aide urgente' : 'Need urgent help';
      setRecordedTranscript(fallbackVoice);
    }
  };

  const stopAndSendRecording = async () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setIsTranscribing(true);

    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }

    try {
      // Allow dataavailable to flush
      await new Promise((r) => setTimeout(r, 300));
      const mimeType = mediaRecorder?.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const res = reader.result as string;
          resolve(res);
        };
      });
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;

      // Send to server for Gemini multimodal transcription
      const res = await fetch('/api/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64, mimeType }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        const transcript = data.transcript?.trim();
        if (transcript) {
          setRecordedTranscript(transcript);
          await submitSupporterText(transcript);
          return;
        }
      }
    } catch (err) {
      console.warn('Gemini audio transcription error:', err);
    } finally {
      setIsTranscribing(false);
    }

    // Default fallback if audio was empty or error occurred
    const fallbackText = lang === 'ar' ? 'أنا مع الشخص المصاب، المسعفون يسرعو' : lang === 'fr' ? "Je suis avec la personne, dépêchez les secours" : "I am with the person, please hurry";
    await submitSupporterText(fallbackText);
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(false);
    setIsTranscribing(false);
    setRecordedTranscript('');
    setRecordingSeconds(0);
  };

  // Combine model chips (excluding used) with the 3 constant chips
  const activeConstantChips = CONSTANT_QUICK_CHIPS[lang] || CONSTANT_QUICK_CHIPS.fr;
  const filteredModelChips = modelQuickReplies.filter(
    (chip) => !usedChips.has(chip.trim().toLowerCase()) && !activeConstantChips.includes(chip)
  );
  const displayChips = [...filteredModelChips.slice(0, 3), ...activeConstantChips];

  // =========================================================================
  // VIEW 1: SUPPORTER HOME SCREEN (NO ACTIVE EMERGENCY YET)
  // =========================================================================
  if (!activeIncident) {
    return (
      <div 
        dir={isRTL ? 'rtl' : 'ltr'} 
        className="w-full max-w-lg mx-auto min-h-[calc(100vh-140px)] flex flex-col justify-between py-4 px-3 sm:px-4 space-y-5"
      >
        {/* SINGLE IN-PAGE GLASS HEADER CARD */}
        <div className="flex items-center justify-between gap-3 frosted-panel p-4 rounded-3xl shadow-sm border border-white/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#2F6BFF] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Shield className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="inline-block text-lg font-serif-headline text-[#111827] tracking-tight font-bold leading-[1.2] pb-[0.08em]">
                {t.appName}
              </h1>
              <p className="text-[11px] text-[#526071] font-medium hidden sm:block">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onChangePerspective && (
              <button
                onClick={onChangePerspective}
                className="text-xs text-[#526071] hover:text-[#111827] flex items-center gap-1.5 font-medium transition-colors cursor-pointer py-1.5 px-3 rounded-full bg-white/90 border border-black/[0.08] hover:bg-white shadow-2xs active:scale-95"
              >
                <span>{t.changePerspective}</span>
              </button>
            )}

            {/* The single AR / FR / EN switcher */}
            <div className="flex items-center bg-white/90 p-1 rounded-full border border-black/[0.08] shadow-xs text-xs font-bold">
              {(['ar', 'fr', 'en'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => handleLanguageChange(l)}
                  className={`px-2 py-0.5 rounded-full uppercase tracking-wider transition-all cursor-pointer ${
                    lang === l
                      ? 'bg-[#2F6BFF] text-white shadow-xs font-bold'
                      : 'text-[#526071] hover:text-[#111827]'
                  }`}
                >
                  {l === 'ar' ? 'العربية' : l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* REGISTERED TICKET CARD (AUTO-SCANNED, REUSED EVERYWHERE) */}
        <div className="frosted-panel rounded-2xl p-4 sm:p-4.5 flex items-center justify-between border border-emerald-500/25 bg-white/85 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-[11px] font-mono font-bold text-emerald-700 uppercase tracking-wider">
                  {t.scannedTicket}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#111827] mt-0.5 tracking-tight font-serif-headline">
                {getLocalizedTicketSeat(lang)}
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-[10px] font-mono font-bold shrink-0 hidden sm:inline-block">
            {t.activeSeat}
          </span>
        </div>

        {/* Title */}
        <div className="text-center pt-1">
          <h2 className="text-2xl sm:text-3xl font-serif-headline text-[#111827] tracking-tight font-bold">
            {t.urgentQuestion}
          </h2>
          <p className="text-xs text-[#526071] mt-1 max-w-sm mx-auto">
            {t.urgentSubtitle}
          </p>
        </div>

        {/* THREE LARGE EMERGENCY BUTTONS */}
        <div className="flex-1 flex flex-col justify-center gap-3.5 my-2">
          {/* BUTTON 1: MEDICAL */}
          <button
            onClick={() => handleButtonPress('medical_emergency')}
            disabled={isSending}
            className={`group relative min-h-[125px] rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#FF5A5F] via-[#FF4349] to-[#E0245E] text-white active:scale-[0.98] transition-transform duration-200 shadow-xl flex items-center justify-between ${isRTL ? 'text-right' : 'text-left'} pulse-ring-medical cursor-pointer overflow-hidden`}
          >
            <div className={`space-y-1 z-10 ${isRTL ? 'pl-2' : 'pr-2'}`}>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/25 text-white font-mono text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs">
                  {t.oneTapBadge}
                </span>
                <span className="text-white/90 text-xs font-bold">{t.medicalTag}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif-headline font-bold text-white tracking-tight drop-shadow-xs">
                {t.medicalTitle}
              </h3>
              <p className="text-xs font-medium text-white/95">
                {t.medicalDesc}
              </p>
              <p className="text-[11px] text-white/80">
                {t.medicalSub}
              </p>
            </div>

            <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
              <HeartPulse className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-pulse" />
            </div>
          </button>

          {/* BUTTON 2: SECURITY */}
          <button
            onClick={() => handleButtonPress('fight')}
            disabled={isSending}
            className={`group relative min-h-[125px] rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#2F6BFF] via-[#1E56E8] to-[#123FC4] text-white active:scale-[0.98] transition-transform duration-200 shadow-xl flex items-center justify-between ${isRTL ? 'text-right' : 'text-left'} pulse-ring-security cursor-pointer overflow-hidden`}
          >
            <div className={`space-y-1 z-10 ${isRTL ? 'pl-2' : 'pr-2'}`}>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/25 text-white font-mono text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs">
                  {t.oneTapBadge}
                </span>
                <span className="text-white/90 text-xs font-bold">{t.securityTag}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif-headline font-bold text-white tracking-tight drop-shadow-xs">
                {t.securityTitle}
              </h3>
              <p className="text-xs font-medium text-white/95">
                {t.securityDesc}
              </p>
              <p className="text-[11px] text-white/80">
                {t.securitySub}
              </p>
            </div>

            <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
          </button>

          {/* BUTTON 3: FIRE / CRUSH */}
          <button
            onClick={() => handleButtonPress('fire_smoke')}
            disabled={isSending}
            className={`group relative min-h-[125px] rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#FF8A1F] via-[#F97316] to-[#EA580C] text-white active:scale-[0.98] transition-transform duration-200 shadow-xl flex items-center justify-between ${isRTL ? 'text-right' : 'text-left'} pulse-ring-fire cursor-pointer overflow-hidden`}
          >
            <div className={`space-y-1 z-10 ${isRTL ? 'pl-2' : 'pr-2'}`}>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/25 text-white font-mono text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs">
                  {t.oneTapBadge}
                </span>
                <span className="text-white/90 text-xs font-bold">{t.fireTag}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-serif-headline font-bold text-white tracking-tight drop-shadow-xs">
                {t.fireTitle}
              </h3>
              <p className="text-xs font-medium text-white/95">
                {t.fireDesc}
              </p>
              <p className="text-[11px] text-white/80">
                {t.fireSub}
              </p>
            </div>

            <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-white/20 border border-white/40 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
              <Flame className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
          </button>
        </div>

        {/* Bottom Link: Something Else */}
        <div className="text-center pt-1">
          <button
            onClick={() => handleButtonPress('other')}
            disabled={isSending}
            className="text-xs text-[#526071] hover:text-[#111827] underline decoration-black/20 hover:decoration-black transition-colors py-1 px-3 rounded-xl cursor-pointer"
          >
            {t.somethingElse}
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE HELP SCREEN (NO DUPLICATE TOP BAR / NO SECOND SWITCHER)
  // =========================================================================
  const wordsOfLatestAi = (latestAiText || '').split(/\s+/).filter(Boolean);

  return (
    <div 
      dir={isRTL ? 'rtl' : 'ltr'} 
      className="w-full max-w-xl mx-auto min-h-[calc(100vh-140px)] flex flex-col justify-between py-4 px-3 sm:px-4 animate-in zoom-in-95 space-y-4"
    >
      {/* SINGLE IN-PAGE GLASS HEADER CARD */}
      <div className="flex items-center justify-between gap-3 frosted-panel p-4 rounded-3xl shadow-sm border border-white/90">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#2F6BFF] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Shield className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="inline-block text-lg font-serif-headline text-[#111827] tracking-tight font-bold leading-[1.2] pb-[0.08em]">
              {t.appName}
            </h1>
            <p className="text-[11px] text-[#526071] font-medium hidden sm:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onChangePerspective && (
            <button
              onClick={onChangePerspective}
              className="text-xs text-[#526071] hover:text-[#111827] flex items-center gap-1.5 font-medium transition-colors cursor-pointer py-1.5 px-3 rounded-full bg-white/90 border border-black/[0.08] hover:bg-white shadow-2xs active:scale-95"
            >
              <span>{t.changePerspective}</span>
            </button>
          )}

          {/* The single AR / FR / EN switcher */}
          <div className="flex items-center bg-white/90 p-1 rounded-full border border-black/[0.08] shadow-xs text-xs font-bold">
            {(['ar', 'fr', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => handleLanguageChange(l)}
                className={`px-2 py-0.5 rounded-full uppercase tracking-wider transition-all cursor-pointer ${
                  lang === l
                    ? 'bg-[#2F6BFF] text-white shadow-xs font-bold'
                    : 'text-[#526071] hover:text-[#111827]'
                }`}
              >
                {l === 'ar' ? 'العربية' : l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TOP EMERGENCY CARD: STATUS, ESTIMATED ETA, MUTE TOGGLE */}
      <div className="frosted-panel rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-sm border border-white/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2F6BFF] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#2F6BFF]" />
            </span>
            <span className="text-xs font-bold text-[#2F6BFF] tracking-wider uppercase">
              {t.helpOnWay}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Mute/Unmute */}
            <button
              onClick={() => {
                if (isSpeaking && !isMuted) {
                  stopAudio();
                }
                setIsMuted(!isMuted);
              }}
              className="p-2 rounded-full bg-white/90 border border-black/10 text-[#526071] hover:text-[#111827] transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-[#2F6BFF]" />}
            </button>

            {/* Estimated ETA Badge */}
            <span className="text-xs font-mono font-bold text-[#111827] bg-white/90 px-3 py-1 rounded-xl border border-black/[0.08] flex items-center gap-1.5 shadow-2xs font-tabular">
              <Clock className="w-3.5 h-3.5 text-[#FF8A1F]" />
              {t.estimatedEta}: ~{formatTime(arrivalSeconds)}
            </span>
          </div>
        </div>

        {/* REGISTERED SEAT IN HEADER */}
        <div className="flex items-center justify-between text-xs py-1.5 px-3 bg-emerald-50/80 border border-emerald-200/60 rounded-xl text-emerald-900 font-mono">
          <div className="flex items-center gap-1.5 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-bold truncate">{activeIncident.exactSeat || getLocalizedTicketSeat(lang)}</span>
          </div>
          <span className="text-[10px] text-emerald-700 uppercase shrink-0 font-bold ml-2">{t.verifiedBadge}</span>
        </div>

        {/* CENTER: GLOWING ANIMATED AI ORB */}
        <div className="flex flex-col items-center justify-center py-1 space-y-1.5">
          <div className="relative flex items-center justify-center">
            <div className="w-18 h-18 rounded-full bg-gradient-to-tr from-[#2F6BFF] via-[#7EE0C3] to-[#FF8A1F] animate-ai-orb flex items-center justify-center shadow-lg">
              <div className="w-13 h-13 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-inner">
                {isSpeaking ? (
                  <div className="flex items-center gap-1 h-5">
                    <span className="w-1 h-3 bg-[#2F6BFF] rounded-full animate-wave-1" />
                    <span className="w-1 h-5 bg-[#2F6BFF] rounded-full animate-wave-2" />
                    <span className="w-1 h-6 bg-[#2F6BFF] rounded-full animate-wave-3" />
                    <span className="w-1 h-4 bg-[#2F6BFF] rounded-full animate-wave-4" />
                  </div>
                ) : (
                  <Sparkles className="w-6 h-6 text-[#2F6BFF]" />
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-0.5 text-center">
            <span className="text-[11px] font-semibold text-[#526071]">
              {isSpeaking ? (
                <span className="text-[#2F6BFF] font-bold animate-pulse">{t.aiSpeaking}</span>
              ) : (
                <span>{t.aiTitle}</span>
              )}
            </span>
            <button
              onClick={() => {
                if (latestAiText) playSpeech(latestAiText, lang);
              }}
              className="text-[10px] text-[#2F6BFF] hover:underline font-medium flex items-center gap-1 py-0.5 cursor-pointer"
            >
              <Volume2 className="w-3 h-3" /> {t.hearAgain}
            </button>
          </div>
        </div>

        {/* WORD-BY-WORD SYNCHRONIZED DISPLAY (SUBTITLES) */}
        {latestAiText && (
          <div className="p-3 rounded-2xl bg-white/90 border border-[#2F6BFF]/20 shadow-xs text-center space-y-1">
            <div className="text-xs sm:text-sm text-[#111827] leading-relaxed font-medium">
              {wordsOfLatestAi.map((word, idx) => {
                const isCurrentWord = isSpeaking && currentSpokenWordIdx === idx;
                return (
                  <span
                    key={idx}
                    className={`inline-block mx-0.5 transition-colors duration-150 ${
                      isCurrentWord
                        ? 'bg-[#2F6BFF] text-white px-1.5 py-0.5 rounded-md font-bold shadow-xs scale-105'
                        : ''
                    }`}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress Tracker */}
        <div className="pt-2 border-t border-black/[0.06]">
          <div className="grid grid-cols-3 gap-2 text-[11px] font-semibold text-center">
            <div className="flex flex-col items-center gap-1 text-[#2F6BFF]">
              <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <span>{t.stepReceived}</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-[#2F6BFF]">
              <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center font-bold text-xs">
                ✓
              </div>
              <span className="truncate max-w-[120px]">{activeIncident.assignedTeam || t.stepDispatched}</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-[#FF8A1F] font-bold animate-pulse">
              <div className="w-6 h-6 rounded-full bg-orange-50 border-2 border-[#FF8A1F] flex items-center justify-center text-xs">
                ⚡
              </div>
              <span>{t.stepEnRoute}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI INTERCOM CHAT STREAM */}
      <div className="frosted-panel rounded-3xl p-4 overflow-y-auto max-h-[220px] space-y-3">
        {activeIncident.chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'supporter'
                ? isRTL ? 'items-start' : 'items-end'
                : isRTL ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1 px-1">
              {msg.sender === 'ai' && (
                <span className="text-[10px] font-bold text-[#2F6BFF] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {t.safetyLeadLabel}
                </span>
              )}
              {msg.sender === 'operator' && (
                <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> {t.securityCommandLabel}
                </span>
              )}
              {msg.sender === 'supporter' && (
                <span className="text-[10px] font-medium text-[#526071]">{t.youLabel}</span>
              )}
            </div>

            <div
              className={`max-w-[90%] rounded-2xl p-3 text-xs font-medium leading-relaxed shadow-xs ${
                msg.sender === 'supporter'
                  ? 'bg-[#2F6BFF] text-white'
                  : msg.sender === 'operator'
                  ? 'bg-amber-50 border border-amber-200 text-amber-900'
                  : 'bg-white text-[#111827] border border-white/90'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {isAiTyping && (
          <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-white w-20 shadow-xs border border-white/80">
            <span className="w-2 h-2 rounded-full bg-[#2F6BFF] animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-[#2F6BFF] animate-bounce [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-[#2F6BFF] animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* THREE LARGE RESPONSE TILES AT BOTTOM */}
      <div className="space-y-3 pt-1">
        {/* TILE 1: QUICK MESSAGES (Model non-repeating chips + 3 constant translated chips) */}
        <div className="frosted-panel rounded-3xl p-4 shadow-sm border border-white/90 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827]">
              <Sparkles className="w-4 h-4 text-[#2F6BFF]" />
              <span>{t.quickTileTitle}</span>
            </div>
            <span className="text-[10px] text-[#526071]">{t.quickTileDesc}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {displayChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => submitSupporterText(chip)}
                disabled={isSending}
                className="p-2.5 rounded-2xl text-xs font-bold bg-white/90 hover:bg-neutral-50 text-[#111827] border border-black/[0.08] active:scale-95 transition-all shadow-xs text-center cursor-pointer hover:border-[#2F6BFF]/40 leading-snug"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* TILE 2: VOICE INTERCOM (MediaRecorder + Gemini transcription) */}
        <div className="frosted-panel rounded-3xl p-4 shadow-sm border border-white/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#111827]">
              <Mic className="w-4 h-4 text-red-500" />
              <span>{t.voiceTileTitle}</span>
            </div>
            <span className="text-[10px] text-[#526071]">{t.voiceTileDesc}</span>
          </div>

          {!isRecording ? (
            <button
              type="button"
              onClick={startRecording}
              disabled={isSending || isTranscribing}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-red-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-red-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>{isTranscribing ? t.transcribing : `${t.recordBtn} (${lang === 'ar' ? 'العربية / الدارجة' : lang === 'fr' ? 'Français' : 'English'})`}</span>
            </button>
          ) : (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-bold text-red-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                  <span>{t.recordingStatus}</span>
                </span>
                <span className="font-mono font-bold text-red-700 bg-white/80 px-2 py-0.5 rounded-md border border-red-200">
                  {formatTime(recordingSeconds)}
                </span>
              </div>

              {/* Live Waveform */}
              <div className="flex items-center justify-center gap-1.5 h-10 bg-white/80 rounded-xl p-2 border border-red-100">
                {recordingWaveform.map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}px` }}
                    className="w-1.5 bg-red-500 rounded-full transition-all duration-150"
                  />
                ))}
              </div>

              {/* Actions: Stop & Send, Cancel */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={stopAndSendRecording}
                  disabled={isSending}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{t.stopRecordBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={cancelRecording}
                  className="p-2.5 rounded-xl bg-white hover:bg-neutral-100 text-red-600 border border-red-200 font-medium text-xs cursor-pointer"
                  title="Cancel Recording"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* TILE 3: SILENT TEXT */}
        <div className="frosted-panel rounded-3xl p-3.5 shadow-sm border border-white/90">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputText.trim()) {
                const text = inputText;
                setInputText('');
                submitSupporterText(text);
              }
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.typePlaceholder}
              className="flex-1 bg-white border border-black/[0.08] focus:border-[#2F6BFF] rounded-2xl px-4 py-3 text-xs text-[#111827] placeholder:text-[#526071] focus:outline-none shadow-xs"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="p-3.5 rounded-2xl bg-[#2F6BFF] hover:bg-[#1E56E8] disabled:bg-neutral-200 text-white transition-all disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* BOTTOM METADATA WITH SEAT & CANCEL LINK */}
        <div className="flex items-center justify-between text-[11px] text-[#526071] pt-1 px-2 font-mono">
          <span className="truncate max-w-[280px]">
            {t.ref} #{activeIncident.id.slice(-6).toUpperCase()} • {activeIncident.exactSeat || REGISTERED_TICKET.fullSeatString}
          </span>
          <button
            onClick={onClearActiveEmergency}
            className="text-[#526071] hover:text-[#FF5A5F] underline transition-colors cursor-pointer shrink-0 ml-2"
          >
            {t.safeNow}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupporterView;
