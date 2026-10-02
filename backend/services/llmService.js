const API_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 8000;
const RETRY_DELAY_MS = 1500;

const INSTRUCTION = 'You explain scholarship eligibility decisions to students. Use ONLY the rules provided below. Do not invent requirements, amounts, limits or documents. The status is already decided by a rule engine and you must NOT change or question it. Write a plain-language explanation of at most 3 sentences that references the relevant rule IDs. If status is NEEDS_MORE_INFORMATION, state exactly what information is missing. Respond with JSON only, no markdown: {"explanation": string, "ruleIdsUsed": string[]}.';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendChat(systemContent, userContent) {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    return { data: null, status: null, message: 'LLM_API_KEY is not configured.' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let lastStatus = null;
  let retried429 = false;
  let retriedReasoningEffort = false;
  let retriedMaxTokens = false;
  let omitReasoningEffort = false;
  let useMaxCompletionTokens = false;
  try {
    while (true) {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.LLM_MODEL,
          messages: [
            { role: 'system', content: systemContent },
            { role: 'user', content: userContent },
          ],
          temperature: 0.1,
          ...(useMaxCompletionTokens ? { max_completion_tokens: 1500 } : { max_tokens: 1500 }),
          response_format: { type: 'json_object' },
          ...(omitReasoningEffort ? {} : { reasoning_effort: 'low' }),
        }),
        signal: controller.signal,
      });
      lastStatus = response.status;

      if (response.status === 429 && !retried429) {
        retried429 = true;
        await wait(RETRY_DELAY_MS);
        continue;
      }
      if (response.status === 400) {
        const errorText = await response.text();
        const lowerErrorText = errorText.toLowerCase();
        if (lowerErrorText.includes('reasoning_effort') && !retriedReasoningEffort) {
          retriedReasoningEffort = true;
          omitReasoningEffort = true;
          continue;
        }
        if (lowerErrorText.includes('max_tokens') && !retriedMaxTokens) {
          retriedMaxTokens = true;
          useMaxCompletionTokens = true;
          continue;
        }
        console.warn(`LLM request failed (status: ${response.status}).`);
        return { data: null, status: response.status, message: `LLM request failed with status ${response.status}.` };
      }
      if (!response.ok) {
        console.warn(`LLM request failed (status: ${response.status}).`);
        return { data: null, status: response.status, message: `LLM request failed with status ${response.status}.` };
      }
      try {
        return { data: await response.json(), status: response.status, message: 'LLM request succeeded.' };
      } catch (_error) {
        console.warn(`LLM request failed (status: ${response.status}).`);
        return { data: null, status: response.status, message: `LLM returned invalid JSON (status ${response.status}).` };
      }
    }
    console.warn(`LLM request failed (status: ${lastStatus}).`);
    return { data: null, status: lastStatus, message: `LLM request failed with status ${lastStatus}.` };
  } catch (error) {
    const timedOut = error.name === 'AbortError';
    console.warn(`LLM request failed (status: ${timedOut ? 'timeout' : 'unavailable'}).`);
    return {
      data: null,
      status: lastStatus,
      message: timedOut ? 'LLM request timed out.' : 'LLM request failed.',
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function explainScheme(profile, scheme, result) {
  try {
    const payload = JSON.stringify({
      studentProfile: profile,
      schemeName: scheme.name,
      rules: (scheme.rules || []).map(({ ruleId, text }) => ({ ruleId, text })),
      decidedStatus: result.status,
      matchedRuleIds: result.matchedRules.map((rule) => rule.ruleId),
      failedRuleIds: result.failedRules.map((rule) => rule.ruleId),
      missingInformation: result.missingInformation,
    });
    const { data } = await sendChat(INSTRUCTION, payload);
    if (!data) return null;
    const text = data.choices?.[0]?.message?.content;
    if (typeof text !== 'string') return null;
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (_error) {
      const safePreview = text.slice(0, 100).replaceAll(process.env.LLM_API_KEY || '\u0000', '[redacted]');
      console.warn(`LLM output JSON parsing failed: ${safePreview}`);
      return null;
    }
    if (typeof parsed.explanation !== 'string' || !parsed.explanation.trim()) return null;
    if (!Array.isArray(parsed.ruleIdsUsed)) return null;
    const validRuleIds = new Set((scheme.rules || []).map((rule) => rule.ruleId));
    return {
      explanation: parsed.explanation.trim(),
      ruleIdsUsed: parsed.ruleIdsUsed.filter((ruleId) => validRuleIds.has(ruleId)),
    };
  } catch (_error) {
    console.warn('LLM response failed validation (status: invalid).');
    return null;
  }
}

async function explainRecommendation(profile, recommendation, schemes) {
  const systemContent = 'You help a student choose between scholarships they are eligible for. The ranking is already decided by estimated annual value and you must NOT change it or the best choice. Use ONLY the data provided. Do not invent amounts, rules or deadlines. In at most 4 sentences explain why the top scheme is the best choice, compare it briefly with the runner-up (value, benefit type, number of documents), and mention any scheme in couldBeBetter that the student could unlock by providing missing information. Respond with JSON only: {"reasoning": string}.';
  try {
    const schemesById = new Map(schemes.map((scheme) => [scheme._id ?? scheme.id, scheme]));
    const rankedSchemes = recommendation.ranking.map((ranked) => {
      const scheme = schemesById.get(ranked.schemeId);
      return {
        schemeId: ranked.schemeId,
        benefitsSummary: scheme?.benefits?.summary,
        requiredDocuments: scheme?.documents || [],
      };
    });
    const userContent = JSON.stringify({
      ranking: recommendation.ranking,
      couldBeBetter: recommendation.couldBeBetter,
      rankedSchemes,
    });
    const { data } = await sendChat(systemContent, userContent);
    if (!data) return null;
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string') return null;
    const cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (_error) {
      const safePreview = content.slice(0, 100).replaceAll(process.env.LLM_API_KEY || '\u0000', '[redacted]');
      console.warn(`LLM recommendation JSON parsing failed: ${safePreview}`);
      return null;
    }
    return typeof parsed.reasoning === 'string' && parsed.reasoning.trim()
      ? parsed.reasoning.trim()
      : null;
  } catch (_error) {
    console.warn('LLM recommendation response failed validation (status: invalid).');
    return null;
  }
}

async function pingLLM() {
  const { data, status, message } = await sendChat(
    'Reply with JSON {"ok": true}',
    'Reply with JSON {"ok": true}'
  );
  const ok = Boolean(data);
  const host = new URL(API_ENDPOINT).host;
  const model = process.env.LLM_MODEL || 'undefined';
  const diagnostic = `status ${status ?? 'unknown'} from ${host}, model ${model}`;
  if (!ok) console.warn(diagnostic);
  return { ok, status, message: ok ? `${message} ${diagnostic}` : diagnostic };
}

module.exports = { explainScheme, explainRecommendation, pingLLM };
