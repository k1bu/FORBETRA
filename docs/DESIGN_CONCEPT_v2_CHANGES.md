# DESIGN CONCEPT v2: Changes from The Quiet Room v1

## Revision Log for "The Quiet Room"

_Revisions based on iterative prototyping sessions -- March 2026_

---

> This document specifies ONLY what changes from the original DESIGN_CONCEPT.md. Everything not mentioned here remains as specified in v1.

---

## 1. FEEDBACK VIEW: The Mirror becomes The Perception Field

### What changed and why

The Mirror (Julie Zhuo's mirrored-bar concept) was replaced during prototyping. Marc was unambiguous: **"The aggregated stakeholder info is much less useful. It's the individual that is most important and interesting."** The Mirror treated all stakeholders as a single averaged voice. The Perception Field treats each rater as a distinct perspective with their own trajectory.

Hover-to-spotlight also failed. It was too implicit, too easy to miss, too ambiguous about state. Marc approved **explicit toggle switches** per rater -- on/off, with clear visual state change.

### The Perception Field -- specification

The Feedback lens is now a single scrolling view with four stacked sections:

**Section 1: Big Numbers**

Two large score pairs at the top of the screen, side by side:

| Column              | Content                                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Left (Effort)       | Your self-score in `data-effort-vivid` at 44px Geist Mono. Below it: the average of active raters at 22px, 0.6 opacity. Below that: gap indicator in Geist Mono 12px, colored by signal semantics. |
| Right (Performance) | Same layout in `data-performance-vivid`.                                                                                                                                                           |

The average and gap update dynamically as raters are toggled on/off. When only one rater is active, the label shifts from "avg of N raters" to that rater's name.

**Section 2: Dimension Toggle**

A segmented control (pill shape, `surface-raised` background) with two options: Effort | Performance. Controls which dimension the chart below displays. The active segment gets a tinted background matching its data color at 12% opacity and vivid text.

This replaces the v1 dual-band River. The River tried to show both dimensions simultaneously, which created visual density without clarity. One dimension at a time, switchable, with the toggle making the current view unambiguous.

**Section 3: The Line Chart**

A canvas-based line chart inside a `surface-raised` card with `border-default`. Shows:

- **Your self-score line**: rendered as a thicker line (2.5px stroke) in the active dimension's vivid color, with 4px dots at each data point
- **Individual rater lines**: each rater gets a distinct color from the rater palette (see token additions below), rendered at 1.5px stroke. Lines are visible only for raters whose toggle is ON. Lines for toggled-off raters are hidden entirely -- no ghost state, no dimming, just absent.
- **Y-axis**: 0-10 scale with gridlines at 2-point intervals, rendered in `border-default`. Score values along the left edge in Geist Mono 9px, `text-muted`.
- **X-axis**: Week labels (W1, W2...) in Geist Mono 9px, `text-muted`.
- **Tooltip on hover/tap**: Appears at the hovered week. Shows week number, then a row per visible rater: color dot + name + score. Your self-score listed first, labeled "You."

The chart container has `cursor: crosshair` and a vertical guide line that follows the cursor position, snapping to the nearest week.

**Section 4: Perspectives List**

Below the chart, a list of all raters. Each rater is a row with:

| Element         | Spec                                                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color dot       | 10px circle in the rater's assigned color                                                                                                                                                                                             |
| Line swatch     | 20x3px rounded bar in the rater's color. Full opacity when active, 0.4 when inactive.                                                                                                                                                 |
| Name            | 14px, weight 500. Weight 600 and full opacity when active; 0.45 opacity when inactive.                                                                                                                                                |
| Gap text        | 11px, `text-tertiary`. Shows alignment status in words: "Closely aligned" / "Slight gap" / "Significant gap." Dimmed to 0.35 opacity when inactive.                                                                                   |
| Scores          | Two small score values (effort and performance for current week) in Geist Mono 15px, colored by dimension. Dimmed when inactive.                                                                                                      |
| Alignment badge | Pill-shaped. "Aligned" (green), "Gap" (amber), or "Attention" (red). Dimmed when inactive.                                                                                                                                            |
| Toggle switch   | 36x20px pill toggle. OFF: `surface-subtle` background with `border-strong`, knob at left in `text-muted`. ON: background tinted to the rater's color at 20% opacity, border in the rater's color, knob at right in the rater's color. |

Row tap behavior: tapping the row itself activates "solo mode" -- isolates that single rater (all others off). Tapping the same row again when it is the only active rater restores all raters. The toggle switch is an independent control for adding/removing individual raters without affecting others.

Show all / Hide all links in the section header provide batch control.

For large teams (>5 raters), the list shows the first 5 by default with a "Show all N perspectives" button (dashed border, `text-tertiary`) to expand the remainder.

**Section 5: AI Insight**

Unchanged from v1 -- editorial text in a `surface-raised` card. But now the insight text should reference the Perception Field data directly: which raters diverge most, whether gaps are closing, and what patterns the AI detects across individual perspectives. The insight should name specific raters when relevant, not just reference aggregate gaps.

### What is removed

- **The Mirror visualization** -- retired entirely. The mirrored-bar metaphor (self on left, stakeholder on right) is replaced by the line chart with per-rater lines.
- **The River visualization on the Feedback lens** -- the River (dual-band flowing shape) remains available on the Progress lens for self-score trends, but it no longer appears on Feedback. Feedback is now exclusively about other people's perspectives compared to yours.
- **Hover-to-spotlight interaction** -- replaced by toggle switches. Explicit state > implicit state.

---

## 2. CHECK-IN INPUT: Gradient Bars Get Visible Numbers

### What changed and why

The v1 gradient bars were elegant but failed usability testing. Without scale markers, users could not judge where they were on the 0-10 range. The number that "crystallized at the top" was insufficient -- users wanted to see the full scale context as they dragged.

### Revised check-in bar specification

The gradient bars remain (they are the right gestural metaphor -- "raising" your score), but with three additions:

1. **Scale markers along the bar**: Tick marks at every integer from 0 to 10, positioned along the vertical axis of each bar. Each tick is a 6px horizontal line extending from the right edge of the bar, in `text-muted` (0.20 opacity). The corresponding number appears to the right of the tick in Geist Mono at 10px, `text-muted`.

2. **Large floating number**: As the user drags, the current value appears in Geist Mono at 40px, positioned just above the thumb/finger position, offset 24px upward to avoid occlusion. This number moves with the drag gesture. It uses the dimension's vivid color. On release, it animates (200ms, ease-out) to settle at the top of the bar as in v1.

3. **Snap feedback**: The bar snaps to integer values. As the drag crosses each integer threshold, a subtle haptic tick fires (UIImpactFeedbackGenerator .light, rigid style) and the floating number updates. This gives tactile confirmation of each unit.

The anchor labels ("Significant effort" at 7, "Full commitment" at 9) still appear AFTER the score is set, as in v1. The scale markers provide orientation during input; the labels provide meaning after commitment.

### Stakeholder input consistency

Stakeholders receive the same revised gradient bars. The interaction language is identical across all user roles, as specified in v1 -- now with the scale markers and floating number included.

---

## 3. THE PORTRAIT: From Abstract Radial to Legible Cycle Report

### What changed and why

Marc's response to the radial Behavioral Portrait was direct: "Makes no sense." The radial/petal visualization -- where week shapes encode effort/performance ratios and opacity encodes completion -- was too abstract. Users could not read it without a legend, and even with a legend, the encoding was not intuitive. A "trained eye" could read it, but this is a coaching product for executives, not a data visualization portfolio piece.

### Recommendation: Replace with a structured Cycle Report

The Portrait concept (a single shareable artifact summarizing a cycle) is worth preserving. The encoding should change from abstract radial geometry to a composed editorial page that is immediately legible.

**The Cycle Report -- specification**

A full-screen scrolling view with five sections:

**Section 1: Headline summary**

64px top padding. The identity anchor in Display register (32px). Below it, a single-sentence AI-generated summary of the cycle in Body register, `text-secondary`. Example: "Over 12 weeks, your effort was consistently high while stakeholder perception of your performance grew steadily closer to your own view."

**Section 2: The Journey (line chart)**

A landscape-oriented line chart showing the full cycle. Your effort and performance lines in their data colors. All stakeholder lines overlaid as a cluster of thin lines (the Perception Field chart, but for the full cycle). This is the same visualization language the user already understands from the weekly Feedback view -- no new encoding to learn. Below the chart, a row of key moments annotated: "Week 4: largest gap" / "Week 9: closest alignment" / "Week 12: strongest performance score."

**Section 3: Big numbers for the cycle**

A grid of four key metrics, each rendered as a large Geist Mono number with a label:

| Metric               | Example                            |
| -------------------- | ---------------------------------- |
| Average effort       | 7.2                                |
| Average performance  | 6.4                                |
| Perception gap trend | Narrowing (with directional arrow) |
| Completion rate      | 92%                                |

**Section 4: Key insight**

AI-generated paragraph (2-3 sentences) identifying the most meaningful pattern from the cycle. Editorial treatment: Body register, line-height 1.7, max-width 580px. Key phrases highlighted in `text-primary`.

**Section 5: Share**

"Share your journey" button. Exports a 1080x1080 PNG containing: the journey line chart, the four key metrics, and the identity anchor text. Dark background, "Forbetra" wordmark faintly at bottom. The shared image is legible to anyone -- no decoder ring required.

### What is removed

- **The radial/petal visualization** -- retired
- **The drawing animation** (3-second clockwise build) -- retired
- **D3.js dependency for the portrait** -- no longer needed; the line chart uses the same canvas renderer as the Perception Field

### What is preserved

- The concept of a cycle-completion artifact worth sharing
- The identity anchor as the centerpiece
- The emotional weight of the moment (this is still a "turn around on the trail" experience)
- The 64px top padding ceremony

---

## 4. NAVIGATION: The Three-Lens Model -- Confirmed with One Revision

### What stays

The three-lens model (Today / Progress / Feedback) is confirmed. The principle -- each lens answers one question -- proved correct during prototyping.

### What changes

**Progress lens revision**: The Progress lens in v1 specified three sections: The River, This Week's Numbers, and AI Insight. Based on prototyping, Marc's preferred layout pattern is:

1. **Big numbers first** -- effort and performance scores at 44px Geist Mono, with trend indicators. These are the first thing you see.
2. **Line chart second** -- your self-scores over time (effort and performance as two lines). This is simpler than The River: two clean lines on a standard chart, not a dual-band flowing shape. The River was visually striking but harder to read than a plain line chart.
3. **AI insight third** -- editorial text, unchanged from v1.

The River visualization is retired from the Progress lens. It is replaced by a standard multi-line chart with the same canvas renderer used in the Perception Field. Visual consistency across lenses: the user learns one chart language, not two.

---

## 5. COACH VIEW: The Perception Field for Coaches

### What changes

The v1 coach Session View specified: prep brief, The River visualization, and coach notes. Two revisions:

**1. The Perception Field replaces The River in the Session View**

Coaches see the same Perception Field that the individual sees on their Feedback lens -- the same toggle-based per-rater line chart, the same perspectives list, the same big numbers. This gives coaches the ability to prepare for conversations about specific stakeholder relationships ("Sarah rates your effort consistently higher than David -- what do you think explains that?").

The Perception Field in the coach view has one addition: a "Coach notes" column alongside each rater in the perspectives list. A small text icon indicates whether the coach has annotated a specific rater relationship. Tapping opens a per-rater note field.

**2. The coach can see what the individual cannot**

Coaches see rater names on the Perception Field. The individual may see anonymized labels (Rater 1, Rater 2) depending on the cycle configuration. The coach always sees real names. This asymmetry is the entire point of the coaching relationship -- the coach holds context the individual does not.

### What stays

- The signal-sorted client list (attention > divergent > active > waiting)
- The prep brief as editorial text
- Coach notes with auto-save
- On-demand prep generation
- The Portfolio View

---

## 6. DESIGN TOKENS: Updates from Prototyping

### New tokens: Rater Color Palette

The Perception Field requires a palette of 12+ distinct, visually separable colors that all pass AA contrast on `surface-base`. These are assigned to raters in order and remain stable throughout a cycle.

| Token      | Value   | Contrast on base |
| ---------- | ------- | ---------------- |
| `rater-1`  | #f472b6 | 4.5:1            |
| `rater-2`  | #60a5fa | 5.1:1            |
| `rater-3`  | #a78bfa | 4.6:1            |
| `rater-4`  | #2dd4bf | 6.8:1            |
| `rater-5`  | #fbbf24 | 8.4:1            |
| `rater-6`  | #fb923c | 5.7:1            |
| `rater-7`  | #a3e635 | 8.9:1            |
| `rater-8`  | #22d3ee | 7.2:1            |
| `rater-9`  | #e879f9 | 4.8:1            |
| `rater-10` | #f87171 | 4.6:1            |
| `rater-11` | #34d399 | 6.4:1            |
| `rater-12` | #818cf8 | 4.5:1            |

These colors are deliberately high-chroma and diverse in hue. On the dark stone background, they read as distinct "voices" -- each perspective has its own visual identity. The palette was tested in the prototype-field.html prototype and confirmed to be legible even when 12 lines overlap on the chart.

Assignment rule: colors are assigned by stakeholder creation order and remain fixed for the duration of the relationship. If a rater is removed and re-added, they get their original color back.

### Revised token: accent color

| Token    | v1 Value | v2 Value | Change                     |
| -------- | -------- | -------- | -------------------------- |
| `accent` | #d4a06a  | #d4a06a  | No change to the hex value |

The accent color was already shifted from `#e8a04a` to `#d4a06a` in v1. Prototyping confirmed this was correct -- the lower-saturation brass reads as premium without competing with the rater palette. No further revision needed.

### Typography: no changes

Plus Jakarta Sans + Geist Mono at the six-size scale (11, 13, 15, 20, 25, 32) confirmed during prototyping. No revisions.

### Spacing: no changes

The 8-point grid and 64px ceremony spacing confirmed. No revisions.

### Cards: no changes

The two-variant card system (surface / interactive) confirmed. No revisions.

### Animation: one addition

| Token           | Value | Usage                                                               |
| --------------- | ----- | ------------------------------------------------------------------- |
| `duration-snap` | 100ms | Haptic-synchronized snap feedback during drag input (check-in bars) |

This is faster than `duration-fast` (150ms) because it must feel instantaneous to match the haptic tick. Used exclusively for the score-snap micro-interaction on check-in gradient bars.

---

## 7. REVISED EXCLUSIONS

### Newly excluded

| Excluded Element                                | Reason                                                                                                                                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The River (dual-band flowing visualization)** | Visually impressive but harder to read than a standard line chart. Replaced by plain multi-line charts on both Progress and Feedback lenses. Consistency and legibility over novelty. |
| **The Mirror (mirrored-bar gap visualization)** | Aggregated stakeholder data is less useful than individual rater data. Replaced by the Perception Field's per-rater line chart with toggles.                                          |
| **The radial Behavioral Portrait**              | Abstract encoding was not intuitive. Replaced by a structured Cycle Report with immediately legible charts and numbers.                                                               |
| **Hover-to-spotlight interaction**              | Too implicit. Users could not tell what state they were in. Replaced by explicit toggle switches with clear on/off visual state.                                                      |

### Newly included (reversals from v1 exclusions)

None. All v1 exclusions remain in effect.

---

## 8. REVISED IMPLEMENTATION PRIORITY

The implementation sequence changes to reflect the Perception Field as the signature feature:

**Phase 1: Foundation** -- unchanged from v1

**Phase 2: The Three Lenses**

- Build Today lens -- unchanged
- Build Progress lens -- big numbers + standard line chart + AI insight (simpler than v1 River)
- Build Feedback lens -- **The Perception Field** (toggle-based per-rater line chart, perspectives list, big numbers, AI insight). This is the most complex new component and the product's signature interaction.

**Phase 3: Signature Moments**

- The revised gradient-bar check-in (with scale markers, floating number, snap haptics)
- The Pulse -- unchanged
- The Reveal -- unchanged
- Streak counter -- unchanged

**Phase 4: Coach Console**

- Signal-sorted client list -- unchanged
- Session view with **Perception Field** (reuse the Feedback lens component with coach-specific additions: real names, per-rater notes)
- On-demand prep -- unchanged
- Portfolio view -- unchanged

**Phase 5: The Cycle Report** (replaces The Portrait)

- Headline summary + journey line chart + big numbers + AI insight + share export
- Simpler to implement than the D3 radial -- uses the same chart renderer as Progress and Feedback

**Phase 6: Onboarding** -- unchanged from v1

---

## 9. SUMMARY OF DESIGN PRINCIPLES REINFORCED

These are not new principles. They are the ones that prototyping proved most load-bearing:

1. **Individual data over aggregates.** Every rater is a person with a name, a color, and a trajectory. Averages are supplementary, not primary. The product's value is in the specificity of each perspective.

2. **Explicit controls over implicit interactions.** If the user cannot tell what state the interface is in by looking at it, the interaction pattern has failed. Toggles > hovers. Labels > color alone. Numbers > shapes.

3. **Visible numbers always.** Every visualization shows actual numeric scores. Charts have labeled axes. Scores are rendered in monospace at sizes that command attention. The data IS the design -- do not abstract it behind encodings that require decoding.

4. **One chart language.** The line chart (time on x-axis, 0-10 on y-axis, colored lines per data source) is the single visualization grammar for the entire product. Progress, Feedback, Cycle Report, and Coach views all use the same chart type with the same renderer. Users learn it once.

5. **Warm rationalism holds.** Dark stone surfaces, brass and slate data colors, Plus Jakarta Sans, Geist Mono for numbers, the 64px ceremony, the editorial AI insight treatment -- all confirmed. The aesthetic is correct. The revisions are structural (what data to show, how to interact with it), not atmospheric.

---

_The Quiet Room still feels like a private coaching room with warm timber and indirect light. The difference in v2 is that the instruments on the wall are clearer: real numbers, real names, real controls. The room is warm. The data is honest. The user is in command._
