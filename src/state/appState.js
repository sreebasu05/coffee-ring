import { StorageManager } from '../storage/storageManager.js';
import { APP_CONFIG } from '../config/appConfig.js';
import { supabase, isSupabaseConfigured } from '../db/supabaseClient.js';

class AppState {
  constructor() {
    this.user = null;
    this.habits = [];
    this.checkIns = [];
    this.categoryColors = {};
    
    // Default selected date is today (YYYY-MM-DD local format)
    this.selectedDate = this.formatDate(new Date());
    this.dashboardWeekOffset = 0; // 0 = This Week, 1 = Last Week
    
    // Listeners for reactive UI rendering
    this.listeners = [];
    this.isCloudSynced = false;
  }

  formatDate(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  init() {
    if (!localStorage.getItem('coffeering_schema_v2')) {
      StorageManager.init(true); // force reset database
      localStorage.setItem('coffeering_schema_v2', 'true');
    }

    StorageManager.init();
    this.loadStateFromCache();

    // Set up Supabase Auth state listener
    if (isSupabaseConfigured && supabase) {
      // Check initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        this.isCloudSynced = !!session;
        this.notify();
      });

      supabase.auth.onAuthStateChange(async (event, session) => {
        this.isCloudSynced = !!session;
        if (session) {
          // Fetch data from Supabase cloud database
          const success = await StorageManager.fetchFromSupabase();
          if (success) {
            this.loadStateFromCache();
          }
        } else {
          // If logged out, load local guest profile/data
          this.loadStateFromCache();
        }
      });
    }
  }

  loadStateFromCache() {
    this.user = StorageManager.getUserProfile();
    this.habits = StorageManager.getHabits() || [];
    this.checkIns = StorageManager.getCheckIns() || [];

    // Auto-seed history if history is completely empty for local guests
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
  async resetData() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    this.isCloudSynced = false;
    localStorage.removeItem('coffeering_onboarding_completed');
    localStorage.removeItem('coffeering_onboarding_draft');
    StorageManager.init(true); // force reset database
    this.user = null;
    this.habits = [];
    this.checkIns = [];
    this.categoryColors = {};
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

  getLogForHabitOnDate(habitId, dateStr) {
    return this.checkIns.find(log => log.habitId === habitId && log.date === dateStr) || null;
  }

  getWeeklyCount(habitId) {
    const current = new Date(this.getDashboardDate());
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

  getDashboardDate() {
    const d = new Date();
    if (this.dashboardWeekOffset === 1) {
      d.setDate(d.getDate() - 7);
    }
    return d;
  }

  getWeekStartAndEnd(offset = 0) {
    const d = this.getDashboardDate();
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
      const logTime = new Date(log.date).getTime();
      return logTime >= start.getTime() && logTime <= end.getTime();
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

  isHabitScheduledForDate(habitId, dateStr) {
    const habit = this.habits.find(h => h.id === habitId);
    if (!habit) return true;
    if (!habit.days || !Array.isArray(habit.days) || habit.days.length === 0) return true;
    
    // Parse date safely
    const date = new Date(dateStr + "T00:00:00");
    const day = date.getDay();
    const abbrs = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return habit.days.includes(abbrs[day]);
  }

  // ── Weekly Streaks ────────────────────────────────────────
  getWeeklyStreak(habitId) {
    const habit = this.habits.find(h => h.id === habitId);
    if (!habit) return 0;
    
    let streak = 0;
    let offset = 0;
    
    const currentWeekCount = this.getWeekLogsCount(habitId, 0);
    const currentWeekMet = currentWeekCount >= 1;
    
    if (currentWeekMet) {
      streak = 1;
      offset = 1;
      while (true) {
        const count = this.getWeekLogsCount(habitId, offset);
        if (count >= 1) {
          streak++;
          offset++;
        } else {
          break;
        }
      }
    } else {
      offset = 1;
      while (true) {
        const count = this.getWeekLogsCount(habitId, offset);
        if (count >= 1) {
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
      const count = this.getWeekLogsCount(habitId, offset);
      if (count >= 1) {
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

  // ── Target Streaks ────────────────────────────────────────
  getTargetStreak(habitId) {
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

  // ── Daily Streaks ─────────────────────────────────────────
  getDailyStreak(habitId) {
    const habit = this.habits.find(h => h.id === habitId);
    if (!habit) return 0;

    const habitLogs = this.checkIns.filter(log => log.habitId === habitId);

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

    const habitLogs = this.checkIns.filter(log => log.habitId === habitId);

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

  getRollingConsistency(habitId, days = 28, nowDate = new Date()) {
    const habit = this.habits.find(h => h.id === habitId);
    if (!habit) return 0;

    const createdDate = new Date(habit.createdAt);
    // Find the Monday of the week the habit was created
    const createdDay = createdDate.getDay();
    const createdMonday = new Date(createdDate);
    const diffToMonday = createdDay === 0 ? -6 : 1 - createdDay;
    createdMonday.setDate(createdDate.getDate() + diffToMonday);
    createdMonday.setHours(0,0,0,0);

    // Find the Monday of the current week (based on nowDate)
    const now = new Date(nowDate);
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

    let totalConsistency = 0;

    completedWeeksMondays.forEach(monday => {
      const target = this.getWeeklyTargetForDate(habitId, this.formatDate(monday));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23,59,59,999);

      const count = this.checkIns.filter(log => {
        if (log.habitId !== habitId) return false;
        const logDate = new Date(log.date + "T00:00:00");
        return logDate.getTime() >= monday.getTime() && logDate.getTime() <= sunday.getTime();
      }).length;

      const consistencyForWeek = Math.min(count / target, 1.0);
      totalConsistency += consistencyForWeek;
    });

    return Math.round((totalConsistency / completedWeeksMondays.length) * 100);
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
    const todayStr = this.formatDate(new Date());
    const scheduledHabits = this.habits.filter(h => this.isHabitScheduledForDate(h.id, todayStr) && !this.isDatePaused(h, todayStr));
    if (scheduledHabits.length === 0) return 100;
    const completedToday = scheduledHabits.filter(h => this.getLogForHabitOnDate(h.id, todayStr) !== null).length;
    return Math.round((completedToday / scheduledHabits.length) * 100);
  }

  getWeeklyGoalProgress() {
    if (this.habits.length === 0) return 0;
    const realToday = new Date();
    const todayStr = this.formatDate(realToday);
    const dayOfWeek = realToday.getDay();
    // Monday is 1, Sunday is 0. Remaining days in the current week (including today):
    const remainingDays = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;

    const startOfWeek = new Date(realToday.setDate(realToday.getDate() - realToday.getDay() + (realToday.getDay() === 0 ? -6 : 1)));
    startOfWeek.setHours(0,0,0,0);

    return this.habits.filter(h => {
      // Calculate real current week count
      const realWeeklyCount = this.checkIns.filter(log => {
        if (log.habitId !== h.id) return false;
        const logTime = new Date(log.date).getTime();
        return logTime >= startOfWeek.getTime();
      }).length;

      const target = this.getWeeklyTargetForDate(h.id, todayStr);
      const remainingNeeded = target - realWeeklyCount;
      // Habit is "on track" if it has already met the target OR if it's mathematically possible to meet it in the remaining days
      return remainingNeeded <= 0 || remainingNeeded <= remainingDays;
    }).length;
  }

  getCategoryCompletion(categoryId) {
    const catHabits = this.habits.filter(h => h.category === categoryId);
    if (catHabits.length === 0) return 0;
    
    let totalTarget = 0;
    let totalCompleted = 0;
    const todayStr = this.formatDate(this.getDashboardDate());
    
    catHabits.forEach(h => {
      totalTarget += this.getWeeklyTargetForDate(h.id, todayStr);
      totalCompleted += this.getWeeklyCount(h.id);
    });
    
    if (totalTarget === 0) return 0;
    return Math.round((totalCompleted / totalTarget) * 100);
  }

  getWeeklyDayByDayActivity() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const current = this.getDashboardDate();
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

  getOverallConsistency() {
    if (this.habits.length === 0) return 0;
    let sum = 0;
    const dashDate = this.getDashboardDate();
    this.habits.forEach(h => {
      sum += this.getRollingConsistency(h.id, 28, dashDate);
    });
    return Math.round(sum / this.habits.length);
  }

  getCategoryFocus() {
    if (this.habits.length === 0 || this.checkIns.length < 7) {
      return { mostFocused: null, needsFocus: null, isLocked: true };
    }

    // Dynamic import to avoid circular dependency if APP_CONFIG isn't available here,
    // but APP_CONFIG is likely globally available or imported.
    // Let's use the categories list from the habits.
    const activeCatIds = [...new Set(this.habits.map(h => h.category))];
    
    if (activeCatIds.length === 0) return { mostFocused: null, needsFocus: null, isLocked: true };

    const dashDate = this.getDashboardDate();
    const catRates = activeCatIds.map(catId => {
      const catHabits = this.habits.filter(h => h.category === catId);
      let sum = 0;
      catHabits.forEach(h => sum += this.getRollingConsistency(h.id, 28, dashDate));
      return { categoryId: catId, rate: Math.round(sum / catHabits.length) };
    });

    catRates.sort((a, b) => b.rate - a.rate);
    const mostFocused = catRates[0];
    const needsFocus = catRates.length > 1 ? catRates[catRates.length - 1] : null;

    if (mostFocused) {
      mostFocused.tieCount = catRates.filter(x => x.rate === mostFocused.rate).length - 1;
    }
    if (needsFocus) {
      needsFocus.tieCount = catRates.filter(x => x.rate === needsFocus.rate).length - 1;
    }

    return { mostFocused, needsFocus, isLocked: false };
  }

  getHabitRankings() {
    if (this.habits.length === 0) return [];
    
    const dashDate = this.getDashboardDate();
    const oneWeekAgo = new Date(dashDate);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const now = dashDate;
    const nowDay = now.getDay();
    const currentMonday = new Date(now);
    const diffToCurrentMonday = nowDay === 0 ? -6 : 1 - nowDay;
    currentMonday.setDate(now.getDate() + diffToCurrentMonday);
    currentMonday.setHours(0,0,0,0);

    const rankings = this.habits.map(h => {
      const current = this.getRollingConsistency(h.id, 28, dashDate);
      const previous = this.getRollingConsistency(h.id, 28, oneWeekAgo);
      
      const createdDate = new Date(h.createdAt);
      const createdDay = createdDate.getDay();
      const createdMonday = new Date(createdDate);
      const diffToMonday = createdDay === 0 ? -6 : 1 - createdDay;
      createdMonday.setDate(createdDate.getDate() + diffToMonday);
      createdMonday.setHours(0,0,0,0);

      const isNew = createdMonday.getTime() >= currentMonday.getTime();

      let trend = 'flat';
      if (current > previous) trend = 'up';
      if (current < previous) trend = 'down';
      if (isNew) trend = 'flat';

      return { habit: h, consistency: current, trend, isNew };
    });

    const sorted = rankings.sort((a, b) => b.consistency - a.consistency);
    if (sorted.length > 0) {
      const topScore = sorted[0].consistency;
      sorted[0].tieCount = sorted.filter(x => x.consistency === topScore).length - 1;
      
      const bottomScore = sorted[sorted.length - 1].consistency;
      sorted[sorted.length - 1].tieCount = sorted.filter(x => x.consistency === bottomScore).length - 1;
    }
    return sorted;
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

    const now = this.getDashboardDate();
    const cutoff7 = new Date(now); cutoff7.setDate(now.getDate() - 7);
    const cutoff30 = new Date(now); cutoff30.setDate(now.getDate() - 30);

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

    const cutoff14 = new Date(now); cutoff14.setDate(now.getDate() - 14);
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
  getAdvancedBehavioralInsights() {
    if (this.habits.length === 0 || this.checkIns.length === 0) {
      return { overall: [], habitTags: {}, perHabitStats: [] };
    }

    const today = this.getDashboardDate();
    // Monday of the current week (to exclude current week from full week analysis)
    const currentDay = today.getDay();
    const currentMonday = new Date(today);
    const diffToCurrentMonday = currentDay === 0 ? -6 : 1 - currentDay;
    currentMonday.setDate(today.getDate() + diffToCurrentMonday);
    currentMonday.setHours(0,0,0,0);

    const habitStats = this.habits.map(h => ({
      habit: h,
      missedWeeks: 0,
      recoveredWeeks: 0,
      zeroLogWeeks: 0,
      savedWeeks: 0,
      successfulWeeks: 0,
      momentumWeeks: 0,
      
      totalWeekdayLogs: 0,
      totalWeekendLogs: 0,
    }));

    // Iterate trailing 12 weeks for weekly stats
    for (let offset = 1; offset <= 12; offset++) {
      const wDate = new Date(currentMonday.getTime() - (offset * 7 * 86400000));
      const wNextDate = new Date(currentMonday.getTime() - ((offset - 1) * 7 * 86400000));
      
      habitStats.forEach(stat => {
        const targetW = this.getWeeklyTargetForDate(stat.habit.id, this.formatDate(wDate));
        const targetNextW = this.getWeeklyTargetForDate(stat.habit.id, this.formatDate(wNextDate));
        
        const createdDate = new Date(stat.habit.createdAt);
        const createdMonday = new Date(createdDate);
        const createdDay = createdMonday.getDay();
        const diffToMonday = createdDay === 0 ? -6 : 1 - createdDay;
        createdMonday.setDate(createdMonday.getDate() + diffToMonday);
        createdMonday.setHours(0,0,0,0);

        if (wDate.getTime() < createdMonday.getTime()) {
          return; // Skip weeks before the habit was created
        }

        const countW = this.getWeekLogsCount(stat.habit.id, offset);
        const countNextW = this.getWeekLogsCount(stat.habit.id, offset - 1); // offset-1 is the week *after* offset

        // 1. Comeback Rate (Target Recovery)
        if (countW < targetW) {
          stat.missedWeeks++;
          if (countNextW >= targetNextW) {
            stat.recoveredWeeks++;
          }
        }

        // 2. Slump Prevention
        if (countW === 0) {
          stat.zeroLogWeeks++;
          if (countNextW > 0) {
            stat.savedWeeks++;
          }
        }

        // 3. Momentum Maintenance
        if (countW >= targetW) {
          stat.successfulWeeks++;
          if (countNextW >= targetNextW) {
            stat.momentumWeeks++;
          }
        }
      });
    }

    // Weekend vs Weekday Bias (Trailing 4 weeks = 28 days)
    for (let i = 1; i <= 28; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayOfWeek = d.getDay();
      const dateStr = this.formatDate(d);
      
      habitStats.forEach(stat => {
        const hasLog = this.checkIns.some(log => log.habitId === stat.habit.id && log.date === dateStr);
        if (hasLog) {
          if (dayOfWeek === 0 || dayOfWeek === 6) stat.totalWeekendLogs++;
          else stat.totalWeekdayLogs++;
        }
      });
    }

    let globalMissed = 0, globalRecovered = 0;
    let globalZero = 0, globalSaved = 0;
    let globalSuccess = 0, globalMomentum = 0;
    let globalWeekdayLogs = 0, globalWeekendLogs = 0;

    let bestComeback = { habitId: null, rate: -1 };
    let bestSlump = { habitId: null, rate: -1 };
    let bestMomentum = { habitId: null, rate: -1 };

    habitStats.forEach(stat => {
      globalMissed += stat.missedWeeks;
      globalRecovered += stat.recoveredWeeks;
      globalZero += stat.zeroLogWeeks;
      globalSaved += stat.savedWeeks;
      globalSuccess += stat.successfulWeeks;
      globalMomentum += stat.momentumWeeks;
      
      globalWeekdayLogs += stat.totalWeekdayLogs;
      globalWeekendLogs += stat.totalWeekendLogs;

      if (stat.missedWeeks >= 2) {
        const rate = stat.recoveredWeeks / stat.missedWeeks;
        if (rate > 0 && rate > bestComeback.rate) bestComeback = { habitId: stat.habit.id, rate };
      }
      if (stat.zeroLogWeeks >= 1) {
        const rate = stat.savedWeeks / stat.zeroLogWeeks;
        if (rate > 0 && rate > bestSlump.rate) bestSlump = { habitId: stat.habit.id, rate };
      }
      if (stat.successfulWeeks >= 2) {
        const rate = stat.momentumWeeks / stat.successfulWeeks;
        if (rate > 0 && rate > bestMomentum.rate) bestMomentum = { habitId: stat.habit.id, rate };
      }
    });

    const habitTags = {};
    if (bestComeback.habitId) habitTags[bestComeback.habitId] = { label: 'COMEBACK', classes: 'bg-amber-100 text-amber-700' };
    if (bestSlump.habitId) habitTags[bestSlump.habitId] = { label: 'SLUMP PROOF', classes: 'bg-blue-100 text-blue-700' };
    if (bestMomentum.habitId) habitTags[bestMomentum.habitId] = { label: 'MOMENTUM', classes: 'bg-emerald-100 text-emerald-700' };

    const overall = [];

    if (globalMissed >= 2) {
      const rate = Math.round((globalRecovered / globalMissed) * 100);
      if (rate > 0) {
        overall.push({
          id: 'comeback',
          title: rate >= 50 ? "Strong Comebacks" : "Comeback Opportunity",
          text: rate >= 50 
            ? `When you miss a weekly goal, you bounce back and hit it the next week ${rate}% of the time!` 
            : `You recover your weekly targets ${rate}% of the time. Don't let a bad week keep you down.`,
          icon: 'refresh-cw',
          color: 'text-text-primary',
          bg: 'bg-surface-sunken border-divider'
        });
      }
    }

    if (globalZero >= 1) {
      const rate = Math.round((globalSaved / globalZero) * 100);
      if (rate > 0) {
        overall.push({
          id: 'slump',
          title: rate >= 50 ? "Slump Resistant" : "Slump Warning",
          text: rate >= 50 
            ? `After a week of 0 check-ins, you return to log at least once the next week ${rate}% of the time.` 
            : `After a week of 0 check-ins, you only return ${rate}% of the time. Focus on doing just 1 rep to keep the habit alive!`,
          icon: 'shield',
          color: 'text-text-primary',
          bg: 'bg-surface-sunken border-divider'
        });
      }
    }

    if (globalSuccess >= 2) {
      const rate = Math.round((globalMomentum / globalSuccess) * 100);
      if (rate > 0) {
        overall.push({
          id: 'momentum',
          title: rate >= 60 ? "Momentum Master" : "Building Momentum",
          text: rate >= 60
            ? `Once you hit your target, you hit it again the next week ${rate}% of the time.`
            : `You chain successful weeks together ${rate}% of the time.`,
          icon: 'zap',
          color: 'text-text-primary',
          bg: 'bg-surface-sunken border-divider'
        });
      }
    }

    // Weekend vs Weekday
    const totalLogsIn4Weeks = globalWeekdayLogs + globalWeekendLogs;
    if (totalLogsIn4Weeks >= 5) {
      const weekdayAvg = globalWeekdayLogs / 20; // 4 weeks * 5 days
      const weekendAvg = globalWeekendLogs / 8;  // 4 weeks * 2 days
      if (weekendAvg > weekdayAvg * 1.2) {
        overall.push({
          id: 'weekend',
          title: "Weekend Warrior",
          text: `You log significantly more often on weekends. Great way to use your free time!`,
          icon: 'sun',
          color: 'text-text-primary',
          bg: 'bg-surface-sunken border-divider'
        });
      } else if (weekdayAvg > weekendAvg * 1.2) {
        overall.push({
          id: 'weekday',
          title: "Weekday Hero",
          text: `Your consistency thrives during the workweek but drops on weekends.`,
          icon: 'briefcase',
          color: 'text-text-primary',
          bg: 'bg-surface-sunken border-divider'
        });
      }
    }

    // Anchor Habit (Stacking)
    if (this.habits.length >= 2) {
      const habitCompletionLogs = this.habits.map(h => ({
        id: h.id,
        name: h.name,
        dates: new Set(this.checkIns.filter(log => log.habitId === h.id).map(log => log.date))
      }));

      let bestPair = null;
      let highestProb = 0;

      for (let i = 0; i < habitCompletionLogs.length; i++) {
        for (let j = 0; j < habitCompletionLogs.length; j++) {
          if (i === j) continue;
          const anchor = habitCompletionLogs[i];
          const follower = habitCompletionLogs[j];
          
          if (anchor.dates.size >= 5 && follower.dates.size >= 5) {
            let bothDays = 0;
            anchor.dates.forEach(d => { if (follower.dates.has(d)) bothDays++; });
            const prob = bothDays / anchor.dates.size;
            if (prob >= 0.6 && prob > highestProb) {
              highestProb = prob;
              bestPair = { anchor: anchor.name, follower: follower.name, prob: Math.round(prob * 100) };
            }
          }
        }
      }

      if (bestPair) {
        overall.push({
          id: 'anchor',
          title: "Habit Stacking",
          text: `When you log '${bestPair.anchor}', you also log '${bestPair.follower}' ${bestPair.prob}% of the time!`,
          icon: 'link',
          color: 'text-text-primary',
          bg: 'bg-surface-sunken border-divider'
        });
      }
    }

    return { 
      overall, 
      habitTags,
      perHabitStats: habitStats 
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
