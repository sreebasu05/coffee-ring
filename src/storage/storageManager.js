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
  .map((preset, index) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateStr = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(thirtyDaysAgo.getDate()).padStart(2, '0')}`;
    return {
      id: `habit_seed_${index}`,
      name: preset.name,
      type: preset.type,
      category: preset.category,
      weeklyTarget: preset.weeklyTarget || 7,
      weeklyTargetHistory: [{ date: dateStr, target: preset.weeklyTarget || 7 }],
      minGoal: preset.minGoal || null,
      maxGoal: preset.maxGoal || null,
      unit: preset.unit,
      icon: preset.icon,
      tags: [...preset.tags],
      createdAt: thirtyDaysAgo.toISOString()
    };
  });

// Helper to generate 30 days of historical logs
const generate21DaysHistory = (habits) => {
  const checkIns = [];
  const today = new Date();
  
  // Define 4 weeks of day offsets: Week 1 (30-22), Week 2 (21-15), Week 3 (14-8), Week 4 (7-1)
  const weeks = [
    [30, 29, 28, 27, 26, 25, 24, 23, 22],
    [21, 20, 19, 18, 17, 16, 15],
    [14, 13, 12, 11, 10, 9, 8],
    [7, 6, 5, 4, 3, 2, 1]
  ];

  // For each habit, assign a consistency profile:
  // - 'perfect': Meets the weekly target 100% of the time.
  // - 'average': Meets about 70% of the weekly target.
  // - 'failing': Meets only 30% of the weekly target.
  const profiles = habits.map((h, idx) => {
    if (idx % 3 === 0) return 'perfect';
    if (idx % 3 === 1) return 'average';
    return 'failing';
  });

  weeks.forEach((weekOffsets, weekIdx) => {
    habits.forEach((h, hIdx) => {
      const profile = profiles[hIdx];
      const target = h.weeklyTarget || 7;
      const weekLength = weekOffsets.length;
      
      // Scale target depending on the number of days in the week block (e.g. 9 days vs 7 days)
      const scaledTarget = Math.max(1, Math.round((target / 7) * weekLength));
      
      // Determine how many days to log for this habit this week
      let daysToLog = 0;
      if (profile === 'perfect') {
        daysToLog = scaledTarget;
      } else if (profile === 'average') {
        daysToLog = Math.max(1, Math.round(scaledTarget * 0.7));
      } else { // failing
        daysToLog = Math.max(0, Math.floor(scaledTarget * 0.3));
      }

      // Randomly select which days of the week to log
      const shuffledOffsets = [...weekOffsets].sort(() => 0.5 - Math.random());
      const selectedOffsets = shuffledOffsets.slice(0, daysToLog);

      selectedOffsets.forEach(offset => {
        const logDate = new Date();
        logDate.setDate(today.getDate() - offset);
        
        const year = logDate.getFullYear();
        const month = String(logDate.getMonth() + 1).padStart(2, '0');
        const day = String(logDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        let val = 1;
        let tags = [];
        let note = "";

        // Determine value if it's a numeric habit
        if (h.type === 'number') {
          const hasMin = h.minGoal !== null && h.minGoal !== undefined && h.minGoal !== "";
          const hasMax = h.maxGoal !== null && h.maxGoal !== undefined && h.maxGoal !== "";
          
          if (hasMin && hasMax) {
            const min = parseFloat(h.minGoal);
            const max = parseFloat(h.maxGoal);
            // Some logs might slightly miss the goal if the profile is failing
            if (profile === 'failing' && Math.random() > 0.5) {
              val = Math.floor(min - 1 - Math.random() * 5);
            } else {
              val = Math.floor(min + Math.random() * (max - min + 1));
            }
          } else if (hasMin) {
            const min = parseFloat(h.minGoal);
            val = profile === 'failing' && Math.random() > 0.5
              ? Math.floor(min - 1 - Math.random() * 3)
              : Math.floor(min + Math.random() * 5);
          } else if (hasMax) {
            const max = parseFloat(h.maxGoal);
            val = profile === 'failing' && Math.random() > 0.5
              ? Math.floor(max + 1 + Math.random() * 3)
              : Math.floor(max - Math.random() * 5);
          } else {
            val = Math.floor(5 + Math.random() * 10);
          }
        }

        // Add some realistic notes and tags if the preset has them
        if (h.tags && h.tags.length > 0) {
          // Log 1 or 2 tags
          const numTags = Math.floor(1 + Math.random() * 2);
          tags = [...h.tags].sort(() => 0.5 - Math.random()).slice(0, numTags);
        }

        if (Math.random() > 0.7) {
          const notes = ["Feeling good", "Productive session", "Completed early", "Routine maintained"];
          note = notes[Math.floor(Math.random() * notes.length)];
        }

        checkIns.push({
          id: `log_seed_${h.id}_${dateStr}`,
          habitId: h.id,
          date: dateStr,
          value: val,
          tags,
          note,
          timestamp: logDate.getTime()
        });
      });
    });
  });

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

  seedHistoryForCurrentHabits() {
    const habits = this.getHabits() || [];
    if (habits.length === 0) return [];
    const seeded = generate21DaysHistory(habits);
    localStorage.setItem(KEYS.CHECK_INS, JSON.stringify(seeded));
    return seeded;
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

  saveHabitsList(habits) {
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
