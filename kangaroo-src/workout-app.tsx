"use client";

// Kangaroo Gym — single-file React app, built by kangaroo-src/build.sh into
// sandbox/kangaroo/bundle.js (promote copies it live). Storage is plain
// localStorage under "kangaroo-*" keys; kangaroo/boot.js namespaces those per
// environment and syncs them to Supabase. Keep every persisted shape
// backwards-compatible with data that is already in the field.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type VoiceStyle = "Calm coach" | "Focused coach" | "Soft notification";
type ExerciseMode = "sets" | "hold" | "interval";
type Muscle = "Shoulders" | "Chest" | "Biceps" | "Triceps" | "Core" | "Upper Back" | "Lower Back" | "Hips" | "Glutes" | "Quads" | "Hamstrings" | "Knees" | "Shins" | "Calves";

type Exercise = {
  id: string;
  name: string;
  mode: ExerciseMode;
  sets: number;
  target: number;
  unit: string;
  duration: number;
  alternating: boolean;
  runDuration: number;
  walkDuration: number;
  runSpeed: number;
  walkSpeed: number;
  muscles: Muscle[];
};

type Workout = { id: string; name: string; focus: string; exercises: Exercise[] };
type TrainingHistory = Partial<Record<Muscle, string>>;
type EditorState = { workoutId: string; exercise: Exercise; isNew: boolean } | null;
type RecoveryStatus = "recent" | "warning" | "overdue" | "never";
type CardioActivity = "Walking" | "Biking" | "Running";
type CardioEntry = { id: string; activity: CardioActivity; minutes: number; date: string };
type WorkoutSession = { id: string; workoutId: string; workoutName: string; date: string; completed: number; skipped: number };
type ActiveSession = { workoutId: string; exerciseIndex: number; completedIds: string[]; skippedIds: string[] };

const muscles: Muscle[] = ["Shoulders", "Chest", "Biceps", "Triceps", "Core", "Upper Back", "Lower Back", "Hips", "Glutes", "Quads", "Hamstrings", "Knees", "Shins", "Calves"];

const localDateValue = (value = new Date()) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2,"0")}-${String(value.getDate()).padStart(2,"0")}`;
const storedDateValue = (value: string) => {
  const [year,month,day] = value.split("-").map(Number);
  return new Date(year,month - 1,day,12).toISOString();
};
const calendarDaysSince = (value: string) => {
  const then = new Date(value); const now = new Date();
  const thenDay = Date.UTC(then.getFullYear(),then.getMonth(),then.getDate());
  const today = Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
  return Math.max(0,Math.round((today - thenDay) / 86400000));
};
// Two recovery profiles, not fourteen thresholds — see docs/kangaroo-fysio-audit.md.
// "normal" is calibrated on the WHO rule of at least twice a week per major
// muscle group (average gap 3.5 days, so 5+ days means you no longer make it).
// "short" is for groups that carry little damage and where the gain is in
// regularity: slow-twitch (calves/soleus, shins) and postural or tendon work
// (core, hips, knees). Nothing here says train them MORE — frequency adds
// nothing at equal weekly volume — only that their window closes sooner.
type RecoveryProfile = "short" | "normal";
const recoveryDays: Record<RecoveryProfile, { recent: number; warning: number }> = {
  short: { recent: 1, warning: 3 },
  normal: { recent: 2, warning: 4 },
};
const shortRecovery: Muscle[] = ["Core", "Hips", "Knees", "Shins", "Calves"];
const profileFor = (muscle: Muscle): RecoveryProfile => shortRecovery.includes(muscle) ? "short" : "normal";

const getRecoveryStatus = (value?: string, profile: RecoveryProfile = "normal"): RecoveryStatus => {
  if (!value) return "never";
  const days = calendarDaysSince(value);
  const limit = recoveryDays[profile];
  return days <= limit.recent ? "recent" : days <= limit.warning ? "warning" : "overdue";
};

const recoveryLabel = (status: RecoveryStatus, profile: RecoveryProfile = "normal") => {
  const limit = recoveryDays[profile];
  if (status === "never") return "No history";
  if (status === "recent") return `0–${limit.recent} days`;
  if (status === "warning") return `${limit.recent + 1}–${limit.warning} days`;
  return `${limit.warning + 1}+ days`;
};

// ---- fase 2: minimale rust ------------------------------------------------
// Alleen hamstrings: na zwaar excentrisch werk is 72 uur vaak nog niet genoeg
// voor herstel van structuur en functie. Geen kleur en geen blokkade, alleen
// een zin. De opgeslagen datum heeft geen bruikbare kloktijd (handmatig
// markeren zet 12:00), dus dit rekent in kalenderdagen: vandaag of gisteren.
const minRestDays: Partial<Record<Muscle, number>> = { Hamstrings: 2 };
const restWarning = (muscle: Muscle, value?: string) => {
  const min = minRestDays[muscle];
  if (!min || !value) return null;
  const days = calendarDaysSince(value);            // NaN bij een kapotte opgeslagen datum
  if (!Number.isFinite(days) || days >= min) return null;
  return "Hamstrings take longer than most: after hard eccentric work even 72 hours is often not enough to fully recover. Going again this soon is fine if you keep it light.";
};
const cardioMinimum = (activity: CardioActivity) => activity === "Walking" ? 30 : activity === "Biking" ? 40 : 1;
const estimateWorkoutMinutes = (workout: Workout) => Math.max(1,Math.ceil(workout.exercises.reduce((total,exercise) => {
  if (exercise.mode === "hold") return total + exercise.sets * exercise.duration;
  if (exercise.mode === "interval") return total + exercise.sets * (exercise.runDuration + exercise.walkDuration);
  return total + exercise.sets * 50;
},0) / 60));
const describeDate = (value: string) => {
  const days = calendarDaysSince(value);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return new Date(value).toLocaleDateString(undefined,{ day:"numeric", month:"short", year:"numeric" });
};

type Point = [number, number];
type MuscleMask = { muscle: Muscle; polygons: Point[][] };
const mirror = (polygon: Point[], center: number): Point[] => polygon.map(([x,y]) => [center * 2 - x,y]);
const muscleMasks: MuscleMask[] = [
  { muscle:"Shoulders", polygons:[
    [[302,187],[277,185],[262,196],[257,219],[262,246],[279,274],[298,270],[313,243],[319,211]],
    mirror([[302,187],[277,185],[262,196],[257,219],[262,246],[279,274],[298,270],[313,243],[319,211]],414),
    [[947,188],[918,184],[892,194],[878,211],[877,239],[890,262],[910,275],[930,260],[945,227]],
    mirror([[947,188],[918,184],[892,194],[878,211],[877,239],[890,262],[910,275],[930,260],[945,227]],1026),
  ]},
  { muscle:"Chest", polygons:[
    [[402,199],[355,198],[321,207],[304,229],[308,257],[327,280],[354,293],[398,293],[409,278]],
    mirror([[402,199],[355,198],[321,207],[304,229],[308,257],[327,280],[354,293],[398,293],[409,278]],414),
  ]},
  { muscle:"Biceps", polygons:[
    [[302,259],[283,261],[271,282],[267,315],[275,344],[291,354],[307,337],[317,299],[314,275]],
    mirror([[302,259],[283,261],[271,282],[267,315],[275,344],[291,354],[307,337],[317,299],[314,275]],414),
  ]},
  { muscle:"Triceps", polygons:[
    [[902,257],[883,266],[871,294],[868,326],[876,351],[891,353],[906,330],[914,292]],
    mirror([[902,257],[883,266],[871,294],[868,326],[876,351],[891,353],[906,330],[914,292]],1026),
  ]},
  { muscle:"Core", polygons:[
    [[350,291],[330,298],[319,329],[319,390],[328,431],[350,448],[358,410],[356,327]],
    mirror([[350,291],[330,298],[319,329],[319,390],[328,431],[350,448],[358,410],[356,327]],414),
    [[363,297],[402,296],[404,329],[361,330]],[[362,335],[404,334],[404,369],[361,369]],[[361,375],[404,374],[404,408],[360,408]],[[360,414],[405,413],[404,446],[359,446]],
    mirror([[363,297],[402,296],[404,329],[361,330]],414),mirror([[362,335],[404,334],[404,369],[361,369]],414),mirror([[361,375],[404,374],[404,408],[360,408]],414),mirror([[360,414],[405,413],[404,446],[359,446]],414),
  ]},
  // Hips = hip flexors + abductors (glute medius/TFL) + adductors: the band
  // between the waist and the thighs. Front view only — on the back figure the
  // glutes already cover this area, and the panel list works from either side.
  { muscle:"Hips", polygons:[
    [[303,470],[322,452],[348,453],[359,475],[354,516],[337,545],[315,539],[300,508]],
    [[363,459],[406,459],[407,506],[398,547],[375,549],[362,512]],
    mirror([[303,470],[322,452],[348,453],[359,475],[354,516],[337,545],[315,539],[300,508]],414),
    mirror([[363,459],[406,459],[407,506],[398,547],[375,549],[362,512]],414),
  ]},
  { muscle:"Upper Back", polygons:[
    [[974,151],[1026,176],[1078,151],[1097,194],[1060,246],[1026,330],[991,246],[955,194]],
    [[954,227],[925,244],[904,281],[910,329],[930,365],[957,387],[979,365],[992,311],[997,294]],
    mirror([[954,227],[925,244],[904,281],[910,329],[930,365],[957,387],[979,365],[992,311],[997,294]],1026),
  ]},
  { muscle:"Lower Back", polygons:[
    [[930,365],[957,387],[979,365],[997,294],[1011,340],[1008,414],[985,442],[952,430]],
    mirror([[930,365],[957,387],[979,365],[997,294],[1011,340],[1008,414],[985,442],[952,430]],1026),
    [[997,334],[1026,350],[1055,334],[1074,402],[1052,436],[1026,451],[999,436],[978,402]],
  ]},
  { muscle:"Glutes", polygons:[
    [[918,454],[963,445],[1016,467],[1014,510],[991,536],[950,538],[916,519],[907,490]],
    mirror([[918,454],[963,445],[1016,467],[1014,510],[991,536],[950,538],[916,519],[907,490]],1026),
  ]},
  { muscle:"Quads", polygons:[
    [[308,546],[346,550],[361,606],[353,665],[335,701],[316,686],[302,645],[301,579]],[[350,550],[397,552],[398,616],[383,676],[365,702],[350,672],[361,606]],
    mirror([[308,546],[346,550],[361,606],[353,665],[335,701],[316,686],[302,645],[301,579]],414),mirror([[350,550],[397,552],[398,616],[383,676],[365,702],[350,672],[361,606]],414),
  ]},
  { muscle:"Hamstrings", polygons:[
    [[910,549],[958,549],[979,575],[980,632],[964,684],[947,701],[927,675],[914,630]],[[961,549],[1001,550],[1000,630],[984,679],[968,698],[958,664],[979,575]],
    mirror([[910,549],[958,549],[979,575],[980,632],[964,684],[947,701],[927,675],[914,630]],1026),mirror([[961,549],[1001,550],[1000,630],[984,679],[968,698],[958,664],[979,575]],1026),
  ]},
  { muscle:"Shins", polygons:[
    [[311,715],[334,707],[356,729],[362,779],[352,828],[334,854],[317,829],[307,781]],[[340,709],[363,714],[371,759],[367,810],[351,849],[344,817],[361,779]],
    mirror([[311,715],[334,707],[356,729],[362,779],[352,828],[334,854],[317,829],[307,781]],414),mirror([[340,709],[363,714],[371,759],[367,810],[351,849],[344,817],[361,779]],414),
  ]},
  { muscle:"Calves", polygons:[
    [[902,708],[933,704],[957,727],[964,770],[955,816],[936,839],[915,827],[902,787]],[[938,704],[966,713],[977,753],[973,799],[955,834],[950,803],[964,770]],
    mirror([[902,708],[933,704],[957,727],[964,770],[955,816],[936,839],[915,827],[902,787]],1026),mirror([[938,704],[966,713],[977,753],[973,799],[955,834],[950,803],[964,770]],1026),
  ]},
  // Knees last so they win hit-testing where they overlap quads/shins edges.
  { muscle:"Knees", polygons:[
    [[312,694],[348,688],[386,694],[391,708],[381,724],[346,730],[314,723],[305,708]],
    mirror([[312,694],[348,688],[386,694],[391,708],[381,724],[346,730],[314,723],[305,708]],414),
    [[914,688],[952,682],[994,688],[999,704],[990,720],[952,726],[918,720],[908,704]],
    mirror([[914,688],[952,682],[994,688],[999,704],[990,720],[952,726],[918,720],[908,704]],1026),
  ]},
];

const migrateMuscles = (values: string[] = []): Muscle[] => Array.from(new Set(values.flatMap((value) => {
  if (value === "Back") return ["Upper Back", "Lower Back"] as Muscle[];
  return muscles.includes(value as Muscle) ? [value as Muscle] : [];
})));

const migrateWorkouts = (values: Workout[]): Workout[] => values.map((workout) => ({
  ...workout,
  exercises: workout.exercises.map((exercise) => ({ ...exercise, muscles: migrateMuscles(exercise.muscles as string[]) })),
}));

const migrateHistory = (value: Record<string, string>): TrainingHistory => {
  const next = Object.fromEntries(Object.entries(value).filter(([muscle]) => muscle !== "Back" && muscles.includes(muscle as Muscle))) as TrainingHistory;
  if (value.Back) {
    next["Upper Back"] ??= value.Back;
    next["Lower Back"] ??= value.Back;
  }
  return next;
};

const lowerLegFix: Workout = {
  id: "lower-leg-fix",
  name: "Lower Leg Fix",
  focus: "Elastic strength · lower body",
  exercises: [
    { id: "calf-hold", name: "Calf raise hold", mode: "hold", sets: 10, target: 1, unit: "hold", duration: 30, alternating: true, runDuration: 60, walkDuration: 60, runSpeed: 10, walkSpeed: 5, muscles: ["Calves"] },
    { id: "drop-jumps", name: "Drop jumps", mode: "sets", sets: 3, target: 10, unit: "reps", duration: 30, alternating: false, runDuration: 60, walkDuration: 60, runSpeed: 10, walkSpeed: 5, muscles: ["Calves", "Quads", "Hamstrings", "Glutes"] },
    { id: "pogo-hops", name: "Pogo hops", mode: "sets", sets: 3, target: 10, unit: "meters", duration: 30, alternating: false, runDuration: 60, walkDuration: 60, runSpeed: 10, walkSpeed: 5, muscles: ["Calves"] },
    { id: "in-out", name: "In-and-out jumps", mode: "sets", sets: 3, target: 20, unit: "reps", duration: 30, alternating: false, runDuration: 60, walkDuration: 60, runSpeed: 10, walkSpeed: 5, muscles: ["Calves", "Quads"] },
    { id: "treadmill", name: "Treadmill", mode: "interval", sets: 5, target: 1, unit: "round", duration: 30, alternating: false, runDuration: 60, walkDuration: 60, runSpeed: 10, walkSpeed: 5, muscles: ["Calves", "Quads", "Hamstrings"] },
  ],
};

const newExercise = (): Exercise => ({ id: crypto.randomUUID(), name: "New exercise", mode: "sets", sets: 3, target: 10, unit: "reps", duration: 30, alternating: false, runDuration: 60, walkDuration: 60, runSpeed: 10, walkSpeed: 5, muscles: [] });

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1A7 7 0 0 0 15 6l-.4-2.6h-4L10 6a7 7 0 0 0-1.5 1L6 6 4 9.4 6 11a7 7 0 0 0 0 2l-2 1.6L6 18l2.5-1a7 7 0 0 0 1.5 1l.5 2.6h4L15 18a7 7 0 0 0 1.5-1l2.5 1 2-3.4-2-1.6a7 7 0 0 0 0-1Z"/></>,
    sound: <><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12"/></>,
    spark: <><path d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/></>,
    rest: <><path d="M5 6h14M7 10h10l-1 9H8l-1-9Z"/><path d="M9 3h6"/></>,
    check: <path d="m5 12 4 4L19 6"/>, arrow: <path d="m9 18 6-6-6-6"/>, back: <path d="m15 18-6-6 6-6"/>,
    pause: <><path d="M9 7v10M15 7v10"/></>, play: <path d="m9 7 8 5-8 5V7Z"/>,
    plus: <path d="M12 5v14M5 12h14"/>, edit: <><path d="m4 20 4.4-1 10-10-3.4-3.4-10 10L4 20Z"/><path d="m13.8 6.8 3.4 3.4"/></>,
    trash: <><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></>,
    up: <path d="m6 15 6-6 6 6"/>, down: <path d="m6 9 6 6 6-6"/>, skip: <><path d="m6 6 8 6-8 6V6ZM17 6v12"/></>,
    expand: <><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></>,
    collapse: <><path d="M8 8H3V3M16 8h5V3M8 16H3v5M16 16h5v5"/></>,
    cardio: <><path d="M20.5 9.5c0 5-8.5 10-8.5 10s-8.5-5-8.5-10A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8.5 3.5Z"/><path d="M5 12h3l1.5-3 2.5 6 1.5-3H19"/></>,
    history: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></>,
    body: <><circle cx="12" cy="5" r="2"/><path d="M9 9h6l2 4M9 9l-2 4M10 9l-1 5 1 7M14 9l1 5-1 7"/></>, list: <><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></>,
  };
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

// Form check per muscle group, behind the (?) buttons: how to isolate the muscle
// and how to tell you are actually doing the movement right. Deliberately keyed
// on the muscle group and not on the exercise — the exercises are self-made and
// renamed freely, the fourteen muscle groups are fixed.
const formChecks: Record<Muscle, { isolate: string; check: string }> = {
  "Shoulders": {
    isolate: "Lateral raise, thumbs slightly up, arms about 20–30° in front of your body.",
    check: "Stand with your back against a wall: the back of your head and your shoulder blades stay on the wall for the whole rep. Shoulders creeping up to your ears means the traps took over — go lighter.",
  },
  "Chest": {
    isolate: "Single-arm floor press or a band press — one side at a time hides nothing.",
    check: "You should feel it across the breastbone, not in the front of the shoulder. Keep the shoulder blades pinned back and down; if the shoulder rolls forward at the bottom, shorten the range.",
  },
  "Biceps": {
    isolate: "Seated incline curl: the arm hangs behind your body so the shoulder cannot help.",
    check: "Back against the wall, elbows against your ribs. If the elbow drifts forward or your back arches off the wall, it is a swing and not a curl.",
  },
  "Triceps": {
    isolate: "Overhead single-arm extension.",
    check: "Only the forearm moves — the upper arm stays still next to your ear. Burn in the back of the arm is right, a pinch in the elbow joint is not.",
  },
  "Core": {
    isolate: "Dead bug: opposite arm and leg, slowly, on your back.",
    check: "Lie down with one hand under your lower back — the pressure on that hand must not change while the limbs move. For a plank, check in a mirror: ears, hips and heels in one line, ribs pulled down, no sag.",
  },
  "Upper Back": {
    isolate: "Prone Y-and-T raise, or a face pull.",
    check: "Start every pull with the shoulder blades, not the hands. Chin lightly tucked; if you feel it in your neck instead of between the shoulder blades, the load is too heavy.",
  },
  "Lower Back": {
    isolate: "Bird dog, or a hip hinge holding a broomstick along your spine.",
    check: "The broomstick must touch the back of your head, your upper back and your tailbone during the whole hinge. Losing contact = you are rounding your back instead of hinging at the hip.",
  },
  "Hips": {
    isolate: "Side-lying hip abduction for the side of the hip, standing marches for the hip flexors, a couch stretch for the front.",
    check: "Stand on one leg for 30 seconds in front of a mirror: the pelvis stays level and the knee does not fall inward. If your hip drops on the free-leg side, the standing hip is the weak link.",
  },
  "Glutes": {
    isolate: "Single-leg glute bridge.",
    check: "Push the hips all the way up without arching your lower back — squeeze the glute, do not lift with the lumbar spine. Hamstring cramping means your heels are too far away; slide them closer to your seat.",
  },
  "Quads": {
    isolate: "Wall sit, or a step-up with a slow lowering phase.",
    check: "Wall squat: back flat against the wall, feet about one foot forward, sit until the thighs are parallel. The knees track over the feet and the heels stay down. Heels lifting usually means tight calves, not weak quads.",
  },
  "Hamstrings": {
    isolate: "Assisted Nordic curl, or a single-leg Romanian deadlift.",
    check: "Bend at the hip, not the lower back: knees soft, hips travel backwards, stretch felt in the back of the thigh. If your lower back complains first, you are bending the spine.",
  },
  "Knees": {
    isolate: "Terminal knee extension with a band, or a slow step-down from a low step.",
    check: "Step down in front of a mirror: the knee stays over the second toe and does not collapse inward. If it does collapse, train Hips and Glutes before adding load here.",
  },
  "Shins": {
    isolate: "Toe raise — heels on the floor, lift the forefoot — or walking on your heels.",
    check: "Sit with the leg straight and pull your toes towards your knee: you should feel a burn on the front of the shin. No burn means you are only swinging the ankle instead of loading the muscle.",
  },
  "Calves": {
    isolate: "Single-leg calf raise off a step — bent knee loads the soleus, straight knee the gastrocnemius.",
    check: "Rise all the way onto the ball of your foot without rolling out to the little toe, then lower slowly into a full stretch below the step. Fewer than about 20 clean single-leg reps is the thing to work on.",
  },
};

function FormCheck({ targets, label }: { targets: Muscle[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const rows = Array.from(new Set(targets)).filter((muscle) => formChecks[muscle]);
  if (!rows.length) return null;
  return <span className="form-check">
    <button type="button" className={`form-check-button ${open ? "open" : ""}`} aria-expanded={open} aria-label={`Form check for ${label || rows.join(", ")}`} title="How do I know I am doing this right?" onClick={() => setOpen((value) => !value)}>?</button>
    {open && <span className="form-check-panel" role="note">
      {rows.map((muscle) => <span key={muscle} className="form-check-row">
        {rows.length > 1 && <strong>{muscle}</strong>}
        <span><em>Isolate</em> {formChecks[muscle].isolate}</span>
        <span><em>Check</em> {formChecks[muscle].check}</span>
      </span>)}
    </span>}
  </span>;
}

const describeExercise = (exercise: Exercise) => {
  if (exercise.mode === "hold") return `${exercise.sets} × ${exercise.duration} sec${exercise.alternating ? " · alternating sides" : ""}`;
  if (exercise.mode === "interval") return `${exercise.sets} rounds · ${exercise.runDuration}s run / ${exercise.walkDuration}s walk`;
  return `${exercise.sets} × ${exercise.target} ${exercise.unit}`;
};

export default function WorkoutApp() {
  const [workouts, setWorkouts] = useState<Workout[]>([lowerLegFix]);
  const [activeWorkoutId, setActiveWorkoutId] = useState(lowerLegFix.id);
  const [view, setView] = useState<"body" | "train" | "manage" | "history">("body");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState>(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>("Calm coach");
  const [vibration, setVibration] = useState(true);
  const [restTimer, setRestTimer] = useState(false);
  const [history, setHistory] = useState<TrainingHistory>({});
  const [selectedBodyTarget, setSelectedBodyTarget] = useState<Muscle | "Cardio">("Calves");
  const [muscleDateDraft, setMuscleDateDraft] = useState(() => localDateValue());
  const [cardioEntries, setCardioEntries] = useState<CardioEntry[]>([]);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [cardioActivity, setCardioActivity] = useState<CardioActivity>("Walking");
  const [cardioMinutes, setCardioMinutes] = useState(30);
  const [cardioDate, setCardioDate] = useState(() => localDateValue());
  const [bodySide, setBodySide] = useState<"front" | "back">("front");
  const [hydrated, setHydrated] = useState(false);
  const [coachFullscreen, setCoachFullscreen] = useState(false);
  const coachCardRef = useRef<HTMLElement>(null);
  const muscleRowRefs = useRef<Partial<Record<Muscle,HTMLDivElement | null>>>({});
  const cardioRowRef = useRef<HTMLDivElement>(null);

  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(0);
  const [phase, setPhase] = useState<"run" | "walk">("run");
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [skippedIds, setSkippedIds] = useState<string[]>([]);
  const spokenFive = useRef(false);

  const activeWorkout = workouts.find((workout) => workout.id === activeWorkoutId) || workouts[0];
  const current = activeWorkout?.exercises[exerciseIndex];
  const sortedCardioEntries = useMemo(() => [...cardioEntries].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),[cardioEntries]);
  const latestCardio = sortedCardioEntries[0];
  const historyRows = useMemo(() => [
    ...workoutSessions.map((session) => ({ id:session.id, date:session.date, kind:"workout" as const, title:session.workoutName, detail:`${session.completed} completed · ${session.skipped} skipped` })),
    ...cardioEntries.map((entry) => ({ id:entry.id, date:entry.date, kind:"cardio" as const, title:entry.activity, detail:`${entry.minutes} min` })),
  ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),[workoutSessions,cardioEntries]);

  useEffect(() => {
    try {
      const storedWorkouts = JSON.parse(localStorage.getItem("kangaroo-workouts") || "null");
      const storedSettings = JSON.parse(localStorage.getItem("kangaroo-settings") || "null");
      const storedHistory = JSON.parse(localStorage.getItem("kangaroo-history") || "null");
      const storedCardio = JSON.parse(localStorage.getItem("kangaroo-cardio") || "null");
      const storedWorkoutSessions = JSON.parse(localStorage.getItem("kangaroo-workout-history") || "null");
      const storedSession = JSON.parse(localStorage.getItem("kangaroo-active-session") || "null") as ActiveSession | null;
      let loadedWorkouts: Workout[] = [lowerLegFix];
      if (Array.isArray(storedWorkouts) && storedWorkouts.length) { loadedWorkouts = migrateWorkouts(storedWorkouts); setWorkouts(loadedWorkouts); setActiveWorkoutId(loadedWorkouts[0].id); }
      if (storedSettings) { setVoiceOn(storedSettings.voiceOn ?? true); setVoiceStyle(storedSettings.voiceStyle || "Calm coach"); setVibration(storedSettings.vibration ?? true); setRestTimer(storedSettings.restTimer ?? false); }
      if (storedHistory) setHistory(migrateHistory(storedHistory));
      if (Array.isArray(storedCardio)) setCardioEntries(storedCardio);
      if (Array.isArray(storedWorkoutSessions)) setWorkoutSessions(storedWorkoutSessions);
      // Restore an in-progress session so a reload mid-workout doesn't lose
      // progress (and the finished workout still gets logged).
      const sessionWorkout = storedSession && loadedWorkouts.find((workout) => workout.id === storedSession.workoutId);
      if (storedSession && sessionWorkout) {
        const index = Math.min(Math.max(0,storedSession.exerciseIndex || 0),sessionWorkout.exercises.length);
        setActiveWorkoutId(sessionWorkout.id);
        setExerciseIndex(index);
        setCompletedIds(Array.isArray(storedSession.completedIds) ? storedSession.completedIds : []);
        setSkippedIds(Array.isArray(storedSession.skippedIds) ? storedSession.skippedIds : []);
        const exercise = sessionWorkout.exercises[index];
        if (exercise) setSecondsLeft(exercise.mode === "interval" ? exercise.runDuration : exercise.duration);
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated) localStorage.setItem("kangaroo-workouts", JSON.stringify(workouts)); }, [workouts, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("kangaroo-settings", JSON.stringify({ voiceOn, voiceStyle, vibration, restTimer })); }, [voiceOn, voiceStyle, vibration, restTimer, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("kangaroo-history", JSON.stringify(history)); }, [history, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("kangaroo-cardio", JSON.stringify(cardioEntries)); }, [cardioEntries, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("kangaroo-workout-history", JSON.stringify(workoutSessions)); }, [workoutSessions, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    if (started || completedIds.length + skippedIds.length > 0) {
      localStorage.setItem("kangaroo-active-session", JSON.stringify({ workoutId:activeWorkoutId, exerciseIndex, completedIds, skippedIds } satisfies ActiveSession));
    } else {
      localStorage.removeItem("kangaroo-active-session");
    }
  }, [hydrated, started, activeWorkoutId, exerciseIndex, completedIds, skippedIds]);

  useEffect(() => { window.scrollTo(0,0); }, [view]);

  useEffect(() => {
    const syncFullscreen = () => setCoachFullscreen(document.fullscreenElement === coachCardRef.current);
    const closeFallback = (event: KeyboardEvent) => {
      if (event.key === "Escape" && coachFullscreen && !document.fullscreenElement) setCoachFullscreen(false);
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("keydown", closeFallback);
    if (coachFullscreen) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("keydown", closeFallback);
      document.body.style.overflow = "";
    };
  }, [coachFullscreen]);

  const toggleCoachFullscreen = async () => {
    const card = coachCardRef.current;
    if (!card) return;
    if (document.fullscreenElement === card) {
      await document.exitFullscreen();
      return;
    }
    if (coachFullscreen) {
      setCoachFullscreen(false);
      return;
    }
    try {
      await card.requestFullscreen();
    } catch {
      setCoachFullscreen(true);
    }
  };

  const speak = useCallback((text: string) => {
    if (!voiceOn || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voiceStyle === "Focused coach" ? 1.12 : voiceStyle === "Soft notification" ? 0.9 : 0.98;
    utterance.pitch = voiceStyle === "Soft notification" ? 1.08 : 1;
    utterance.volume = voiceStyle === "Soft notification" ? 0.68 : 1;
    window.speechSynthesis.speak(utterance);
  }, [voiceOn, voiceStyle]);
  const buzz = useCallback(() => { if (vibration && "vibrate" in navigator) navigator.vibrate([80, 50, 80]); }, [vibration]);

  const resetExerciseState = useCallback((exercise: Exercise | undefined) => {
    setCurrentSet(0); setPhase("run"); setSecondsLeft(exercise?.mode === "interval" ? exercise.runDuration : exercise?.duration || 0); setPaused(false); spokenFive.current = false;
  }, []);

  const selectWorkout = (id: string) => {
    const selected = workouts.find((item) => item.id === id);
    setActiveWorkoutId(id); setStarted(false); setExerciseIndex(0); setCompletedIds([]); setSkippedIds([]); resetExerciseState(selected?.exercises[0]);
  };

  const logSession = useCallback((completed: number, skipped: number) => {
    if (!activeWorkout || completed + skipped === 0) return;
    setWorkoutSessions((sessions) => [{ id:crypto.randomUUID(), workoutId:activeWorkout.id, workoutName:activeWorkout.name, date:new Date().toISOString(), completed, skipped },...sessions]);
  }, [activeWorkout]);

  const finishExercise = useCallback((result: "done" | "skip") => {
    if (!current || !activeWorkout) return;
    if (result === "done") {
      setCompletedIds((items) => items.includes(current.id) ? items : [...items, current.id]);
      const now = new Date().toISOString();
      setHistory((previous) => ({ ...previous, ...Object.fromEntries(current.muscles.map((muscle) => [muscle, now])) }));
    } else setSkippedIds((items) => items.includes(current.id) ? items : [...items, current.id]);
    const nextIndex = exerciseIndex + 1;
    if (nextIndex >= activeWorkout.exercises.length) {
      const finalCompleted = completedIds.length + (result === "done" && !completedIds.includes(current.id) ? 1 : 0);
      const finalSkipped = skippedIds.length + (result === "skip" && !skippedIds.includes(current.id) ? 1 : 0);
      logSession(finalCompleted, finalSkipped);
      setExerciseIndex(nextIndex); setStarted(false); setPaused(false); setCoachFullscreen(false); speak(result === "done" ? "Workout complete. Great work." : "Workout finished."); buzz(); return;
    }
    const next = activeWorkout.exercises[nextIndex];
    setExerciseIndex(nextIndex); resetExerciseState(next); speak(`Next, ${next.name}.`); buzz();
  }, [current, activeWorkout, exerciseIndex, completedIds, skippedIds, logSession, speak, buzz, resetExerciseState]);

  const advanceTimedSegment = useCallback(() => {
    if (!current || current.mode === "sets") return;
    if (current.mode === "hold") {
      if (currentSet + 1 >= current.sets) { finishExercise("done"); return; }
      const nextSet = currentSet + 1;
      setCurrentSet(nextSet); setSecondsLeft(current.duration); spokenFive.current = false;
      speak(current.alternating ? `${nextSet % 2 === 0 ? "Left" : "Right"} side.` : `Hold ${nextSet + 1}.`); buzz();
      return;
    }
    if (phase === "run") {
      setPhase("walk"); setSecondsLeft(current.walkDuration); spokenFive.current = false;
      speak(`Walk at ${current.walkSpeed} kilometers per hour.`); buzz();
      return;
    }
    if (currentSet + 1 < current.sets) {
      const nextRound = currentSet + 1;
      setCurrentSet(nextRound); setPhase("run"); setSecondsLeft(current.runDuration); spokenFive.current = false;
      speak(`Round ${nextRound + 1}. Run at ${current.runSpeed} kilometers per hour.`); buzz();
      return;
    }
    finishExercise("done");
  }, [current, currentSet, phase, finishExercise, speak, buzz]);

  useEffect(() => {
    if (!started || paused || !current || current.mode === "sets") return;
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [started, paused, current]);

  useEffect(() => {
    if (!started || !current || current.mode === "sets" || secondsLeft !== 0) return;
    advanceTimedSegment();
  }, [secondsLeft, started, current, advanceTimedSegment]);

  useEffect(() => {
    if (!started || !current || current.mode === "sets" || secondsLeft !== 5 || spokenFive.current) return;
    spokenFive.current = true;
    const nextAction = current.mode === "hold" ? (currentSet + 1 < current.sets ? (current.alternating ? `${(currentSet + 1) % 2 === 0 ? "left" : "right"} side` : "next hold") : "finish") : phase === "run" ? "walk" : currentSet + 1 < current.sets ? "run" : "finish";
    speak(`Five seconds. Next, ${nextAction}.`);
  }, [secondsLeft, started, current, currentSet, phase, speak]);

  const start = () => {
    if (!current) return;
    setStarted(true); setPaused(false); resetExerciseState(current);
    const cue = current.mode === "hold" && current.alternating ? `${current.name}. Left side first.` : current.mode === "interval" ? `${current.name}. Run at ${current.runSpeed} kilometers per hour.` : `${current.name}. Set one.`;
    speak(cue); buzz();
  };
  const completeSet = () => {
    if (!current) return;
    if (currentSet + 1 >= current.sets) finishExercise("done");
    else { setCurrentSet((value) => value + 1); speak(`Set ${currentSet + 2}.`); buzz(); }
  };
  const resetCurrentExercise = () => {
    if (!current) return;
    resetExerciseState(current);
    if (started) setPaused(true);
  };
  const toggleTimer = () => {
    if (!started) start();
    else setPaused((value) => !value);
  };
  const resetWorkout = () => { setStarted(false); setPaused(false); setExerciseIndex(0); setCompletedIds([]); setSkippedIds([]); resetExerciseState(activeWorkout?.exercises[0]); window.speechSynthesis?.cancel(); };
  const finishWorkoutEarly = () => {
    logSession(completedIds.length, skippedIds.length);
    resetWorkout();
    speak("Workout logged.");
  };
  const progress = activeWorkout?.exercises.length ? ((completedIds.length + skippedIds.length) / activeWorkout.exercises.length) * 100 : 0;

  const saveExercise = () => {
    if (!editor) return;
    setWorkouts((items) => items.map((workout) => workout.id !== editor.workoutId ? workout : { ...workout, exercises: editor.isNew ? [...workout.exercises, editor.exercise] : workout.exercises.map((exercise) => exercise.id === editor.exercise.id ? editor.exercise : exercise) }));
    setEditor(null);
  };
  const addWorkout = () => {
    const workout: Workout = { id: crypto.randomUUID(), name: `Workout ${workouts.length + 1}`, focus: "Custom training", exercises: [] };
    setWorkouts((items) => [...items, workout]); setActiveWorkoutId(workout.id); setView("manage"); resetWorkout();
  };
  const deleteWorkout = (id: string) => {
    if (workouts.length === 1) return;
    const remaining = workouts.filter((workout) => workout.id !== id); setWorkouts(remaining);
    if (id === activeWorkoutId) selectWorkout(remaining[0].id);
  };
  const moveExercise = (index: number, direction: -1 | 1) => {
    if (!activeWorkout) return;
    const next = index + direction; if (next < 0 || next >= activeWorkout.exercises.length) return;
    const reordered = [...activeWorkout.exercises]; [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
    setWorkouts((items) => items.map((workout) => workout.id === activeWorkout.id ? { ...workout, exercises: reordered } : workout));
  };
  const updateActiveWorkout = (patch: Partial<Workout>) => setWorkouts((items) => items.map((workout) => workout.id === activeWorkoutId ? { ...workout, ...patch } : workout));

  // Volgorde van de spiergroepenlijst: bovenaan wat het langst geleden getraind
  // is, dus bovenaan staat wat je in principe als eerste zou moeten doen.
  // Nooit getraind telt als het langst geleden. De vaste anatomische volgorde
  // blijft staan waar hij hoort: in de oefening-editor.
  const trainedAt = (muscle: Muscle) => {
    const value = history[muscle]; if (!value) return 0;           // 0 = 1970: ouder dan elke echte datum
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;                       // en een kapotte datum ook
  };
  const sortedMuscles = useMemo(() => [...muscles].sort((a,b) => trainedAt(a) - trainedAt(b)),[history]);

  const formatLastTrained = (muscle: Muscle) => {
    const value = history[muscle]; if (!value) return "Not trained yet";
    const days = calendarDaysSince(value);
    return days === 0 ? "Trained today" : days === 1 ? "Trained yesterday" : `Trained ${days} days ago`;
  };
  const recoveryClass = (muscle: Muscle) => {
    return getRecoveryStatus(history[muscle], profileFor(muscle));
  };
  const selectBodyTarget = (target: Muscle | "Cardio") => {
    setSelectedBodyTarget(target);
    if (target === "Cardio") {
      setBodySide("front"); setCardioDate(localDateValue());
    } else {
      setMuscleDateDraft(history[target] ? localDateValue(new Date(history[target]!)) : localDateValue());
    }
    window.setTimeout(() => {
      const row = target === "Cardio" ? cardioRowRef.current : muscleRowRefs.current[target];
      row?.scrollIntoView({ behavior:"smooth", block:"center" });
    },0);
  };
  const saveMuscleDate = (muscle: Muscle) => setHistory((previous) => ({ ...previous, [muscle]: storedDateValue(muscleDateDraft || localDateValue()) }));
  const addCardioEntry = () => {
    const minimum = cardioMinimum(cardioActivity);
    const minutes = Math.max(minimum,cardioMinutes);
    setCardioMinutes(minutes);
    setCardioEntries((entries) => [{ id:crypto.randomUUID(), activity:cardioActivity, minutes, date:storedDateValue(cardioDate || localDateValue()) },...entries]);
  };

  return <main className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setView("body")} aria-label="Kangaroo Gym home"><span className="brand-mark">K</span><span>Kangaroo<br/>Gym</span></button>
      <nav className="main-nav" aria-label="Main navigation">
        <button className={view === "body" ? "active" : ""} onClick={() => setView("body")}><Icon name="body"/> Body map</button>
        <button className={view === "train" ? "active" : ""} onClick={() => setView("train")}><Icon name="play"/> Train</button>
        <button className={view === "manage" ? "active" : ""} onClick={() => setView("manage")}><Icon name="list"/> Workouts</button>
        <button className={view === "history" ? "active" : ""} onClick={() => setView("history")}><Icon name="history"/> History</button>
      </nav>
      <button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Open settings"><Icon name="settings"/></button>
    </header>

    {view === "body" && <section className="workspace-page body-page">
      <div className="page-intro body-intro"><span className="eyebrow">BODY MAP</span><div className="recovery-legend"><span><i className="recent"/> 0–2 days</span><span><i className="warning"/> 3–4 days</span><span><i className="overdue"/> 5+ days</span><span><i className="never"/> No history</span></div><p className="recovery-legend-note">{shortRecovery.join(", ")} carry less damage and turn sooner: 0–1 / 2–3 / 4+ days.</p></div>
      <div className="body-grid">
        <div className="body-view-area">
          <div className="body-side-toggle" role="group" aria-label="Choose body view"><button className={bodySide === "front" ? "active" : ""} aria-pressed={bodySide === "front"} onClick={() => setBodySide("front")}>Front</button><button className={bodySide === "back" ? "active" : ""} aria-pressed={bodySide === "back"} onClick={() => setBodySide("back")}>Back</button></div>
          <div className={`body-visual body-${bodySide}`}>
            <AnatomyCanvas history={history} selectedMuscle={selectedBodyTarget === "Cardio" ? null : selectedBodyTarget} onSelect={selectBodyTarget}/>
            <button className={`cardio-marker ${getRecoveryStatus(latestCardio?.date)} ${selectedBodyTarget === "Cardio" ? "active" : ""}`} onClick={() => selectBodyTarget("Cardio")} aria-label="Open cardio log"><Icon name="cardio"/><span>Cardio</span></button>
            <div className="body-view-labels" aria-hidden="true"><span>Front</span><span>Back</span></div>
          </div>
        </div>
        <aside className="muscle-panel"><div className="all-muscles"><h3>Cardio</h3><div ref={cardioRowRef} className={`body-list-item ${selectedBodyTarget === "Cardio" ? "active" : ""}`}><button className="body-target-button" onClick={() => selectBodyTarget("Cardio")}><i className={getRecoveryStatus(latestCardio?.date)}/><span><strong>Cardio</strong><small>{latestCardio ? `${latestCardio.activity} · ${describeDate(latestCardio.date)}` : "No cardio logged yet"}</small></span><Icon name="arrow"/></button>{selectedBodyTarget === "Cardio" && <div className="inline-tracking-panel"><span className={`status-badge ${getRecoveryStatus(latestCardio?.date)}`}>{recoveryLabel(getRecoveryStatus(latestCardio?.date))}</span><h2>Cardio</h2><p>Log a walk, bike ride, or run with the date you did it.</p><div className="tracking-form"><div className="field-group"><label>Activity</label><select value={cardioActivity} onChange={(event) => { const activity = event.target.value as CardioActivity; setCardioActivity(activity); setCardioMinutes((value) => Math.max(value,cardioMinimum(activity))); }}><option value="Walking">Walking (30+ minutes)</option><option value="Biking">Biking (40+ minutes)</option><option value="Running">Running</option></select></div><div className="field-group"><label>Minutes</label><input type="number" min={cardioMinimum(cardioActivity)} value={cardioMinutes} onChange={(event) => setCardioMinutes(Math.max(cardioMinimum(cardioActivity),Number(event.target.value)))}/></div><div className="field-group date-field"><label>Date</label><div><input type="date" max={localDateValue()} value={cardioDate} onChange={(event) => setCardioDate(event.target.value)}/><button onClick={() => setCardioDate(localDateValue())}>Today</button></div></div></div><button className="primary-button" onClick={addCardioEntry}><Icon name="plus"/> Add cardio activity</button>{sortedCardioEntries.length > 0 && <div className="cardio-history"><h4>Recent cardio</h4>{sortedCardioEntries.slice(0,6).map((entry) => <div key={entry.id}><span><strong>{entry.activity}</strong><small>{entry.minutes} min · {describeDate(entry.date)}</small></span><button className="mini-icon danger" onClick={() => setCardioEntries((entries) => entries.filter((item) => item.id !== entry.id))} aria-label={`Delete ${entry.activity} entry`}><Icon name="trash"/></button></div>)}</div>}</div>}</div><h3>Muscle groups</h3>{sortedMuscles.map((muscle) => <div key={muscle} ref={(node) => { muscleRowRefs.current[muscle] = node; }} className={`body-list-item ${selectedBodyTarget === muscle ? "active" : ""}`}><button className="body-target-button" onClick={() => selectBodyTarget(muscle)}><i className={recoveryClass(muscle)}/><span><strong>{muscle}</strong><small>{formatLastTrained(muscle)}</small></span><Icon name="arrow"/></button>{selectedBodyTarget === muscle && <div className="inline-tracking-panel"><span className={`status-badge ${recoveryClass(muscle)}`}>{recoveryLabel(recoveryClass(muscle), profileFor(muscle))}</span><h2>{muscle}<FormCheck targets={[muscle]} label={muscle}/></h2><p>{formatLastTrained(muscle)}</p>{restWarning(muscle, history[muscle]) && <p className="rest-note">{restWarning(muscle, history[muscle])}</p>}<div className="field-group date-field"><label>Training date</label><div><input type="date" max={localDateValue()} value={muscleDateDraft} onChange={(event) => setMuscleDateDraft(event.target.value)}/><button onClick={() => setMuscleDateDraft(localDateValue())}>Today</button></div></div><div className="muscle-actions"><button className="primary-button" onClick={() => saveMuscleDate(muscle)}><Icon name="check"/> {history[muscle] ? "Update training date" : "Mark trained"}</button><button className="secondary-button" onClick={() => { setHistory((previous) => { const next = { ...previous }; delete next[muscle]; return next; }); setMuscleDateDraft(localDateValue()); }}>Clear history</button></div></div>}</div>)}</div></aside>
      </div>
    </section>}

    {view === "train" && <section className="workspace-page">
      <div className="page-intro"><div><span className="eyebrow">TRAIN</span><h1>{activeWorkout?.name || "Train"}</h1><p>{activeWorkout?.focus}</p></div></div>
      <div className="workout-card-switcher" aria-label="Choose a workout">{workouts.map((workout) => <button key={workout.id} className={workout.id === activeWorkoutId ? "active" : ""} onClick={() => workout.id !== activeWorkoutId && selectWorkout(workout.id)}><span>{workout.exercises.length} EXERCISES · ~{estimateWorkoutMinutes(workout)} MIN</span><strong>{workout.name}</strong><small>{workout.focus}</small></button>)}</div>

      <section className="workout" aria-labelledby="workout-heading">
        <div className="section-heading"><div><h2 id="workout-heading">Session</h2></div><span className="progress-label">{completedIds.length + skippedIds.length} / {activeWorkout?.exercises.length || 0} handled</span></div>
        <div className="progress-track"><span style={{ width: `${progress}%` }}/></div>
        {!activeWorkout?.exercises.length ? <div className="empty-state"><h3>This workout is empty.</h3><p>Add its first exercise in the workout editor.</p><button className="primary-button compact-button" onClick={() => setView("manage")}><Icon name="plus"/> Add exercise</button></div> : <div className="workout-grid">
          <div className="exercise-list">
            {activeWorkout.exercises.map((exercise, index) => <button key={exercise.id} className={`exercise-row ${index === exerciseIndex ? "active" : ""} ${completedIds.includes(exercise.id) ? "done" : ""} ${skippedIds.includes(exercise.id) ? "skipped" : ""}`} onClick={() => { if (!started) { setExerciseIndex(index); resetExerciseState(exercise); } }}>
              <span className="exercise-index">{completedIds.includes(exercise.id) ? <Icon name="check"/> : skippedIds.includes(exercise.id) ? <Icon name="skip"/> : String(index + 1).padStart(2, "0")}</span>
              <span className="exercise-copy"><strong>{exercise.name}</strong><small>{describeExercise(exercise)}</small></span>
              <span className="muscle-tags">{exercise.muscles.slice(0,2).map((muscle) => <em key={muscle}>{muscle}</em>)}</span>
              <span className="row-arrow"><Icon name="arrow"/></span>
            </button>)}
          </div>

          {current && <aside ref={coachCardRef} className={`coach-card ${coachFullscreen ? "is-fullscreen" : ""}`} aria-live="polite">
            <div className="coach-top"><span className="coach-label">{started ? "NOW TRAINING" : "READY WHEN YOU ARE"}</span><div className="coach-top-actions"><span>{exerciseIndex + 1} / {activeWorkout.exercises.length}</span><button className="fullscreen-button" onClick={toggleCoachFullscreen} aria-label={coachFullscreen ? "Exit fullscreen timer" : "Open timer fullscreen"} title={coachFullscreen ? "Exit fullscreen" : "Fullscreen timer"}><Icon name={coachFullscreen ? "collapse" : "expand"}/></button></div></div>
            <h3>{current.name}</h3><p>{describeExercise(current)}<FormCheck key={current.id} targets={current.muscles} label={current.name}/></p>
            {current.mode === "hold" && <div className="timer"><strong>{String(Math.floor(secondsLeft / 60)).padStart(2,"0")}:{String(secondsLeft % 60).padStart(2,"0")}</strong><span>{current.alternating ? `${currentSet % 2 === 0 ? "LEFT" : "RIGHT"} SIDE · HOLD ${currentSet + 1} OF ${current.sets}` : `HOLD ${currentSet + 1} OF ${current.sets}`}</span></div>}
            {current.mode === "interval" && <div className="timer interval-timer"><strong>{String(Math.floor(secondsLeft / 60)).padStart(2,"0")}:{String(secondsLeft % 60).padStart(2,"0")}</strong><span>ROUND {currentSet + 1} OF {current.sets} · {phase.toUpperCase()} {phase === "run" ? current.runSpeed : current.walkSpeed} KM/H</span><div className="round-dots">{Array.from({ length: current.sets }, (_, index) => <i key={index} className={index < currentSet ? "complete" : index === currentSet ? "current" : ""}>{index < currentSet ? <Icon name="check"/> : index + 1}</i>)}</div><small>Each round is one run plus one walk.</small></div>}
            {current.mode === "sets" && <div className="set-tracker"><div className="set-count"><strong>{current.target}</strong><span>{current.unit} · set {Math.min(currentSet + 1, current.sets)} of {current.sets}</span></div><div className="set-dots">{Array.from({ length: current.sets }, (_, index) => <span key={index} className={index < currentSet ? "complete" : index === currentSet ? "current" : ""}>{index < currentSet ? <Icon name="check"/> : index + 1}</span>)}</div></div>}
            {current.mode !== "sets" ? <><div className="timer-controls"><button onClick={() => setSecondsLeft((value) => value + 10)}>+10 sec</button><button onClick={() => setSecondsLeft((value) => Math.max(1,value - 10))}>−10 sec</button><button className="start-control" onClick={toggleTimer}><Icon name={!started || paused ? "play" : "pause"}/>{!started || paused ? "Start" : "Pause"}</button><button onClick={resetCurrentExercise}>Reset</button><button className="skip-control" onClick={() => finishExercise("skip")}><Icon name="skip"/> Skip</button></div>{current.mode === "interval" && <button className="next-phase" onClick={advanceTimedSegment}>{phase === "run" ? "Finish run · start walk" : currentSet + 1 < current.sets ? `Finish walk · start round ${currentSet + 2}` : "Finish final walk"}<Icon name="arrow"/></button>}</> : !started ? <button className="primary-button" onClick={start}><Icon name="play"/> Start workout</button> : <><button className="primary-button set-button" onClick={completeSet}><Icon name="check"/> Complete set {currentSet + 1}</button><div className="session-controls set-session-controls"><button onClick={() => finishExercise("done")}><Icon name="check"/> Done</button><button onClick={resetCurrentExercise}>Reset sets</button><button onClick={() => finishExercise("skip")}><Icon name="skip"/> Skip</button></div></>}
            {completedIds.length + skippedIds.length > 0 && <button className="primary-button finish-button" onClick={finishWorkoutEarly}><Icon name="check"/> Finish &amp; log workout</button>}
            {(started || completedIds.length + skippedIds.length > 0) && <button className="reset-button" onClick={resetWorkout}>Reset workout (don&apos;t log)</button>}
          </aside>}
          {!current && <aside className="coach-card session-complete-card" aria-live="polite"><div className="coach-top"><span className="coach-label">SESSION COMPLETE</span><span>{activeWorkout.exercises.length} / {activeWorkout.exercises.length}</span></div><h3>Workout logged.</h3><p>{completedIds.length} completed · {skippedIds.length} skipped</p><button className="primary-button" onClick={resetWorkout}><Icon name="play"/> Start again</button></aside>}
        </div>}
      </section>
    </section>}

    {view === "manage" && <section className="workspace-page">
      <div className="page-intro"><div><span className="eyebrow">WORKOUTS</span><h1>Your workouts</h1></div><button className="primary-button compact-button" onClick={addWorkout}><Icon name="plus"/> New workout</button></div>
      <div className="manager-grid">
        <aside className="workout-library"><h2>Your workouts</h2>{workouts.map((workout) => <div key={workout.id} className={`library-item ${workout.id === activeWorkoutId ? "active" : ""}`}><button onClick={() => selectWorkout(workout.id)}><strong>{workout.name}</strong><span>{workout.exercises.length} exercises</span></button><button className="mini-icon danger" aria-label={`Delete ${workout.name}`} disabled={workouts.length === 1} onClick={() => deleteWorkout(workout.id)}><Icon name="trash"/></button></div>)}</aside>
        {activeWorkout && <div className="workout-editor">
          <div className="editor-header"><div className="field-group"><label htmlFor="workout-name">Workout name</label><input id="workout-name" value={activeWorkout.name} onChange={(event) => updateActiveWorkout({ name: event.target.value })}/></div><div className="field-group"><label htmlFor="workout-focus">Focus / description</label><input id="workout-focus" value={activeWorkout.focus} onChange={(event) => updateActiveWorkout({ focus: event.target.value })}/></div></div>
          <div className="editor-title"><div><h2>Exercises</h2><p>Use the arrows to change the order.</p></div><button className="secondary-button" onClick={() => setEditor({ workoutId: activeWorkout.id, exercise: newExercise(), isNew: true })}><Icon name="plus"/> Add exercise</button></div>
          <div className="editable-list">{activeWorkout.exercises.map((exercise, index) => <div className="editable-row" key={exercise.id}><span className="drag-index">{String(index + 1).padStart(2,"0")}</span><div><strong>{exercise.name}</strong><span>{describeExercise(exercise)} · {exercise.muscles.join(", ") || "No body parts linked"}</span></div><div className="row-actions"><button className="mini-icon" onClick={() => moveExercise(index,-1)} disabled={index === 0} aria-label="Move up"><Icon name="up"/></button><button className="mini-icon" onClick={() => moveExercise(index,1)} disabled={index === activeWorkout.exercises.length - 1} aria-label="Move down"><Icon name="down"/></button><button className="mini-icon" onClick={() => setEditor({ workoutId: activeWorkout.id, exercise: { ...exercise }, isNew: false })} aria-label="Edit exercise"><Icon name="edit"/></button><button className="mini-icon danger" onClick={() => updateActiveWorkout({ exercises: activeWorkout.exercises.filter((item) => item.id !== exercise.id) })} aria-label="Delete exercise"><Icon name="trash"/></button></div></div>)}</div>
          {!activeWorkout.exercises.length && <div className="empty-editor">No exercises yet. Add one to start building this workout.</div>}
        </div>}
      </div>
    </section>}

    {view === "history" && <section className="workspace-page">
      <div className="page-intro"><div><span className="eyebrow">HISTORY</span><h1>Training history</h1></div></div>
      {!historyRows.length ? <div className="empty-state"><h3>No history yet.</h3><p>Finished workouts and logged cardio show up here.</p></div> : <div className="history-list">
        {historyRows.map((row) => <div key={row.id} className={`history-row ${row.kind}`}>
          <span className="history-icon"><Icon name={row.kind === "workout" ? "play" : "cardio"}/></span>
          <span className="history-copy"><strong>{row.title}</strong><small>{row.detail}</small></span>
          <span className="history-date">{describeDate(row.date)}</span>
          <button className="mini-icon danger" aria-label={`Delete ${row.title}`} onClick={() => row.kind === "workout" ? setWorkoutSessions((sessions) => sessions.filter((session) => session.id !== row.id)) : setCardioEntries((entries) => entries.filter((entry) => entry.id !== row.id))}><Icon name="trash"/></button>
        </div>)}
      </div>}
    </section>}

    <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><button className={view === "body" ? "active" : ""} onClick={() => setView("body")}><Icon name="body"/><span>Body</span></button><button className={view === "train" ? "active" : ""} onClick={() => setView("train")}><Icon name="play"/><span>Train</span></button><button className={view === "manage" ? "active" : ""} onClick={() => setView("manage")}><Icon name="list"/><span>Workouts</span></button><button className={view === "history" ? "active" : ""} onClick={() => setView("history")}><Icon name="history"/><span>History</span></button></nav>

    {editor && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditor(null); }}><section className="editor-panel" role="dialog" aria-modal="true" aria-labelledby="exercise-editor-title"><div className="settings-top"><div><span className="eyebrow">{editor.isNew ? "NEW EXERCISE" : "EDIT EXERCISE"}</span><h2 id="exercise-editor-title">Exercise setup</h2></div><button className="done-button" onClick={() => setEditor(null)}>Cancel</button></div><ExerciseForm exercise={editor.exercise} onChange={(exercise) => setEditor({ ...editor, exercise })}/><div className="panel-footer"><button className="primary-button" onClick={saveExercise}><Icon name="check"/> Save exercise</button></div></section></div>}

    {settingsOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}><section className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title"><div className="settings-top"><div><span className="eyebrow">KANGAROO GYM</span><h2 id="settings-title">Settings</h2></div><button className="done-button" onClick={() => setSettingsOpen(false)}>Done</button></div><SettingRow icon="sound" title="Voice cues" description="Say the next action 5 seconds before switching."><Toggle checked={voiceOn} onChange={setVoiceOn} label="Voice cues"/></SettingRow><div className="voice-block"><div><span className="setting-title">Voice style</span><p>Choose how the spoken cues should sound.</p></div><div className="voice-options">{(["Calm coach","Focused coach","Soft notification"] as VoiceStyle[]).map((style) => <button key={style} className={voiceStyle === style ? "selected" : ""} onClick={() => setVoiceStyle(style)}><span>{style}</span>{voiceStyle === style && <Icon name="check"/>}</button>)}</div></div><SettingRow icon="spark" title="Vibration" description="Use vibration for key transitions where available."><Toggle checked={vibration} onChange={setVibration} label="Vibration"/></SettingRow><SettingRow icon="rest" title="Rest timer" description="Optional rest timer between exercises. Currently off by default."><Toggle checked={restTimer} onChange={setRestTimer} label="Rest timer"/></SettingRow><button className="test-button" onClick={() => speak("Stay light on your feet. Your next exercise begins in five seconds.")}><Icon name="sound"/> Test voice</button></section></div>}
  </main>;
}

function ExerciseForm({ exercise, onChange }: { exercise: Exercise; onChange: (exercise: Exercise) => void }) {
  const patch = (values: Partial<Exercise>) => onChange({ ...exercise, ...values });
  return <div className="exercise-form"><div className="field-group full"><label htmlFor="exercise-name">Exercise name</label><input id="exercise-name" value={exercise.name} onChange={(event) => patch({ name:event.target.value })}/></div><div className="form-grid"><div className="field-group"><label htmlFor="exercise-mode">Tracking type</label><select id="exercise-mode" value={exercise.mode} onChange={(event) => patch({ mode:event.target.value as ExerciseMode })}><option value="sets">Sets / reps / distance</option><option value="hold">Timed hold</option><option value="interval">Run / walk intervals</option></select></div><NumberField label={exercise.mode === "interval" ? "Rounds" : exercise.mode === "hold" ? "Total holds" : "Sets"} value={exercise.sets} onChange={(sets) => patch({ sets })}/>{exercise.mode === "sets" && <><NumberField label="Target per set" value={exercise.target} onChange={(target) => patch({ target })}/><div className="field-group"><label>Unit</label><input value={exercise.unit} onChange={(event) => patch({ unit:event.target.value })} placeholder="reps, meters…"/></div></>}{exercise.mode === "hold" && <><NumberField label="Seconds per hold" value={exercise.duration} onChange={(duration) => patch({ duration })}/><label className="check-row"><input type="checkbox" checked={exercise.alternating} onChange={(event) => patch({ alternating:event.target.checked })}/><span><strong>Alternate sides</strong><small>Start left, then right, and repeat.</small></span></label></>}{exercise.mode === "interval" && <><NumberField label="Run seconds" value={exercise.runDuration} onChange={(runDuration) => patch({ runDuration })}/><NumberField label="Run speed (km/h)" value={exercise.runSpeed} onChange={(runSpeed) => patch({ runSpeed })}/><NumberField label="Walk seconds" value={exercise.walkDuration} onChange={(walkDuration) => patch({ walkDuration })}/><NumberField label="Walk speed (km/h)" value={exercise.walkSpeed} onChange={(walkSpeed) => patch({ walkSpeed })}/></>}</div><div className="muscle-picker"><label>Linked body parts</label><p>These update automatically when the exercise is completed.</p><div>{muscles.map((muscle) => <button type="button" key={muscle} className={exercise.muscles.includes(muscle) ? "selected" : ""} onClick={() => patch({ muscles:exercise.muscles.includes(muscle) ? exercise.muscles.filter((item) => item !== muscle) : [...exercise.muscles,muscle] })}>{exercise.muscles.includes(muscle) && <Icon name="check"/>}{muscle}</button>)}</div></div></div>;
}

function NumberField({ label, value, onChange }: { label:string; value:number; onChange:(value:number)=>void }) { return <div className="field-group"><label>{label}</label><input type="number" min="1" step="1" value={value} onChange={(event) => onChange(Math.max(1, Number(event.target.value)))}/></div>; }
function Toggle({ checked, onChange, label }: { checked:boolean; onChange:(value:boolean)=>void; label:string }) { return <button className={`toggle ${checked ? "on" : ""}`} role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}><span/></button>; }
function SettingRow({ icon, title, description, children }: { icon:string; title:string; description:string; children:React.ReactNode }) { return <div className="setting-row"><span className="setting-icon"><Icon name={icon}/></span><div><span className="setting-title">{title}</span><p>{description}</p></div>{children}</div>; }

function buildMaskPath(polygons: Point[][]) {
  const path = new Path2D();
  polygons.forEach((polygon) => {
    polygon.forEach(([x,y],index) => index === 0 ? path.moveTo(x,y) : path.lineTo(x,y));
    path.closePath();
  });
  return path;
}

function AnatomyCanvas({ history, selectedMuscle, onSelect }: { history: TrainingHistory; selectedMuscle: Muscle | null; onSelect: (muscle: Muscle) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const colors: Record<RecoveryStatus,string> = { recent:"#8ccf48", warning:"#f1b84a", overdue:"#f26f54", never:"#c4c8c2" };
  const statusFor = useCallback((muscle: Muscle) => {
    return getRecoveryStatus(history[muscle], profileFor(muscle));
  },[history]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current; const image = imageRef.current;
    if (!canvas || !image) return;
    const context = canvas.getContext("2d"); if (!context) return;
    context.clearRect(0,0,canvas.width,canvas.height);
    context.drawImage(image,0,0,canvas.width,canvas.height);
    muscleMasks.forEach((mask) => {
      const path = buildMaskPath(mask.polygons);
      context.save();
      context.globalCompositeOperation = "source-atop";
      context.globalAlpha = statusFor(mask.muscle) === "never" ? (mask.muscle === selectedMuscle ? .38 : .22) : (mask.muscle === selectedMuscle ? .7 : .55);
      context.fillStyle = colors[statusFor(mask.muscle)];
      context.fill(path);
      context.restore();
    });
  },[selectedMuscle,statusFor]);

  useEffect(() => {
    const image = new Image(); image.src = "./body-map-v2.png";
    image.onload = () => { imageRef.current = image; draw(); };
    return () => { image.onload = null; };
  },[draw]);
  useEffect(() => { draw(); },[draw]);

  const selectAtPoint = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect(); const x = (event.clientX - rect.left) * canvas.width / rect.width; const y = (event.clientY - rect.top) * canvas.height / rect.height;
    const context = canvas.getContext("2d"); if (!context) return;
    const hit = [...muscleMasks].reverse().find((mask) => context.isPointInPath(buildMaskPath(mask.polygons),x,y));
    if (hit) onSelect(hit.muscle);
  };

  return <canvas ref={canvasRef} className="anatomy-canvas" width="1448" height="1086" onClick={selectAtPoint} role="img" aria-label="Interactive faceless male anatomy showing front and back muscle recovery colors"/>;
}
