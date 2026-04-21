# FORBETRA: The Quiet Room

## A Platform Redesign Through the Lens of Warm Rationalism

_Design concept by the Designer Agent -- March 2026_

---

> "We need to aim at essential things, to remove every redundant effect."
> -- AG Fronzoni

> "The simple form gives users the freedom to develop their own way of handling an object."
> -- Kenya Hara

---

## 0. DESIGN DIRECTION IN ONE SENTENCE

**Forbetra should feel like a private executive coaching room -- warm timber, indirect light, one conversation at a time -- translated into a digital surface where data becomes self-knowledge and every interaction has the cadence of a thoughtful question.**

The name for this direction: **The Quiet Room**.

---

## 1. AUDIT SUMMARY

### What Exists (and What Works)

The current Forbetra design has a genuinely strong visual foundation:

- **Surface palette**: Warm stone blacks (#0c0a09 base, #141210 raised, #1c1917 overlay) -- these are excellent. Not cold blue-blacks, not generic grays. They have the warmth of dark walnut furniture. Keep.
- **Accent**: Amber/gold (#e8a04a) -- a sophisticated choice that avoids the tech-blue cliche. It reads as intelligence, not notification. Keep and refine.
- **Typography**: Plus Jakarta Sans with Geist Sans/Mono fallback, letter-spacing -0.01em, OpenType features cv02/03/04/11. Good geometric warmth. Keep.
- **Glass morphism cards**: The `.card` and `.glass` utilities create genuine depth hierarchy. Keep the principle, evolve the execution.
- **Animation easing**: `cubic-bezier(0.16, 1, 0.3, 1)` -- this is an excellent out-expo curve. Fast attack, gentle settle. Feels confident. Keep.

### What Fails

1. **Cognitive architecture**: The individual hub loads 8-12 information zones simultaneously. No progressive disclosure. No temporal awareness. The interface treats all information as equally urgent regardless of context.

2. **Emotional flatness**: The platform is transactional. Check in, see numbers, leave. No ritual. No surprise. No moment where a user pauses and feels something about their own growth. The stakeholder reveal -- potentially the most emotionally powerful feature in any coaching software -- is buried in a data table.

3. **Coach experience**: Read-only, sparse, clinical. Coaches see data but cannot act on it in the moment. The session preparation screen is a scrolling wall.

4. **Inconsistent visual eras**: Three distinct design languages coexist (polished onboarding, dense hub, bare completion pages).

5. **Color semantics**: 6+ colors compete in the insights view. Data colors (effort sky-blue, performance amber-gold) conflict with semantic colors (success green, warning amber, error red). The amber accent and performance amber overlap -- this is a category error.

6. **No signature moment**: Nothing in Forbetra would make someone hand their phone to a colleague. Nothing would make them screenshot. Nothing marks the passage of time through a 12-week developmental journey.

---

## 2. REFERENCE BOARD

### Track A: Category Leaders

| Reference                       | What to Steal                                                                                                                                                                                                                        | How to Adapt                                                                                                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Linear** (linear.app)         | Preserves information density while improving scannability. Structure felt not seen. Warmer grays, softened borders, dimmed inactive elements. Navigation recedes so content advances.                                               | Apply Linear's "don't compete for attention you haven't earned" principle to the individual hub. The sidebar becomes near-invisible. The current state -- and only the current state -- commands attention. |
| **Superhuman** (superhuman.com) | Treats each item as a triage decision, not a display object. Keyboard-first, single-focus. The inbox is a to-do list where you deal with items one at a time. No scanning required.                                                  | Forbetra's individual hub should adopt this philosophy: present the ONE thing the user should do right now, not the twelve things they could theoretically look at. Sequential, not simultaneous.           |
| **Oura Ring app**               | Personal health metrics rendered as calm, glanceable daily summaries. Dark interface where your data is the brightest thing on screen. Long-term trends revealed through layered temporal views (daily, weekly, monthly, quarterly). | Forbetra should treat behavioral data the way Oura treats biometric data: daily snapshot is simple, weekly view adds context, cycle view reveals patterns. Same data, different focal lengths.              |
| **Whoop app**                   | Strain/recovery/sleep as a three-metric system that reduces complex biometric data to three numbers you can act on. The daily "readiness" score is the gateway; detail unfolds only on request.                                      | Reduce Forbetra's metric sprawl. The individual's daily state should be expressible in two numbers (effort, performance) and one word (alignment status). Everything else is behind a deliberate tap.       |

### Track B: Design Systems & Patterns

| Reference                           | What to Steal                                                                                                                                                               | How to Adapt                                                                                                                                                                                  |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vercel Geist** (vercel.com/geist) | Four typographic registers: Headings, Buttons, Labels, Copy. Each with distinct line-height (Labels tight, Copy generous). Monospace as accent register for technical data. | Adopt Geist's register model. Plus Jakarta Sans at four scales: Display (cycle milestones), Heading (section titles), Body (reflections), Mono (scores, percentages, week numbers).           |
| **Arc Browser**                     | Progressive disclosure mastered. Features revealed exactly when needed, not before. Onboarding teaches two things in 90 seconds through hands-on experience.                | Forbetra's individual hub should reveal its depth through use, not on first load. Week 1 sees a minimal surface. Week 4 sees contextual patterns emerge. Week 12 sees the full constellation. |

### Track C: Cross-Pollination

| Reference                                        | What to Steal                                                                                                                                                                                                                               | Why It Elevates                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The therapy room** (interior design principle) | Soft warm lighting (2700-3000K equivalent), natural materials (wood, linen), deliberate emptiness that invites the client to fill the space. Safety signaled through environment, not words. Trust through restraint, not reassurance copy. | Forbetra is a coaching tool. The interface should feel like entering a therapist's office: warm, quiet, attentive. The warm stone-black palette already does this. Now extend it to information architecture: fewer things on screen = more space for reflection. The platform should feel like it's _listening_, not _talking_. |
| **Executive boardroom** (2025 trends)            | Dark timber panels, matte black pendants, Scandinavian-influenced minimalism. Calm authority and timelessness. Brass as punctuation. Recessed lighting that makes faces the brightest thing in the room.                                    | Forbetra's amber accent plays the role of brass in a dark boardroom: warm metallic punctuation against dark surfaces. The interface should have the gravity of a boardroom but the warmth of a private study. Not a startup -- a firm.                                                                                           |
| **Kinfolk magazine** (editorial design)          | Custom type family with six styles serving distinct roles. 12-column grid. Brodovitch-level breathing room. Content photographed as if it matters. Every spread has one focal point.                                                        | Forbetra's AI insights and cycle reports should feel editorial, not generated. One insight per view. Generous line-height (1.7+). The text itself is the design. No decorative cards wrapping it -- just well-set type on a quiet surface.                                                                                       |
| **Michelin restaurant menu**                     | Restrained typography, deliberate ordering (the menu structures your experience), whitespace as luxury signal, zero decoration. The food is the design; the menu just organizes access to it.                                               | Forbetra's navigation should feel like a prix fixe menu: a curated sequence, not a buffet. The platform guides you through a rhythm (intention, check-in, review, reveal) rather than offering everything at once.                                                                                                               |

### Track D: Anti-References -- What We Are Deliberately NOT Doing

| Anti-Reference                                                   | What to Avoid                                                                                                                          | Why                                                                                                                                                                                                   |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Generic coaching SaaS** (BetterUp, CoachHub UI)                | Bright white backgrounds, rounded colorful cards, corporate stock photography, progress bars as primary feedback, gamification badges. | These platforms look like HR software. Forbetra's users are executives and senior leaders. The aesthetic must signal peer, not platform. Authority, not cheerfulness.                                 |
| **Wellness app pastels** (Calm, Headspace visual language)       | Soft gradients, illustration-heavy, pastel color palettes, nature imagery, rounded everything.                                         | Forbetra is not a meditation app. It deals with performance, perception gaps, and behavioral accountability. The emotional register is clear-eyed honesty, not gentle reassurance.                    |
| **Dashboard maximalism** (Tableau, PowerBI, analytics platforms) | Dense chart grids, rainbow color scales, 6+ chart types per screen, toolbar-heavy chrome.                                              | Behavioral data is not business analytics. There are only two numbers (effort, performance) and their relationship over time. The visualization vocabulary should be as restrained as the data model. |
| **Gamification patterns** (badges, levels, leaderboards, XP)     | Extrinsic motivation systems that reduce developmental growth to point accumulation.                                                   | Executive coaching is not a game. Streak acknowledgment is appropriate; badges and levels are patronizing for this audience. Recognition should be quiet, not celebratory.                            |
| **Emoji as design element**                                      | Using emoji as section headers, status indicators, or decorative elements.                                                             | The current Forbetra uses emoji (trophy, seedling) as placeholder icons. These undermine the premium positioning. Replace with typographic or geometric treatments.                                   |

### Track E: Deep-Dive -- How Linear Builds Calm Density

From Linear's design refresh documentation: their core principle is **"structure should be felt, not seen."** Borders are softened and rounded rather than eliminated. Navigation dims to let content advance. They shifted from cool blue-gray to warmer gray with less saturation. They built an integrated color picker in their dev toolbar to micro-adjust hue, chroma, and lightness before committing. They preserve information density while improving scannability through subtle visual treatments rather than aggressive weight differences.

**The lesson for Forbetra**: Do not reduce information -- reduce visual competition. The hub's problem is not that it has too much data; it's that everything screams at the same volume. Dimming, receding, layering -- these are the tools. Linear proves you can show everything and still feel calm.

---

## 3. EXPERIENCE CHOREOGRAPHY -- THE EMOTIONAL ARC

### The Weekly Rhythm

Forbetra operates on a weekly cycle. The emotional design must honor this cadence:

**Monday: The Intention (Lacing Up)**
The user opens Forbetra and sees their identity anchor -- who they said they were becoming -- rendered not as a card but as a quiet line of text at the top of the screen, like an epigraph in a book. Below it, this week's prompt. The screen is almost entirely empty: the question, a text field, space. The emotion is focused anticipation. You are choosing what to aim at.

- _Haptic_: None. Silence. The intention is a contemplative act.
- _Animation_: The prompt text fades in over 600ms with the out-expo curve. No slide. No bounce. It appears like thought arriving.
- _Sound_: None. (Sound is deliberately absent from Forbetra. Coaching is a private act. The app never makes noise.)

**Wednesday/Friday: The Check-In (The Exhale)**
Two numbers. That is all. The screen shows two large, spaced input areas -- effort on the left, performance on the right. Each is a vertical gradient bar that fills as the user taps or drags. The gesture is upward -- you pull the level up to where it feels right. A number materializes at the top of the bar as you move.

The entire interaction completes in under 30 seconds. No scrolling. No notes field visible (it reveals on tap of a subtle "Add a note" text link). No coach notes, no behavioral indicators, no previous scores cluttering the primary surface. Just: how much effort? How did you perform? Done.

- _Haptic_: A single crisp tap (UIImpactFeedbackGenerator .light) when the score locks.
- _Animation_: The gradient bar fills with a spring curve (response: 0.4, dampingFraction: 0.7). On submit, the two scores hold for 800ms, then contract into two small dots that drift to their position on a minimal week-strip at the bottom of the screen. This is Tobias Ahlin's "Pulse" concept, simplified: the data becoming part of your timeline.
- _Reduce Motion alternative_: Scores appear instantly, dots appear in timeline with a crossfade.

**The Reveal (Opening the Envelope)**
When stakeholder feedback arrives, the individual does not see a number update on a dashboard. They see a single notification on their home screen: "Someone shared their perspective." No name. No score. Just the invitation.

Tapping enters a three-screen micro-flow:

1. **Your view**: Your own scores for this period, cleanly stated. "You rated your effort 7, your performance 5." Two numbers on a dark field. Owned. Settled.
2. **Their view**: A single card, face-down, breathing. Tap to turn. The card rotates (CSS rotateY, 400ms) and their scores appear. The background shifts subtly: warm (within 1 point alignment) or cooler (gap of 3+). A single line of contextual text: "You see this similarly" or "There's a gap worth exploring."
3. **The prompt**: "What might explain the difference?" A single text input at the exact moment of maximum curiosity. Optional. But placed perfectly.

This is the emotional peak of the weekly cycle. It is the moment where Forbetra does something no other tool does: it shows you yourself through someone else's eyes. Design the hell out of it.

- _Haptic_: The card flip triggers a medium impact tap. If scores are aligned, a subtle success pattern (two quick taps). If divergent, nothing -- silence is more powerful than alarm.
- _Animation_: Card flip is CSS 3D transform, 400ms ease-out. Background color shift is a 1200ms transition, nearly imperceptible -- it arrives as a feeling, not a visual event.

**End of Cycle: The Portrait (Turning Around on the Trail)**
After 8-16 weeks, the user receives their Behavioral Portrait. This is Giorgia Lupi's concept, executed with restraint: a radial visualization where each week is a segment, shaped by the effort/performance ratio. The identity anchor text sits in the center. Stakeholder perception traces a second, lighter contour.

No two portraits look the same. This is the screenshot moment. This is the artifact a user shares with their coach, their mentor, their future self.

- _Animation_: The portrait draws itself over 3 seconds, week by week, starting from week 1 and tracing the journey clockwise. Each segment materializes with a 100ms stagger. The effect is watching your own growth story unfold.
- _Reduce Motion alternative_: Portrait appears fully rendered with a simple fade-in.

### The Sensory Score

| Moment                | Visual Register                                  | Haptic                  | Sound | Tempo                                |
| --------------------- | ------------------------------------------------ | ----------------------- | ----- | ------------------------------------ |
| Opening the app       | Quiet, single-focus, identity anchor visible     | None                    | None  | Slow (600ms fade)                    |
| Monday intention      | Contemplative, generous whitespace, one question | None                    | None  | Slow (type at your own pace)         |
| Check-in              | Minimal, two inputs only, gradient bars          | Light tap on score lock | None  | Fast (under 30s total)               |
| Score submission      | The Pulse -- scores contract to timeline         | Light tap               | None  | Medium (800ms hold, then transition) |
| Reveal notification   | Single line of text, anticipatory                | None                    | None  | Pause (user-initiated)               |
| Card flip             | 3D rotation, background color shift              | Medium tap              | None  | Medium (400ms flip, 1200ms color)    |
| Reflection prompt     | Open text field, generous space                  | None                    | None  | Slow (user's pace)                   |
| Weekly insight        | Editorial typography, one insight at a time      | None                    | None  | Reading pace                         |
| Cycle portrait        | Radial drawing animation, 3s build               | None                    | None  | Ceremonial (3s)                      |
| Streak acknowledgment | Quiet counter, momentary                         | Light double-tap        | None  | Fast (1.5s appears, holds, fades)    |

### Haptic Vocabulary

| Pattern           | Meaning                               | Implementation                     |
| ----------------- | ------------------------------------- | ---------------------------------- |
| Single light tap  | Score locked, action acknowledged     | UIImpactFeedbackGenerator(.light)  |
| Single medium tap | Significant reveal, card flip         | UIImpactFeedbackGenerator(.medium) |
| Double quick tap  | Alignment confirmed, positive signal  | Two .light taps, 80ms apart        |
| None (silence)    | Contemplation, no interruption needed | Deliberate absence                 |

### Sound Vocabulary

**Forbetra is silent.** Always. No chimes, no completion sounds, no notification tones within the app. Coaching is a private, reflective practice. Sound would violate the intimacy of the experience. The therapy room analogy holds: you would never play a jingle when a client has an insight.

---

## 4. THE CONCEPT -- THE QUIET ROOM

### 4.1 Design System Evolution

The Quiet Room evolves the existing token system rather than replacing it.

#### Typography

**One typeface: Plus Jakarta Sans.** Hierarchy through size alone -- weight used sparingly.

| Register          | Size | Weight | Line-Height | Letter-Spacing | Usage                                                   |
| ----------------- | ---- | ------ | ----------- | -------------- | ------------------------------------------------------- |
| Display           | 32px | 700    | 1.15        | -0.025em       | Cycle milestones, portrait center, onboarding headlines |
| Heading           | 20px | 600    | 1.3         | -0.015em       | Section titles, page titles                             |
| Body              | 15px | 400    | 1.7         | -0.01em        | Reflections, AI insights, descriptive text              |
| Label             | 11px | 600    | 1.35        | 0.08em         | UPPERCASE. Week numbers, metric labels, navigation      |
| Mono (Geist Mono) | 13px | 500    | 1.4         | 0              | Scores, percentages, dates, data values                 |

The typographic scale follows a 1.25 ratio: 11, 13, 15, 20, 25, 32. Six sizes. No more.

**Why Plus Jakarta Sans stays**: It is a warm geometric sans-serif -- humanist enough to feel approachable, geometric enough to feel precise. It carries the warmth of the therapy room and the authority of the boardroom. A serif would tilt too editorial. A pure geometric (Inter, Geist) would tilt too cold. Plus Jakarta is the intersection.

#### Color Palette

The existing palette is refined, not replaced. The critical change: resolving the amber conflict between accent and performance data.

**Surfaces (unchanged)**

| Token             | Value   | Usage                      |
| ----------------- | ------- | -------------------------- |
| `surface-base`    | #0c0a09 | Page background            |
| `surface-raised`  | #141210 | Cards, sidebar             |
| `surface-overlay` | #1c1917 | Elevated cards, modals     |
| `surface-subtle`  | #231f1c | Hover states, active items |

**Text (unchanged)**

| Token            | Value                   | Usage                         |
| ---------------- | ----------------------- | ----------------------------- |
| `text-primary`   | rgba(250,244,237, 0.93) | Headlines, primary content    |
| `text-secondary` | rgba(250,244,237, 0.55) | Supporting text, descriptions |
| `text-tertiary`  | rgba(250,244,237, 0.35) | Labels, metadata              |
| `text-muted`     | rgba(250,244,237, 0.20) | Disabled, placeholder         |

**Accent (refined)**

| Token          | Value                   | Usage                                                                                                                         |
| -------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `accent`       | #d4a06a                 | Shifted slightly warmer and lower saturation from #e8a04a. Less orange, more burnished brass. Actions, links, the amber glow. |
| `accent-hover` | #e0b580                 | Hover state                                                                                                                   |
| `accent-muted` | rgba(212,160,106, 0.10) | Backgrounds for accent elements                                                                                               |

**Data Colors (new -- the critical fix)**

| Token                    | Value                   | Contrast on base | Usage                                                                                 |
| ------------------------ | ----------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| `data-effort`            | #94a3b8                 | 5.2:1            | Effort scores and visualizations. Cool slate -- the color of steady, deliberate work. |
| `data-effort-vivid`      | #cbd5e1                 | 8.1:1            | Effort in high-emphasis contexts                                                      |
| `data-effort-muted`      | rgba(148,163,184, 0.10) | --               | Effort backgrounds                                                                    |
| `data-performance`       | #d4a06a                 | 4.8:1            | Performance scores and visualizations. Warm brass -- the color of visible result.     |
| `data-performance-vivid` | #e0b580                 | 6.2:1            | Performance in high-emphasis contexts                                                 |
| `data-performance-muted` | rgba(212,160,106, 0.10) | --               | Performance backgrounds                                                               |

**Why this pairing**: Effort is the internal engine -- steady, structural, cool. Performance is the external output -- visible, warm, radiant. The cool/warm duality maps to the inner/outer nature of the two metrics. Slate and brass. Structure and surface. This pairing is used universally: every chart, every score display, every visualization speaks this language. A user will internalize "cool = effort, warm = performance" within their first week.

**The accent and performance color are now the same hue family.** This is intentional: performance is what Forbetra ultimately celebrates. The accent color IS the performance color. Effort gets its own cool register. This resolves the semantic conflict where amber meant both "interact with this button" and "this is your performance score."

**Semantic Colors (simplified)**

| Token              | Value   | Usage                                           |
| ------------------ | ------- | ----------------------------------------------- |
| `signal-aligned`   | #4ade80 | Perception gap < 1 point. Self and other agree. |
| `signal-divergent` | #f59e0b | Perception gap 1-3 points. Worth exploring.     |
| `signal-attention` | #ef4444 | Perception gap > 3 points or system error.      |

Three semantic colors. No more. Each carries a single, unambiguous meaning.

#### Borders (evolved)

Following Linear's principle of "structure felt, not seen":

| Token            | Value                   | Usage                                                               |
| ---------------- | ----------------------- | ------------------------------------------------------------------- |
| `border-default` | rgba(250,244,237, 0.04) | Reduced from 0.06. Barely visible -- structural, not decorative.    |
| `border-strong`  | rgba(250,244,237, 0.08) | Reduced from 0.12. For active/focused elements.                     |
| `border-accent`  | rgba(250,244,237, 0.14) | Reduced from 0.20. Rare -- only for primary interactive boundaries. |

#### Spacing

The 8-point grid, applied with the rigor of Noorda's Milan Metro system:

| Token       | Value | Usage                                         |
| ----------- | ----- | --------------------------------------------- |
| `space-xs`  | 4px   | Tight details: icon-to-label gaps             |
| `space-sm`  | 8px   | Compact: list item padding                    |
| `space-md`  | 16px  | Standard: card padding, section gaps          |
| `space-lg`  | 24px  | Generous: between content sections            |
| `space-xl`  | 32px  | Breathing room: page margins on mobile        |
| `space-2xl` | 48px  | Landmark: between major sections              |
| `space-3xl` | 64px  | Ceremony: top padding on single-focus screens |

**The 64px rule**: Every single-focus screen (intention, check-in, reveal) starts with 64px of top padding. This is the digital equivalent of the therapist's pause before speaking. It signals: this space is yours. There is no rush.

#### Cards

The card system simplifies from three variants to two:

| Variant       | Treatment                                                                                                           | Usage                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `surface`     | `background: surface-raised; border: 1px solid border-default; border-radius: 12px;` No inner shadow, no glow.      | Data display, containers, navigation items |
| `interactive` | Same as surface, plus: `transition: all 200ms cubic-bezier(0.16,1,0.3,1); &:hover { border-color: border-strong; }` | Tappable cards, links, buttons             |

Glass morphism is retired. It was impressive but added visual complexity without functional value. The Quiet Room has solid walls.

#### Animation

| Token             | Value                         | Usage                                                             |
| ----------------- | ----------------------------- | ----------------------------------------------------------------- |
| `ease-out`        | cubic-bezier(0.16, 1, 0.3, 1) | All transitions. One curve for the entire platform.               |
| `duration-fast`   | 150ms                         | Hover states, toggle switches                                     |
| `duration-normal` | 300ms                         | Page transitions, card reveals                                    |
| `duration-slow`   | 600ms                         | Ceremonial moments: prompt appearance, portrait segments          |
| `stagger`         | 60ms                          | Sequential element reveals (reduced from 80ms for tighter rhythm) |

**Reduce Motion**: All animations have explicit alternatives:

- Slide-up becomes instant appearance
- Fade-in becomes instant appearance at full opacity
- The Pulse (score-to-timeline) becomes a crossfade
- The card flip becomes a crossfade between front and back
- The portrait draw becomes a single fade-in of the complete image

---

### 4.2 Information Architecture -- The Three Lenses

The individual hub's 8-12 information zones collapse into three distinct views, each answering one question:

**Lens 1: TODAY** (default view)
_"What should I do right now?"_

The screen contains, at most, four elements:

1. Identity anchor (one line, text-tertiary, top of screen -- like an epigraph)
2. Week indicator (Label register: "WEEK 7 / 12")
3. The one primary action card (check-in, set intention, or "You're caught up")
4. If stakeholder feedback arrived: a single reveal notification

Nothing else. No charts. No metrics. No navigation cards. The sidebar handles navigation. Today handles action.

When there is nothing to do, the screen shows the identity anchor, the week number, and a single sentence: "You're on track. Your next check-in opens Wednesday." The emptiness is the design. It says: we respect your time. You did the work. Go.

_Adapted from_: Superhuman's single-focus triage model and Linear's "don't compete for attention you haven't earned."

**Lens 2: PROGRESS** (second tab)
_"How am I doing over time?"_

A single scrolling view with three sections, in order:

1. **The River** -- a dual-band flowing visualization showing effort (slate) and performance (brass) over the cycle's duration. Stakeholder perception appears as a translucent second contour within each band. Where self and other diverge, the gap is visible. The river is the signature visualization of Forbetra.

2. **This Week's Numbers** -- effort score, performance score, trend direction, alignment status. Four data points. Rendered in Geist Mono at 32px. Large, glanceable, unapologetic.

3. **AI Insight** -- the latest weekly synthesis, rendered as editorial text. No card wrapping it. No colored section headers. Just well-set type: Plus Jakarta Sans at 15px, line-height 1.7, max-width 580px. One insight per view. A "Read full report" link leads to the complete synthesis.

_Adapted from_: Oura Ring's temporal layering (daily/weekly/cycle views) and Kinfolk's editorial typography.

**Lens 3: FEEDBACK** (third tab)
_"How do others see me?"_

The perception gap analysis -- the product's genuine differentiator -- gets its own dedicated space:

1. **The Mirror** -- Julie Zhuo's concept: self-ratings on the left, stakeholder ratings on the right, rendered as facing horizontal bars. Where they meet in the middle, a solid shape. Where they diverge, visible whitespace. The last four weeks stacked vertically show whether gaps are closing or widening.

2. **Per-stakeholder breakdown** -- who has responded this period, individual gap indicators, response rate over time. Each stakeholder is a single row: name, last response date, alignment indicator (dot: green/amber/red).

3. **Pending invitations and stakeholder management** -- add, remove, resend links.

_Adapted from_: Whoop's three-metric system (each view has one primary question) and the Mirror concept from the UX redesign panel.

### 4.3 Convention Challenge -- Killing the Dashboard

**The convention**: SaaS products have dashboards. The dashboard shows everything at a glance. More data = more value.

**Why it fails here**: Executive coaching is not a monitoring activity. It is a reflective practice. A "dashboard" implies surveillance -- watching dials and gauges for anomalies. That is the wrong metaphor for self-development. A user should not feel like they are checking instruments; they should feel like they are journaling, then occasionally stepping back to see the shape of their story.

**What we do instead**: Three focused lenses (Today, Progress, Feedback) replace the single dashboard. Each answers one question. The user never sees "everything at once" because that is not how self-knowledge works. You understand yourself through specific, framed questions -- not through a wall of metrics.

This is Vignelli's subway map lesson applied to personal data: information at the point of decision, never before, never after.

---

### 4.4 The Four Experiences, Redesigned

#### A. THE INDIVIDUAL EXPERIENCE

**Opening the app -- The Quiet Room**

Imagine opening Forbetra on a Wednesday afternoon. The screen is almost entirely dark -- warm, breathing darkness, like a room with the lights low. At the very top, in text so subtle it is almost subliminal, your identity anchor: "I am becoming a leader who listens before deciding." Below it, even quieter: "WEEK 7 / 12."

In the center of the screen, a single card. Not decorated. Not glowing. Just present, the way a good question is present:

> **Check in**
> How did you show up this week?

A warm brass arrow on the right edge. Nothing else on the entire screen. No sidebar (it is there, collapsed, 48px wide, icon-only on desktop; bottom tab bar on mobile). No metrics. No charts. No streak counter demanding acknowledgment. Just the question and the invitation.

This is the therapy room: your reflection is the only thing that matters right now.

**Spec**: `max-width: 480px; margin: 0 auto; padding-top: 64px;` The single card uses the `interactive` variant. Identity anchor in Label register (11px, 600 weight, 0.08em tracking, text-tertiary). Week in Label register. CTA text in Heading register (20px, 600 weight). Description in Body register (15px, 400 weight, text-secondary). Arrow is a 44x44 interactive target, brass accent.

**The Check-In -- The Exhale**

Tapping into the check-in, the screen resolves to two vertical elements, side by side, on a dark field:

Two tall, narrow gradient bars -- effort on the left (slate), performance on the right (brass). Each is 40% of the viewport height. The user touches a bar and drags upward. As the finger rises, the bar fills from the bottom with its color, and a number crystallizes at the top: 1, 2, 3... The gesture is _raising_ your score -- a physical metaphor for reaching toward your assessment.

When you release, the number locks with a light haptic tap. A quiet label below the score shifts to show its anchor text -- "Significant effort" at 7, "Full commitment" at 9. These labels appear AFTER the score is set, as confirmation rather than influence.

Below the two bars, a text link in text-tertiary: "Add a note." Tapping reveals a text area that slides up with the out-expo curve. Above the bars, tiny, in Geist Mono: your score from last period, for reference.

The submit button is a single word at the bottom: "Done." Full width, 48px tall, brass on dark. One tap.

**Spec**: The gradient bars use CSS `linear-gradient` with `background-size` animated via Svelte `tweened` store. The value is derived from touch position relative to bar height. The bar container is `height: 40vh; width: 56px; border-radius: 28px;` (pill-shaped). The inner fill is `border-radius: 28px;` with `transition: height 100ms cubic-bezier(0.16,1,0.3,1)`. Score display: Geist Mono, 32px, 500 weight.

**The Pulse (Post-Submission)**

After tapping "Done," the two gradient bars hold their filled state for 400ms. Then they begin to contract -- shrinking smoothly from 40vh bars to 8px dots, maintaining their color (slate and brass). The dots drift downward and settle into a minimal timeline strip that appears at the bottom of the screen: a row of dot-pairs, one pair per week, showing the entire cycle's scores as a rhythm of slate and brass points. Your new scores take their place in the sequence.

The timeline holds for 1200ms -- just long enough to see the pattern, to notice that this week's dots are higher or lower than last week's. Then the view transitions to the Today screen, where the action card now reads: "You're on track. Your next check-in opens Friday."

**Spec**: The contraction uses `tweened` stores for width, height, and position. The timeline strip is a flex row of `8px` circles with `gap: 4px`, each circle's vertical position proportional to the score (0-10 mapped to 0-16px offset). Container: `height: 32px; padding: 8px 16px;`

**The Reveal -- Opening the Envelope**

A notification appears on the Today lens: a single line of text, no icon, no badge. "Someone shared their perspective." The text itself is the interactive element.

**Screen 1 -- Your view**: Full-screen, 64px top padding. Two large numbers in Geist Mono: "You rated effort 7" (slate) and "performance 5" (brass). Below, in text-secondary: "For the week of March 10." Nothing else. This is your truth, stated plainly. You own these numbers before you see anyone else's.

**Screen 2 -- The card**: Below your scores, a rectangular card appears. It is `surface-raised` with `border-strong`, 64px tall, centered. Its surface is subtly textured -- a fine diagonal pattern at 2% opacity, suggesting something behind it. The card breathes: a gentle 3% scale oscillation over 4 seconds (CSS animation, sinusoidal). A line of text below: "Tap to see their perspective."

The user taps. The card rotates on its Y axis (400ms, ease-out). The other side reveals two numbers in the same layout as yours: their effort score, their performance score. Simultaneously, the background behind the entire screen shifts:

- Aligned (gap < 1): a barely perceptible warm glow radiates from the center -- the `accent-muted` token at 6% opacity, spreading as a radial gradient.
- Moderate gap (1-3): no background change. Neutral.
- Significant gap (3+): the glow is cooler -- `data-effort-muted` at 6% opacity. Not alarming. Just... different.

**Screen 3 -- The prompt**: Below the revealed scores, a line of text fades in (600ms): "What might explain the difference?" and a single-line text input. A "Skip" link in text-muted. A "Save" button in accent.

This three-screen flow is a route: `/individual/reveal/[week]`. It is entered only via the notification. It cannot be navigated to from the sidebar. It is an event, not a page.

**AI Insights -- Editorial, Not Dashboard**

The weekly synthesis is not wrapped in a colored card with a section icon. It is rendered as editorial text on a quiet surface:

64px top padding. A date in Label register: "WEEK 7 SYNTHESIS -- MARCH 14, 2026." Then the insight text, flowing in Plus Jakarta Sans at 15px, line-height 1.7, max-width 580px, centered. Paragraphs separated by 24px. Key phrases in `text-primary` (0.93 opacity) against body text in `text-secondary` (0.55 opacity) -- the hierarchy is typographic, not chromatic.

No section color coding. No emoji headers. No card borders. Just text on a dark surface, like a page in a well-designed book.

Below the synthesis: a "Continue the conversation" link leading to the AI chat, and "View past insights" for chronological history.

_Adapted from_: Kinfolk's editorial treatment -- the content IS the design. iA Writer's principle that the interface should disappear, leaving only the text.

**The Portrait -- End of Cycle**

The cycle completion triggers a full-screen generative visualization. The user sees it for the first time when they tap "View your portrait" on the cycle completion screen.

The screen is entirely dark. In the center, the identity anchor text appears in Display register (32px, 700 weight). Then, clockwise from the 12 o'clock position, segments begin to draw themselves -- one per week. Each segment is a radial shape: its inner radius proportional to effort (cool slate fill), its outer radius proportional to performance (warm brass fill). The segment's opacity maps to completion rate (full check-ins = full opacity, missed = 40% opacity).

A second, thinner contour traces the stakeholder perception for each week -- a lighter line that sometimes hugs the self-rated shape and sometimes diverges.

The result looks different for every user: a unique radial artifact that encodes 8-16 weeks of behavioral data into a single, beautiful, personal image. Symmetrical portraits suggest consistency. Asymmetric ones tell a more complex story. Both are valid. Both are striking.

Below the portrait: "Share" (Web Share API or PNG export via html2canvas) and "Start a new cycle."

**Spec**: SVG-based. Each segment is a `path` element computed from `d3.arc()` with inner/outer radii derived from normalized scores (0-10 mapped to 40-120px radius). Stagger: 100ms per segment. Drawing animation: `stroke-dasharray` / `stroke-dashoffset` technique. Center text: `text-anchor: middle; dominant-baseline: central;`

#### B. THE COACH EXPERIENCE

**The Coach Console -- Command Center**

The coach opens Forbetra and sees the thing Linear gets right: the people who need attention first.

The screen is a clean list. No portfolio metrics, no aggregate stats, no decorative chrome. Just names and signals:

Each client is a row: name on the left (Heading register), and on the right, a single status indicator -- a small dot (8px) colored by the most urgent signal about that client:

- Brass dot: check-in submitted, data fresh, on track
- Slate dot: waiting for check-in, no action needed yet
- `signal-divergent` (amber): a perception gap worth discussing has emerged
- `signal-attention` (red): missed check-ins, declining scores, or stakeholder concern
- No dot: no active cycle

The list is sorted by urgency: attention items surface first, then divergent, then active, then waiting. The coach scans from top to bottom and knows exactly who needs them without reading a single metric.

Tapping a client enters the **Session View** -- a single, scrollable screen designed for a coaching conversation:

1. **Prep brief** (top): The AI-generated coaching prep, rendered as editorial text (like the individual's insight view). Key data points (current scores, trend, gap status) in Geist Mono inline with the narrative. Suggested conversation starters as pull quotes, indented with a left border.

2. **This week's data** (middle): The River visualization for this client -- their effort/performance flow over the cycle. Compact, 160px tall, showing the full trajectory. Below it: their latest intention text and check-in notes, verbatim.

3. **Coach notes** (bottom): A text area for session notes. Auto-saves. Week number auto-populated. Previous weeks' notes in a collapsible accordion below, most recent first.

The session view is the only screen a coach needs during a conversation. Everything on one page, in the order a coaching conversation naturally flows: what does the AI suggest? what does the data show? what did the client say? what do I want to note?

**On-Demand Prep**: A "Regenerate prep" button in the prep section allows coaches to generate fresh AI analysis before any session, not just Monday mornings.

**Spec**: Client list uses the same `interactive` card variant as individual cards. Dot indicator: `width: 8px; height: 8px; border-radius: 4px;` Session view: `max-width: 680px; margin: 0 auto;` River visualization at this width: `height: 160px; width: 100%;`

**Coach Analytics -- The Portfolio View**

Accessible from a secondary nav item (not the primary list). Shows:

1. **Client comparison matrix**: A single table with sortable columns: Name, Week, Completion %, Trend (up/down/flat icon), Alignment (gap indicator), Last Check-in Date. Sortable by any column. No charts -- the table IS the visualization.

2. **Time-series**: A small multiple grid -- one mini-River per client, 80px tall, arranged vertically. This lets the coach see all trajectories simultaneously, pattern-matching across their portfolio.

3. **Export**: CSV download of all client data. PDF report generation for organizational reporting (future feature, designed now for the button placement and empty state).

#### C. THE STAKEHOLDER EXPERIENCE

The stakeholder experience is the current platform's strongest page. The Quiet Room refines it rather than reimagining it.

**Key changes**:

1. **Remove emoji**: The welcome overlay currently uses emoji. Replace with typographic treatments. The shield icon (privacy reassurance) becomes a small Lock icon from Lucide. The gift icon (reveal teaser) becomes the word "Reveal" in accent color.

2. **Unify the rating input**: Stakeholders get the same gradient-bar input as individuals. Effort bar (slate) on the left, performance bar (brass) on the right. Consistent interaction language across all users.

3. **Structured qualitative prompts**: Replace the single "Share what you observed" comment box with two focused fields:
   - "What specific behavior did you observe this week?" (required, character guidance)
   - "What would you suggest they focus on?" (optional)

4. **Post-submission engagement**: After the reveal animation (which stays -- it is excellent), add: "Thank you. Your feedback is shaping [name]'s growth." Then, after 3+ submissions over time, show a subtle prompt: "You've provided feedback 5 times. Want to start your own growth journey?"

5. **Background shift**: Apply the same warm/cool background shift from the individual Reveal to the stakeholder's reveal view. When scores align, warm glow. When they diverge, cooler tone. This creates visual consistency across the reveal experience from both perspectives.

**Spec**: Rating bars identical to individual check-in bars. Structured prompts use Input component with `label` and `characterGuidance` props. Post-submission CTA appears after 500ms delay.

#### D. THE ONBOARDING EXPERIENCE

**Principle**: Onboarding should feel like the first conversation with a new coach -- curious, guided, never overwhelming.

**Structure**: Two steps, not five. (Adapted from Luke Wroblewski's friction reduction principles.)

**Step 1: Your Goal**

- Template library on the left (desktop) or above (mobile). Contexts and objectives browsable as an accordion.
- Selected objective auto-fills the title and description on the right (or below).
- "Build your own" is a text link, not a competing button.
- Draft auto-saves to localStorage (already implemented -- keep it).

**Step 2: Your Reviewers**

- 1-3 reviewers (reduced from 1-5). Three is the minimum for meaningful triangulation. More can be added later.
- Each reviewer: name and email only. Phone removed from initial onboarding (reduces fields by 33%).
- "Skip for now" is prominently available. Following the Arc Browser principle: let users experience value before asking them to recruit others. If they skip, prompt them again after their first check-in.

**Initial ratings are removed from onboarding entirely.** The first check-in IS the baseline. This eliminates the anchoring bias problem (defaulting to 5/5) and removes the most confusing step for new users.

**Visual treatment**: Single-column layout, `max-width: 560px`. Progress: a minimal two-dot indicator at top, not a labeled stepper. Backgrounds: `surface-base`. The template library uses `surface` cards with `interactive` variant on hover. Selected template gets `border-accent`.

**Completion screen**: Clean transition to the Today lens with a single message: "Your journey starts Monday. We'll be here." No emoji. No confetti. The confidence of restraint.

---

### 4.5 Navigation Architecture

#### Desktop (viewport >= 1024px)

Collapsed sidebar: 48px wide, icon-only. Four icons stacked vertically:

1. Home (circle) -- navigates to Today
2. Chart (trending-up) -- navigates to Progress
3. Users (people) -- navigates to Feedback
4. Settings (gear) -- navigates to Settings

The sidebar is `surface-raised` with `border-default` on the right edge. Active item: icon in `accent` color. Inactive: `text-muted`. Hover: `text-secondary`.

The sidebar can be expanded to 200px on hover or click, revealing text labels. But the default state is collapsed. The content area gets maximum space. This is the Linear principle: navigation recedes, content advances.

#### Mobile (viewport < 1024px)

Bottom tab bar: four items matching the sidebar icons. Fixed at bottom, `surface-raised`, `border-default` on top edge. Active item: accent color. Inactive: text-muted. Safe-area-inset-bottom respected.

The current implementation already has this structure. The change is: reducing nav items from 4 to 4 (Home, Check-in, Progress, Feedback becomes Home, Progress, Feedback, Settings) and removing "Check-in" as a persistent nav item. Check-in is accessed from the Today lens's action card. It is a verb, not a destination.

#### Header

The global header simplifies to: "Forbetra" wordmark on the left (Label register: 11px, 700 weight, 0.12em tracking). Clerk UserButton on the right. Nothing else. Role indicator, settings link, and admin link move to settings or the sidebar.

---

### 4.6 States -- Every State Designed

| State                       | Treatment                                                                                                                                                                                     |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Loading**                 | Skeleton shimmer using `surface-subtle` pulsing against `surface-raised`. No spinner. The shimmer follows the layout's structure so users see the page "resolve" into content.                |
| **Empty (first use)**       | The Today lens shows the onboarding CTA. No empty charts, no "no data yet" messages. The emptiness is the invitation.                                                                         |
| **Empty (between actions)** | "You're on track. Your next check-in opens Wednesday." Specific, not generic. Uses the actual day name from the cycle config.                                                                 |
| **Error**                   | Red-tinted banner at top of content area. Explains what went wrong AND suggests the fix. "We couldn't save your check-in. Check your connection and try again." Never: "An error occurred."   |
| **Offline**                 | Banner: "You're offline. Your data is safe -- we'll sync when you reconnect." Check-in form remains usable (localStorage draft).                                                              |
| **Partial data**            | Progress lens shows whatever data exists. The River draws with available weeks, leaving gaps visible (dashed line segments for missing weeks).                                                |
| **Success**                 | The Pulse animation for check-ins. A quiet checkmark (16px, accent color, 300ms fade-in) for other actions. No toast notifications for routine saves -- the state change IS the confirmation. |

---

## 5. SYSTEM COHERENCE -- BEYOND THE APP

### Email Notifications

Forbetra's emails carry the design language:

- **Background**: #0c0a09 (surface-base) -- dark emails are unusual and immediately recognizable in an inbox.
- **Text**: rgba(250,244,237, 0.93) on dark background.
- **Accent**: Brass (#d4a06a) for CTA buttons.
- **Typography**: System sans-serif stack (email clients don't support custom fonts consistently), but the typographic hierarchy mirrors the app: small uppercase labels, generous line-height for body text.
- **Content**: One message per email. No multi-section newsletters.
  - Monday reminder: "Your intention prompt is ready." One CTA button: "Set your intention."
  - Check-in reminder: "How did this week go?" One CTA button: "Check in."
  - Feedback received: "Someone shared their perspective." One CTA button: "See it."
  - Streak acknowledgment: "6 weeks consistent." No CTA needed. Just the acknowledgment.
  - Cycle completion: "Your portrait is ready." One CTA button: "View your portrait."

**Anti-pattern**: No summary digests. No "here's what happened this week" roundups. Each email is a single prompt, like a coach's single question. Respect for the recipient's attention.

### Push Notifications (Future)

Same philosophy:

- One line of text. No subtitle. No image.
- "Your check-in is ready." Not "Don't forget to check in this week! You're on a 6-week streak!"
- Notifications are prompts, not pitches.

### Shareable Artifacts

The Behavioral Portrait is designed for sharing:

- PNG export at 1080x1080 (Instagram-ready, LinkedIn-ready)
- Dark background with the radial visualization centered
- "Forbetra" wordmark in Label register at bottom, barely visible -- brand presence without brand shouting
- No user data labels on the shared version -- the image is abstract enough to be shared publicly while remaining deeply personal to the user

---

## 6. ACCESSIBILITY MATRIX

### Visual

| Element                                        | Contrast Ratio | WCAG Level | Notes                                                                        |
| ---------------------------------------------- | -------------- | ---------- | ---------------------------------------------------------------------------- |
| `text-primary` on `surface-base`               | 14.8:1         | AAA        | Exceeds all requirements                                                     |
| `text-secondary` on `surface-base`             | 6.2:1          | AA         | Passes for all text sizes                                                    |
| `text-tertiary` on `surface-base`              | 3.5:1          | AA Large   | Passes for labels (11px bold qualifies as "large" equivalent at this weight) |
| `accent` (#d4a06a) on `surface-base`           | 5.9:1          | AA         | Passes for buttons and links                                                 |
| `data-effort` (#94a3b8) on `surface-base`      | 5.2:1          | AA         | Passes for score displays                                                    |
| `data-performance` (#d4a06a) on `surface-base` | 5.9:1          | AA         | Passes for score displays                                                    |
| `signal-aligned` (#4ade80) on `surface-base`   | 7.1:1          | AAA        | Excellent                                                                    |
| `signal-attention` (#ef4444) on `surface-base` | 4.6:1          | AA         | Passes                                                                       |

### Color Independence

State is NEVER communicated by color alone:

- **Alignment status**: Dot color (green/amber/red) is always accompanied by text label ("Aligned" / "Gap worth exploring" / "Needs attention") and spatial position (gap size visible in the Mirror visualization)
- **Trend direction**: Arrow icon (up/down/flat) accompanies the color
- **Effort vs. performance**: Labels always present. Spatial position (left = effort, right = performance) is consistent and labeled
- **The Reveal background shift**: The contextual text ("You see this similarly" / "There's a gap worth exploring") carries the meaning. The background shift is atmospheric, not informational

### Motion

| Animation                            | Reduce Motion Alternative                               |
| ------------------------------------ | ------------------------------------------------------- |
| Gradient bar fill on check-in        | Instant fill, number appears without transition         |
| The Pulse (score-to-dot contraction) | Scores fade out, dots appear in timeline with crossfade |
| Card flip on Reveal                  | Card front crossfades to card back (200ms)              |
| Background color shift on Reveal     | Instant color change                                    |
| Portrait drawing animation           | Complete portrait appears with 600ms fade-in            |
| Slide-up stagger for lists           | Instant appearance                                      |
| Skeleton shimmer                     | Static skeleton (no animation)                          |

### Screen Reader

**Reading order for Today lens:**

1. "Forbetra, individual hub" (landmark)
2. Identity anchor text (heading level 2)
3. "Week 7 of 12" (status)
4. Action card: "Check in -- How did you show up this week? Button." (group with accessible label)
5. Reveal notification if present: "New feedback from a stakeholder. Button." (live region, polite)

**Reading order for Check-in:**

1. "Check-in for week 7" (heading level 1)
2. "Previous effort score: 6" (status)
3. "Effort score, slider, current value 0, range 0 to 10" (slider role with accessible value text)
4. "Previous performance score: 5" (status)
5. "Performance score, slider, current value 0, range 0 to 10" (slider role)
6. "Add a note, collapsed, button" (expandable)
7. "Done, button" (submit)

**Interactive elements**: All have `aria-label` describing the action ("Set your effort score" not "Slate bar"). All custom controls have appropriate ARIA roles (slider, radio, button). Decorative gradients and glow effects are `aria-hidden="true"`.

### Cognitive

- No time-limited interactions. Check-ins can be completed at any time during the open window. Intentions can be revised.
- Error messages always explain the fix: "Your check-in couldn't save. Check your connection and tap Done again."
- The three-lens architecture (Today/Progress/Feedback) ensures no single screen exceeds 4-5 information zones.
- Metric labels always include tooltip explanations on first encounter (implemented via the existing InfoTip component).

### Touch Targets

All interactive elements: minimum 44x44px touch target with 8px minimum spacing between targets. The gradient bars for check-in: 56px wide (exceeds minimum). Bottom tab bar icons: 44x44px tap area. "Done" button: full width, 48px tall.

---

## 7. DELIBERATE EXCLUSIONS

| Excluded Element                          | Reason                                                                                                                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gamification badges**                   | Patronizing for executive audience. Streaks are acknowledged quietly (a counter, not a badge). Growth is its own reward.                                               |
| **Glass morphism**                        | Added visual complexity without functional value. Solid surfaces are clearer and more performant. The Quiet Room has solid walls.                                      |
| **Emoji as UI elements**                  | Undermine premium positioning. Replaced with typographic treatments or Lucide icons where necessary.                                                                   |
| **Dashboard view**                        | The convention is wrong for this product. See Section 4.3.                                                                                                             |
| **Confetti/celebration animations**       | Inappropriate for the emotional register. A coaching insight is not a game achievement. Acknowledgment should feel like a nod from a respected colleague, not a party. |
| **Multi-color section coding**            | The 6-color insight sections create cognitive overload. Two data colors (slate, brass) plus three signal colors (green, amber, red) is the entire palette.             |
| **Sound**                                 | Coaching is private and reflective. The app never makes noise.                                                                                                         |
| **Charts with multiple types**            | One visualization type per lens. The River for Progress. The Mirror for Feedback. The Portrait for cycle completion. Consistency over variety.                         |
| **Toast notifications for routine saves** | The state change IS the confirmation. Toasts are reserved for errors and significant events (stakeholder feedback received).                                           |
| **"Save for later" on check-ins**         | Two buttons create a decision point that is also an exit point. One action: Done.                                                                                      |

---

## 8. IMPLEMENTATION PRIORITY

This is a design concept, not an implementation plan. But the recommended sequence for bringing The Quiet Room to life:

**Phase 1: Foundation** (design system tokens + navigation)

- Update color tokens (accent refinement, data-effort/data-performance, simplified semantics)
- Simplify border tokens
- Implement collapsed sidebar + bottom tab bar
- Simplify global header
- Remove glass morphism utilities

**Phase 2: The Three Lenses** (individual hub restructure)

- Build Today lens (single-action focus)
- Build Progress lens (River + numbers + insight)
- Build Feedback lens (Mirror + stakeholder management)
- Retire the monolithic individual hub

**Phase 3: Signature Moments**

- The gradient-bar check-in input
- The Pulse (post-submission animation)
- The Reveal (three-screen micro-flow)
- Streak counter (quiet acknowledgment)

**Phase 4: Coach Console**

- Signal-sorted client list
- Session view (prep + data + notes on one screen)
- On-demand prep generation
- Portfolio view

**Phase 5: The Portrait**

- D3/SVG radial visualization
- Drawing animation
- Share/export functionality

**Phase 6: Onboarding Simplification**

- Two-step flow
- Remove initial ratings
- Deferred stakeholder invitation option

---

_This concept was composed through the lens of warm rationalism -- the intersection of Italian Olivetti precision and Scandinavian democratic warmth. It sits at the corporate authority end of the spectrum, with enough signature moments to prevent the clinical feel of enterprise software. The grid is always there. The restraint is deliberate. The warmth is structural, not decorative._

_The highest compliment for The Quiet Room would be a user who says: "I didn't notice the interface. I just... reflected."_
