# Chest Pain vs Indigestion — Healthcare Motion Graphics Plan (v2)

- **Audio:** `Generated Audio October 07, 2026 - 11_44AM.wav` (97.7s), timed transcript in `voiceover.srt`
- **Format:** 1920×1080, 16:9, 30fps, about 2,930 frames, built in Remotion
- **Direction:** a flat 2.5D healthcare explainer, in the style of hospital patient-education and health-insurer explainers. **Illustrations carry the story.** On-screen text is limited to short labels (1–3 words) attached to illustrations, plus the captions.
- **Continuity rule:** the camera never "leaves." Every scene grows out of the previous one through a morph, zoom, match cut or wipe. There are no plain fades to blank.

---

## 1. Visual style

| | |
|---|---|
| Look | Flat vector illustrations with soft gradients, rounded shapes, subtle inner shadows and a light paper grain. A 2.5D feel comes from parallax layers. |
| Background | A soft clinical gradient (`#EAF4F4` to `#F7FAFB`), with faint floating medical-cross and plus-sign particles drifting slowly |
| Palette | Teal `#1F9E9A` (care/calm), deep navy `#1C2A44` (outlines/ink), heart red `#E04F5F`, artery coral `#F28C82`, stomach amber `#F2A541`, acid green-yellow `#C9D85B`, alert red `#D7263D` (only for 000) |
| Type | Manrope or Inter, used only for labels, section chips and captions |
| Motion | Spring physics (damping around 14), with 3–6 frame overlapping stagger. Organs "breathe" with a ±2% scale idle loop, and an ECG line pulses at about 70 bpm throughout. |
| Captions | A rounded pill inside the reserved caption zone (see 1b). The current word is highlighted in teal, and medical keywords (angina, 000, GP) in red or teal. |

## 1b. Layout rules (strict)

The frame is divided into fixed zones, and nothing crosses between them.

```
┌──────────────────────────────────────────────────────────┐  y=0
│  CHIP ZONE  (section chip, top-left only)       h=110    │
├──────────────────────────────────────────────────────────┤  y=110
│                                                          │
│  STAGE ZONE  illustrations + labels only        h=740    │
│  (side margins 120px)                                    │
│                                                          │
├──────────────────────────────────────────────────────────┤  y=850
│  CAPTION ZONE  captions only, nothing else      h=230    │
└──────────────────────────────────────────────────────────┘  y=1080
```

1. **The caption zone is reserved for captions.** No illustration, label, particle, ground shadow, prop or transition element ever enters y > 850. Captions never leave this zone. It holds at most 2 lines, centred, inside a solid pill background so the background never shows through behind the text.
2. **No text on top of illustrations.** Labels (e.g. "Angina," "arm," "See your GP") are placed in empty stage space and connected to their element with a thin leader line and dot. A label's box keeps at least 24px clearance from every illustration's bounding box.
3. **Each scene reserves a label lane.** Every scene is composed with a fixed illustration area and a separate label lane (usually a left or right column, or a top strip within the stage). Illustrations scale or shift to make room. Labels never squeeze in over them.
4. **Split screens:** each panel has its own label strip at the top of the panel. The centre divider stays clear.
5. **The chip zone holds only the section chip.** It's empty when there's no chip.
6. **Full-screen 000 cards:** the phone illustration takes the left half of the stage and the "000" text the right half, with a clear gutter between them. Captions stay in their zone as usual.
7. **During transitions,** elements may pass behind other elements, but never behind or over text. Labels fade out *before* their illustration starts moving.

**Enforcement:** every illustration and label component reports its bounding box. A dev-only overlay in Remotion Studio draws the zones and flags any text box that intersects an illustration box or leaves its zone (a red outline). A check script steps through every 5th frame and fails the build if anything collides.

## 2. Illustration library (built once as SVG components, reused everywhere)

**Characters**
- **Patient "Sam":** a mid-40s adult, gender-neutral design, with switchable poses: eating, hand on chest, sitting, lying down, bending, on the phone
- **Doctor / GP:** with a white coat, stethoscope and clipboard
- **Paramedic + ambulance:** a side-view ambulance with spinning lights

**Anatomy**
- **Torso X-ray view:** a semi-transparent silhouette with visible organs (heart, lungs, oesophagus, stomach, ribcage outline)
- **Anatomical heart:** stylised with coronary arteries, beats on a loop, can "squeeze" (compress and outline glow)
- **Coronary artery cross-section:** with red blood cell particles flowing; plaque can grow
- **Stomach + oesophagus:** with acid bubbles and a rising "burn" gradient
- **Lungs:** inflate and deflate; can switch to "short breath" (fast and shallow)
- **Nerve and pain-pathway lines:** glowing lines that travel from the chest to the arm, neck, jaw and back

**Symptom icons** (illustrated badges, not flat glyphs)
- lungs with a wind gust (breathlessness), a face with sweat drops (cold sweat), a queasy face with swirl (nausea), a head with orbiting stars (dizziness), a fire/flame on the chest (burn), a lemon or sour face (sour taste), a squeezing fist (pressure), a weight/kettlebell (heaviness)

**Props**
- a dinner plate with a big meal, a phone with "000" on the dial, a 10-minute stopwatch, a crossed-out car key/car, a calendar with repeating marks, a stethoscope, an ECG monitor, a clipboard, a share/send icon

## 3. Transition toolkit

| Name | Use |
|---|---|
| **Zoom-through** | The camera pushes into an organ, and its interior becomes the next scene (heart into artery) |
| **Morph** | A shape interpolates into the next (pulsing ring into heart; ECG line into a divider) |
| **Match cut** | The same object stays in the same screen position while its context changes (Sam's chest to the X-ray torso) |
| **Circle reveal** | An expanding circle from an element, used for the red 000 cards |
| **Liquid / blood-cell wipe** | A wave of red cells flows across the screen to change scene |
| **Split slide** | The screen divides along the ECG line into two halves |
| **Camera pan** | A long horizontal pan across one connected illustration "world" |

---

## 4. Scene-by-scene

### Act 1: Hook (0:00–0:15)

**S1 · 0:00–0:04 · "Chest tightness after a meal is something most of us brush off."**
Sam sits at a table with a big plate of food (parallax: table, Sam, background). Sam leans back, full, then puts a hand on their chest. A soft amber pulse ring appears under the hand. Sam's other hand gives a small "brush off" wave.
→ *Transition:* **match cut**. The camera pushes into Sam's chest and the body becomes the **X-ray torso**.

**S2 · 0:04–0:10 · "Usually it's just indigestion, but sometimes it's your heart asking for help."**
Inside the X-ray torso, the **stomach** glows amber with bubbling acid on "indigestion." On "but sometimes," the glow travels upward to the **heart**, which beats harder, glows red and sends out a small "SOS" ripple. An ECG line runs across the bottom.
→ *Transition:* the ECG line **morphs** into a horizontal divider.

**S3 · 0:10–0:15 · "In the next two minutes, I'll show you how to tell the difference. Stick around."**
A split composition: a stomach illustration on the left, a heart on the right, and a "?" coin flipping between them. A small stopwatch icon ticks (the "two minutes"). On "stick around," three medical icons (ambulance, artery, clipboard) line up as a mini "what's coming" timeline.
→ *Transition:* the camera **zooms into** the ambulance icon.

### Act 2: Emergency signs (0:15–0:32)

**S4 · 0:15–0:17 · "First, the emergency signs."**
The ambulance icon becomes a full ambulance driving in from the left with its lights spinning. A chip reads **01 · Emergency signs**. The red/blue light sweep tints the background.
→ *Transition:* the light sweep **wipes** to a clean torso scene.

**S5 · 0:17–0:23 · "Pressure or pain in your chest that spreads to your arm, neck, jaw, or back."**
A front-view figure (Sam, outlined with an X-ray overlay). The heart glows red, and glowing **pain-pathway lines** travel outward, each synced to its word:
- "arm" → a line runs down the left arm and the arm tints red
- "neck" → it travels up the neck
- "jaw" → the jaw outline lights up
- "back" → the figure rotates 3/4 (2.5D turn) to show the upper back glowing

The figure sits centre-left. Labels (arm · neck · jaw · back) appear one by one in a **right-hand label column**, each joined to its body area by a leader line. No text touches the figure.
→ *Transition:* the figure scales down to the left; space opens on the right.

**S6 · 0:23–0:28 · "Shortness of breath, a cold sweat, nausea, dizziness."**
Four illustrated badges pop out of Sam in an arc, one per word:
- **Lungs** deflating fast with wind lines
- **Sweat drops** falling from Sam's forehead
- **Stomach** with a queasy swirl
- **Head** with orbiting stars as the figure wobbles slightly

Each badge makes a soft "bloop."
→ *Transition:* the four badges collapse into a single **phone**.

**S7 · 0:28–0:31 · "Any of these, call triple zero now."**
A **circle-reveal** in alert red from the phone. A big phone illustration dials **0 · 0 · 0** with key presses synced to "triple zero," and signal waves pulse out. A small ambulance races across the bottom edge. This is the one deliberately urgent, high-contrast moment.
→ *Transition:* the red circle **contracts** back into a blood cell, and the background turns calm teal.

### Act 3: Why meals matter (0:32–0:46)

**S8 · 0:32–0:34 · "So why would eating affect your heart?"**
A chip reads **02 · Why meals matter**. The plate from S1 returns, sliding in, with a small line drawing connecting it to a heart icon by a "?" path.
→ *Transition:* the camera **pans down** into a full-body circulation diagram.

**S9 · 0:34–0:40 · "After a big meal, extra blood goes to your gut, so your heart has to work harder."**
A **circulation map**: heart at the top, gut at the bottom, vessels connecting them. Red blood-cell particles flow, and on "extra blood goes to your gut" most of them redirect downward to the digestive tract, which glows. On "heart has to work harder," the heart beats faster, the ECG speeds up, and a small effort meter (gauge) rises into orange.
→ *Transition:* **zoom-through** into one coronary artery on the heart.

**S10 · 0:40–0:46 · "If the arteries around your heart are narrowed, it can't keep up. That's called angina."**
Inside the **artery**: a tunnel view with blood cells flowing toward the camera. Yellow **plaque** builds up on the walls and narrows the passage, so cells bunch up and slow. Pull back out to the heart: a section of heart muscle dims slightly with a pain spark. On "angina," the heart shifts left and the **Angina** tag appears in the clear space to its right, joined by a leader line.
→ *Transition:* the heart moves right, and an **ECG line splits** the screen vertically.

### Act 4: Tell them apart (0:46–1:06)

**S11 · 0:46–0:48 · "Now how to tell them apart?"**
A chip reads **03 · Tell them apart**. A split screen: on the left, an amber panel with the stomach and oesophagus; on the right, a red panel with the heart. A small balance scale icon wobbles in the centre.

**S12 · 0:48–0:58 · Heartburn (left panel is active, right dims)**
- "Heartburn burns" → animated flames flicker behind the breastbone
- "behind your breastbone… rise into your throat" → an amber gradient **rises up the oesophagus** to the throat
- "sour taste" → a lemon icon pops in near the mouth and Sam's mini face puckers
- "worse when you lie down or bend over" → Sam (mini) **lies down** and the acid sloshes up; then Sam **bends over** and it sloshes again. An upward arrow appears.

**S13 · 0:58–1:06 · Heart pain (right panel is active, left dims)**
- "squeezes" → an illustrated **hand/fist squeezes the heart** as it compresses
- "pressure" → a downward-press icon; "tightness" → a band tightens around the chest; "heaviness" → a weight settles on the chest. Each is a small illustrated badge.
- "spread beyond your chest" → the S5 pain-pathway lines repeat in miniature (a visual callback)

→ *Transition:* both panels **slide together** and merge into a single scene of Sam.

### Act 5: What to do (1:06–1:27)

**S14 · 1:06–1:10 · "If you're not sure, stop. Sit down. Rest."**
Sam is walking. On "stop," Sam freezes and a stop-hand icon appears. On "sit down," a chair slides in and Sam sits. On "rest," the breathing lines slow and a calm teal glow appears. The three actions show as illustrated icons with check marks in a vertical stack.

**S15 · 1:10–1:18 · "If it's severe, getting worse, or not gone in 10 minutes, call triple zero. Don't drive yourself."**
A **10-minute stopwatch** fills its ring; a small severity gauge climbs into red on "getting worse." Then a **circle-reveal** to the red 000 scene: phone dialing, the **ambulance arriving** with paramedics stepping out. On "don't drive yourself," a car-key icon gets crossed out with a red stroke.
→ *Transition:* the ambulance drives off-screen and pulls the scene with it (pan) into a calm teal clinic.

**S16 · 1:18–1:27 · "And if it keeps coming back after meals… see your GP. Chest pain that keeps returning is never something to ignore."**
A **calendar** with plates on several days, and a repeating chest-pulse icon appears on each. Then a **GP clinic** scene: the doctor with a stethoscope listens to Sam's chest, an ECG monitor shows a trace, and a clipboard checklist ticks. The clinic illustration sits left, and **See your GP** sits in the right label lane.

### Act 6: Close (1:27–1:38)

**S17 · 1:27–1:33 · "Most of the time, it really is just indigestion. But your heart deserves the benefit of the doubt."**
Back to the opening table scene for symmetry. Sam is relaxed. A small stomach icon shows a tick ("usually indigestion"). Then the **heart** floats up from Sam's chest, wrapped in a soft protective shield/hands icon, with a steady, calm ECG.

**S18 · 1:33–1:38 · "Share this with someone who always says it's just indigestion."**
The heart shrinks into a **share icon**, and paper-plane messages fly out to three small friend avatars. End card: heart + ECG logo mark, with the disclaimer: *General information only — not medical advice. In an emergency call 000.*

---

## 5. Sound design (optional)
- A soft corporate-health ambient bed at about −28 dB that drops out under the 000 moments
- A subtle heartbeat underlay in Acts 2–3
- UI "bloops" on badge pops, a whoosh on zoom-throughs, a low impact on the red circle reveals, and an ambulance siren swell (short and quiet) at S7 and S15

## 6. Build steps
1. Scaffold the Remotion project, then re-run Whisper with word timestamps to produce `captions.json`. Build the zone layout and the collision-check overlay first, so every scene is built against it.
2. Draw the **illustration library** as React SVG components (characters, anatomy, icons, props) with animatable parts (heart beat, lungs, arms/poses, acid level, plaque thickness)
3. Build the **transition primitives** (zoom-through, morph, circle reveal, cell wipe, split)
4. Build the scenes act by act, previewing each in Remotion Studio for review
5. Add captions and the sound layer, then render a 1080p H.264 MP4

**Review points:** after the illustration library (style check), after Act 2 (motion and transition feel), then the full render.
