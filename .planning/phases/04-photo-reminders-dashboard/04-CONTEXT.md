# Phase 4: Photo Reminders + Dashboard - Context

**Gathered:** 2026-01-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Kimmie never forgets to post groom photos and has a quick view of today's schedule. Photos attach to appointments, reminders prompt when photos are missing, and a dashboard provides at-a-glance schedule visibility. Photo posting to social media is NOT in scope (separate capability).

</domain>

<decisions>
## Implementation Decisions

### Photo capture flow
- Photo storage: Upload to cloud (S3/GCS), store URL in database
- Photo attachment to appointments: Claude's discretion (auto-attach to current/next makes sense)
- Before/After marking: Claude's discretion (inline buttons after sending is clean UX)
- Multi-photo handling: Claude's discretion (ask once, apply to all is efficient)

### Reminder behavior
- Trigger timing: Claude's discretion (end of business day or after last appointment)
- Persistence: Claude's discretion (one reminder, maybe follow-up if appropriate)
- Dismiss/snooze: Claude's discretion (buttons add flexibility but may be overkill)
- Skip logic: Claude's discretion (only remind on days with appointments makes sense)

### Dashboard display
- Location: Both Telegram (/today command) AND simple web page
- Morning briefing time: **8:40am with timezone awareness** (user specified)
- Briefing content: Claude's discretion (appointments + useful context like spicy meters, notes)
- Web dashboard auth: Basic password protection

### Streak & gamification
- Streak counting: Claude's discretion (work days with appointments is fairest)
- Streak display: Both in morning briefing AND on-demand command
- Milestones: Claude's discretion (light celebration at major milestones fits Kimmie's personality)
- Additional gamification: Claude's discretion (keep it simple, maybe weekly stats)

### Claude's Discretion
- Photo attachment logic (auto-attach to in-progress/next appointment)
- Before/After UI pattern (inline buttons recommended)
- Multi-photo batch handling
- Reminder persistence and snooze UX
- Morning briefing content depth
- Streak counting rules
- Gamification depth (keep light)

</decisions>

<specifics>
## Specific Ideas

- Morning briefing at exactly 8:40am with timezone consideration
- Web dashboard needs basic password (not public, not complex auth)
- Streak should show in morning briefing + be available on command
- Photos must go to cloud storage (S3/GCS), not just Telegram servers

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-photo-reminders-dashboard*
*Context gathered: 2026-01-26*
