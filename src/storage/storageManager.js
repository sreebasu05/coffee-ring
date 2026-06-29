import { APP_CONFIG } from '../config/appConfig.js';

// LocalStorage Keys
const KEYS = {
  USER_PROFILE: 'coffeering_user_profile',
  HABITS: 'coffeering_habits',
  CHECK_INS: 'coffeering_check_ins',
  CATEGORY_COLORS: 'coffeering_category_colors'
};

const getDefaultCategoryColors = () => {
  const map = {};
  APP_CONFIG.categories.forEach(cat => {
    map[cat.id] = cat.defaultColor;
  });
  return map;
};

// Seed 7 default starter habits
const STARTER_PRESET_IDS = [
  'preset_gym', 'preset_steps', 'preset_water', 'preset_calories',
  'preset_junkfood', 'preset_bathing', 'preset_spend'
];

const getDefaultHabits = () => APP_CONFIG.presets
  .filter(p => STARTER_PRESET_IDS.includes(p.id))
  .map((preset, index) => ({
    id: `habit_seed_${index}`,
    name: preset.name,
    type: preset.type,
    category: preset.category,
    weeklyTarget: preset.weeklyTarget || 7,
    minGoal: preset.minGoal || null,
    maxGoal: preset.maxGoal || null,
    unit: preset.unit,
    icon: preset.icon,
    tags: [...preset.tags],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
  }));

// Helper to generate 21 days of historical logs
const generate21DaysHistory = (habits) => {
  const checkIns = [];
  const today = new Date();
  
  // Go back 21 days
  for (let i = 21; i >= 1; i--) {
    const logDate = new Date();
    logDate.setDate(today.getDate() - i);
    
    const year = logDate.getFullYear();
    const month = String(logDate.getMonth() + 1).padStart(2, '0');
    const day = String(logDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const dayOfWeek = logDate.getDay(); // 0=Sunday, 1=Monday ...

    habits.forEach(h => {
      let shouldLog = false;
      let val = null;
      let tags = [];
      let note = "";

      if (h.name === "Gym Workout") {
        // Gym is 4x a week: Mon, Wed, Fri, Sat
        shouldLog = [1, 3, 5, 6].includes(dayOfWeek);
        val = 1;
        const routineTags = ["Leg Day", "Push Day", "Pull Day", "Cardio"];
        tags = [routineTags[dayOfWeek % routineTags.length]];
        note = `Workout session completed`;
      } 
      else if (h.name === "Walk / Steps") {
        // Steps logged most days, target is 8000
        shouldLog = Math.random() > 0.15;
        val = Math.floor(6500 + Math.random() * 5000); // 6500 to 11500
        note = `Walked around the park`;
      }
      else if (h.name === "Drink Water") {
        // Drink water target 8, logged every day
        shouldLog = true;
        val = Math.floor(6 + Math.random() * 5); // 6 to 10 glasses
      }
      else if (h.name === "Calorie Budget") {
        // Calories logged every day, target 1800-2200
        shouldLog = true;
        val = Math.floor(1700 + Math.random() * 600); // 1700 to 2300 kcal
        if (val > 2200) note = "Slightly over budget today";
      }
      else if (h.name === "No Junk Food") {
        // Yes/No habit, 85% success rate
        shouldLog = Math.random() > 0.15;
        val = 1;
      }
      else if (h.name === "Bathing") {
        // Bathing completed daily
        shouldLog = true;
        val = 1;
      }
      else if (h.name === "Daily Spend Budget") {
        // Spend budget logged daily, max target 500
        shouldLog = Math.random() > 0.05;
        val = Math.floor(150 + Math.random() * 450); // 150 to 600 rupees
        if (val > 500) note = "Bought some groceries";
      }

      if (shouldLog) {
        checkIns.push({
          id: `log_seed_${h.id}_${dateStr}`,
          habitId: h.id,
          date: dateStr,
          value: val,
          tags,
          note,
          timestamp: logDate.getTime()
        });
      }
    });
  }

  return checkIns;
};

export const StorageManager = {
  init(forceReset = false) {
    if (forceReset) {
      localStorage.removeItem(KEYS.USER_PROFILE);
      localStorage.removeItem(KEYS.HABITS);
      localStorage.removeItem(KEYS.CHECK_INS);
      localStorage.removeItem(KEYS.CATEGORY_COLORS);
    }
    
    // If not registered yet, do not seed default values
    if (!localStorage.getItem(KEYS.USER_PROFILE)) {
      return;
    }
    
    let habits = null;
    if (!localStorage.getItem(KEYS.HABITS)) {
      habits = [];
      localStorage.setItem(KEYS.HABITS, JSON.stringify(habits));
    } else {
      habits = JSON.parse(localStorage.getItem(KEYS.HABITS));
    }

    if (!localStorage.getItem(KEYS.CHECK_INS)) {
      localStorage.setItem(KEYS.CHECK_INS, JSON.stringify([]));
    }
    
    if (!localStorage.getItem(KEYS.CATEGORY_COLORS)) {
      localStorage.setItem(KEYS.CATEGORY_COLORS, JSON.stringify(getDefaultCategoryColors()));
    }
  },

  registerUser(name, chosenPresetIds = [], generateHistory = true) {
    const userProfile = { name };
    localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(userProfile));

    // Resolve category colors
    localStorage.setItem(KEYS.CATEGORY_COLORS, JSON.stringify(getDefaultCategoryColors()));

    // Get preset list
    const presets = APP_CONFIG.presets || [];
    const habits = presets
      .filter(p => chosenPresetIds.includes(p.id))
      .map((preset, index) => ({
        id: `habit_preset_${Date.now()}_${index}`,
        name: preset.name,
        type: preset.type,
        category: preset.category,
        weeklyTarget: preset.weeklyTarget || 7,
        minGoal: preset.minGoal || null,
        maxGoal: preset.maxGoal || null,
        unit: preset.unit,
        icon: preset.icon,
        tags: [...preset.tags],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }));

    localStorage.setItem(KEYS.HABITS, JSON.stringify(habits));

    if (generateHistory && habits.length > 0) {
      const seededCheckIns = generate21DaysHistory(habits);
      localStorage.setItem(KEYS.CHECK_INS, JSON.stringify(seededCheckIns));
    } else {
      localStorage.setItem(KEYS.CHECK_INS, JSON.stringify([]));
    }
  },

  getUserProfile() {
    this.init();
    return JSON.parse(localStorage.getItem(KEYS.USER_PROFILE));
  },

  saveUserProfile(profile) {
    localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
  },

  getHabits() {
    this.init();
    return JSON.parse(localStorage.getItem(KEYS.HABITS));
  },

  saveHabit(habit) {
    const habits = this.getHabits();
    const index = habits.findIndex(h => h.id === habit.id);
    if (index >= 0) {
      habits[index] = habit;
    } else {
      habits.push(habit);
    }
    localStorage.setItem(KEYS.HABITS, JSON.stringify(habits));
    return habits;
  },

  deleteHabit(id) {
    const habits = this.getHabits().filter(h => h.id !== id);
    localStorage.setItem(KEYS.HABITS, JSON.stringify(habits));
    
    const checkIns = this.getCheckIns().filter(c => c.habitId !== id);
    localStorage.setItem(KEYS.CHECK_INS, JSON.stringify(checkIns));
    return habits;
  },

  getCheckIns() {
    this.init();
    return JSON.parse(localStorage.getItem(KEYS.CHECK_INS));
  },

  saveCheckIn(checkIn) {
    const logs = this.getCheckIns();
    const index = logs.findIndex(log => log.habitId === checkIn.habitId && log.date === checkIn.date);
    
    if (index >= 0) {
      logs[index] = { ...logs[index], ...checkIn };
    } else {
      logs.push(checkIn);
    }
    localStorage.setItem(KEYS.CHECK_INS, JSON.stringify(logs));
    return logs;
  },

  removeCheckIn(habitId, date) {
    const logs = this.getCheckIns().filter(log => !(log.habitId === habitId && log.date === date));
    localStorage.setItem(KEYS.CHECK_INS, JSON.stringify(logs));
    return logs;
  },

  // ── Category Color Management ─────────────────────────────
  getCategoryColors() {
    this.init();
    return JSON.parse(localStorage.getItem(KEYS.CATEGORY_COLORS));
  },

  saveCategoryColors(colorMap) {
    localStorage.setItem(KEYS.CATEGORY_COLORS, JSON.stringify(colorMap));
  }
};
