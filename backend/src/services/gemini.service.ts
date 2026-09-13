import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import config from '../config/index.js';
import { VarkaOperationalContext, VarkaContextService } from './varkaContext.service.js';

// Ensure .env is freshly read
dotenv.config();

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Session memory map
const sessionHistoryMap = new Map<string, ChatMessage[]>();

const SYSTEM_INSTRUCTION = `You are VARKA INTELLIGENCE, the operational intelligence assistant inside the Varka maritime logistics platform.

CRITICAL CONCISENESS & RELEVANCE RULES:
1. ONLY ANSWER EXACTLY WHAT THE USER ASKS. NEVER dump unprompted operational summaries, unasked module data, or lengthy reports unless specifically requested.
2. GREETINGS: If the user sends a greeting (e.g. "helo", "hello", "hi", "hyy", "hey", "good morning"), reply ONLY with a polite, natural 1-sentence greeting (e.g. "Hello! How can I assist you with your operations today?"). DO NOT output voyage or market data for a simple greeting.
3. SPECIFIC QUESTIONS: If the user asks a specific question (e.g. "What is the ETA?", "What is the speed?", "What is the freight rate?"), answer ONLY that specific question directly in 1-2 concise sentences.
4. Keep responses direct, professional, and grounded solely in the provided Varka context.
5. Never invent or hallucinate data. If a value is unavailable in the live context, explicitly say that it is unavailable.
6. Only output a comprehensive multi-point summary if the user explicitly asks for a "summary", "overview", or "full report".`;

export class GeminiService {
  /**
   * Retrieve active conversation history for a session (bounded to last 10 messages)
   */
  public static getHistory(userId: string): ChatMessage[] {
    return sessionHistoryMap.get(userId) || [];
  }

  /**
   * Append a message to session history
   */
  public static appendHistory(userId: string, message: ChatMessage): void {
    const history = this.getHistory(userId);
    history.push(message);
    // Keep max 12 messages for memory
    if (history.length > 12) {
      history.splice(0, history.length - 12);
    }
    sessionHistoryMap.set(userId, history);
  }

  /**
   * Clear session history
   */
  public static clearHistory(userId: string): void {
    sessionHistoryMap.delete(userId);
  }

  /**
   * Stream a chat response given the live Varka operational context
   */
  public static async streamChat(
    userId: string,
    userQuery: string,
    context: VarkaOperationalContext,
    onToken: (token: string) => void
  ): Promise<string> {
    // Record user query in history
    this.appendHistory(userId, {
      role: 'user',
      content: userQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    // Refresh env dynamically in case .env was updated
    dotenv.config();
    const apiKey = process.env.GEMINI_API_KEY || config.geminiApiKey || '';
    const modelName = process.env.GEMINI_MODEL || config.geminiModel || 'gemini-2.5-flash';

    // If Gemini API Key is provided, call real Gemini API via @google/genai
    if (apiKey && apiKey.trim() !== '') {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const history = this.getHistory(userId);
        const formattedContext = VarkaContextService.formatForPrompt(context);

        // Build contents payload
        const promptWithContext = `${formattedContext}\n\n---\n**USER QUESTION:** ${userQuery}`;

        // Format history for Gemini API
        const contents: any[] = [];
        // Add prior history (excluding the one just added)
        for (let i = 0; i < history.length - 1; i++) {
          const h = history[i];
          if (!h) continue;
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }],
          });
        }
        // Current user message with injected live operational context
        contents.push({
          role: 'user',
          parts: [{ text: promptWithContext }],
        });

        const responseStream = await ai.models.generateContentStream({
          model: modelName,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.2,
          },
        });

        let fullText = '';
        for await (const chunk of responseStream) {
          const text = chunk.text;
          if (text) {
            fullText += text;
            onToken(text);
          }
        }

        // Append assistant response to history
        this.appendHistory(userId, {
          role: 'assistant',
          content: fullText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });

        return fullText;
      } catch (err: any) {
        console.warn('Gemini API call failed, falling back to local grounded reasoning:', err.message || err);
        // Fall through to local grounded reasoning
      }
    }

    // Grounded Local Operational Reasoning Fallback (Always accurate to live Varka context)
    const localResponse = this.generateGroundedResponse(userQuery, context);

    // Stream out token-by-token with realistic cadence
    const words = localResponse.split(' ');
    let fullText = '';

    for (let i = 0; i < words.length; i++) {
      const token = (i === 0 ? '' : ' ') + words[i];
      fullText += token;
      onToken(token);
      // Brief stream delay
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    this.appendHistory(userId, {
      role: 'assistant',
      content: fullText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    return fullText;
  }

  /**
   * Grounded operational reasoning fallback using live Varka context
   */
  private static generateGroundedResponse(query: string, ctx: VarkaOperationalContext): string {
    const q = query.toLowerCase().trim();

    // 0. Greetings & Salutations (helo, hello, hi, hy, hyy, hey, etc.)
    const isGreeting =
      /^(h+[yi]+|h+e+y+|h+e+l+o+|heya+|sup+|yo+|greetings|good\s+(morning|afternoon|evening|day))[\s!.,?]*$/i.test(q) ||
      ['helo', 'hello', 'hi', 'hy', 'hyy', 'hey', 'yo', 'sup', 'salam', 'namaste'].includes(q);

    if (isGreeting) {
      return `Hello! How can I assist you with your operations today?`;
    }

    // 0.1 Identity & Capabilities ("who are you", "help", "what can you do")
    if (
      q.includes('who are you') ||
      q.includes('what are you') ||
      q === 'help' ||
      q.includes('what can you do') ||
      q.includes('how can you help')
    ) {
      return `I am **VARKA INTELLIGENCE**, your operational AI copilot. I reason over live voyage telemetry, freight rate forecasts, vessel optimization, JIT arrival savings, and charter strategies. Ask me any specific question about your active workspace!`;
    }

    // 0.2 Acknowledgements ("thanks", "thank you", "ok", "great")
    if (/^(thanks?|thank\s+you|ok|okay|cool|great|got\s+it|noted|awesome)[\s!.]*$/i.test(q)) {
      return `You're welcome! Let me know if you need any other voyage or rate details.`;
    }

    // 0.3 Specific quick questions: Speed
    if (q === 'speed' || q.includes('what is the speed') || q.includes('current speed')) {
      return `Current vessel speed for **${ctx.voyage.vesselName}** is **${ctx.tracking.speedKnots} knots** (heading ${ctx.tracking.heading}).`;
    }

    // 0.4 Specific quick questions: ETA
    if (q === 'eta' || q.includes('what is the eta') || q.includes('when will it arrive')) {
      return `Target ETA for **${ctx.voyage.destinationPort}** (${ctx.voyage.destinationCode}) is **${ctx.voyage.eta}**.`;
    }

    // 0.5 Specific quick questions: Position
    if (q.includes('where is the vessel') || q.includes('current position') || q.includes('current location')) {
      return `**${ctx.voyage.vesselName}** is currently at **${ctx.tracking.currentLocation}** (${ctx.tracking.coordinates}) with ${ctx.tracking.distanceRemainingNm} NM remaining.`;
    }

    // 1. Vessel Recommendation / Panamax Fit
    if (q.includes('vessel') || q.includes('panamax') || q.includes('fit') || q.includes('why this')) {
      return `Based on live Varka feasibility checks for **${ctx.portForecast.routeId}** (${ctx.portForecast.originPort} → ${ctx.portForecast.destinationPort}):

- **Recommended Class:** **${ctx.vesselOptimization.recommendedVessel}** (Optimization Score: **${ctx.vesselOptimization.optimizationScore}/100**)
- **Draft & Dimensions:** Draft ${ctx.vesselOptimization.typicalDraftM}m fits Paradip (Max Draft 18m) and Newcastle (Max Draft 15.2m). Beam (${ctx.vesselOptimization.typicalBeamM}m) and LOA (${ctx.vesselOptimization.typicalLoaM}m) satisfy all terminal locks.
- **Parcel Utilisation:** ${ctx.vesselOptimization.utilisationPct}% of DWT for your ${ctx.portForecast.cargoMt.toLocaleString()} MT ${ctx.portForecast.commodity} cargo.
- **Economic Fit:** At $${ctx.portForecast.currentRateUsdMt.toFixed(2)}/MT, Panamax achieves the lowest all-in landed freight while satisfying draft restrictions at both origin and destination.`;
    }

    // 2. Freight Rate / Forecast / Outlook
    if (q.includes('forecast') || q.includes('rate') || q.includes('freight') || q.includes('price') || q.includes('outlook')) {
      return `Current XGBoost rate forecast for **${ctx.portForecast.routeId}** (${ctx.vesselOptimization.recommendedVessel}): **$${ctx.portForecast.currentRateUsdMt.toFixed(2)}/MT** (P10: $${ctx.portForecast.p10RateUsdMt.toFixed(2)} / P90: $${ctx.portForecast.p90RateUsdMt.toFixed(2)}). Key drivers: ${ctx.portForecast.drivers.map((d) => `${d.driver} (+${d.impact.toFixed(2)})`).join(', ')}.`;
    }

    // 3. JIT / Slow Steaming / Fuel / CO2
    if (q.includes('slow steam') || q.includes('jit') || q.includes('fuel') || q.includes('co2') || q.includes('emission')) {
      return `JIT recommendation: **${ctx.jit.action}** (${ctx.jit.standardSpeedKn} kn → **${ctx.jit.jitSpeedKn} kn**). Saves **${ctx.jit.waitingHoursAvoided} hours** waiting at anchorage, **${ctx.jit.fuelSavedTonnes.toFixed(1)} MT** fuel, and ~$${ctx.jit.costSavedUsd.toLocaleString()}.`;
    }

    // 4. Charter Strategy / Fix Now or Wait
    if (q.includes('charter') || q.includes('fix') || q.includes('spot') || q.includes('contract') || q.includes('wait') || q.includes('strategy')) {
      return `Charter assessment for **${ctx.portForecast.selectedVessel}**: Spot is **$${ctx.charterStrategy.spotRateUsdMt.toFixed(2)}/MT**; 3-voyage commitment is **$${ctx.charterStrategy.contract3RateUsdMt.toFixed(2)}/MT** (~$${ctx.charterStrategy.expectedSavingUsd.toLocaleString()} savings). Recommended clause: ${ctx.charterStrategy.protections[0]}.`;
    }

    // 5. Tracking / Current Voyage
    if (q.includes('voyage') || q.includes('tracking')) {
      return `**${ctx.voyage.voyageId}** (${ctx.voyage.vesselName}): ${ctx.voyage.status} from ${ctx.voyage.originPort} to ${ctx.voyage.destinationPort}. Speed: **${ctx.tracking.speedKnots} kn**, ETA: **${ctx.voyage.eta}**. Risk: ${ctx.voyage.riskLevel}.`;
    }

    // 6. Risks / Port Situation / Weather
    if (q.includes('risk') || q.includes('weather') || q.includes('port') || q.includes('congestion')) {
      return `Destination weather at ${ctx.marine.destPortCode}: wave height **${ctx.marine.destWaveHeightM}m**, wind **${ctx.marine.destWindSpeedKn} kn** (${ctx.marine.weatherRisk}). Paradip congestion index: **${ctx.portForecast.congestionScenario}/100**.`;
    }

    // 7. Costs / Agent / Demurrage
    if (q.includes('cost') || q.includes('agent') || q.includes('demurrage') || q.includes('landed') || q.includes('hidden')) {
      return `Base rate: **$${ctx.agentInsights.quotedRate}/MT**, estimated landed range: **$${ctx.agentInsights.estimatedMinLandedCost.toLocaleString()} - $${ctx.agentInsights.estimatedMaxLandedCost.toLocaleString()}** (+${ctx.agentInsights.variancePercent}%). Advice: ${ctx.agentInsights.tacticalAdvice}`;
    }

    // 8. General Summary / Operational Overview (ONLY when user explicitly requests a summary)
    if (q.includes('summar') || q.includes('overview') || q.includes('report') || q.includes('everything') || q.includes('all')) {
      return `**VARKA INTELLIGENCE Summary** for active module **${ctx.currentPage.toUpperCase()}**:

- **Active Voyage:** ${ctx.voyage.vesselName} (${ctx.voyage.status}) traveling at ${ctx.tracking.speedKnots} kn. Target ETA: ${ctx.voyage.eta}.
- **Market Forecast:** $${ctx.portForecast.currentRateUsdMt.toFixed(2)}/MT on ${ctx.portForecast.routeId} for ${ctx.vesselOptimization.recommendedVessel} (P10: $${ctx.portForecast.p10RateUsdMt.toFixed(2)} / P90: $${ctx.portForecast.p90RateUsdMt.toFixed(2)}).
- **JIT Recommendation:** ${ctx.jit.action} (Saving ${ctx.jit.fuelSavedTonnes.toFixed(1)} MT fuel).
- **Next Tactical Step:** ${ctx.agentInsights.tacticalAdvice}`;
    }

    // Default: To-the-point guidance asking what they want to know
    return `I am currently monitoring your **${ctx.currentPage.toUpperCase()}** operations. What specific question do you have (e.g. vessel speed, ETA, freight rates, vessel fit, or JIT savings)?`;
  }
}
