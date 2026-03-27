# FORBETRA: The Quiet Room -- Design Specification

## The Authoritative Design Reference

*Consolidated from iterative prototyping sessions -- March 2026*
*Visual source of truth: `prototype-v2.html`*

---

> "We need to aim at essential things, to remove every redundant effect."
> -- AG Fronzoni

---

## 1. DESIGN DIRECTION

**Forbetra should feel like a private executive coaching room -- warm timber, indirect light, one conversation at a time -- translated into a digital surface where data becomes self-knowledge and every interaction has the cadence of a thoughtful question.**

The name for this direction: **The Quiet Room**.

The aesthetic sits at the intersection of Italian Olivetti precision and Scandinavian democratic warmth -- what we call **warm rationalism**. Precision that does not feel cold. Restraint that does not feel austere. The grid is always there. The warmth is structural, not decorative.

The highest compliment would be a user who says: "I didn't notice the interface. I just... reflected."

---

## 2. DESIGN SYSTEM

Every token below is implemented in `prototype-v2.html` and is the canonical reference.

### 2.1 Surfaces

| Token | Value | Usage |
|-------|-------|-------|
| `surface-base` | `#0c0a09` | Page background. Warm stone-black, not cold blue-black. |
| `surface-raised` | `#141210` | Cards, tab bar, input backgrounds. |
| `surface-overlay` | `#1c1917` | Tooltips, menus, elevated panels. |
| `surface-subtle` | `#231f1c` | Toggle off-state, hover states, active items. |

These are the walls of the Quiet Room. They have the warmth of dark walnut furniture.

### 2.2 Text

All text colors share a warm-white base: `rgb(250, 244, 237)`.

| Token | Value | Usage |
|-------|-------|-------|
| `text-primary` | `rgba(250,244,237, 0.93)` | Headlines, primary content, self-score line on charts. |
| `text-secondary` | `rgba(250,244,237, 0.55)` | Supporting text, descriptions, insight body. |
| `text-tertiary` | `rgba(250,244,237, 0.35)` | Labels, metadata, identity anchor, gap descriptions. |
| `text-muted` | `rgba(250,244,237, 0.20)` | Disabled states, placeholder text, scale markers, inactive tabs. |

### 2.3 Accent Color

| Token | Value | Usage |
|-------|-------|-------|
| `accent` | `#e0b580` | Buttons, active tab indicator, CTA elements, notification links. |
| `accent-hover` | `#edc99a` | Hover state for accent elements. |
| `accent-muted` | `rgba(224,181,128, 0.10)` | Background tints for accent contexts (e.g., NEW badge background). |

**The accent color (`#e0b580`) is deliberately different from the performance data color (`#d4a06a`).** Buttons must be visually distinguishable from data values. The accent is warmer and lighter; performance data is deeper brass.

### 2.4 Data Colors

| Token | Value | Contrast on base | Usage |
|-------|-------|-------------------|-------|
| `data-effort` | `#94a3b8` | 5.2:1 | Effort scores, chart lines, bar dimension labels. Cool slate. |
| `data-effort-vivid` | `#cbd5e1` | 8.1:1 | Effort in high-emphasis: score readouts, big numbers. |
| `data-performance` | `#d4a06a` | 4.8:1 | Performance scores, chart lines, bar dimension labels. Warm brass. |
| `data-performance-vivid` | `#e0b580` | 6.2:1 | Performance in high-emphasis: score readouts, big numbers. |

**Why this pairing:** Effort is the internal engine -- steady, structural, cool. Performance is the external output -- visible, warm, radiant. The cool/warm duality maps to inner/outer. Slate and brass. A user internalizes "cool = effort, warm = performance" within their first week.

### 2.5 Signal Colors

| Token | Value | Usage |
|-------|-------|-------|
| `signal-aligned` | `#4ade80` | Gap less than 1 point. Badges read "Aligned." |
| `signal-different` | `#f59e0b` | Gap 1-2 points. Badges read "Different view." |
| `signal-attention` | `#ef4444` | Gap greater than 2 points or system errors. Badges read "Big gap." |

Three signal colors. No more. Each carries a single, unambiguous meaning.

### 2.6 Rater Color Palette

Twelve distinct, high-chroma colors for per-rater identification on the Perception Field. Assigned by stakeholder creation order and fixed for the duration of the relationship.

| Token | Value | Contrast on base |
|-------|-------|-------------------|
| `rater-1` | `#f472b6` | 4.5:1 |
| `rater-2` | `#60a5fa` | 5.1:1 |
| `rater-3` | `#a78bfa` | 4.6:1 |
| `rater-4` | `#2dd4bf` | 6.8:1 |
| `rater-5` | `#fbbf24` | 8.4:1 |
| `rater-6` | `#fb923c` | 5.7:1 |
| `rater-7` | `#a3e635` | 8.9:1 |
| `rater-8` | `#22d3ee` | 7.2:1 |
| `rater-9` | `#e879f9` | 4.8:1 |
| `rater-10` | `#f87171` | 4.6:1 |
| `rater-11` | `#34d399` | 6.4:1 |
| `rater-12` | `#818cf8` | 4.5:1 |

Each perspective has its own visual voice. If a rater is removed and re-added, they get their original color back.

### 2.7 Borders

Following Linear's principle of "structure felt, not seen":

| Token | Value | Usage |
|-------|-------|-------|
| `border-default` | `rgba(250,244,237, 0.04)` | Barely visible structural borders. Cards, dividers. |
| `border-strong` | `rgba(250,244,237, 0.08)` | Active/focused elements. Hover states. |

### 2.8 Typography

**Primary: Plus Jakarta Sans** -- warm geometric sans-serif. Humanist enough to feel approachable, geometric enough to feel precise.
**Data: Geist Mono** -- monospace register for all numeric data.

| Register | Size | Weight | Line-Height | Letter-Spacing | Usage |
|----------|------|--------|-------------|----------------|-------|
| Display | 32px | 700 | 1.15 | -0.025em | Growth Story headlines, onboarding |
| Heading | 20px | 600 | 1.3 | -0.015em | Section titles, page titles |
| Body | 15px | 400 | 1.7 | -0.01em | Reflections, AI insights, descriptions |
| Body Small | 13px | 400 | 1.5 | -0.01em | Supporting copy, back links |
| Label | 11px | 600 | 1.35 | 0.08em | UPPERCASE. Week numbers, section labels, tab labels, wordmark |
| Mono Data | 44px | 700 | 1 | 0 | Big numbers (Geist Mono) |
| Mono Score | 40px | 700 | 1 | 0 | Check-in score readout (Geist Mono) |
| Mono Secondary | 22px | 500 | 1 | 0 | Rater averages (Geist Mono) |
| Mono Small | 15px | 500 | 1 | 0 | Rater row scores (Geist Mono) |
| Mono Tiny | 11px | 500 | 1 | 0 | Last score reference, scale ticks (Geist Mono) |

The typographic scale: 9, 10, 11, 13, 14, 15, 20, 22, 32, 40, 44. Size through purpose, not decoration.

### 2.9 Spacing

8-point grid, applied with the rigor of Noorda's Milan Metro:

| Token | Value | Usage |
|-------|-------|-------|
| `space-xs` | 4px | Icon-to-label gaps, tight details |
| `space-sm` | 8px | Compact: list padding, small gaps |
| `space-md` | 16px | Standard: card padding, label-group margins |
| `space-lg` | 24px | Generous: between content sections, page side padding |
| `space-xl` | 32px | Breathing room: between major sections |
| `space-2xl` | 48px | Landmark: bar-group gap, caught-up state padding |
| `space-3xl` | 40px | Ceremony: top padding on focused screens |

**The ceremony-space rule:** Every screen begins with 40px of top padding below the header. This is the digital equivalent of the therapist's pause before speaking.

### 2.10 Cards

Two variants:

| Variant | Treatment | Usage |
|---------|-----------|-------|
| `card` | `background: surface-raised; border: 1px solid border-default; border-radius: 12px; padding: 20px 24px;` | Data display, containers, insight cards, chart cards. |
| `card-interactive` | Same as card, plus: `transition: all 150ms ease; &:hover { border-color: border-strong; background: surface-overlay; }` | Client rows, tappable cards. |

No glass morphism. Solid surfaces only. The Quiet Room has solid walls.

### 2.11 Animation

| Token | Value | Usage |
|-------|-------|-------|
| `ease` | `cubic-bezier(0.16, 1, 0.3, 1)` | All transitions. One curve for the entire platform. Fast attack, gentle settle. |
| `dur-hover` | 150ms | Hover states, toggle switches, micro-interactions. |
| `dur-transition` | 300ms | Screen transitions, card state changes. |
| `dur-ceremony` | 600ms | Fade-in on content arrival. The prompt appearing like thought arriving. |
| `dur-snap` | 100ms | Haptic-synchronized snap on check-in bar value changes. Must feel instantaneous. |
| `stagger` | 60ms | Sequential element reveals (coach client list only). |

**Reduce Motion:** All animations have explicit alternatives. `@media (prefers-reduced-motion: reduce)` sets all durations to 0.01ms. Staggered fade-ins become instant appearance. Content pages render immediately.

**No staggered animations on content pages.** The Growth Story renders immediately. Staggered fade-ins are reserved for lists only (e.g., coach client list).

### 2.12 Buttons

| Variant | Spec |
|---------|------|
| Primary | `width: 100%; padding: 14px; border-radius: 8px; background: accent; color: #0c0a09; font-size: 15px; font-weight: 600;` Hover: `accent-hover`. Disabled: `opacity: 0.4; cursor: not-allowed.` |
| Secondary | `display: inline-block; padding: 14px 32px; border: 1px solid border-strong; border-radius: 8px; background: transparent; color: text-secondary; font-size: 15px; font-weight: 500;` Hover: `border-color: text-tertiary; color: text-primary.` |

### 2.13 Global Header

Fixed at top. `padding: 16px 24px; border-bottom: 1px solid border-default; background: surface-base; z-index: 100.`

Left: "FORBETRA" wordmark (11px, 700 weight, 0.12em tracking, uppercase, `text-tertiary`).
Right: Avatar circle (28px, border-radius 14px, `surface-subtle` with `border-strong`, initials in 10px `text-tertiary`).

Nothing else. No role indicator. No settings link. Radical simplicity.

---

## 3. NAVIGATION ARCHITECTURE

### 3.1 The Three Tabs

| Tab | Icon | Question It Answers |
|-----|------|---------------------|
| **Today** | Concentric circles | "What should I do right now?" |
| **Progress** | Trending-up polyline | "How am I doing over time?" |
| **Feedback** | People silhouettes | "How do others see me?" |

Three tabs. Always visible. On every screen.

### 3.2 Tab Bar Specification

Fixed at bottom. `background: surface-raised; border-top: 1px solid border-default; padding: 8px 0 max(8px, env(safe-area-inset-bottom)); z-index: 100.`

Each tab button: `flex-direction: column; gap: 4px; padding: 6px 28px; min-width: 72px.`
- Inactive: `text-muted`
- Hover: `text-secondary`
- Active: `accent`

Tab label: 10px, 600 weight, 0.06em tracking, uppercase.
Tab icon: 20x20 SVG, `stroke: currentColor; stroke-width: 1.5; fill: none.`

### 3.3 Separate Contexts

These are NOT tabs. They are accessed from a demo/admin panel or via separate entry points:

- **Coach view** -- separate role-based context, accessed by coaches via their own login
- **Growth Story** -- accessed from cycle completion prompt or admin panel
- **Stakeholder feedback form** -- accessed via token-based link (no authentication required)

### 3.4 Screen Container

All screens: `padding-top: 61px` (header height), `padding-bottom: 80px` (tab bar height), `min-height: 100vh.`

Inner content: `max-width: 440px; margin: 0 auto; padding: 0 24px.` Reading-width variant (Progress, Feedback, Growth, Coach): `max-width: 640px.`

---

## 4. SCREEN-BY-SCREEN SPECIFICATION

### 4.1 TODAY -- The Home Screen

**What the user sees:**

Imagine opening Forbetra on a Wednesday afternoon. The screen is warm darkness. At the top, in text so subtle it is almost subliminal, your identity anchor: "I am becoming a leader who listens before deciding." Below it, even quieter: "Week 7 of 12."

If a check-in is due, the rating bars appear right here on the Today screen. No separate check-in screen. No extra taps. The instruction is a single line: "How did you show up this week?"

If no check-in is due: "You're on track. Your next check-in opens Wednesday." Center-aligned, `text-secondary`, 15px. The emptiness is the design.

**Information hierarchy (top to bottom):**

1. Identity anchor (Label register, `text-tertiary`)
2. Week indicator ("Week 7 of 12" -- Geist Mono, 11px, `text-muted`)
3. Check-in bars (when due) OR caught-up state
4. New feedback notification (when present)
5. Coach nudge (when present)

**Identity Anchor spec:** 11px, 600 weight, 0.08em tracking, uppercase, `text-tertiary`. margin-bottom: 8px.

**Week Indicator spec:** Geist Mono, 11px, `text-muted`, 0.06em tracking. margin-bottom: 32px.

Plain language: "Week 7 of 12" -- not "WEEK 7 / 12."

**New Feedback Notification:**

When stakeholder feedback arrives, a notification appears on Today: a left-bordered text hint.

`padding: 12px 16px; border-left: 2px solid rgba(224,181,128, 0.25); cursor: pointer.` Hover: border-color becomes `accent`.

Text: "Sarah M. shared her perspective. View scores -->" (13px, `text-secondary`, with "View scores" in `accent`).

Tapping navigates directly to the Feedback tab with that rater's row highlighted with the NEW state. No separate reveal screen. No card flips. No glow. The data IS the reveal.

**Coach Nudge:**

`border-left: 2px solid rgba(224,181,128, 0.20); padding: 16px 20px.`

Text: 14px italic, `text-secondary`. Attribution: 11px, `text-muted`, non-italic. Example: *"Consider what your team sees that you might be discounting this week."* -- Your coach, Sarah

**Caught-Up State:**

`text-align: center; padding: 48px 0.`

"You're on track. Your next check-in opens Wednesday." (15px, `text-secondary`, line-height 1.6.)

Uses the actual day name from the cycle configuration. Specific, not generic.

**States:**

| State | Treatment |
|-------|-----------|
| Check-in due | Bars visible, submit button, note prompt |
| Check-in saved | Caught-up message with next check-in day. "Check-in saved. Your next check-in opens Wednesday." |
| Feedback received | Notification hint visible, tappable to Feedback tab |
| Nothing to do | Caught-up message only. Emptiness is the design. |
| First use | Onboarding CTA |
| Loading | Skeleton shimmer: `surface-subtle` pulsing against `surface-raised`. No spinner. |
| Error | Red-tinted banner: "We couldn't save your check-in. Check your connection and try again." |

---

### 4.2 CHECK-IN -- Inlined Into Today

The check-in is NOT a separate screen. It lives directly on the Today tab when a check-in is due.

**Rating Bars:**

Two vertical gradient bars, side by side. Effort on the left (slate), performance on the right (brass).

**Bar Track:**
- Width: 72px. Height: 280px. Border-radius: 36px (pill-shaped).
- Background: `surface-raised`. Border: `2px solid rgba(250,244,237, 0.06)`.
- Touch-action: none. User-select: none.
- Active state: border-color brightens to `rgba(250,244,237, 0.12)`, glow shadow appears:
  - Effort: `box-shadow: 0 0 24px rgba(148,163,184, 0.15), inset 0 0 24px rgba(148,163,184, 0.05)`
  - Performance: `box-shadow: 0 0 24px rgba(212,160,106, 0.15), inset 0 0 24px rgba(212,160,106, 0.05)`

**Bar Fill:**
- Position: absolute, anchored to bottom. Border-radius on bottom only.
- Effort gradient: `linear-gradient(to top, #475569, #94a3b8, #cbd5e1)`
- Performance gradient: `linear-gradient(to top, #92700a, #d4a06a, #e0b580)`
- Transition: `height 80ms ease`

**Bar Thumb:**
- Positioned at top of fill. Width: 32px. Height: 4px. Border-radius: 2px.
- Background: `rgba(250,244,237, 0.8)`. Box-shadow: `0 0 8px rgba(250,244,237, 0.3)`.
- Hidden until user interacts.

**Last-Score Reference Marker:**
- Horizontal line at the position of last week's score. 2px tall, `rgba(250,244,237, 0.25)`.
- Positioned inside the bar track. Non-interactive (pointer-events: none).

**Scale Markers (alongside bar):**
- Full 0-10 scale displayed to the left of each bar track.
- Every integer gets a tick mark. Majors at 0, 5, 10 (wider line, brighter number, larger text).
- Tick line: 8px wide (12px for majors), `rgba(250,244,237, 0.12)` (0.25 for majors).
- Numbers: Geist Mono, 11px for minors (9px, `text-muted`), 11px for majors (`text-tertiary`).
- Active highlight: when dragging, the current value's tick gets `text-primary`, 700 weight, 13px, 16px line width, 2px height, `rgba(250,244,237, 0.5)`.

**Score Readout -- BELOW the bar, not inside it:**

The bar is pure material. The score number lives in a dedicated reading zone below.

`bar-label-group`: `text-align: center; margin-top: 16px.`

- Dimension label: 11px, 600 weight, 0.08em tracking, uppercase. Effort in `data-effort`, performance in `data-performance`.
- Score number: Geist Mono, **40px**, 700 weight, line-height 1. Effort in `data-effort-vivid`, performance in `data-performance-vivid`. Inactive state: `text-muted`, shows "--".
- Pulse animation on value change: `transform: scale(1.08)` for 120ms, then back.
- Last score: Geist Mono, 11px, `text-muted`. "Last: 6"

**Bars Container:** `display: flex; justify-content: center; gap: 48px; margin-bottom: 20px.`

**Interaction behavior:**
- Touch/mouse down on bar starts drag. Value snaps to integers (0-10).
- Each integer crossing triggers a haptic tick (UIImpactFeedbackGenerator .light, rigid) and readout update.
- Submit button stays disabled until BOTH bars have been set.
- Bars snap to integer values: drag position mapped to nearest integer, percentage calculated as `(val / 10) * 100`.

**Note Prompt -- Always Visible:**

The note field is always visible on the check-in, not hidden behind a toggle.

Label: "What shaped your week? -- even one sentence helps your coach" (14px, `text-secondary`, with em-dash portion in `text-tertiary`).

Textarea: `min-height: 88px; background: surface-raised; border: 1px solid border-default; border-radius: 10px; padding: 14px 16px; font-size: 14px; line-height: 1.6.` Focus: `border-color: rgba(250,244,237, 0.14).` Placeholder: `text-muted`.

**Submit Button:** Full-width primary button. "Save check-in." Disabled until both bars set.

**Post-Submission:** The check-in area immediately transitions to the caught-up state: "Check-in saved. Your next check-in opens Wednesday."

---

### 4.3 PROGRESS -- Self-Scores Over Time

**What the user sees:**

A clean vertical scroll of your own data. No rater information here. Self-data lives in Progress. Rater data lives in Feedback. Clean separation.

**Information hierarchy (top to bottom):**

1. Identity anchor + week indicator
2. Big numbers (effort and performance, side by side)
3. Effort chart (stacked small-multiple)
4. Performance chart (stacked small-multiple)
5. AI insight

**Big Numbers:**

Two columns, centered, 48px gap.

Each column:
- Score: 44px Geist Mono, 700 weight, in vivid data color. `score-you` class.
- "(you)" label: 11px, `text-tertiary`. margin-top: 4px.
- Trend: Geist Mono 12px, `text-muted`. Arrow + "from N". margin-top: 4px.

**Two Stacked Charts:**

Effort chart above, performance chart below. No dimension toggle needed. Each chart is self-labeled.

Chart card: `background: surface-raised; border: 1px solid border-default; border-radius: 12px; padding: 16px 12px 8px; cursor: crosshair; margin-bottom: 8px.`

Chart label: 9px, 600 weight, 0.06em tracking, uppercase, `text-muted`. "EFFORT OVER TIME" / "PERFORMANCE OVER TIME."

Canvas: full width, 160px height. HiDPI-aware (devicePixelRatio scaling).

**Progress charts show self-score lines only:**
- Self line: `rgba(250,244,237, 0.93)`, 2.5px stroke, 4px dots at each data point.
- Y-axis: 0-10 scale, gridlines at 0/5/10 in `border-default`. Labels in Geist Mono 9px, `text-muted`.
- X-axis: "W1", "W2", etc. in Geist Mono 10px, `text-muted`. Current week bolded and brighter.
- "You" label at right edge of line: Geist Mono 10px bold, `rgba(250,244,237, 0.7)`.

**Tooltip on hover:** Appears at hovered week. Shows week number header, then "You" with score. Same tooltip component as Feedback charts, just without rater rows.

**AI Insight:** Rendered in an insight card (`surface-raised`, `border-default`, 12px radius, 20px 24px padding). Body text: 15px, line-height 1.7, `text-secondary`. Key phrases: `text-primary`, 500 weight.

No section headers or colored cards wrapping it. The text itself is the design.

---

### 4.4 FEEDBACK -- The Perception Field

This is the product's signature screen. Individual rater data over aggregates. Each rater is a person with a name, a color, and a trajectory.

**What the user sees:**

A single scrolling view with five sections stacked vertically.

**Information hierarchy (top to bottom):**

1. Section title ("FEEDBACK -- HOW OTHERS SEE YOU")
2. Big numbers (self vs. rater averages)
3. Perspectives list with toggles (ABOVE the charts)
4. Effort chart (with rater lines)
5. Performance chart (with rater lines)
6. AI insight

**Section Title:** 11px, 600 weight, 0.08em tracking, uppercase, `text-muted`. margin-bottom: 32px.

**Section 1: Big Numbers**

Two score columns, centered, 48px gap. Each column:

| Element | Spec |
|---------|------|
| Dimension label | 11px, 600 weight, 0.08em tracking, uppercase, `text-muted`. margin-bottom: 8px. |
| Your self-score | 44px Geist Mono, 700 weight. Effort: `data-effort-vivid`. Performance: `data-performance-vivid`. |
| "(you)" sub-label | 11px, `text-tertiary`. margin-top: 4px. |
| Rater average | 22px Geist Mono, 500 weight. Effort: `data-effort` at 0.6 opacity. Performance: `data-performance` at 0.6 opacity. margin-top: 12px. |
| Average label | 10px, `text-muted`. "avg of 3 raters" or the rater's name when solo. margin-top: 3px. |
| Gap text | 12px, 500 weight. Colored by signal semantics. margin-top: 8px. |

Gap text uses **plain language**: "They see +1.2 higher" / "They see 0.5 lower" / "Close to your view" (when gap < 0.5).

Gap color: `signal-aligned` (gap 0-1), `signal-different` (gap 1-2), `signal-attention` (gap 2+).

The average and gap update dynamically as raters are toggled on/off. When one rater active, the label shifts to that rater's name.

**Section 2: Perspectives List**

Positioned ABOVE the charts so toggles are near the data they control.

Header: "PERSPECTIVES" (Label register, `text-muted`) with a "Reset" link (11px, `text-tertiary`, hidden until selection differs from default).

Each rater is a row:

| Element | Spec |
|---------|------|
| Toggle switch | 36x20px pill, border-radius: 10px. OFF: `surface-subtle` background, 1.5px `border-strong` border, knob at left (`rgba(250,244,237, 0.15)`). ON: background tinted to rater's color at 20% opacity, border in rater's color at 40% opacity, knob at right in rater's color. |
| Line swatch | 20x3px, border-radius: 2px, in rater's color. Opacity: 1 when active, 0.4 when inactive. |
| Name | 14px, 500 weight, in rater's color. 600 weight when active. 0.45 opacity when inactive. |
| Gap description | 11px, `text-tertiary`. "Sees your effort 2 higher" / "Close to your view." 0.35 opacity when inactive. |
| Scores | Two score values (E and P) in Geist Mono 15px, 500 weight, in vivid data colors. 0.35 opacity when inactive. Dimension labels: 9px, 0.06em tracking, uppercase, `text-muted`. |
| Alignment badge | Pill-shaped (3px 8px padding, 4px radius, 10px font, 500 weight). "Aligned" (green), "Different view" (amber), "Big gap" (red). 0.35 opacity when inactive. |

**Rater row container:** `padding: 12px 16px; border-radius: 10px; cursor: pointer; margin-bottom: 2px.` Hover: `background: surface-raised; border-color: border-default.`

**Toggle interaction:** Clicking the toggle adds/removes that individual rater without affecting others.

**Solo mode:** Tapping the rater's name/info area activates solo mode -- isolates that single rater (all others off). Tapping the same rater's info area again when it's the only active rater restores all raters.

**NEW state:** When a rater has new feedback, their row gets:
- Background: `rgba(224,181,128, 0.06)`
- Border: `rgba(224,181,128, 0.15)`
- A "NEW" badge after the name: 9px, 600 weight, 0.06em tracking, uppercase, `accent` color, background `accent-muted`, padding 2px 6px, border-radius 3px, margin-left 8px.

This is how the "reveal" works. No separate screen. The Today notification ("Sarah M. shared her perspective. View scores -->") navigates to the Feedback tab with that row highlighted in the NEW state. The data IS the moment.

**Perspective sorting:** Rows are sorted by gap magnitude (largest gap first). This ensures the most noteworthy perspectives are always at the top.

**Show All / Hide All:** Batch controls in the section header. "Reset" link appears when any rater is toggled off.

**Section 3 & 4: Two Stacked Charts**

Effort chart above, performance chart below. Same chart card spec as Progress, but with rater lines overlaid.

- Self line: `rgba(250,244,237, 0.93)`, 2.5px stroke, 4px dots.
- Active rater lines: rater's color, 1.5px stroke, 3px dots, 0.4 opacity.
- Inactive rater lines: hidden entirely. No ghost state, no dimming. Just absent.
- Right-edge labels: rater first name + score in a rounded background pill (`rgba(12,10,9, 0.75)`) at each line's terminal point. Geist Mono 10px bold.

**Tooltip:** Shows week number header, then all visible scores sorted high-to-low. Each row: color dot (6px circle) + name + score. "You" listed with `text-primary`, other raters with `text-secondary`. Tooltip container: `surface-overlay`, `border-strong`, 12px radius, 12px 16px padding, box-shadow.

**Section 5: AI Insight**

Same insight card as Progress. But the text references the Perception Field data directly: which raters diverge most, whether gaps are closing, patterns across individual perspectives. Names specific raters when relevant.

Example: "**Sarah** consistently rates your effort 2 points higher than you rate yourself -- she sees work you may be discounting. **David** tracks closest to your self-assessment, especially on effort."

---

### 4.5 STAKEHOLDER FEEDBACK FORM

Accessed via a token-based link. No authentication. Separate context from the main app -- the tab bar is hidden (or absent).

**What the stakeholder sees:**

**Header:** "Share your perspective" (Heading register, 20px, 600 weight).

**Context:** "You're giving feedback on **James Mitchell**'s effort and performance this week. Your responses are confidential." (14px, `text-secondary`, with name in `text-primary` bold.)

**Definitions:** "**Effort** = how much energy and commitment they showed. **Performance** = the quality and impact of their work." (12px, `text-muted`, with terms bolded in `text-tertiary`.)

**Rating Bars:** Identical to the individual check-in bars in every respect (72px wide, 280px tall, same gradients, scale markers, thumb, score readout below). No "Last" marker (stakeholders don't have history on this screen).

**Structured Qualitative Prompts:**

Two fields in a stacked layout (flex column, 16px gap):

**Field 1 (required):**
- Label: "What specific behavior did you observe this week?" (13px, 500 weight, `text-secondary`)
- Hint: "Think of a concrete moment -- what did they do or say?" (11px, `text-muted`)
- Textarea: same spec as individual note field. Placeholder: "e.g., In Tuesday's meeting, they asked the team for input before making the decision..."

**Field 2 (optional):**
- Label: "What would you suggest they focus on?" (13px, 500 weight, `text-secondary`)
- "OPTIONAL" badge: 10px, `text-muted`, 0.04em tracking, uppercase.
- Textarea: same spec. Placeholder: "One thing that could make a difference..."

**Submit:** Primary button, "Submit feedback." **Disabled until both rating bars are set.** Disabled state: `opacity: 0.4; cursor: not-allowed.`

**Confidentiality footer:** Centered, 12px, `text-muted`. "Your feedback is confidential and helps shape their growth."

**Post-submission:** Thank-you confirmation: "Thank you. Your feedback is shaping [name]'s growth." After 3+ submissions over time: "You've provided feedback 5 times. Want to start your own growth journey?"

---

### 4.6 COACH VIEW -- Signal-Sorted Client List

**What the coach sees:**

A greeting, a client count, and a clean list sorted by urgency. No dots, no badges, no colored indicators competing for attention. The meta text IS the signal, colored by urgency.

**Header:**
- "Good afternoon, Sarah" (Heading register)
- "4 active clients" (13px, `text-muted`)

**Client List:**

Each client is a card-interactive row:
- Container: `padding: 16px 20px; background: surface-raised; border: 1px solid border-default; border-radius: 10px; margin-bottom: 8px.`
- Avatar: 32px circle, `surface-subtle`, initials in 11px 600 weight `text-tertiary`.
- Name: 15px, 500 weight, `text-primary`.
- Signal text: 12px, colored by urgency.

**Signal sorting (top to bottom):**

| Priority | Color | Example Text |
|----------|-------|-------------|
| Attention (highest) | `signal-attention` (red) | "Missed 2 check-ins, 5 days ago" |
| Divergent | `signal-different` (amber) | "Perception gap emerging, 2 days ago" |
| Active | `text-secondary` | "Checked in today" |
| Waiting (lowest) | `text-muted` | "Awaiting check-in" |

No dots. The meta text is the signal. The color reinforces priority. A coach scans top to bottom and knows exactly who needs them.

**Staggered entry animation:** The client list uses staggered fade-in at 80ms intervals. This is the one place where list stagger is appropriate.

**Coach view is accessed from a separate context** (role-based routing or demo panel), not from the main three-tab navigation.

---

### 4.7 GROWTH STORY -- Cycle Completion Report

Replaces the Portrait. A structured, immediately legible cycle report. No abstract radial visualizations. No encoding that requires a decoder ring.

**What the user sees:**

A full-screen scrolling view that renders immediately. No staggered animations. This content matters -- let them read it.

**Information hierarchy (top to bottom):**

1. Back link + section label ("YOUR GROWTH STORY -- CYCLE 1")
2. AI-generated headline (Heading register)
3. Start-vs-end comparison table
4. Dual-line trend charts (12 weeks, effort above, performance below)
5. Top 3 rater quotes
6. AI narrative
7. "What's Next" suggestions
8. Share + Start New Cycle buttons

**Section Label:** Label register, `text-muted`, margin-bottom: 16px.

**AI Headline:** 20px, 600 weight, line-height 1.4, `text-primary`, max-width: 520px. Example: "You started uncertain about delegation and ended with your team noticing the change."

**Comparison Table:**

Full-width table, border-collapse.

Headers: 11px, 600 weight, 0.06em tracking, uppercase, `text-muted`. Padding: 8px 12px. Text-align: right (first column left). Bottom border: `border-default`.

Data cells: Geist Mono, 14px, 500 weight. Right-aligned. Bottom border: `border-default`. First column: Plus Jakarta Sans, 13px, `text-secondary`, left-aligned.

Rows: Effort (you), Performance (you), Effort (raters), Performance (raters), Perception gap. Columns: Start (W1), End (W12), Change.

Positive changes in `signal-aligned`. Gap closing in `signal-aligned` with downward arrow.

**Growth Charts:**

Two chart cards (same spec as Progress/Feedback charts), 160px height each. Effort above, performance below.

Self line as primary. Rater lines shown as dashed overlays (1.5px, rater colors, 0.3 opacity, `setLineDash([4, 4])`). All raters shown -- no toggle on Growth Story. Right-edge labels for each line.

**Top 3 Rater Quotes:**

Section label: "WHAT THEY SAID" (Label register, `text-muted`).

Each quote: 16px top/bottom padding, bottom border in `border-default`. Quote text: 15px, line-height 1.7, `text-secondary`, italic. Attribution: 11px, `text-muted`, non-italic. "-- Sarah"

**AI Narrative:**

15px, line-height 1.7, `text-secondary`. Key phrases: `text-primary`, 500 weight. Max-width governed by reading-width container (640px). Generous paragraph spacing (double line break).

**What's Next:**

Section label: "WHAT'S NEXT" (Label register, `text-muted`).

Each suggestion: `padding: 12px 0; border-bottom: border-default; font-size: 14px; color: text-secondary.`

**Action Buttons:**

Centered row, 12px gap. "Share" as secondary button. "Start a new cycle" as primary button (inline-width, not full-width: `width: auto; padding: 14px 32px`).

**Share Export:** 1080x1080 PNG containing the journey charts, comparison table, and identity anchor text. Dark background, "FORBETRA" wordmark faintly at bottom. Legible to anyone -- no decoder ring required.

---

## 5. CROSS-SCREEN PATTERNS

### 5.1 One Chart Language

The line chart (time on x-axis, 0-10 on y-axis, colored lines per data source) is the single visualization grammar for the entire product. Progress, Feedback, Growth Story, and Coach views all use the same chart renderer. Users learn it once.

Chart rendering details:
- Canvas-based, HiDPI-aware (devicePixelRatio scaling).
- Bezier curves between data points (control points at midpoints for smooth interpolation).
- Y-axis: gridlines at 0/5/10 in `rgba(250,244,237, 0.04)`, labels in Geist Mono 9px `text-muted`.
- X-axis: "W1", "W2"... in Geist Mono 10px `text-muted`. Current week bolded and brighter (`text-secondary`).
- Padding: left 28px, right 80px (for right-edge labels), top 12px, bottom 28px.
- Cursor: crosshair over chart area.
- Tooltip: follows cursor, snaps to nearest week. `surface-overlay`, `border-strong`, 10px radius, 12px 16px padding, box-shadow `0 8px 24px rgba(0,0,0, 0.4)`.

### 5.2 Notification Model

Notifications are prompts, not pitches.

**Email:** Dark background (#0c0a09). One message per email. Brass CTA button. System sans-serif stack.
- Check-in reminder: "How did this week go?" One button: "Check in."
- Feedback received: "Someone shared their perspective." One button: "See it."
- Streak: "6 weeks consistent." No CTA. Just the acknowledgment.
- Cycle completion: "Your Growth Story is ready." One button: "View your story."

**Push (future):** One line of text. No subtitle. No image. "Your check-in is ready." Not "Don't forget to check in! You're on a 6-week streak!"

**In-app:** The notification hint on Today (left-border accent, 13px text, tappable to Feedback tab).

### 5.3 Confirmation Behavior

No toast notifications for routine saves. The state change IS the confirmation.

- Check-in saved: screen transitions to caught-up state with next check-in date.
- Stakeholder feedback submitted: thank-you message appears inline.
- Errors: red-tinted banner at top of content area. Explains what went wrong AND suggests the fix.

### 5.4 Empty States

| Context | Treatment |
|---------|-----------|
| First use (no data) | Today shows onboarding CTA. No empty charts, no "no data yet." |
| Between actions | "You're on track. Your next check-in opens [day]." Specific, never generic. |
| No raters selected (Feedback) | Big numbers show "--". Average labels show "no raters selected." Charts show self-line only. |
| Partial data (Progress) | Charts draw with available weeks. Missing weeks are simply absent (shorter line). |
| No feedback yet (Feedback) | "No perspectives yet. Your raters will appear here after they respond." |

### 5.5 Haptic Vocabulary

| Pattern | Meaning | Implementation |
|---------|---------|----------------|
| Single light tap | Score locked, value snapped | UIImpactFeedbackGenerator(.light), rigid style |
| None (silence) | Contemplation, reading, reviewing | Deliberate absence |

**Forbetra is silent.** No chimes, no completion sounds, no notification tones within the app. Coaching is a private, reflective practice. The therapy room analogy holds: you would never play a jingle when a client has an insight.

### 5.6 Plain Language Everywhere

| Instead of | Use |
|-----------|-----|
| "WEEK 7 / 12" | "Week 7 of 12" |
| "Divergent" | "Different view" |
| "Convergent" | "Aligned" |
| triangle-up 1.2 gap | "They see +1.2 higher" |
| "Significant divergence detected" | "Big gap" |
| Perception gap trend: Narrowing | "Perception gap: closing" (with downward arrow) |
| "Sees effort +2.0 vs. self" | "Sees your effort 2 higher" |

---

## 6. ACCESSIBILITY MATRIX

### 6.1 Contrast Ratios

| Element | Ratio | WCAG Level |
|---------|-------|------------|
| `text-primary` on `surface-base` | 14.8:1 | AAA |
| `text-secondary` on `surface-base` | 6.2:1 | AA |
| `text-tertiary` on `surface-base` | 3.5:1 | AA Large |
| `accent` (#e0b580) on `surface-base` | 6.2:1 | AA |
| `data-effort` (#94a3b8) on `surface-base` | 5.2:1 | AA |
| `data-performance` (#d4a06a) on `surface-base` | 4.8:1 | AA |
| `signal-aligned` (#4ade80) on `surface-base` | 7.1:1 | AAA |
| `signal-attention` (#ef4444) on `surface-base` | 4.6:1 | AA |

### 6.2 Color Independence

State is NEVER communicated by color alone:

- **Alignment status:** Badge color always accompanied by text label ("Aligned" / "Different view" / "Big gap").
- **Gap magnitude:** Plain-language gap text ("They see +1.2 higher") always present alongside color.
- **Effort vs. performance:** Always labeled. Spatial position (left = effort, right = performance) is consistent.
- **Rater identification:** Name always visible alongside color dot/swatch.
- **Coach urgency:** Signal text carries meaning. Color reinforces but does not carry alone.

### 6.3 Motion Alternatives

`@media (prefers-reduced-motion: reduce)` sets all animation/transition durations to 0.01ms.

| Animation | Alternative |
|-----------|------------|
| Bar fill on check-in | Instant fill |
| Score readout pulse | Instant number change |
| Fade-in on page content | Instant appearance |
| Coach list stagger | Instant appearance |
| Growth Story content | Already instant (no stagger) |

### 6.4 Screen Reader Order

**Today:**
1. "Forbetra" (landmark)
2. Identity anchor (heading level 2)
3. "Week 7 of 12" (status)
4. Check-in controls or caught-up message
5. Notification if present (live region, polite)
6. Coach nudge if present

**Check-in:**
1. "How did you show up this week?" (instruction)
2. "Effort score, slider, current value 0, range 0 to 10" (slider role)
3. "Last effort score: 6" (status)
4. "Performance score, slider, current value 0, range 0 to 10" (slider role)
5. "Last performance score: 7" (status)
6. Note prompt and textarea
7. "Save check-in, button" (submit)

**Feedback:**
1. "Feedback -- how others see you" (heading)
2. Big numbers section (effort self-score, rater average, gap; performance self-score, rater average, gap)
3. Perspectives list (each rater: toggle state, name, gap description, scores, badge)
4. Charts (described as "Effort over time, chart" / "Performance over time, chart")
5. AI insight

### 6.5 Touch Targets

All interactive elements: minimum 44x44px touch target with 8px minimum spacing. Rating bars: 72px wide. Tab bar buttons: 72px min-width. Submit buttons: full width, 48px effective height (14px padding + content).

### 6.6 Cognitive

- No time-limited interactions. Check-ins can be completed any time during the open window.
- Error messages always explain the fix.
- Three-tab architecture ensures no single screen exceeds manageable complexity.
- Scale markers on check-in bars provide orientation before, during, and after input.

---

## 7. DELIBERATE EXCLUSIONS

These features were explicitly designed, tested, and killed during prototyping. They are documented here so future designers do not re-introduce them.

| Excluded | Why It Was Killed |
|----------|-------------------|
| **The Reveal (card flip micro-flow)** | Designed as a three-screen sequence with card flips, glow effects, breathing animations, and a reflection prompt. Replaced by the simpler, more direct approach: new feedback appears as a highlighted "NEW" badge on the rater's row in the Feedback tab. The notification navigates directly there. The data IS the reveal. The reflection prompt was eliminated because the AI insight does this job better. |
| **The Portrait (radial behavioral visualization)** | Abstract encoding -- each week as a radial segment shaped by effort/performance ratio -- was not intuitive. Marc's response: "Makes no sense." Replaced by the Growth Story: a structured, immediately legible cycle report with comparison tables, line charts, quotes, and AI narrative. |
| **The River (dual-band flowing visualization)** | Visually striking but harder to read than standard line charts. Replaced by two stacked small-multiple charts (effort above, performance below) on both Progress and Feedback. Consistency and legibility over novelty. |
| **The Mirror (mirrored-bar gap visualization)** | Julie Zhuo's concept: self on left, stakeholder on right, facing horizontal bars. Failed because it aggregated all stakeholders into one voice. Individual rater data is what matters. Replaced by the Perception Field with per-rater toggle switches. |
| **Dimension toggle (segmented control)** | A pill-shaped toggle between Effort and Performance for a single chart. Eliminated by using two stacked charts instead. No toggle needed when both are always visible. |
| **Reflection prompt on reveal** | "What might explain the difference?" was a text input shown after seeing stakeholder scores. Cut because the AI insight section already surfaces these patterns better, with specific rater names and data-driven observations. |
| **Separate check-in screen** | Originally a distinct route (`/individual/checkin`). Inlined into the Today tab. One screen, zero extra taps. |
| **Hover-to-spotlight interaction** | Used to highlight individual raters on the Feedback chart by hovering. Too implicit -- users couldn't tell what state they were in. Replaced by explicit toggle switches with clear on/off visual state. |
| **Glass morphism** | Added visual complexity without functional value. Solid surfaces are clearer and more performant. |
| **Gamification badges** | Patronizing for executive audience. Streaks acknowledged quietly with a counter, not a badge. |
| **Emoji as UI elements** | Undermine premium positioning. Replaced with typographic treatments or minimal SVG icons. |
| **Dashboard view** | Executive coaching is not a monitoring activity. It is a reflective practice. Three focused lenses replaced the monolithic dashboard. |
| **Confetti / celebration animations** | A coaching insight is not a game achievement. Acknowledgment feels like a nod from a respected colleague, not a party. |
| **Sound** | Coaching is private. The app never makes noise. |
| **Toast notifications for routine saves** | The state change IS the confirmation. Toasts reserved for errors only. |
| **"Save for Later" on check-ins** | Two save buttons create a decision point that is also an exit point. One action: Done. |
| **Floating score number inside/above bar** | Originally the score appeared as a large number hovering above the thumb during drag. Replaced by a fixed readout zone below the bar. The bar is pure material; the reading lives in its own dedicated space. |
| **Staggered animations on content pages** | Growth Story renders immediately. Staggered fade-ins reserved for lists only. Content pages should never make the user wait to read. |
| **Dots as coach signals** | Originally, colored dots (8px circles) indicated client urgency. Replaced by meta text that IS the signal. "Perception gap emerging, 2 days ago" in amber is more informative than a dot. |
| **Rater lines on Progress tab** | Progress shows self-scores only. Self-data = Progress. Rater data = Feedback. Clean separation prevents cognitive overload and keeps each tab's purpose clear. |

---

## 8. IMPLEMENTATION PRIORITY

Phased approach for building in SvelteKit.

### Phase 1: Foundation (Design System + Navigation)
- Implement all design tokens as CSS custom properties
- Build global header component
- Build bottom tab bar with three-tab routing
- Establish screen container pattern (440px / 640px max-width variants)
- Build card component (two variants)
- Build button components (primary, secondary)
- Implement typography classes
- Remove any existing glass morphism utilities
- `@media (prefers-reduced-motion)` rule

### Phase 2: The Three Tabs
- **Today tab:** Identity anchor, week indicator, caught-up state, notification hint, coach nudge
- **Check-in (inlined into Today):** Rating bars with scale markers, thumb, last-score marker, score readout below, note prompt always visible, submit with validation
- **Progress tab:** Big numbers, two stacked line charts (self-only), AI insight card
- **Feedback tab (The Perception Field):** Big numbers with dynamic averages, perspectives list with toggles, two stacked line charts with rater overlays, tooltip system, NEW state, solo mode, AI insight
- **Shared chart renderer:** Canvas-based, HiDPI, bezier curves, tooltip, right-edge labels. One renderer for all charts.

### Phase 3: Stakeholder Experience
- Token-based feedback form
- Rating bars (reuse check-in component)
- Structured qualitative prompts
- Submit validation (both bars required)
- Thank-you confirmation

### Phase 4: Coach Console
- Signal-sorted client list with staggered entry
- Meta text as signal (colored by urgency)
- Session view with Perception Field (reuse Feedback tab component with coach additions: real names, per-rater notes)
- On-demand prep generation

### Phase 5: Growth Story
- Cycle completion trigger
- AI headline + comparison table
- 12-week charts with dashed rater overlays
- Rater quotes section
- AI narrative
- What's Next suggestions
- Share/export (1080x1080 PNG)

### Phase 6: Onboarding
- Two-step flow (Goal + Reviewers)
- Template library
- Deferred stakeholder invitation option
- No initial ratings (first check-in IS the baseline)

### Phase 7: Notifications + System Coherence
- Dark email templates
- Push notification content patterns
- Streak acknowledgment (quiet counter)

---

## 9. ATTRIBUTION

This design specification synthesizes work from:

- **Expert Panel UX Redesign** (`expert-panel-ux-redesign.md`): Tobias Ahlin (micro-interactions, The Pulse), Julie Zhuo (reveal moment, three emotional registers), Giorgia Lupi (data visualization as self-knowledge), Luke Wroblewski (friction reduction, bar input design).
- **The Designer Agent** (iterative prototyping, warm rationalism framework, token system, cinematic screen descriptions).
- **Aesthetic Reference Collection** (`designer-references.md`): Italian Rationalist tradition (Olivetti, Fronzoni, Pintori), Scandinavian democratic warmth (Kenya Hara, Norm Architects), contemporary digital references (Linear, Vercel Geist, Oura Ring, Superhuman).
- **Marc Sagal** (product decisions: individual data over aggregates, kill the reveal, kill the portrait, inline the check-in, plain language, score readout below the bar, no staggered content animations).

---

*The Quiet Room still feels like a private coaching room with warm timber and indirect light. The instruments on the wall are clear: real numbers, real names, real controls. The room is warm. The data is honest. The user is in command.*
