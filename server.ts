import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI server-side with telemetry header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Word overlap calculation for code guard (threshold 0.60)
function computeWordOverlap(textA: string, textB: string): number {
  const cleanA = (textA || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const cleanB = (textB || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (cleanA.length === 0 || cleanB.length === 0) return 0;
  const setA = new Set(cleanA);
  const setB = new Set(cleanB);
  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection++;
  }
  return intersection / Math.min(setA.size, setB.size);
}

function isValidLanguageScript(text: string, targetLang: 'French' | 'Arabic' | 'English'): boolean {
  if (!text || typeof text !== 'string') return false;
  const hasArabicScript = /[\u0600-\u06FF]/.test(text);
  if (targetLang === 'Arabic') {
    return hasArabicScript;
  }
  // For French or English, cannot be Arabic script
  if (hasArabicScript) return false;
  return true;
}

// Context-aware local fallbacks in case API is slow or unavailable
function getLocalFallback(
  incidentType: string,
  seat: string,
  lockedLang: 'French' | 'Arabic' | 'English',
  isFollowUp: boolean = false,
  supporterAnswer: string = ''
) {
  const ans = (supporterAnswer || '').toLowerCase();

  // First turn fallback
  if (!isFollowUp) {
    if (lockedLang === 'Arabic') {
      return {
        reply: "أنا معك، فرقة الإسعاف والمنظمون في طريقهم لمقعدك الآن. ابق بجانب الشخص واهدأ، واش كيتنفس؟",
        facts_update: { status: "help_en_route" },
        severity: "high",
        escalate: false,
        quick_replies: ["كيتنفس مزيان", "ما كيتنفسش", "المنظم وصل"],
        dashboard_summary: "Local safety fallback: help dispatched to Virage Nord seat; checking breathing.",
      };
    }
    if (lockedLang === 'English') {
      return {
        reply: "I'm right here with you. Medics and stadium security are on their way to your section right now. Are they conscious and breathing?",
        facts_update: { status: "help_en_route" },
        severity: "high",
        escalate: false,
        quick_replies: ["Breathing normally", "Not breathing", "Help arrived"],
        dashboard_summary: "Emergency team dispatched to seat; checking consciousness and breathing.",
      };
    }
    return {
      reply: "Je suis avec vous, les secours et les stadiers arrivent immédiatement à votre rangée. Restez près de la personne, respire-t-elle normalement ?",
      facts_update: { status: "help_en_route" },
      severity: "high",
      escalate: false,
      quick_replies: ["Elle respire", "Ne respire pas", "Un stadier arrive"],
      dashboard_summary: "Secours dépêchés à la rangée du supporter ; vérification de la respiration en cours.",
    };
  }

  // Follow-up turns (NEVER repeat the first message!)
  const isNegativeBreathing =
    ans.includes('ne respire') || ans.includes('pas') || ans.includes('ما كيتنفس') || ans.includes('not breathing') || ans.includes('inconscient') || ans.includes('unconscious');
  const isStewardArrived =
    ans.includes('stadier') || ans.includes('arrivé') || ans.includes('وصل') || ans.includes('here') || ans.includes('arrived');

  if (lockedLang === 'Arabic') {
    if (isNegativeBreathing) {
      return {
        reply: "تم إشعار المسعفين بأولوية قصوى عاجلة. نادي فوراً على المنظم بسترة صفراء وتأكد من مجرى التنفس.",
        facts_update: { breathing: "negative" },
        severity: "critical",
        escalate: true,
        quick_replies: ["المنظم وصل", "أنا بجانبه", "المسعفون هنا"],
        dashboard_summary: "Supporter reported breathing issue. Escalated to critical priority.",
      };
    }
    if (isStewardArrived) {
      return {
        reply: "ممتاز، أشر للمنظم مباشرة نحو المصاب ليأخذ زمام الأمور فوراً. ابق هادئاً.",
        facts_update: { steward_contact: true },
        severity: "high",
        escalate: false,
        quick_replies: ["المنظم تكفل بالحالة", "كل شيء تحت السيطرة", "شكراً"],
        dashboard_summary: "Steward arrived at seat. Handing over on-site care.",
      };
    }
    return {
      reply: "فرقة المساعدة تقترب من ممر صفكم الآن. ابق بجانب الشخص واحرص على توفير مساحة كافية للتنفس.",
      facts_update: { status: "stewards_approaching" },
      severity: "high",
      escalate: false,
      quick_replies: ["كيتنفس بهدوء", "المنظم وصل", "أحتاج مساعدة"],
      dashboard_summary: "Supporter reassured, response team entering aisle.",
    };
  }

  if (lockedLang === 'English') {
    if (isNegativeBreathing) {
      return {
        reply: "Emergency responders alerted with top priority. Shout to the nearest yellow-vest steward immediately and keep their airway clear.",
        facts_update: { breathing: "negative" },
        severity: "critical",
        escalate: true,
        quick_replies: ["Steward is here", "Airway clear", "I am with them"],
        dashboard_summary: "Supporter reported unresponsive/breathing issue. Escalated to critical priority.",
      };
    }
    if (isStewardArrived) {
      return {
        reply: "Great, signal directly to the steward so they can take over. Stay right there with them.",
        facts_update: { steward_contact: true },
        severity: "high",
        escalate: false,
        quick_replies: ["Steward has taken over", "All safe now", "Still waiting for medics"],
        dashboard_summary: "Steward reached fan section. Handing over response.",
      };
    }
    return {
      reply: "The responders are heading down your aisle right now. Keep them calm and protect their breathing space.",
      facts_update: { status: "stewards_approaching" },
      severity: "high",
      escalate: false,
      quick_replies: ["Breathing calmly", "Help arrived", "Keep them still"],
      dashboard_summary: "Supporter reassured. Response team in aisle.",
    };
  }

  // French follow-up
  if (isNegativeBreathing) {
    return {
      reply: "Alerte maximale transmise aux médecins. Criez immédiatement vers le stadier en gilet jaune le plus proche et dégagez les voies respiratoires.",
      facts_update: { breathing: "negative" },
      severity: "critical",
      escalate: true,
      quick_replies: ["Le stadier arrive", "Voies dégagées", "Je reste à ses côtés"],
      dashboard_summary: "Problème respiratoire signalé. Urgence critique transmise au PC sécurité.",
    };
  }
  if (isStewardArrived) {
    return {
      reply: "Parfait, faites signe de la main au stadier pour qu'il prenne immédiatement le relais auprès de la personne.",
      facts_update: { steward_contact: true },
      severity: "high",
      escalate: false,
      quick_replies: ["Le stadier a pris le relais", "Tout va bien", "En attente des médecins"],
      dashboard_summary: "Stadier sur place à la rangée du supporter.",
    };
  }
  return {
    reply: "Les secours s'engagent dans votre allée en ce moment même. Restez calme à ses côtés et veillez à lui laisser de l'espace.",
    facts_update: { status: "stewards_approaching" },
    severity: "high",
    escalate: false,
    quick_replies: ["Elle respire calmement", "Un stadier arrive", "Je reste avec elle"],
    dashboard_summary: "Secours en approche immédiate dans l'allée du supporter.",
  };
}

// Helper to construct strictly alternating Gemini contents payload [user, model, user, model, ..., user]
function buildMultiturnPayload(
  incidentType: string,
  seat: string,
  lockedLang: 'French' | 'Arabic' | 'English',
  history: any[],
  supporterAnswer: string,
  isFirstMessage: boolean,
  currentStateJson: any
): { role: 'user' | 'model'; parts: { text: string }[] }[] {
  if (isFirstMessage) {
    return [
      {
        role: 'user',
        parts: [
          {
            text: `[EMERGENCY TRIGGER: ${incidentType.toUpperCase()} at ${seat}]. Supporter tapped emergency button. Locked Language: ${lockedLang}. Current state: ${JSON.stringify(currentStateJson)}`,
          },
        ],
      },
    ];
  }

  const rawTurns: { role: 'user' | 'model'; text: string }[] = [];

  // Always ensure conversation starts with a User turn (Gemini API requirement)
  rawTurns.push({
    role: 'user',
    text: `[EMERGENCY TRIGGER: ${incidentType.toUpperCase()} at ${seat}]. Supporter requested immediate help.`,
  });

  if (Array.isArray(history)) {
    for (const msg of history) {
      const isUser = msg.role === 'user' || msg.sender === 'supporter';
      const isModel = msg.role === 'model' || msg.sender === 'ai' || msg.sender === 'operator';
      const text = (msg.text || '').trim();
      if (!text) continue;

      if (isUser) {
        rawTurns.push({ role: 'user', text });
      } else if (isModel) {
        rawTurns.push({ role: 'model', text });
      }
    }
  }

  // Add latest supporter answer if provided
  const latestAnswer = (supporterAnswer || '').trim();
  if (latestAnswer) {
    const last = rawTurns[rawTurns.length - 1];
    // Do not append duplicate identical user message if already at the end
    if (!last || last.role !== 'user' || last.text !== latestAnswer) {
      rawTurns.push({ role: 'user', text: latestAnswer });
    }
  }

  // Sanitize so roles STRICTLY alternate: user -> model -> user -> model ...
  const sanitized: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

  for (const item of rawTurns) {
    if (sanitized.length === 0) {
      if (item.role === 'user') {
        sanitized.push({ role: 'user', parts: [{ text: item.text }] });
      }
    } else {
      const prevRole = sanitized[sanitized.length - 1].role;
      if (item.role !== prevRole) {
        sanitized.push({ role: item.role, parts: [{ text: item.text }] });
      } else {
        // Merge consecutive messages of same role
        sanitized[sanitized.length - 1].parts[0].text += `\n${item.text}`;
      }
    }
  }

  // Conversation MUST end with a user turn for the model to reply
  if (sanitized.length === 0 || sanitized[sanitized.length - 1].role !== 'user') {
    sanitized.push({
      role: 'user',
      parts: [{ text: latestAnswer || 'Please advise on current safety steps.' }],
    });
  }

  return sanitized;
}

// 1. SUPPORTER AI CHAT (REAL CHATBOT, NO SCRIPTED NODES)
app.post('/api/assistant-chat', async (req, res) => {
  const {
    incidentType = 'medical_emergency',
    seat = 'Gate B • Block 104 • Row 12 • Seat 44 • Virage Nord',
    lockedLanguage = 'French',
    history = [],
    supporterAnswer = '',
    isFirstMessage = false,
    state = {
      incident_type: 'medical_emergency',
      ticket_seat: 'Gate B • Block 104 • Row 12 • Seat 44 • Virage Nord',
      facts_known: {},
      actions_already_given: [],
    },
  } = req.body || {};

  const isFollowUp = !isFirstMessage && (Array.isArray(history) && history.length > 0 || Boolean(supporterAnswer));

  // Normalize locked language strictly to French, Arabic, or English
  let lockedLang: 'French' | 'Arabic' | 'English' = 'French';
  const langLower = (lockedLanguage || '').toLowerCase().trim();
  if (langLower.startsWith('ar') || langLower.includes('عرب') || langLower.includes('darija')) {
    lockedLang = 'Arabic';
  } else if (langLower.startsWith('en') || langLower.includes('anglais')) {
    lockedLang = 'English';
  } else {
    lockedLang = 'French';
  }

  try {
    const ai = getGeminiClient();
    if (!ai) {
      const fallback = getLocalFallback(incidentType, seat, lockedLang, isFollowUp, supporterAnswer);
      return res.json(fallback);
    }

    const systemPrompt = `You are the MyArena safety assistant, an AI inside a football stadium app, talking to one person in distress at ${seat}. Help is already dispatched. You are a calm, experienced safety steward having an active two-way conversation: you listen and respond directly to what they said.
Rules:
1. Answer exactly what the person just said or asked before anything else. If they answer about breathing or movement, acknowledge it specifically. If they ask a question (what do I do, how long, who are you, is it serious), answer it directly.
2. Maximum two short spoken-style sentences. No lists, no formulas. Reassurance like 'I am with you' should only be used in the first opening message, NEVER repeated in follow-up turns.
3. Every turn MUST give a new action, specific update, or relevant question. NEVER repeat a sentence or instruction from earlier in the conversation.
4. Never ask for a fact already in the state. 'I don't know' is a valid answer: give the safest default action and move forward.
5. Safety advice must come only from ALLOWED_ACTIONS, rephrased in your own words. Never diagnose.
6. If the person says someone is not breathing or unconscious, set escalate true and severity critical, and state that top priority emergency medical teams were alerted.
7. Reply ONLY in ${lockedLang}. In English, speak natural, authentic standard English (use 'paramedics', 'stewards', 'medical team'). In Arabic, understand Darija and answer in clear Arabic with light Darija. In French, natural spoken French.
8. Keep replies concise and clear for audio playback in a noisy stadium.

ALLOWED_ACTIONS:
- Medical: Keep the person still and warm without moving them unless direct danger. Loosen tight collar or clothing around the neck. Check breathing and reaction; shout to nearest steward in yellow vest. If bleeding, press firmly on the wound with clean cloth without releasing. Do not give food or drink and do not force them to stand. If chest pain or breathing difficulty, keep them seated or semi-reclined.
- Fire / Smoke: Stay low under the smoke and cover mouth and nose with a garment. Head calmly toward lighted green emergency exit signs. Never touch flares or hot objects. Follow steward hand signals.
- Crowd crush / Surge: Cross arms over chest to protect breathing space. Move diagonally with crowd flow; do not fight against the crowd and never bend down for dropped items. Look for relief gates opened by stewards.
- Security / Brawl / Physical threat: Move calmly back several rows away from the altercation. Do not film or engage. Stay near stewards or family safety zones. Keep stairways clear for security teams.

Good exchange examples:
Example 1 (Medical - French):
User: "Elle s'est évanouie par terre !"
Model: {"reply": "Je suis avec vous, l'équipe médicale SAMU arrive à votre rangée. Ne la relevez pas et desserrez son col, est-ce qu'elle respire ?", "facts_update": {"victim_status": "fainted_on_ground"}, "severity": "high", "escalate": false, "quick_replies": ["Elle respire", "Ne respire pas", "Je ne sais pas"], "dashboard_summary": "Victime évanouie au sol ; col desserré, contrôle de la respiration en cours."}

Example 2 (Follow-up - French):
User: "Elle respire"
Model: {"reply": "Parfait, maintenez-la allongée sur le côté sans lui donner à boire. Les stadiers arrivent dans votre allée avec la trousse.", "facts_update": {"breathing": "confirmed"}, "severity": "high", "escalate": false, "quick_replies": ["Le stadier est là", "Elle bouge", "Combien de temps ?"], "dashboard_summary": "Respiration confirmée ; position latérale de sécurité conseillée."}

Example 3 (Follow-up - English):
User: "Breathing normally"
Model: {"reply": "Good, keep them resting flat on their side and do not offer water yet. The section stewards are entering your aisle right now.", "facts_update": {"breathing": "normal"}, "severity": "high", "escalate": false, "quick_replies": ["Steward arrived", "They are waking up", "What do I do now?"], "dashboard_summary": "Breathing normal; supporter instructed to keep them resting on their side."}

Example 4 (Follow-up - Arabic/Darija):
User: "كيتنفس مزيان"
Model: {"reply": "مزيان بزاف، خليه مرتاح وماتعطيهش الماء دابا. فرقة الإسعاف واصلين للدرج ديال صفكم.", "facts_update": {"breathing": "confirmed"}, "severity": "high", "escalate": false, "quick_replies": ["المنظم وصل", "بدا كيفيق", "شحال ديال الوقت؟"], "dashboard_summary": "تم التأكد من التنفس؛ المسعفون في ممر الصف."}`;

    const currentStateJson = {
      incident_type: incidentType,
      ticket_seat: seat,
      locked_language: lockedLang,
      facts_known: state?.facts_known || {},
      actions_already_given: state?.actions_already_given || [],
    };

    // Build strictly alternating Gemini multiturn payload
    const contentsPayload = buildMultiturnPayload(
      incidentType,
      seat,
      lockedLang,
      history,
      supporterAnswer,
      isFirstMessage,
      currentStateJson
    );

    // Extract previous assistant replies for word overlap check
    const previousAssistantReplies: string[] = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role === 'model' || msg.sender === 'ai') {
          if (msg.text) previousAssistantReplies.push(msg.text);
        }
      }
    }

    const callModel = async (retryInstruction?: string) => {
      let payload = [...contentsPayload];
      if (retryInstruction) {
        // Append retry instruction to the last user turn rather than creating consecutive user turns
        const lastIdx = payload.length - 1;
        const lastTurn = payload[lastIdx];
        payload[lastIdx] = {
          role: 'user',
          parts: [{ text: `${lastTurn.parts[0].text}\n\n[Instruction: ${retryInstruction}]` }],
        };
      }

      return await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: payload,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              facts_update: { type: Type.OBJECT },
              severity: {
                type: Type.STRING,
                enum: ['low', 'medium', 'high', 'critical'],
              },
              escalate: { type: Type.BOOLEAN },
              quick_replies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              dashboard_summary: { type: Type.STRING },
            },
            required: ['reply', 'severity', 'escalate', 'quick_replies', 'dashboard_summary'],
          },
        },
      });
    };

    const callModelWithTimeout = async (retryInstruction?: string, timeoutMs = 7000) => {
      const modelPromise = callModel(retryInstruction);
      let timer: NodeJS.Timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Model call timeout')), timeoutMs);
      });
      try {
        const result = await Promise.race([modelPromise, timeoutPromise]);
        clearTimeout(timer!);
        return result;
      } catch (err) {
        clearTimeout(timer!);
        throw err;
      }
    };

    let response = await callModelWithTimeout();
    let parsed: any = null;

    if (response?.text) {
      try {
        parsed = JSON.parse(response.text);
      } catch (e) {
        console.warn('Failed to parse model JSON:', e);
      }
    }

    // Code guard: check word overlap and script validity
    let shouldRegenerate = false;
    if (!parsed || !parsed.reply) {
      shouldRegenerate = true;
    } else {
      const scriptValid = isValidLanguageScript(parsed.reply, lockedLang);
      const overlap = previousAssistantReplies.length > 0
        ? Math.max(...previousAssistantReplies.map((p) => computeWordOverlap(parsed.reply, p)))
        : 0;

      if (!scriptValid || overlap > 0.6) {
        console.warn(`[MyArena Guard] Regenerating: scriptValid=${scriptValid}, maxOverlap=${overlap}`);
        shouldRegenerate = true;
      }
    }

    // Regenerate once if rejected
    if (shouldRegenerate) {
      const retryMsg = `Say something brand new and different responding directly to the supporter's latest statement, in ${lockedLang}. Do not repeat previous phrases.`;
      try {
        const retryResponse = await callModelWithTimeout(retryMsg, 5000);
        if (retryResponse?.text) {
          try {
            const retryParsed = JSON.parse(retryResponse.text);
            if (retryParsed && retryParsed.reply && isValidLanguageScript(retryParsed.reply, lockedLang)) {
              parsed = retryParsed;
            }
          } catch (_) {}
        }
      } catch (_) {}
    }

    if (parsed && parsed.reply) {
      return res.json({
        reply: parsed.reply,
        facts_update: parsed.facts_update || {},
        severity: parsed.severity || 'high',
        escalate: Boolean(parsed.escalate),
        quick_replies: Array.isArray(parsed.quick_replies) ? parsed.quick_replies.slice(0, 4) : [],
        dashboard_summary: parsed.dashboard_summary || `Supporter update at ${seat}: ${parsed.reply.slice(0, 70)}`,
      });
    }

    // Fallback if model output was empty or invalid
    return res.json(getLocalFallback(incidentType, seat, lockedLang, isFollowUp, supporterAnswer));
  } catch (err: any) {
    const errMsg = String(err?.message || err);
    if (!errMsg.includes('429') && !errMsg.includes('RESOURCE_EXHAUSTED')) {
      console.warn('Chat model fallback activated:', errMsg);
    }
    return res.json(getLocalFallback(incidentType, seat, lockedLang, isFollowUp, supporterAnswer));
  }
});

// Circuit-breaker for Gemini TTS quota (Free Tier limit: 10 req/day)
let ttsQuotaExceededUntil = 0;

// 2. GEMINI TTS API (gemini-3.8-flash-tts)
app.post('/api/tts', async (req, res) => {
  const { text, language } = req.body || {};
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (Date.now() < ttsQuotaExceededUntil) {
    return res.json({
      fallbackToSpeechSynthesis: true,
      reason: 'tts_quota_circuit_breaker',
    });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      fallbackToSpeechSynthesis: true,
      reason: 'gemini_client_unavailable',
    });
  }

  const isEnglish = language === 'English' || language === 'en';
  const isFrench = language === 'French' || language === 'fr';
  // Use Puck for authentic native American English, Charon for French, Kore for Arabic
  const voiceName = isEnglish ? 'Puck' : isFrench ? 'Charon' : 'Kore';

  try {
    let response: any = null;

    // 1. Primary: gemini-3.8-flash-tts (high quota, authentic native accents)
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [{ text }],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });
    } catch (primaryErr: any) {
      console.warn('Primary TTS error, trying lite fallback:', primaryErr?.message);
      // 2. Secondary fallback: gemini-3.8-flash-lite-tts
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash-lite-tts',
          contents: [
            {
              role: 'user',
              parts: [{ text }],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName },
              },
            },
          },
        });
      } catch (liteErr: any) {
        console.warn('Lite TTS error:', liteErr?.message);
        return res.json({
          fallbackToSpeechSynthesis: true,
          reason: 'tts_models_unavailable',
        });
      }
    }

    const base64Audio = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
      });
    }

    return res.json({
      fallbackToSpeechSynthesis: true,
      reason: 'no_audio_data',
    });
  } catch (err: any) {
    const errMsg = String(err?.message || err);
    if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || err?.status === 429) {
      ttsQuotaExceededUntil = Date.now() + 15 * 60 * 1000;
    }
    return res.json({
      fallbackToSpeechSynthesis: true,
      reason: 'tts_error',
    });
  }
});

// 3. GEMINI SPEECH INPUT TRANSCRIBE (INCLUDING DARIJA)
app.post('/api/transcribe-audio', async (req, res) => {
  const { audioBase64, mimeType = 'audio/webm' } = req.body;
  if (!audioBase64) {
    return res.status(400).json({ error: 'audioBase64 is required' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({ transcript: '', fallback: true });
  }

  const cleanBase64 = audioBase64.replace(/^data:audio\/\w+;base64,/, '');

  try {
    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/webm',
        data: cleanBase64,
      },
    };

    const textPart = {
      text: `You are the audio speech transcriber for the MyArena football stadium safety assistant.
The speaker is an attendee at a match in Morocco or international venue.
They may speak Moroccan Darija (transcribe in standard Moroccan Darija Arabic letters or Latin Arabizi, exactly as spoken), Standard Arabic, French, or English.
Rules:
1. Transcribe the words accurately and verbatim.
2. Return ONLY the transcribed text. Do NOT include quotation marks, markdown, explanations, or metadata.`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [audioPart, textPart] },
    });

    const transcript = (response.text || '').trim();
    return res.json({ transcript });
  } catch (err: any) {
    const errMsg = String(err?.message || err);
    if (!errMsg.includes('429') && !errMsg.includes('RESOURCE_EXHAUSTED')) {
      console.warn('Audio transcribe fallback activated:', errMsg);
    }
    return res.json({ transcript: '', fallback: true });
  }
});

// 4. ANALYZE REPORT API
app.post('/api/analyze-report', async (req, res) => {
  const { text, zone, imageBase64 } = req.body;
  if (!text && !imageBase64) {
    return res.status(400).json({ error: 'Text or image is required' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      language: 'French',
      incident_type: 'medical_emergency',
      severity: 'high',
      zone: zone || 'Virage Nord',
      english_summary: `Supporter report in ${zone || 'Virage Nord'}: "${(text || '').slice(0, 80)}"`,
      recommended_action: 'Dispatch zone stewards to inspect',
      confidence: 0.85,
      source: 'fallback_engine',
    });
  }

  try {
    const promptText = `You are the AI Safety Engine for "MyArena", a premier football stadium security system.
Analyze the following incident report submitted by a football match supporter.
Supporters may write or speak in Moroccan Darija (Arabic letters or Latin script), French, Standard Arabic, or English.
Supporter seat / zone: "${zone || 'Gate B • Block 104 • Row 12 • Seat 44 • Virage Nord'}".
Supporter report text: "${text || '(Visual report from photo)'}"

Analyze the input:
1. Identify the input language (e.g. "Darija (Latin script)", "Darija (Arabic script)", "French", "Arabic", "English").
2. Determine incident type: "fight", "medical_emergency", "fire_smoke", "overcrowding", "theft", "other".
3. Evaluate severity: "low", "medium", "high", "critical".
4. Identify zone strictly from: "North Stand", "South Stand", "East Stand", "West Stand", "Gate A", "Gate B", "VIP", "Parking".
5. Provide a crisp 1-sentence English summary.
6. Provide an operational recommended security action.
7. Confidence score between 0.0 and 1.0.`;

    const contents: any[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      });
    }
    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: contents },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            language: { type: Type.STRING },
            incident_type: {
              type: Type.STRING,
              enum: ['fight', 'medical_emergency', 'fire_smoke', 'overcrowding', 'theft', 'other'],
            },
            severity: {
              type: Type.STRING,
              enum: ['low', 'medium', 'high', 'critical'],
            },
            zone: {
              type: Type.STRING,
              enum: ['North Stand', 'South Stand', 'East Stand', 'West Stand', 'Gate A', 'Gate B', 'VIP', 'Parking'],
            },
            english_summary: { type: Type.STRING },
            recommended_action: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ['language', 'incident_type', 'severity', 'zone', 'english_summary', 'recommended_action', 'confidence'],
        },
      },
    });

    if (response.text) {
      return res.json({ ...JSON.parse(response.text), source: 'gemini' });
    }
    throw new Error('Empty response');
  } catch (err: any) {
    return res.json({
      language: 'French',
      incident_type: 'medical_emergency',
      severity: 'high',
      zone: zone || 'Virage Nord',
      english_summary: `Supporter report in ${zone || 'Virage Nord'}`,
      recommended_action: 'Dispatch stewards to verify seat',
      confidence: 0.8,
      source: 'fallback_engine',
    });
  }
});

// 5. DEDUPLICATION / MERGE API
app.post('/api/deduplicate', async (req, res) => {
  const { newReport, openIncidents } = req.body;
  if (!newReport) {
    return res.status(400).json({ error: 'newReport is required' });
  }

  if (!openIncidents || openIncidents.length === 0) {
    return res.json({
      matchedIncidentId: null,
      shouldMerge: false,
      reason: 'No open incidents currently in stadium queue.',
    });
  }

  const ai = getGeminiClient();
  if (!ai) {
    const match = openIncidents.find(
      (inc: any) => inc.zone === newReport.zone && inc.incident_type === newReport.incident_type
    );
    if (match) {
      return res.json({
        matchedIncidentId: match.id,
        shouldMerge: true,
        why_merged: `Corroborates active ${match.incident_type} in ${match.zone} reported within matching timeframe.`,
      });
    }
    return res.json({
      matchedIncidentId: null,
      shouldMerge: false,
      why_merged: 'Treated as independent incident.',
    });
  }

  try {
    const candidates = openIncidents.map((inc: any) => ({
      id: inc.id,
      zone: inc.zone,
      type: inc.incident_type,
      summary: inc.english_summary,
      reportCount: inc.reportCount,
      lastReportTime: inc.lastReportTime,
    }));

    const dedupePrompt = `You are the stadium incident deduplication engine for MyArena.
A new incident report has arrived:
- Zone: ${newReport.zone}
- Incident Type: ${newReport.incident_type}
- Original Supporter Text: "${newReport.raw_text || newReport.text}"

Active incidents:
${JSON.stringify(candidates, null, 2)}

Rules:
If they describe the SAME event, return shouldMerge: true, matchedIncidentId: <id>, and a concise why_merged explanation. Otherwise shouldMerge: false, matchedIncidentId: null.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: dedupePrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shouldMerge: { type: Type.BOOLEAN },
            matchedIncidentId: { type: Type.STRING },
            why_merged: { type: Type.STRING },
          },
          required: ['shouldMerge', 'why_merged'],
        },
      },
    });

    if (response.text) {
      return res.json(JSON.parse(response.text));
    }
    throw new Error('Empty dedupe response');
  } catch (err: any) {
    const match = openIncidents.find(
      (inc: any) => inc.zone === newReport.zone && inc.incident_type === newReport.incident_type
    );
    if (match) {
      return res.json({
        matchedIncidentId: match.id,
        shouldMerge: true,
        why_merged: `Corroborates active ${match.incident_type} in ${match.zone}.`,
      });
    }
    return res.json({
      matchedIncidentId: null,
      shouldMerge: false,
      why_merged: 'Treated as independent new incident.',
    });
  }
});

// 6. GENERATE FORMAL INCIDENT REPORT IN FRENCH
app.post('/api/generate-security-report', async (req, res) => {
  const { incidents, stadiumInfo } = req.body;
  const ai = getGeminiClient();

  const fallbackReport = `================================================================================
                    RAPPORT OFFICIEL D'INCIDENT DE SÉCURITÉ
                           MYARENA STADIUM SAFETY OPS
================================================================================
Date & Heure : ${new Date().toLocaleString('fr-FR')}
Événement    : Match officiel - Grand Stade
Statut Global: NIVEAU DE VIGILANCE RENFORCÉ

I. SYNTHÈSE GLOBALE
--------------------------------------------------------------------------------
Nombre total d'incidents enregistrés : ${incidents?.length || 0}
Siège du supporter référencé       : Gate B • Block 104 • Row 12 • Seat 44 • Virage Nord

II. DÉTAILS DES INCIDENTS PAR SECTEUR
--------------------------------------------------------------------------------
${(incidents || [])
  .map(
    (inc: any, idx: number) => `
[INCIDENT #${idx + 1}] - ZONE : ${inc.exactSeat || inc.zone}
- Typologie         : ${inc.incident_type?.toUpperCase()}
- Gravité           : ${inc.severity?.toUpperCase()}
- Signalements liés : ${inc.reportCount || 1} rapport(s)
- Résumé opérationnel : ${inc.dashboard_summary || inc.english_summary || 'Aucun résumé'}
- Mesures requises  : ${inc.recommended_action || 'Contrôle par les stadiers'}
- Justification     : ${inc.why_merged || 'Premier signalement'}
`
  )
  .join('\n')}

III. RECOMMANDATIONS DU COMMANDEMENT
--------------------------------------------------------------------------------
1. Maintenir le dispositif de sécurité actif aux abords de la Porte B et du Virage Nord.
2. Garantir les couloirs d'évacuation médicale vers les issues principales.
3. Rapport transmis à la préfecture et au délégué du match.
================================================================================`;

  if (!ai) {
    return res.json({ report: fallbackReport, source: 'fallback_engine' });
  }

  try {
    const prompt = `Génère un rapport officiel d'incident de sécurité de stade, rédigé en Français professionnel, conforme aux exigences de la préfecture de police, de la commission de sécurité de la ligue et du délégué du match.
Données des incidents en temps réel :
${JSON.stringify(incidents, null, 2)}
Stade : ${stadiumInfo?.name || 'Grand Stade - MyArena'}
Siège du supporter enregistré : Gate B • Block 104 • Row 12 • Seat 44 • Virage Nord

Le rapport doit être clair, formel, structuré :
1. EN-TÊTE OFFICIEL (Date, heure, statut du stade, niveau d'alerte global)
2. RÉSUMÉ EXÉCUTIF (Alertes reçues des supporters en Darija/Français/Arabe, incidents traités et fusionnés par l'IA)
3. FICHE DÉTAILLÉE DES ÉVÉNEMENTS (Secteur exact du siège, type d'incident, degré d'urgence, action entreprise par les secours)
4. PLAN D'ACTION IMMÉDIAT ET DISPOSITIF DE CLÔTURE.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: "Tu es le responsable en chef de la sécurité d'un grand stade de football international.",
      },
    });

    if (response.text) {
      return res.json({ report: response.text, source: 'gemini' });
    }
    return res.json({ report: fallbackReport, source: 'fallback_engine' });
  } catch (err: any) {
    console.error('Failed to generate formal report with Gemini:', err?.message);
    return res.json({ report: fallbackReport, source: 'fallback_engine' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  // Strict API 404 handler: Any unhandled /api/* request returns JSON, NEVER HTML!
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MyArena Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
});
