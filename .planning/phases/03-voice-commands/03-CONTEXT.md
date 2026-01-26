# Phase 3: Voice Commands - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Kimmie sends voice messages to Telegram while grooming (hands dirty), bot transcribes and processes them through existing natural language handler, replies with text.

**Note:** This is a backup/insurance feature. Keyboard dictation already works for most cases. Voice message handling adds:
- Faster workflow (one hold-release vs multiple taps)
- Better accuracy in noisy environments
- Fallback when phone dictation fails

</domain>

<decisions>
## Implementation Decisions

### Transcription Service
- OpenAI Whisper API (already have OPENAI_API_KEY configured)
- Cost is negligible (~$0.006/minute, pennies per month at expected usage)
- Single API call: send audio file, get text back

### Processing Flow
- Voice message received → download audio from Telegram
- Send to Whisper API → get transcription
- Pass transcription to existing natural language handler (from Phase 2)
- Reply with text result (same as typed queries)

### Response Format
- Same format as typed natural language queries
- No special "voice" formatting needed — consistency is better

### Claude's Discretion
- Whether to echo transcription back ("I heard: 'who is Sarah'") or just show result
- Error message wording when transcription fails
- Audio format handling (Telegram sends OGG/OPUS, may need conversion)
- Rate limiting / abuse prevention (if needed)

</decisions>

<specifics>
## Specific Ideas

- Keep it simple — this is insurance, not a core feature
- Reuse Phase 2's natural language handler completely (don't duplicate logic)
- If transcription fails, friendly error: "Couldn't understand that — try again or type your question"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-voice-commands*
*Context gathered: 2026-01-26*
