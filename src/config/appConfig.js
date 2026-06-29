export const APP_CONFIG = {
  appName: "Habit Tracker",
  version: "1.0.0",
  defaultUser: {
    name: "Sree",
  },
  greetingTimes: {
    morning: 5,
    afternoon: 12,
    evening: 17,
    night: 22
  },

  // ── Category Definitions ──────────────────────────────────
  categories: [
    { id: "health",       name: "Health",       icon: "heart-pulse",  defaultColor: "pastelMint" },
    { id: "diet",         name: "Diet",         icon: "apple",        defaultColor: "pastelAmber" },
    { id: "learning",     name: "Learning",     icon: "book-open",    defaultColor: "pastelLavender" },
    { id: "productivity", name: "Productivity",  icon: "zap",          defaultColor: "pastelSky" },
    { id: "selfcare",     name: "Self-Care",    icon: "sparkles",     defaultColor: "pastelPink" },
    { id: "finance",      name: "Finance",      icon: "wallet",       defaultColor: "pastelRose" }
  ],

  // ── Pastel Color Palette (for color picker) ──────────────
  pastelColors: [
    { key: "pastelMint",     hex: "#a7f3d0", label: "Mint" },
    { key: "pastelAmber",    hex: "#fde68a", label: "Amber" },
    { key: "pastelLavender", hex: "#ddd6fe", label: "Lavender" },
    { key: "pastelSky",      hex: "#bae6fd", label: "Sky" },
    { key: "pastelPink",     hex: "#fbcfe8", label: "Pink" },
    { key: "pastelRose",     hex: "#fecdd3", label: "Rose" }
  ],

  // ── Habit Presets (Exhaustive) ────────────────────────────
  // Types: "checkbox" (yes/no daily) | "number" (log a value daily)
  // Every habit has a weeklyTarget (1–7 days)
  presets: [
    // ─── Health ─────────────────────────────────────────────
    {
      id: "preset_gym",
      name: "Gym Workout",
      type: "checkbox",
      category: "health",
      weeklyTarget: 4,
      unit: "sessions",
      icon: "dumbbell",
      tags: ["Leg Day", "Push Day", "Pull Day", "Cardio", "Core"]
    },
    {
      id: "preset_steps",
      name: "Walk / Steps",
      type: "number",
      category: "health",
      weeklyTarget: 5,
      minGoal: 8000,
      maxGoal: null,
      unit: "steps",
      icon: "footprints",
      tags: []
    },
    {
      id: "preset_water",
      name: "Drink Water",
      type: "number",
      category: "health",
      weeklyTarget: 7,
      minGoal: 8,
      maxGoal: null,
      unit: "glasses",
      icon: "droplet",
      tags: []
    },
    {
      id: "preset_vitamins",
      name: "Take Vitamins",
      type: "checkbox",
      category: "health",
      weeklyTarget: 7,
      unit: "times",
      icon: "pill",
      tags: []
    },
    {
      id: "preset_yoga",
      name: "Stretch / Yoga",
      type: "checkbox",
      category: "health",
      weeklyTarget: 5,
      unit: "sessions",
      icon: "activity",
      tags: ["Morning Flow", "Evening Stretch", "Full Body"]
    },
    {
      id: "preset_sleep",
      name: "Sleep Hours",
      type: "number",
      category: "health",
      weeklyTarget: 6,
      minGoal: 7,
      maxGoal: 9,
      unit: "hours",
      icon: "moon",
      tags: []
    },
    {
      id: "preset_protein_shake",
      name: "Protein Shake",
      type: "checkbox",
      category: "health",
      weeklyTarget: 7,
      unit: "times",
      icon: "glass-water",
      tags: []
    },
    {
      id: "preset_cold_shower",
      name: "Cold Shower",
      type: "checkbox",
      category: "health",
      weeklyTarget: 5,
      unit: "times",
      icon: "snowflake",
      tags: []
    },
    {
      id: "preset_run",
      name: "Run / Cardio",
      type: "number",
      category: "health",
      weeklyTarget: 3,
      minGoal: 2,
      maxGoal: null,
      unit: "km",
      icon: "bike",
      tags: []
    },

    // ─── Diet ───────────────────────────────────────────────
    {
      id: "preset_calories",
      name: "Calorie Budget",
      type: "number",
      category: "diet",
      weeklyTarget: 6,
      minGoal: 1800,
      maxGoal: 2200,
      unit: "kcal",
      icon: "utensils",
      tags: []
    },
    {
      id: "preset_protein_intake",
      name: "Protein Intake",
      type: "number",
      category: "diet",
      weeklyTarget: 7,
      minGoal: 150,
      maxGoal: null,
      unit: "grams",
      icon: "beef",
      tags: []
    },
    {
      id: "preset_junkfood",
      name: "No Junk Food",
      type: "checkbox",
      category: "diet",
      weeklyTarget: 6,
      unit: "times",
      icon: "ban",
      tags: []
    },
    {
      id: "preset_no_sugar",
      name: "No Sugar",
      type: "checkbox",
      category: "diet",
      weeklyTarget: 5,
      unit: "times",
      icon: "candy-off",
      tags: []
    },
    {
      id: "preset_no_alcohol",
      name: "No Alcohol",
      type: "checkbox",
      category: "diet",
      weeklyTarget: 6,
      unit: "times",
      icon: "wine-off",
      tags: []
    },
    {
      id: "preset_vegetables",
      name: "Eat Vegetables",
      type: "checkbox",
      category: "diet",
      weeklyTarget: 7,
      unit: "times",
      icon: "salad",
      tags: []
    },
    {
      id: "preset_cook",
      name: "Cook at Home",
      type: "checkbox",
      category: "diet",
      weeklyTarget: 5,
      unit: "times",
      icon: "chef-hat",
      tags: []
    },

    // ─── Learning ───────────────────────────────────────────
    {
      id: "preset_read",
      name: "Read Books",
      type: "number",
      category: "learning",
      weeklyTarget: 5,
      minGoal: 30,
      maxGoal: null,
      unit: "min",
      icon: "book-open",
      tags: []
    },
    {
      id: "preset_sysdesign",
      name: "System Design Study",
      type: "checkbox",
      category: "learning",
      weeklyTarget: 5,
      unit: "sessions",
      icon: "network",
      tags: ["HLD", "LLD", "Databases", "Caching", "Queues", "Load Balancers"]
    },
    {
      id: "preset_leetcode",
      name: "LeetCode Problems",
      type: "number",
      category: "learning",
      weeklyTarget: 5,
      minGoal: 2,
      maxGoal: null,
      unit: "problems",
      icon: "code",
      tags: ["Arrays", "Graphs", "DP", "Trees", "Strings"]
    },
    {
      id: "preset_meditate",
      name: "Meditate",
      type: "number",
      category: "learning",
      weeklyTarget: 5,
      minGoal: 10,
      maxGoal: null,
      unit: "min",
      icon: "brain",
      tags: []
    },
    {
      id: "preset_journal",
      name: "Journal",
      type: "checkbox",
      category: "learning",
      weeklyTarget: 5,
      unit: "times",
      icon: "pencil",
      tags: []
    },
    {
      id: "preset_language",
      name: "Language Practice",
      type: "number",
      category: "learning",
      weeklyTarget: 4,
      minGoal: 20,
      maxGoal: null,
      unit: "min",
      icon: "languages",
      tags: []
    },

    // ─── Productivity ───────────────────────────────────────
    {
      id: "preset_wake_early",
      name: "Wake Up Before 6am",
      type: "checkbox",
      category: "productivity",
      weeklyTarget: 6,
      unit: "times",
      icon: "alarm-clock",
      tags: []
    },
    {
      id: "preset_no_social",
      name: "No Social Media",
      type: "checkbox",
      category: "productivity",
      weeklyTarget: 5,
      unit: "times",
      icon: "smartphone-off",
      tags: []
    },
    {
      id: "preset_deep_work",
      name: "Deep Work",
      type: "number",
      category: "productivity",
      weeklyTarget: 5,
      minGoal: 4,
      maxGoal: null,
      unit: "hours",
      icon: "focus",
      tags: []
    },
    {
      id: "preset_plan",
      name: "Plan Tomorrow",
      type: "checkbox",
      category: "productivity",
      weeklyTarget: 6,
      unit: "times",
      icon: "list-checks",
      tags: []
    },
    {
      id: "preset_no_youtube",
      name: "No YouTube",
      type: "checkbox",
      category: "productivity",
      weeklyTarget: 5,
      unit: "times",
      icon: "tv-off",
      tags: []
    },

    // ─── Self-Care ──────────────────────────────────────────
    {
      id: "preset_skincare",
      name: "Skincare Routine",
      type: "checkbox",
      category: "selfcare",
      weeklyTarget: 7,
      unit: "times",
      icon: "sparkles",
      tags: ["AM Routine", "PM Routine"]
    },
    {
      id: "preset_bathing",
      name: "Bathing",
      type: "checkbox",
      category: "selfcare",
      weeklyTarget: 7,
      unit: "times",
      icon: "shower-head",
      tags: []
    },
    {
      id: "preset_floss",
      name: "Floss",
      type: "checkbox",
      category: "selfcare",
      weeklyTarget: 7,
      unit: "times",
      icon: "smile",
      tags: []
    },
    {
      id: "preset_brush",
      name: "Brush Teeth 2x",
      type: "checkbox",
      category: "selfcare",
      weeklyTarget: 7,
      unit: "times",
      icon: "sunrise",
      tags: []
    },

    // ─── Finance ────────────────────────────────────────────
    {
      id: "preset_spend",
      name: "Daily Spend Budget",
      type: "number",
      category: "finance",
      weeklyTarget: 6,
      minGoal: null,
      maxGoal: 500,
      unit: "₹",
      icon: "wallet",
      tags: []
    },
    {
      id: "preset_no_impulse",
      name: "No Impulse Purchases",
      type: "checkbox",
      category: "finance",
      weeklyTarget: 7,
      unit: "times",
      icon: "shield-check",
      tags: []
    }
  ]
};
