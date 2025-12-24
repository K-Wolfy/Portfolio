---
created: 2025-12-20T18:02
updated: 2025-12-25T00:03
publish: true
---
I’ve added the documentation file at:
`docs/prompt-architecture.md`

## Quick “edit map” for you

When you want to tweak behaviour:

- **Change filtered points (Step 1)**  
    → `app/lib/prompts/analyzePrompt.ts`
    
    - `ANALYSIS_SYSTEM_PROMPT`
    - `buildAnalysisUserContent`
- **Change core reply behaviour (BIFF/JADE, how it interprets answers)**  
    → `app/lib/prompts/finalizePrompt.ts`
    
    - `FINALIZE_SYSTEM_PROMPT`
- **Change how style options shape the reply**  
    → `app/lib/prompts/finalizePrompt.ts`
    
    - `buildStyleDirectives(profile)`
- **Change available style dimensions / defaults / mappings**  
    → `app/lib/prompts/promptTypes.ts`
    
    - `FinalizeProfile`
    - `*_Key` types
    - `*_MAP` objects
    - `DEFAULT_FINALIZE_PROFILE`
- **Change how style keys flow from UI to API**  
    → UI: `app/page.tsx` (state + JSON body)  
    → API: `app/api/finalize/route.ts` (reading keys → profile)

---------
## 1. Top‑level structure

You mainly care about these paths:

- `app/page.tsx`  
    UI, including style selectors and the POST to `/api/finalize`.
    
- `app/api/analyze/route.ts`  
    Calls the analysis prompt (Filtered Points).
    
- `app/api/finalize/route.ts`  
    Calls the finalize prompt and constructs the style profile.
    
- `app/lib/prompts/analyzePrompt.ts`  
    Analysis system prompt + user message template.
    
- `app/lib/prompts/finalizePrompt.ts`  
    Finalize system prompt + style directives based on the profile.
    
- `app/lib/prompts/promptTypes.ts`  
    Types and mappings for style keys into the `FinalizeProfile`.
    

---

## 2. Analysis prompts (Step 1 – Filtered Points)

**File:** `app/lib/prompts/analyzePrompt.ts`

Contains:

- `ANALYSIS_SYSTEM_PROMPT`  
    This is the big system prompt that defines:
    
    - Global rules and operational mandate.
    - Safety check behaviour.
    - Categorisation rules (Logistics / Info / Emotional Bait / Required Reply).
    - Sanitisation and output format for `## Filtered Points`.
- `buildAnalysisUserContent(message: string)`  
    Constructs the user message content sent to the model, wrapping the original message with text like:
    
    - “Here is the original message to analyse…”
    - “Original message: `…`”

**Use this file when you want to:**

- Change how messages are analysed and filtered into points.
- Change the exact format of the “Filtered Points” output.
- Adjust how you present the original message to the model (e.g., different wrapper instructions).

**Where it’s used:**

In `app/api/analyze/route.ts`, the route imports `ANALYSIS_SYSTEM_PROMPT` and `buildAnalysisUserContent`, and passes them into `streamText` as the `system` prompt and the `user` content.

---

## 3. Finalize prompts (Step 3 – Draft neutral reply)

**File:** `app/lib/prompts/finalizePrompt.ts`

This is the main prompt logic for generating the neutral reply.

Contains:

1. `FINALIZE_SYSTEM_PROMPT`  
    The core system prompt that defines:
    
    - Global rules: BIFF, JADE prohibition, Australian context.
    - How to interpret the user’s numbered answers.
    - Positive/negative examples.
    - Missing information rules.
    - Output format (greeting, paragraphs, closing vs clarification‑only paragraph).
2. `getFinalizeSystemPrompt(profile: FinalizeProfile)`  
    Takes a `FinalizeProfile` (formality, structure, tone, length, lexical) and returns the final system prompt by:
    
    - Starting from `FINALIZE_SYSTEM_PROMPT`.
    - Appending style‑specific guidance from `buildStyleDirectives(profile)`.
3. `buildFinalizeUserContent({ originalMessage, userAnswers })`  
    Constructs the user message content sent to the model, including:
    
    - A short explanation of what to do (generate email vs ask for missing info).
    - The `originalMessage` wrapped in ``` fences.
    - The `userAnswers` wrapped in ``` fences.
4. `buildStyleDirectives(profile: FinalizeProfile)`  
    Adds extra, targeted instructions based on:
    
    - `profile.formality`
        - PLain / Standard / Formal – how formal the language should be.
    - `profile.structure`
        - Paragraph vs structured/numbered lines.
    - `profile.tone`
        - Cool / Neutral / Warm – emotional temperature within neutral bounds.
    - `profile.length`
        - Standard / Extended – verbosity constraints.
    - `profile.lexical`
        - Plain / Standard / Precise – how simple or precise the wording is.

**Use this file when you want to:**

- Change core reply behaviour or examples → edit `FINALIZE_SYSTEM_PROMPT`.
- Adjust how style options (Overall style, Tone, Word choice, Length, Structure) actually affect the model’s behaviour → edit `buildStyleDirectives`.
- Change how you package `originalMessage` and `userAnswers` for the model → edit `buildFinalizeUserContent`.

**Where it’s used:**

In `app/api/finalize/route.ts`, the route:

- Builds a `FinalizeProfile` from style keys.
- Passes that into `getFinalizeSystemPrompt(profile)` as the `system` prompt.
- Uses `buildFinalizeUserContent` for the `user` content.

---

## 4. Style profile types and mappings

**File:** `app/lib/prompts/promptTypes.ts`

This file defines the shape of a “style profile” and how UI keys map into it.

Key pieces:

- `FinalizeProfile` type  
    Fields:
    
    - `formality`: `'plain' | 'standard' | 'formal'`
    - `structure`: `'paragraph' | 'structured'`
    - `tone`: `'cool' | 'neutral' | 'warm'`
    - `length`: `'standard' | 'extended'`
    - `lexical`: `'plain' | 'standard' | 'precise'`
- Key types used by the UI and API:
    
    - `FormalityKey`: `'biff_plain' | 'biff_standard' | 'biff_formal'`
    - `StructureKey`: `'paragraph' | 'structured'`
    - `ToneKey`: `'tone_cool' | 'tone_neutral' | 'tone_warm'`
    - `LengthKey`: `'length_standard' | 'length_extended'`
    - `LexicalKey`: `'lexical_plain' | 'lexical_standard' | 'lexical_precise'`
- Mapping objects:
    
    - `FORMALITY_MAP: FormalityKey → Formality`
    - `STRUCTURE_MAP: StructureKey → StructureStyle`
    - `TONE_MAP: ToneKey → Tone`
    - `LENGTH_MAP: LengthKey → LengthProfile`
    - `LEXICAL_MAP: LexicalKey → LexicalProfile`
- `DEFAULT_FINALIZE_PROFILE`  
    Represents the existing “anchor” behaviour (formal, paragraph, neutral tone, standard length, precise wording).
    

**Use this file when you want to:**

- Change the default style → edit `DEFAULT_FINALIZE_PROFILE`.
- Adjust how keys like `biff_standard` or `tone_warm` translate into internal behaviour → edit the corresponding `*_MAP`.
- Add or remove style dimensions → extend `FinalizeProfile`, define new key types and maps.

---

## 5. API routes and how they combine everything

### 5.1 Analysis route

**File:** `app/api/analyze/route.ts`

Relevant behaviour:

- Validates and rate limits the request.
- Calls:
    - `ANALYSIS_SYSTEM_PROMPT` as the system prompt.
    - `buildAnalysisUserContent(message)` for the user prompt.
- Uses `checkSafetyPatterns` before calling the model.

You generally only touch this file if:

- You want to change validation, rate limiting, or safety behaviour for the analysis step.
- You need a different model from `AI_MODEL_NAME`.

### 5.2 Finalize route

**File:** `app/api/finalize/route.ts`

This is where style keys are read and converted to a `FinalizeProfile`.

Main responsibilities:

1. Validate `originalMessage` and `userAnswers` (length, presence).
    
2. Read style keys from the request body:
    
    - `formalityKey`
    - `structureKey`
    - `toneKey`
    - `lengthKey`
    - `lexicalKey`  
        with sensible defaults (current behaviour) when omitted or invalid.
3. Build the `FinalizeProfile` using the maps from `promptTypes.ts`.
    
4. Call:
    
    - `getFinalizeSystemPrompt(profile)` for the system prompt.
    - `buildFinalizeUserContent({ originalMessage, userAnswers })` for the user prompt.
5. Apply the safety check (`checkSafetyPatterns`) to combined input and user answers.
    

You edit this file if you want to:

- Change how style keys are passed from client to server (e.g. rename them, add/remove keys).
- Force a specific style profile for testing by overriding the `profile` construction.

---

## 6. UI wiring (where the selectors and POST live)

**File:** `app/page.tsx`

Key responsibilities:

- Maintains local state for:
    
    - `originalMessage`, `analysisOutput`, `userAnswers`, `suggestedResponse`
    - Style keys:
        - `formalityKey`
        - `structureKey`
        - `toneKey`
        - `lengthKey`
        - `lexicalKey`
- Renders:
    
    - Step 1 textarea and “Analyse message” button.
    - Step 2 filtered points.
    - Step 2 style controls (Overall style, Tone, Word choice, Length, Structure).
    - Step 3 neutral reply draft.
- Sends the finalize request with style keys:
    
    - The body of the `/api/finalize` request includes `originalMessage`, `userAnswers`, and all style keys.

You edit `page.tsx` if you want to:

- Change which style options are visible or how they are grouped.
- Change default selections for style keys.
- Add help text or tooltips (e.g., around “Overall style” or “Word choice”).

---

## 7. Quick “where to edit what” cheat sheet

- **Change analysis / Filtered Points behaviour**  
    → `app/lib/prompts/analyzePrompt.ts`
    
- **Change core reply rules, interpretation of answers, examples**  
    → `app/lib/prompts/finalizePrompt.ts`  
    (specifically `FINALIZE_SYSTEM_PROMPT`)
    
- **Change what style options mean in prompt terms**  
    → `app/lib/prompts/finalizePrompt.ts`  
    (specifically `buildStyleDirectives(profile)`)
    
- **Change available style dimensions, key names, or defaults**  
    → `app/lib/prompts/promptTypes.ts`
    
- **Change how UI exposes style options**  
    → `app/page.tsx`
    
- **Change how API reads style keys and builds profile**  
    → `app/api/finalize/route.ts`