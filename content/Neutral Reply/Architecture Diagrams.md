---
created: 2025-12-23T14:08
updated: 2025-12-25T00:03
publish: true
---
## Task 1 – Architecture Diagrams (Mermaid.js)

### 1. User Flow: Input → Safety → Analysis → User Review → Finalization


mermaid

```
flowchart TD
    U[User<br/>High-conflict message] --> S[Step 1: Paste Message<br/>Next.js UI]
    S --> V[Input Validation<br/>(length, non-empty)]
    V -->|Invalid| E1[Error Message<br/>"Check your input"]
    V -->|Valid| SAF[Safety Check<br/>Regex/phrase scan]

    SAF -->|Flagged| F1[Safety Flag<br/>"Do not respond. Consult legal counsel."]
    SAF -->|Safe| A[Step 2: Analyze<br/>/api/analyze]

    A --> LLM1[LLM Analysis<br/>ANALYSIS_SYSTEM_PROMPT]
    LLM1 --> FP[Filtered Points<br/>Markdown list]

    FP --> UR[User Review<br/>Reads Filtered Points]
    UR --> UA[User Answers<br/>Short responses per numbered request]

    UA --> V2[Input Validation<br/>originalMessage + userAnswers]
    V2 -->|Invalid| E2[Error Message<br/>"Both fields required" / "Too long"]
    V2 -->|Valid| SAF2[Safety Check<br/>combined text]

    SAF2 -->|Flagged| F2[Safety Flag<br/>"Do not respond. Consult legal counsel."]
    SAF2 -->|Safe| FIN[Step 3: Finalize<br/>/api/finalize]

    FIN --> LLM2[LLM Finalization<br/>FINALIZE_SYSTEM_PROMPT + style profile]
    LLM2 --> DR[Draft Neutral Reply<br/>BIFF email body]

    DR --> U2[User Copies / Sends Reply]
```

---

### 2. System Architecture: Next.js Client ↔ API Routes ↔ Safety Layer ↔ LLM

mermaid

```
C4Context
title Neutral Reply – System Architecture

Person(user, "User", "Co-parent / Legal / Professional")
System_Boundary(app, "Neutral Reply (Next.js App)") {
    Container(ui, "Next.js Client (app/page.tsx)", "React/TypeScript", "Three-step workflow UI. Holds all state (messages, answers, style keys).")
    Container_Boundary(api, "API Routes") {
        Container(analyze, "/api/analyze", "Next.js Route Handler", "Performs validation, rate limiting, safety check, and analysis LLM call.")
        Container(finalize, "/api/finalize", "Next.js Route Handler", "Performs validation, rate limiting, safety check, style resolution, and finalization LLM call.")
    }
    Container(lib, "Shared Server Libraries", "TypeScript Modules", "AI config, rate limiting, retries, safety patterns, logging, prompt definitions.")
}

System_Ext(llm, "LLM Provider (Groq / Gemini)", "Llama / Gemini Models", "Executes constrained prompts and returns text streams via Vercel AI SDK.")

Rel(user, ui, "Uses via browser")
Rel(ui, analyze, "POST /api/analyze\n{ message, ... }")
Rel(ui, finalize, "POST /api/finalize\n{ originalMessage, userAnswers, styleKeys }")

Rel(analyze, lib, "Uses\n- aiConfig\n- rateLimit\n- safety\n- logger\n- analyzePrompt")
Rel(finalize, lib, "Uses\n- aiConfig\n- rateLimit\n- safety\n- logger\n- promptTypes\n- finalizePrompt")

Rel(analyze, llm, "streamText(ANALYSIS_SYSTEM_PROMPT, user content)")
Rel(finalize, llm, "streamText(FINALIZE_SYSTEM_PROMPT + style directives)")

Rel(user, llm, "Never directly interacts", "boundary")
```

_(If your Markdown viewer doesn't support `C4Context`, you can present this as standard `flowchart LR` instead.)_

---

### 3. Safety Logic Gate: Defense in Depth

mermaid

```
flowchart TD
    subgraph Client Request
        IN[Incoming Request<br/>message / originalMessage + userAnswers]
    end

    IN --> V[Input Validation<br/>length & presence checks]

    V -->|Invalid| ERR_USER[400 User Error<br/>"Empty" / "Too long" / Missing fields]
    V -->|Valid| RL[Rate Limit Check<br/>/lib/rateLimit.ts]

    RL -->|Exceeded| ERR_CAP[429 Capacity Error<br/>"Service is busy"]
    RL -->|Allowed| SAF[Regex / Phrase Safety Scan<br/>checkSafetyPatterns()]

    SAF -->|Flagged| SAF_FLAG[Return Safety Flag Message<br/>200 OK text/plain]
    SAF -->|Safe| PROMPT[LLM Call with Constrained System Prompt<br/>ANALYSIS_SYSTEM_PROMPT or FINALIZE_SYSTEM_PROMPT]

    PROMPT --> RESP[Deterministic Text Response<br/>Filtered Points or BIFF Email]

    RESP --> OUT[Return to Client<br/>ReactMarkdown Render]

    classDef safety fill=#ffe4e6,stroke=#f97373,stroke-width=1px;
    class SAF,SAF_FLAG safety;
    classDef validation fill=#e0f2fe,stroke=#3b82f6,stroke-width=1px;
    class V,RL validation;
```

---

## Task 2 – "Hero Code" Snippets

Below are three cleaned‑up, commented snippets showcasing engineering quality. You can embed them with syntax highlighting and a short caption.

---

### Hero Snippet 1 – Exponential Backoff & Error Classification (`aiRetry.ts`)

**Why it matters:**  
This code turns flaky external AI APIs into a predictable component by **retrying only on the right conditions** and mapping internal errors to user‑safe messages. It's infrastructure engineering, not just scripting.

ts

```typescript
// Minimal type to support both sync and async functions.
export type BackoffFn<T> = () => T | Promise<T>;

const BASE_DELAYS_MS = [250, 500, 1000, 2000];

/**
 * Run a function with exponential backoff and jitter.
 * - Retries only on rate-limit-style errors.
 * - Fails fast on hard daily/TPD limits.
 * - Surfaces non-rate-limit errors immediately.
 */
export async function withExponentialBackoff<T>(fn: BackoffFn<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < BASE_DELAYS_MS.length; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Hard daily/token-per-day limits: do not retry.
      if (isHardDailyLimitError(error)) {
        throw error;
      }

      // Non-rate-limit errors: do not retry.
      if (!isRateLimitError(error)) {
        throw error;
      }

      const hasMoreRetries = attempt < BASE_DELAYS_MS.length - 1;
      if (!hasMoreRetries) break;

      const baseDelay = BASE_DELAYS_MS[attempt];
      const jitter = baseDelay * 0.2;
      const delay =
        baseDelay + (Math.random() * jitter * (Math.random() > 0.5 ? 1 : -1));

      await new Promise((resolve) => setTimeout(resolve, Math.max(0, delay)));
    }
  }

  throw lastError ?? new Error('Unknown error during AI request');
}

/**
 * Map internal AI errors to user-facing messages without leaking details.
 * Categorises into:
 * - "user"     – bad input, shape, or validation.
 * - "capacity" – rate limits, daily limits, service busy.
 * - "system"   – unexpected technical issues.
 */
export function mapAIErrorToClient(error: unknown): {
  status: number;
  message: string;
  type: 'user' | 'capacity' | 'system';
} {
  if (isHardDailyLimitError(error)) {
    return {
      status: 429,
      message: 'Daily limit reached, please try again tomorrow.',
      type: 'capacity',
    };
  }

  if (isRateLimitError(error)) {
    return {
      status: 429,
      message: 'Service is busy, please try again later.',
      type: 'capacity',
    };
  }

  return {
    status: 500,
    message: 'Unexpected error. Please try again in a few minutes.',
    type: 'system',
  };
}
```

**What this demonstrates:**

- Separation of **infrastructure behavior** from business logic.
- A clean policy for when to retry and when to fail fast.
- User‑facing error messages that don't leak internal details or stack traces.

---

### Hero Snippet 2 – Safety Pattern Scanner (`safety.ts`)

**Why it matters:**  
This snippet shows a **second, independent safety layer** that doesn't rely on the LLM's alignment. It's tuned to the domain (Australian family‑law context) and returns structured metadata for logging and gating.

ts

```typescript
type SafetyCategory = 'self_harm' | 'violence_threat' | 'child_abuse' | 'sexual_violence';

export type SafetyCheckResult = {
  flagged: boolean;
  categories: SafetyCategory[];
  matches: string[];
};

// Domain-tuned phrase lists: conservative and explicit.
const SELF_HARM_PHRASES = [
  'kill myself', 'killing myself', 'end my life', 'suicidal thoughts',
  'suicidal ideation', 'commit suicide', 'suicide note', 'self-harm',
];

const VIOLENCE_THREAT_PHRASES = [
  'i will kill you', "i'm going to kill you", 'i will seriously hurt you',
  'i will beat you up', 'i will bash you', 'i will smash you',
  'i will break your legs', 'i will find you and',
];

const CHILD_ABUSE_PHRASES = [
  'child sexual abuse material', 'child exploitation material',
  'csam', 'csem', 'child pornography', 'underage porn',
];

const SEXUAL_VIOLENCE_PHRASES = [
  'rape the child', 'i will rape you', "i'm going to rape you",
  'sexually assault the child', 'sexual assault of a child',
];

const CHILD_CONTEXT_WORDS = ['child', 'children', 'kids', 'son', 'daughter', 'minor', 'underage'];
const CHILD_SEX_VERBS = ['molest', 'groom', 'abuse', 'abusing', 'abused'];

// Internal helper: scan a list of phrases for a given category.
function scanPhrases(
  text: string,
  phrases: string[],
  category: SafetyCategory,
  result: SafetyCheckResult,
) {
  for (const phrase of phrases) {
    if (text.includes(phrase)) {
      result.flagged = true;
      if (!result.categories.includes(category)) {
        result.categories.push(category);
      }
      result.matches.push(phrase);
    }
  }
}

/**
 * Shared safety pattern check used by both API endpoints.
 * - Case-insensitive scan for high-risk phrases.
 * - Detects child abuse risk via (child word + sexual verb) heuristic.
 * - Returns structured data for logging and response decisions.
 *
 * This is deliberately simple and conservative, intended as a second
 * layer in addition to model-level safety prompts.
 */
export function checkSafetyPatterns(input: string | null | undefined): SafetyCheckResult {
  const result: SafetyCheckResult = {
    flagged: false,
    categories: [],
    matches: [],
  };

  if (!input) return result;

  const text = input.toLowerCase();

  scanPhrases(text, SELF_HARM_PHRASES, 'self_harm', result);
  scanPhrases(text, VIOLENCE_THREAT_PHRASES, 'violence_threat', result);
  scanPhrases(text, CHILD_ABUSE_PHRASES, 'child_abuse', result);
  scanPhrases(text, SEXUAL_VIOLENCE_PHRASES, 'sexual_violence', result);

  // Heuristic: any child context word + sexual verb → child abuse risk.
  if (!result.categories.includes('child_abuse')) {
    const hasChildWord = CHILD_CONTEXT_WORDS.some((w) => text.includes(w));
    const hasSexVerb = CHILD_SEX_VERBS.some((w) => text.includes(w));

    if (hasChildWord && hasSexVerb) {
      result.flagged = true;
      result.categories.push('child_abuse');
      result.matches.push('child_sexual_context_combination');
    }
  }

  return result;
}
```

**What this demonstrates:**

- Domain‑specific safety engineering (not just generic "content filters").
- Clear separation between **data (phrase lists)** and **logic (scanner)**.
- Structured result object that integrates neatly with logging and API decisions.

---

### Hero Snippet 3 – Style‑Aware System Prompt Builder (`finalizePrompt.ts` + `promptTypes.ts`)

**Why it matters:**  
This snippet shows how you turned "prompt tweaking" into a **type‑safe configuration system**. The LLM behavior is parameterized via a `FinalizeProfile`, letting you evolve style without rewriting application code.

ts

```typescript
// High-level style profile used by the finalisation engine.
export type FinalizeProfile = {
  formality: 'plain' | 'standard' | 'formal';
  structure: 'paragraph' | 'structured';
  tone: 'cool' | 'neutral' | 'warm';
  length: 'standard' | 'extended';
  lexical: 'plain' | 'standard' | 'precise';
};

/**
 * Build the system prompt for the finalisation step.
 *
 * - FINALIZE_SYSTEM_PROMPT holds the stable BIFF/JADE rules.
 * - buildStyleDirectives(profile) appends narrowly scoped style guidance.
 *
 * This lets us experiment with style (e.g., "cool, structured, plain")
 * without touching the core logic or API signatures.
 */
export function getFinalizeSystemPrompt(profile: FinalizeProfile): string {
  const styleDirectives = buildStyleDirectives(profile);

  return FINALIZE_SYSTEM_PROMPT.trimEnd() + '\n\n' + styleDirectives + '\n';
}

/**
 * Construct a small style directive block based on the selected profile.
 * Each dimension (formality, structure, tone, length, lexical) adds a
 * constrained set of natural‑language rules on top of the base prompt.
 */
function buildStyleDirectives(profile: FinalizeProfile): string {
  const lines: string[] = [];

  // Formality guidance
  if (profile.formality === 'plain') {
    lines.push(
      'ADDITIONAL STYLE RULE – FORMALITY (PLAIN):',
      '- Use simple, everyday language while remaining neutral and clear.',
      '- Prefer short, direct sentences.',
      '- Avoid overly formal phrases where a simpler equivalent works.',
      '',
    );
  } else if (profile.formality === 'standard') {
    lines.push(
      'ADDITIONAL STYLE RULE – FORMALITY (STANDARD):',
      '- Use a neutral, professional tone suitable for everyday emails.',
      '- Avoid sounding stiff or legalistic.',
      '',
    );
  } else if (profile.formality === 'formal') {
    lines.push(
      'ADDITIONAL STYLE RULE – FORMALITY (FORMAL):',
      '- Use a professional tone suitable for court or legal review.',
      '- Prefer complete sentences; avoid slang.',
      '',
    );
  }

  // (Similar small blocks for structure, tone, length, lexical...)

  if (lines.length === 0) {
    return 'ADDITIONAL STYLE RULES: Use the default BIFF-style paragraph reply with neutral professional tone.';
  }

  return lines.join('\n');
}
```

**What this demonstrates:**

- Natural language "code" (prompt text) is **modular and parameterized**, not a single blob.
- The system prompt becomes a **function of a strongly‑typed profile**, which the UI can control.
- Future styles (e.g., "court brief" vs "workplace HR") can be added without changing core logic.

---

## Task 3 – "Evolution" Snippet: Naive Prompt vs Modular System Prompt

You can present this as a side‑by‑side comparison. Here's a text‑based, portfolio‑friendly format.

### Naive Prompt (Beginner Style)

text

```
You are an AI writing assistant. The user will paste a difficult, emotional message from their co-parent
or someone they are in conflict with. Your job is to help them write a brief and neutral reply.

Please:
- Read the original message.
- Decide what they need to respond to.
- Then write a short, polite reply in one or two paragraphs.

Make sure the reply is calm and professional and doesn't escalate the conflict.
Avoid being rude or emotional. Don't give legal advice. Just sound neutral and helpful.
```

**Characteristics:**

- Single blob of instructions.
- No explicit safety behavior.
- No schema for output.
- No separation between analysis and finalization.
- No way to compose with UI or multiple steps.

---

### Modular System Prompt (Your Design)

text

```
# MODULE 0 — GLOBAL RULES & OPERATIONAL MANDATE (REVISED)

CORE IDENTITY: Neutral Communication Processor
ARCHETYPE: Operational De-escalation Analyst
FUNCTION: Convert high-affect communication into low-affect, actionable data
OBJECTIVE: Provide safety through predictability, logic, and boundary enforcement

INTERACTION PROTOCOLS
1. TONE: OPERATIONAL PRECISION WITH CLINICAL DETACHMENT
   - Treat all input as communication data requiring processing.
   - Use analytical precision for classification tasks.
   - No Sympathy Protocol: Replace emotional engagement with functional analysis.
2. ABSOLUTE NO-INFERENCE RULE
   - Do not add, invent, infer, assume, or guess any information not explicitly provided.
3. NO MOTIVE OR EMOTION INTERPRETATION
4. NO CONTINUITY ASSUMPTIONS
5. NO THERAPEUTIC OR EMOTIONAL LANGUAGE
6. STRICT JADE PROHIBITION
7. BIFF ADHERENCE (Enhanced)
8. INTERNAL REASONING SECRECY

---

# MODULE 2 — SAFETY CHECK (IMMEDIATE TERMINATION)

Before processing, scan the input for:
- Explicit threats of violence
- Threats involving children
- Self-harm
- Illegal activity
- Breach of Australian court orders
- Indications of imminent danger

If any are present → output ONLY:

"SAFETY FLAG: This message contains content that may require legal or law enforcement attention. Do not respond. Consult your legal counsel or relevant authorities."

Then stop processing entirely.

---

# MODULE 3 — CATEGORIZATION RULESET (ENHANCED)

Break the input into discrete sentences or message segments.

Each segment must be classified into exactly one of:
- A. Logistics / Actionable
- B. Informational
- C. Emotional Bait / Opinion
- D. Required Reply

---

# MODULE 4 — SANITIZATION PROCEDURE (ENHANCED)

Apply the same rules you defined earlier for A/B/D sanitisation and C exclusion.

---

# MODULE 5 — FILTERED POINTS OUTPUT (TURN 1)

For this endpoint, you will NOT output the original message.

You will only output the Filtered Points as a single section, with the following rules:

1. The first line MUST be a level-2 Markdown heading:
   ## Filtered Points

2. Under this heading, identify all segments classified as A/B/D.
   Ignore segments classified as C.

3. For each retained segment, generate a sanitised point:
   - Remove emotional language, accusations, or judgments.
   - Keep only neutral, factual, actionable content.

4. Number the filtered points sequentially starting at 1:
   - Use the format (1), (2), (3).

5. For each point, choose one format:
   - Informational:
     (n) **Information:** …
     **No response required**
   - Actionable / Required reply:
     (n) **Request:** …
     **Please give a short, practical answer (a few words is enough).**

6. Do not output any other sections, headings, or labels.

---

# MODULE 6 — EXECUTION RULE

For this endpoint, execute Modules 2–5 only.
Do not generate the final email.
Stop after the ## Filtered Points section.
```

**What this demonstrates:**

- **Explicit separation of concerns**: safety, categorization, sanitization, output formatting, execution scope.
- **Deterministic output contract**: the UI and downstream logic can rely on exact headings and structures.
- **Composable behavior**: the same modular prompt can be reused across deployments and model providers.
- **Agentic design**: the model is treated as a component in a pipeline, not an open‑ended chat partner.
