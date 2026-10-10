# ui_spec.md — Download Organizer Pro
## Design Tokens, Screen Layouts & Component Specs

> Read this file whenever building any UI element in popup.html or popup.js.

---

## Design Tokens

```css
/* Backgrounds */
--bg-primary:    #353545;   /* popup root background */
--bg-secondary:  #2a2a3a;   /* inputs, secondary surfaces */
--bg-card:       #1e1e2e;   /* elevated cards, tooltips */

/* Accent */
--accent:        #6366f1;   /* primary buttons, toggle on, focus rings */
--accent-hover:  #4f46e5;
--accent-active: #4338ca;

/* Status */
--success:       #22c55e;   /* toast, Pro badge, valid state */
--error:         #ef4444;   /* validation errors, invalid key */
--warning:       #f59e0b;   /* optional: upgrade nudge */

/* Text */
--text-primary:   #ffffff;
--text-secondary: #94a3b8;
--text-muted:     #475569;

/* Borders */
--border:         #1a1a26;
--border-focus:   #6366f1;

/* Radius */
--radius-card:    8px;
--radius-input:   6px;
--radius-pill:    20px;
--radius-btn:     8px;

/* Typography */
--font: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Transitions */
--transition: 0.15s ease;
```

---

## Popup Dimensions

- Width: `340px` (fixed — set on body)
- Height: auto (grows with content, no fixed height)
- Padding: `16px` on all sides
- No scrollbars — all content fits naturally

---

## Screen Architecture

Three screens inside one popup.html file.
Only one screen is visible at a time. Toggle visibility with JS via `showScreen(id)`.

```html
<div id="screen-main">...</div>
<div id="screen-stats" hidden>...</div>
<div id="screen-license" hidden>...</div>
```

---

## Screen 1 — Main (default)

```
┌───────────────────────────────────┐  bg: #353545
│                                   │
│  [📁 icon]  Download Organizer    │  font-size: 14px, bold, #ffffff
│             Pro                   │
│             Auto-sort files       │  font-size: 11px, #94a3b8
│                        [toggle]   │  right-aligned
│                                   │
├───────────────────────────────────┤  border: 1px #1a1a26
│                                   │
│  FREE PLAN    [Upgrade to Pro →]  │  if free: show this banner
│  — OR —                           │
│  ✓ PRO ACTIVE                     │  if pro: show this instead, #22c55e
│                                   │
├───────────────────────────────────┤
│                                   │
│  SORTING FOLDERS          10px    │  section label: 10px, uppercase,
│                           gap     │  letter-spacing: 0.08em, #475569
│  🖼  Images    [ Images     ]     │  free — input enabled
│  🎬  Videos    [ Videos     ]     │  free — input enabled
│  📄  Documents [ Documents  ]     │  free — input enabled
│  🎵  Music     [ Music   🔒 ]     │  pro only — locked if free
│  📦  Archives  [ Archives 🔒]     │  pro only — locked if free
│  💻  Code      [ Code     🔒]     │  pro only — locked if free
│                                   │
│  [☐] Date subfolders  PRO        │  checkbox — locked if free
│       e.g. Images/2026/October    │  hint text, #475569, 10px
│                                   │
├───────────────────────────────────┤
│  [      Save Settings      ]      │  full-width button, #6366f1
│  [  Activate License Key   ]      │  full-width button, bg: #2a2a3a
│  [  View Stats  ] (Pro only)      │  shown only if isPro
│                                   │
└───────────────────────────────────┘
```

---

## Screen 2 — Stats (Pro only)

```
┌───────────────────────────────────┐
│  ← Back          STATS            │  back link left, title right-ish
│                                   │
│  Total Files Sorted               │  label, #94a3b8, 11px
│  247                              │  number, #ffffff, 28px bold
│                                   │
├───────────────────────────────────┤
│  🖼  Images         124           │
│  🎬  Videos          38           │
│  📄  Documents       55           │
│  🎵  Music           12           │
│  📦  Archives        10           │
│  💻  Code             8           │  each row: icon + label + count
│                                   │  border-bottom: 1px #1a1a26
├───────────────────────────────────┤
│  [      Reset Stats        ]      │  full-width, bg: #2a2a3a, #ef4444 text
└───────────────────────────────────┘
```

---

## Screen 3 — License Activation

```
┌───────────────────────────────────┐
│  ← Back      ACTIVATE PRO         │
│                                   │
│  Upgrade once. Sort forever.      │  tagline, #94a3b8, 13px
│                                   │
│  ┌────────────────┐ ┌───────────┐ │
│  │ $4.99 One-Time │ │$1.99 /mo  │ │  two buttons side-by-side
│  └────────────────┘ └───────────┘ │  both: #6366f1, white text
│                                   │
│  ──────── Already have a key? ──── │  divider with text, #475569
│                                   │
│  [ Enter your license key...    ] │  text input, bg: #2a2a3a
│                                   │
│  [     Activate License        ]  │  full-width, #6366f1
│                                   │
│  ● Invalid or expired key.        │  error state, #ef4444, 12px
│    (hidden by default)            │
│                                   │
│  ✓ Pro activated! Welcome.        │  success state, #22c55e, 12px
│    (hidden by default)            │
│                                   │
└───────────────────────────────────┘
```

---

## Component Specs

### Toggle Switch
```css
/* Track */
width: 40px; height: 22px; border-radius: 22px;
background: #334155 (off) | #6366f1 (on);
transition: background 0.2s;

/* Knob (::before pseudo) */
width: 16px; height: 16px; border-radius: 50%;
background: #ffffff;
left: 3px; top: 3px;
transform: translateX(0) (off) | translateX(18px) (on);
transition: transform 0.2s;
```

### Folder Input
```css
background: #2a2a3a;
border: 1px solid #1a1a26;
border-radius: 6px;
padding: 5px 8px;
font-size: 12px;
color: #ffffff;
outline: none;
transition: border-color 0.15s;

:focus { border-color: #6366f1; }
```

### Locked Input (Pro gate)
```css
opacity: 0.4;
cursor: not-allowed;
pointer-events: none;
```
Add 🔒 icon or a "PRO" pill badge (`background: #6366f1, border-radius: 20px, padding: 2px 6px, font-size: 10px`) to the right of the input.

### Primary Button
```css
background: #6366f1;
color: #ffffff;
border: none;
border-radius: 8px;
padding: 9px 16px;
font-size: 13px;
font-weight: 600;
cursor: pointer;
width: 100%;
transition: background 0.15s;

:hover  { background: #4f46e5; }
:active { background: #4338ca; }
```

### Secondary Button
```css
background: #2a2a3a;
color: #94a3b8;
border: 1px solid #1a1a26;
/* same radius, padding, transition as primary */
```

### Category Row
```css
display: flex;
align-items: center;
gap: 10px;
padding: 7px 0;
border-bottom: 1px solid #1a1a26;

/* icon: font-size 15px, width 22px, text-align center */
/* label: font-size 12px, color #94a3b8, width 72px, flex-shrink 0 */
/* input: flex 1 */
```

### Toast Notification
```css
position: fixed;
bottom: 12px;
left: 50%;
transform: translateX(-50%);
background: #22c55e;
color: #ffffff;
padding: 5px 14px;
border-radius: 20px;
font-size: 12px;
font-weight: 500;
white-space: nowrap;
opacity: 0;           /* hidden by default */
pointer-events: none;
transition: opacity 0.2s;

.visible { opacity: 1; }
```
Show for 2000ms then hide. Use setTimeout to remove `.visible` class.

### Section Label
```css
font-size: 10px;
font-weight: 700;
text-transform: uppercase;
letter-spacing: 0.08em;
color: #475569;
margin-bottom: 10px;
```

### Back Link
```css
font-size: 12px;
color: #6366f1;
cursor: pointer;
display: inline-flex;
align-items: center;
gap: 4px;
```
