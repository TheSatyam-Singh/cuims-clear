# CUIMS Glass Design System

## 1. Creative North Star

**Aurora Glass.** CUIMS Glass should feel like the reference fitness concept the
student pinned: a vibrant wash of colour behind floating frosted tiles, one big
hero number, and a floating dock below. The interface is luminous and tactile —
blurred glass, glowing accents, bold statistics. It is unmistakably crafted,
never institutional, and never a flat clone of the university portal.

## 2. Product Scene

A student opens the extension between classes or from a hostel desk, often in a hurry and
on an ordinary laptop display. They need to confirm that their login is saved, silence the
two known interruption categories, and enter CUIMS or the LMS in a few seconds. The popup
must remain legible at a glance and trustworthy around credentials. On LMS pages the same
quiet system is applied as a light skin: a courses directory that pairs syllabus
materials with semester work, and a thin toolbar with an original-view escape. Native
activities, submissions, notifications, and account controls stay in place.

## 3. UX Architecture

The popup has four zones in one continuous surface: identity, destinations,
saved-login fields, and automation/privacy. “Open CUIMS” and “Open LMS” sit
directly under the header so they are reachable without scrolling. “Open CUIMS”
is the primary action. “Open LMS” is the secondary action and uses the
university’s own signed-in launch path.
Saving settings is explicit. Credential deletion stays visible and local. Controls use
native semantics and keyboard behavior; state is never conveyed through color alone.

## 4. Visual System

- Canvas: `#f2f3ee`; surface: `#ffffff`; ink: `#181a17`; muted ink: `#63685f`.
- Borders: `#d6dad1`; strong borders: `#aeb4aa`. Hairlines carry structure; every
  edge gets a faint specular highlight, as if light catches the glass.
- Accent: `#b7f34a` with `#18200d` text; focus: `#527f17`; success: `#28633a`.
  The accent also blooms across the canvas as bold aurora light — with good and
  warn alongside it — and glows behind the primary action.
- Type: Avenir Next when available, then Avenir, Inter, system sans-serif.
  Eyebrow labels are small, wide-tracked, and uppercase; the title is bold
  (22px) with tight spacing. Statistics are extra-bold with tight tracking —
  the overall attendance reads as a 48px hero number. Tabular numerals wherever
  numbers compare.
- Glass: surfaces are the theme colour at 40–50% via `color-mix`, blurred
  14–28px with boosted saturation, edged in translucent white hairlines. No
  theme ships translucency; the stylesheet derives it, so all 32 themes get the
  look automatically. Meaning tones stay mostly solid to preserve the contrast
  the theme engine guarantees.
- Radius: 22px for tiles, 16px for controls and inputs, full-round for pills,
  meters, switches, and the dock. Soft, continuous curvature throughout.
- Elevation: depth comes from blur and light — ambient washes behind, soft
  shadows under floating tiles, and one glowing dock. Inner top highlights give
  every surface its edge light.
- Navigation: a floating frosted dock pinned to the bottom with four tabs; the
  active tab is a bright pill. The scrollable pane floats above it.
- Spacing: 4px base rhythm with 12px, 16px, 20px, and 24px as primary intervals.
  Views breathe at 16px with 12px gaps between cards.
- Motion: only short state feedback; remove it when reduced motion is requested.

## 5. Component Language

The identity mark is a dark glass tile cut by two lime forward slashes, crossed
by a specular sweep: progress without institutional branding. Navigation lives
in a floating frosted dock; the active tab is a bright pill, the rest quiet icons.

Inputs are deep frosted wells with soft corners. Switches are glass tracks with
glossy knobs that light up in accent when on. The primary action is a luminous
accent bar with a sheen and a strong glow; secondary actions are frosted glass
with hairlines. The security state reads as a small glass chip with a glowing
dot. Destructive local-data removal is an understated text action that only
raises its voice (a soft red fill) while it asks for confirmation.

Attendance leads with a hero tile: the overall number at billboard size over a
glowing meter, then the goal switch, today, leave, and frosted subject rows.
Meaning still arrives through the tone rail, the meter, and words. Today’s
planner rows are clear glass until hovered; only verdict pills keep their soft
fills. The LMS clear view follows the same language: a frosted toolbar, soft
link cards with edge light, and hairline course rows.

## 6. Accessibility & Content

Target WCAG AA contrast, visible `:focus-visible` rings, 44px primary targets, and logical
tab order. Labels remain visible above fields. Password visibility has an accessible name
that updates with state. Status messages use a polite live region. Copy is short, direct,
and peer-built: no hype, no university voice, and no claim that CAPTCHA is bypassed.
