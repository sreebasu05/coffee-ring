import { StorageManager } from '../storage/storageManager.js';
import { APP_CONFIG } from '../config/appConfig.js';

class AppState {
  constructor() {
    this.user = null;
    this.habits = [];
    this.checkIns = [];
    this.categoryColors = {};
    
    // Default selected date is today (YYYY-MM-DD local format)
    this.selectedDate = this.formatDate(new Date());
    
    // Listeners for reactive UI rendering
    this.listeners = [];
  }

  formatDate(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  init() {
    StorageManager.init();
    this.user = StorageManager.getUserProfile();
    this.habits = StorageManager.getHabits() || [];
    this.checkIns = StorageManager.getCheckIns() || [];
    
    // 1. If database is completely empty (no user profile), auto-register a default profile
    if (this.user === null) {
      const defaultPresets = ["preset_gym", "preset_steps", "preset_water", "preset_calories"];
      StorageManager.registerUser(APP_CONFIG.defaultUser?.name || "Test User", defaultPresets, true);
      this.user = StorageManager.getUserProfile();
      this.habits = StorageManager.getHabits() || [];
      this.checkIns = StorageManager.getCheckIns() || [];
    } else {
      // 2. If user exists, ensure they have the default demo habits (Gym, Steps, Water, Calories)
      const defaultPresetIds = ["preset_gym", "preset_steps", "preset_water", "preset_calories"];
      const currentHabitNames = new Set(this.habits.map(h => h.name.toLowerCase()));
      const presets = APP_CONFIG.presets || [];
      
      const missingHabits = presets
        .filter(p => defaultPresetIds.includes(p.id) && !currentHabitNames.has(p.name.toLowerCase()))
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

      if (missingHabits.length > 0) {
        this.habits = [...this.habits, ...missingHabits];
        StorageManager.saveHabitsList(this.habits);
        // Force a fresh seeding of history to include these new habits
        this.checkIns = StorageManager.seedHistoryForCurrentHabits();
      }
    }

    // 3. Auto-seed history if history is completely empty
    if (this.habits.length > 0 && this.checkIns.length === 0) {
      this.checkIns = StorageManager.seedHistoryForCurrentHabits();
    }
    
    this.categoryColors = StorageManager.getCategoryColors() || {};
    this.notify();
  }

  registerUser(name, chosenPresetIds = [], generateHistory = true) {
    StorageManager.registerUser(name, chosenPresetIds, generateHistory);
    this.init();
  }

  // Force reset data to default seeds
  resetData() {
    StorageManager.init(true); // force reset database
    this.user = StorageManager.getUserProfile();
    this.habits = StorageManager.getHabits();
    this.checkIns = StorageManager.getCheckIns();
    this.categoryColors = StorageManager.getCategoryColors();
    this.selectedDate = this.formatDate(new Date());
    this.notify();
  }

  setSelectedDate(dateString) {
    this.selectedDate = dateString;
    this.notify();
  }

  saveHabit(habit) {
    this.habits = StorageManager.saveHabit(habit);
    this.notify();
  }

  deleteHabit(id) {
    this.habits = StorageManager.deleteHabit(id);
    this.checkIns = StorageManager.getCheckIns();
    this.notify();
  }

  togglePauseHabit(id) {
    const habit = this.habits.find(h => h.id === id);
    if (!habit) return;
    const todayStr = this.formatDate(new Date());
    habit.paused = !habit.paused;
    habit.pauseHistory = habit.pauseHistory || [];
    if (habit.paused) {
      habit.pauseHistory.push({ pausedAt: todayStr, resumedAt: null });
    } else {
      const activePause = habit.pauseHistory.find(p => p.resumedAt === null);
      if (activePause) {
        activePause.resumedAt = todayStr;
      }
    }
    this.habits = StorageManager.saveHabit(habit);
    this.notify();
  }

  isDatePaused(habit, dateStr) {
    if (!habit.pauseHistory || habit.pauseHistory.length === 0) return false;
    // Strip time from compared targets by parsing to YYYY-MM-DD local equivalence
    const targetTime = new Date(dateStr + "T00:00:00").getTime();
    return habit.pauseHistory.some(interval => {
      const start = new Date(interval.pausedAt + "T00:00:00").getTime();
      const end = interval.resumedAt 
        ? new Date(interval.resumedAt + "T00:00:00").getTime() 
        : new Date(this.formatDate(new Date()) + "T00:00:00").getTime();
      return targetTime >= start && targetTime <= end;
    });
  }

  logCheckIn(habitId, value, tags = [], note = "") {
    const checkIn = {
      id: `log_${Date.now()}`,
      habitId,
      date: this.selectedDate,
      value,
      tags,
      note,
      timestamp: Date.now()
    };
    this.checkIns = StorageManager.saveCheckIn(checkIn);
    this.notify();
  }

  removeCheckIn(habitId) {
    this.checkIns = StorageManager.removeCheckIn(habitId, this.selectedDate);
    this.notify();
  }

  getLogForHabit(habitId) {
    return this.checkIns.find(log => log.habitId === habitId && log.date === this.selectedDate) || null;
  }

  getWeeklyCount(habitId) {
    const current = new Date();
    const startOfWeek = new Date(current.setDate(current.getDate() - current.getDay() + (current.getDay() === 0 ? -6 : 1))); // Monday
    startOfWeek.setHours(0,0,0,0);

    return this.checkIns.filter(log => {
      if (log.habitId !== habitId) return false;
      const logTime = new Date(log.date).getTime();
      return logTime >= startOfWeek.getTime();
    }).length;
  }

  // ── Category Color Helpers ──────────────────────────────
  getCategoryColor(categoryId) {
    return this.categoryColors[categoryId] || 'pastelMint';
  }

  updateCategoryColor(categoryId, colorKey) {
    this.categoryColors[categoryId] = colorKey;
    StorageManager.saveCategoryColors(this.categoryColors);
    this.notify();
  }

  // ── Insights & Stats Calculation Engine ───────────────────

  getWeekStartAndEnd(offset = 0) {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) - (offset * 7);
    
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start.getTime());
    end.setDate(start.getDate() + 6);
    return { start, end };
  }

  getCurrentWeekStatus(habitId) {
    const { start } = this.getWeekStartAndEnd(0);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getTime());
      d.setDate(start.getDate() + i);
      const dateStr = this.formatDate(d);
      
      const log = this.checkIns.find(l => l.habitId === habitId && l.date === dateStr);
      let isCompleted = log !== null && log !== undefined;
      
      const habit = this.habits.find(h => h.id === habitId);
      if (habit && habit.type === 'number' && log && log.value !== null && log.value !== undefined) {
        const val = log.value;
        const min = (habit.minGoal !== null && habit.minGoal !== undefined && habit.minGoal !== "") ? parseFloat(habit.minGoal) : -Infinity;
        const max = (habit.maxGoal !== null && habit.maxGoal !== undefined && habit.maxGoal !== "") ? parseFloat(habit.maxGoal) : Infinity;
        isCompleted = val >= min && val <= max;
      }
      
      days.push({
        dateStr,
        isCompleted,
        dayName: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]
      });
    }
    return days;
  }

  getWeekLogsCount(habitId, offset = 0) {
    const { start, end } = this.getWeekStartAndEnd(offset);
    return this.checkIns.filter(log => {
      if (log.habitId !== habitId) return false;
      
      let isCompleted = true;
      const habit = this.habits.find(h => h.id === habitId);
      if (habit && habit.type === 'number' && log.value !== null && log.value !== undefined) {
        const val = log.value;
        const min = (habit.minGoal !== null && habit.minGoal !== undefined && habit.minGoal !== "") ? parseFloat(habit.minGoal) : -Infinity;
        const max = (habit.maxGoal !== null && habit.maxGoal !== undefined && habit.maxGoal !== "") ? parseFloat(habit.maxGoal) : Infinity;
        isCompleted = val >= min && val <= max;
      }

      const logTime = new Date(log.date).getTime();
      return isCompleted && logTime >= start.getTime() && logTime <= end.getTime();
    }).length;
  }

  getWeeklyTargetForDate(habitId, dateStr) {
    const habit = this.habits.find(h => h.id === habitId);
    if (!habit) return 7;
    
    if (!habit.weeklyTargetHistory || habit.weeklyTargetHistory.length === 0) {
      return habit.weeklyTarget || 7;
    }
    
    const sorted = [...habit.weeklyTargetHistory].sort((a, b) => a.date.localeCompare(b.date));
    
    let activeTarget = habit.weeklyTarget || 7;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].date <= dateStr) {
        activeTarget = sorted[i].target;
      } else {
        break;
      }
    }
    
    return activeTarget;
  }

  // ── Weekly Streaks ────────────────────────────────────────
  getWeeklyStreak(habitId) {
    const habit = this.habits.find(h => h.id === habitId);
    if (!habit) return 0;
    
    let streak = 0;
    let offset = 0;
    
    const { start: currentStart } = this.getWeekStartAndEnd(0);
    const currentTarget = this.getWeeklyTargetForDate(habitId, this.formatDate(currentStart));
    const currentWeekCount = this.getWeekLogsCount(habitId, 0);
    const currentWeekMet = currentWeekCount >= currentTarget;
    
    if (currentWeekMet) {
      streak = 1;
      offset = 1;
      while (true) {
        const { start } = this.getWeekStartAndEnd(offset);
        const target = this.getWeeklyTargetForDate(habitId, this.formatDate(start));
        const count = this.getWeekLogsCount(habitId, offset);
        if (count >= target) {
          streak++;
          offset++;
        } else {
          break;
        }
      }
    } else {
      offset = 1;
      while (true) {
        const { start } = this.getWeekStartAndEnd(offset);
        const target = this.getWeeklyTargetForDate(habitId, this.formatDate(start));
        const count = this.getWeekLogsCount(habitId, offset);
        if (count >= target) {
          streak++;
          offset++;
        } else {
          break;
        }
      }
    }
    return streak;
  }

  getBestWeeklyStreak(habitId) {
    const habit = this.habits.find(h => h.id === habitId);
    if (!habit) return 0;
    
    let maxStreak = 0;
    let currentStreak = 0;
    
    for (let offset = 52; offset >= 0; offset--) {
      const { start } = this.getWeekStartAndEnd(offset);
      const target = this.getWeeklyTargetForDate(habitId, this.formatDate(start));
      const count = this.getWeekLogsCount(habitId, offset);
      if (count >= target) {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
      } else {
        currentStreak = 0;
      }
    }
    return maxStreak;
  }

  // ── Daily Streaks ─────────────────────────────────────────
  getDailyStreak(habitId) {
    const habit = this.habits.find(h => h.id === habitId);
    if (!habit) return 0;

    const habitLogs = this.checkIns.filter(log => {
      if (log.habitId !== habitId) return false;
      if (habit.type === 'number' && log.value !== null && log.value !== undefined) {
        const val = log.value;
        const min = (habit.minGoal !== null && habit.minGoal !== undefined && habit.minGoal !== "") ? parseFloat(habit.minGoal) : -Infinity;
        const max = (habit.maxGoal !== null && habit.maxGoal !== undefined && habit.maxGoal !== "") ? parseFloat(habit.maxGoal) : Infinity;
        return val >= min && val <= max;
      }
      return true;
    });

    const loggedDates = new Set(habitLogs.map(l => l.date));
    
    let streak = 0;
    const checkDate = new Date();
    
    let checkStr = this.formatDate(checkDate);
    let isTodayCompleted = loggedDates.has(checkStr);
    let isTodayPaused = this.isDatePaused(habit, checkStr);

    if (isTodayCompleted) {
      streak = 1;
    } else if (isTodayPaused) {
      streak = 0; 
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
      checkStr = this.formatDate(checkDate);
      
      while (this.isDatePaused(habit, checkStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
        checkStr = this.formatDate(checkDate);
      }
      
      if (loggedDates.has(checkStr)) {
        streak = 1;
      } else {
        return 0;
      }
    }

    while (true) {
      checkDate.setDate(checkDate.getDate() - 1);
      checkStr = this.formatDate(checkDate);

      if (this.isDatePaused(habit, checkStr)) {
        continue;
      }

      if (loggedDates.has(checkStr)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  getBestDailyStreak(habitId) {
    const habit = this.habits.find(h => h.id === habitId);
    if (!habit) return 0;

    const habitLogs = this.checkIns.filter(log => {
      if (log.habitId !== habitId) return false;
      if (habit.type === 'number' && log.value !== null && log.value !== undefined) {
        const val = log.value;
        const min = (habit.minGoal !== null && habit.minGoal !== undefined && habit.minGoal !== "") ? parseFloat(habit.minGoal) : -Infinity;
        const max = (habit.maxGoal !== null && habit.maxGoal !== undefined && habit.maxGoal !== "") ? parseFloat(habit.maxGoal) : Infinity;
        return val >= min && val <= max;
      }
      return true;
    });

    const loggedDates = new Set(habitLogs.map(l => l.date));
    if (loggedDates.size === 0) return 0;

    let maxStreak = 0;
    let currentStreak = 0;

    const checkDate = new Date();
    for (let i = 90; i >= 0; i--) {
      const tempDate = new Date();
      tempDate.setDate(checkDate.getDate() - i);
      const dateStr = this.formatDate(tempDate);

      if (this.isDatePaused(habit, dateStr)) {
        continue;
      }

      if (loggedDates.has(dateStr)) {
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
      } else {
        currentStreak = 0;
      }
    }
    return maxStreak;
  }

  getCompletionRate(habitId, days = 30) {
    const habit = this.habits.find(h => h.id === habitId);
    if (!habit) return 0;

    const createdDate = new Date(habit.createdAt);
    // Find the Monday of the week the habit was created
    const createdDay = createdDate.getDay();
    const createdMonday = new Date(createdDate);
    const diffToMonday = createdDay === 0 ? -6 : 1 - createdDay;
    createdMonday.setDate(createdDate.getDate() + diffToMonday);
    createdMonday.setHours(0,0,0,0);

    // Find the Monday of the current week
    const now = new Date();
    const nowDay = now.getDay();
    const currentMonday = new Date(now);
    const diffToCurrentMonday = nowDay === 0 ? -6 : 1 - nowDay;
    currentMonday.setDate(now.getDate() + diffToCurrentMonday);
    currentMonday.setHours(0,0,0,0);

    // If the habit was created this week, there are 0 completed weeks
    if (createdMonday.getTime() >= currentMonday.getTime()) {
      return 0; // Not enough full calendar weeks of data yet
    }

    // Generate list of completed weeks (up to 4 weeks)
    const completedWeeksMondays = [];
    let tempMonday = new Date(createdMonday);
    
    const maxWeeks = Math.ceil(days / 7);
    const cutoffMonday = new Date(currentMonday);
    cutoffMonday.setDate(currentMonday.getDate() - (maxWeeks * 7));

    while (tempMonday.getTime() < currentMonday.getTime()) {
      if (tempMonday.getTime() >= cutoffMonday.getTime()) {
        completedWeeksMondays.push(new Date(tempMonday));
      }
      tempMonday.setDate(tempMonday.getDate() + 7);
    }

    if (completedWeeksMondays.length === 0) return 0;

    let weeksMet = 0;

    completedWeeksMondays.forEach(monday => {
      const target = this.getWeeklyTargetForDate(habitId, this.formatDate(monday));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23,59,59,999);

      const count = this.checkIns.filter(log => {
        if (log.habitId !== habitId) return false;
        const logDate = new Date(log.date + "T00:00:00");
        
        if (habit.type === 'number' && log.value !== null && log.value !== undefined) {
          const val = log.value;
          const min = (habit.minGoal !== null && habit.minGoal !== undefined && habit.minGoal !== "") ? parseFloat(habit.minGoal) : -Infinity;
          const max = (habit.maxGoal !== null && habit.maxGoal !== undefined && habit.maxGoal !== "") ? parseFloat(habit.maxGoal) : Infinity;
          if (val < min || val > max) return false;
        }

        return logDate.getTime() >= monday.getTime() && logDate.getTime() <= sunday.getTime();
      }).length;

      if (count >= target) {
        weeksMet++;
      }
    });

    return Math.round((weeksMet / completedWeeksMondays.length) * 100);
  }

  getLoggingFidelity(habitId) {
    const logs = this.checkIns.filter(log => log.habitId === habitId);
    if (logs.length === 0) return 0;
    
    const detailedLogs = logs.filter(log => {
      const hasValue = log.value !== null && log.value !== undefined && log.value !== "";
      const hasNote = log.note && log.note.trim() !== "";
      const hasTags = log.tags && log.tags.length > 0;
      return hasValue || hasNote || hasTags;
    });
    
    return Math.round((detailedLogs.length / logs.length) * 100);
  }

  getOverallLoggingFidelity() {
    if (this.checkIns.length === 0) return 0;
    const detailedLogs = this.checkIns.filter(log => {
      const hasValue = log.value !== null && log.value !== undefined && log.value !== "";
      const hasNote = log.note && log.note.trim() !== "";
      const hasTags = log.tags && log.tags.length > 0;
      return hasValue || hasNote || hasTags;
    });
    return Math.round((detailedLogs.length / this.checkIns.length) * 100);
  }

  getTodayCompletionRate() {
    if (this.habits.length === 0) return 0;
    const completedToday = this.habits.filter(h => this.getLogForHabit(h.id) !== null).length;
    return Math.round((completedToday / this.habits.length) * 100);
  }

  getWeeklyGoalProgress() {
    const todayStr = this.formatDate(new Date());
    return this.habits.filter(h => {
      const weeklyCount = this.getWeeklyCount(h.id);
      const target = this.getWeeklyTargetForDate(h.id, todayStr);
      return weeklyCount >= target;
    }).length;
  }

  getCategoryCompletion(categoryId) {
    const catHabits = this.habits.filter(h => h.category === categoryId);
    if (catHabits.length === 0) return 0;
    
    let totalTarget = 0;
    let totalCompleted = 0;
    const todayStr = this.formatDate(new Date());
    
    catHabits.forEach(h => {
      totalTarget += this.getWeeklyTargetForDate(h.id, todayStr);
      totalCompleted += this.getWeeklyCount(h.id);
    });
    
    if (totalTarget === 0) return 0;
    return Math.round((totalCompleted / totalTarget) * 100);
  }

  getWeeklyDayByDayActivity() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const current = new Date();
    const currentDay = current.getDay();
    const mondayDiff = current.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    
    return days.map((dayName, idx) => {
      const d = new Date(current.getTime());
      d.setDate(mondayDiff + idx);
      const dateStr = this.formatDate(d);
      
      if (this.habits.length === 0) return { day: dayName.substring(0, 3), pct: 0 };
      
      const completedOnDay = this.checkIns.filter(log => log.date === dateStr).length;
      const pct = Math.round((completedOnDay / this.habits.length) * 100);
      return {
        day: dayName.substring(0, 3),
        pct: Math.min(100, pct)
      };
    });
  }

  getHighlights() {
    if (this.habits.length === 0 || this.checkIns.length < 7) {
      return { best: null, worst: null, streakChampion: null, isLocked: true };
    }

    const rateHabits = this.habits.map(h => ({ 
      habit: h, 
      rate: this.getCompletionRate(h.id, 30), 
      streak: this.getWeeklyStreak(h.id) 
    }));

    const maxRate = Math.max(...rateHabits.map(x => x.rate));
    const minRate = Math.min(...rateHabits.map(x => x.rate));
    const maxStreak = Math.max(...rateHabits.map(x => x.streak));

    const bestHabits = rateHabits.filter(x => x.rate === maxRate && maxRate > 0);
    const worstHabits = rateHabits.filter(x => x.rate === minRate && minRate < 100);
    const streakHabits = rateHabits.filter(x => x.streak === maxStreak && maxStreak > 0);

    const best = bestHabits.length > 0 ? bestHabits[Math.floor(Math.random() * bestHabits.length)] : null;
    const worst = worstHabits.length > 0 ? worstHabits[Math.floor(Math.random() * worstHabits.length)] : null;
    const streakChamp = streakHabits.length > 0 ? streakHabits[Math.floor(Math.random() * streakHabits.length)] : null;

    return {
      best: best ? { habit: best.habit, rate: best.rate } : null,
      worst: worst ? { habit: worst.habit, rate: worst.rate } : null,
      streakChampion: streakChamp ? { habit: streakChamp.habit, streak: streakChamp.streak } : null
    };
  }

  // Get tag frequency list sorted by usage counts
  getTagFrequency(habitId) {
    const logs = this.checkIns.filter(log => log.habitId === habitId);
    const counts = {};
    logs.forEach(log => {
      if (log.tags && Array.isArray(log.tags)) {
        log.tags.forEach(tag => {
          counts[tag] = (counts[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Get numeric statistics
  getNumberStats(habitId) {
    const logs = this.checkIns.filter(log => log.habitId === habitId && log.value !== null && log.value !== undefined);
    if (logs.length === 0) {
      return { avg7: 0, avg30: 0, min: 0, max: 0, onTargetRate: 0, trend: 'Stable' };
    }

    const values = logs.map(l => l.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    const now = new Date();
    const cutoff7 = new Date(); cutoff7.setDate(now.getDate() - 7);
    const cutoff30 = new Date(); cutoff30.setDate(now.getDate() - 30);

    const logs7 = logs.filter(l => new Date(l.date).getTime() >= cutoff7.getTime());
    const logs30 = logs.filter(l => new Date(l.date).getTime() >= cutoff30.getTime());

    const avg7 = logs7.length ? Math.round(logs7.reduce((sum, l) => sum + l.value, 0) / logs7.length) : 0;
    const avg30 = logs30.length ? Math.round(logs30.reduce((sum, l) => sum + l.value, 0) / logs30.length) : 0;

    const habit = this.habits.find(h => h.id === habitId);
    let onTargetCount = 0;
    if (habit) {
      const minTarget = (habit.minGoal !== null && habit.minGoal !== undefined && habit.minGoal !== "") ? parseFloat(habit.minGoal) : -Infinity;
      const maxTarget = (habit.maxGoal !== null && habit.maxGoal !== undefined && habit.maxGoal !== "") ? parseFloat(habit.maxGoal) : Infinity;
      
      logs.forEach(l => {
        if (l.value >= minTarget && l.value <= maxTarget) {
          onTargetCount++;
        }
      });
    }
    const onTargetRate = Math.round((onTargetCount / logs.length) * 100);

    const cutoff14 = new Date(); cutoff14.setDate(now.getDate() - 14);
    const prev7Logs = logs.filter(l => {
      const t = new Date(l.date).getTime();
      return t >= cutoff14.getTime() && t < cutoff7.getTime();
    });
    const prev7Avg = prev7Logs.length ? Math.round(prev7Logs.reduce((sum, l) => sum + l.value, 0) / prev7Logs.length) : 0;

    let trend = 'Stable';
    if (prev7Avg > 0) {
      const diffPct = ((avg7 - prev7Avg) / prev7Avg) * 100;
      if (diffPct > 5) trend = 'Trending Up';
      else if (diffPct < -5) trend = 'Trending Down';
    }

    return { avg7, avg30, min, max, onTargetRate, trend };
  }

  // Get notes logged for this habit (max 5)
  getRecentNotes(habitId) {
    return this.checkIns
      .filter(log => log.habitId === habitId && log.note && log.note.trim() !== "")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(log => ({
        date: log.date,
        value: log.value,
        note: log.note
      }));
  }

  // Calculate behavioral insights from history logs
  getBehavioralInsights() {
    if (this.habits.length === 0 || this.checkIns.length === 0) {
      return null;
    }

    const habitBounceBacks = [];
    const habitSlumps = [];

    // ── 1. Bounce-Back Rate (Never Miss Twice) ──
    let missesCount = 0;
    let recoveriesCount = 0;

    // Track day-by-day logs for each habit
    this.habits.forEach(habit => {
      const dates = new Set(
        this.checkIns
          .filter(log => {
            if (log.habitId !== habit.id) return false;
            // For number habits, verify target condition was met
            if (habit.type === 'number' && log.value !== null && log.value !== undefined) {
              const val = log.value;
              const min = (habit.minGoal !== null && habit.minGoal !== undefined && habit.minGoal !== "") ? parseFloat(habit.minGoal) : -Infinity;
              const max = (habit.maxGoal !== null && habit.maxGoal !== undefined && habit.maxGoal !== "") ? parseFloat(habit.maxGoal) : Infinity;
              return val >= min && val <= max;
            }
            return true;
          })
          .map(log => log.date)
      );

      // Analyze days in last 30 days
      let hMisses = 0;
      let hRecoveries = 0;
      const today = new Date();
      for (let i = 29; i >= 1; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const yesterdayStr = this.formatDate(d);

        // If yesterday was a miss
        if (!dates.has(yesterdayStr)) {
          hMisses++;
          missesCount++;
          
          const dNext = new Date(d);
          dNext.setDate(dNext.getDate() + 1);
          const todayStr = this.formatDate(dNext);

          // Did we bounce back today?
          if (dates.has(todayStr)) {
            hRecoveries++;
            recoveriesCount++;
          }
        }
      }

      if (hMisses > 0) {
        habitBounceBacks.push({
          name: habit.name,
          rate: Math.round((hRecoveries / hMisses) * 100)
        });
      }

      // ── Calculate Weekend performance for this habit ──
      let hWeekdayLogs = 0;
      let hWeekdayTotal = 0;
      let hWeekendLogs = 0;
      let hWeekendTotal = 0;

      for (let i = 21; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
        const dateStr = this.formatDate(d);

        if (dayOfWeek === 0 || dayOfWeek === 6) {
          hWeekendTotal++;
          if (dates.has(dateStr)) hWeekendLogs++;
        } else {
          hWeekdayTotal++;
          if (dates.has(dateStr)) hWeekdayLogs++;
        }
      }

      const hWeekdayRate = hWeekdayTotal > 0 ? Math.round((hWeekdayLogs / hWeekdayTotal) * 100) : 0;
      const hWeekendRate = hWeekendTotal > 0 ? Math.round((hWeekendLogs / hWeekendTotal) * 100) : 0;
      
      habitSlumps.push({
        name: habit.name,
        weekdayRate: hWeekdayRate,
        weekendRate: hWeekendRate,
        diff: hWeekdayRate - hWeekendRate
      });
    });

    const bounceBackRate = missesCount > 0 ? Math.round((recoveriesCount / missesCount) * 100) : 100;

    // ── 2. Weekend Slump Indicator ──
    let weekdayLogs = 0;
    let weekdayTotalPossible = 0;
    let weekendLogs = 0;
    let weekendTotalPossible = 0;

    this.habits.forEach(habit => {
      const dates = new Set(
        this.checkIns.filter(log => log.habitId === habit.id).map(log => log.date)
      );

      const today = new Date();
      for (let i = 21; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
        const dateStr = this.formatDate(d);

        if (dayOfWeek === 0 || dayOfWeek === 6) {
          weekendTotalPossible++;
          if (dates.has(dateStr)) weekendLogs++;
        } else {
          weekdayTotalPossible++;
          if (dates.has(dateStr)) weekdayLogs++;
        }
      }
    });

    const weekdayRate = weekdayTotalPossible > 0 ? Math.round((weekdayLogs / weekdayTotalPossible) * 100) : 0;
    const weekendRate = weekendTotalPossible > 0 ? Math.round((weekendLogs / weekendTotalPossible) * 100) : 0;
    const slumpDiff = weekdayRate - weekendRate;

    // ── 3. Keystone anchor connection (find all high-prob stacks) ──
    const keystoneStacks = [];
    if (this.habits.length >= 2) {
      // Find habit completion sets
      const habitCompletionLogs = this.habits.map(h => {
        const completedDates = new Set(
          this.checkIns.filter(log => log.habitId === h.id).map(log => log.date)
        );
        return { id: h.id, name: h.name, completedDates };
      });

      for (let i = 0; i < habitCompletionLogs.length; i++) {
        for (let j = 0; j < habitCompletionLogs.length; j++) {
          if (i === j) continue;
          const anchor = habitCompletionLogs[i];
          const follower = habitCompletionLogs[j];

          let anchorCompletedDays = 0;
          let bothCompletedDays = 0;

          anchor.completedDates.forEach(date => {
            anchorCompletedDays++;
            if (follower.completedDates.has(date)) {
              bothCompletedDays++;
            }
          });

          if (anchorCompletedDays >= 5) {
            const prob = bothCompletedDays / anchorCompletedDays;
            if (prob >= 0.70) {
              keystoneStacks.push({
                anchor: anchor.name,
                follower: follower.name,
                probability: Math.round(prob * 100)
              });
            }
          }
        }
      }

      // Sort by highest probability and limit to top 4 non-redundant stacks
      keystoneStacks.sort((a, b) => b.probability - a.probability);
    }

    return {
      bounceBackRate,
      weekendRate,
      weekdayRate,
      slumpDiff,
      keystoneStacks: keystoneStacks.slice(0, 4),
      habitBounceBacks,
      habitSlumps
    };
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this));
  }
}

export const appState = new AppState();
