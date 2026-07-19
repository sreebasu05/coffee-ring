export const GlossaryPage = {
  render() {
    return `
      <div id="glossary-page" class="flex flex-col gap-10 animate-fade-in pb-12 px-2 max-w-sm mx-auto">
        
        <!-- Header -->
        <div class="flex flex-col gap-2 mt-4 items-center text-center">
          <div class="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-2 rotate-3 dark:bg-indigo-500/20 dark:text-indigo-400">
            <i data-lucide="book-open" class="w-6 h-6"></i>
          </div>
          <h1 class="text-3xl font-black text-text-primary tracking-tight">The Glossary</h1>
          <p class="text-sm text-text-secondary leading-relaxed max-w-[260px]">
            Your quick guide to understanding the psychology running under the hood.
          </p>
        </div>

        <!-- Section: The Basics -->
        <div class="flex flex-col gap-8 mt-4">
          <h2 class="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">The Basics</h2>
          
          <!-- Item: Consistency -->
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400">
                <i data-lucide="target" class="w-5 h-5"></i>
              </div>
              <h3 class="text-xl font-bold text-text-primary">Consistency</h3>
            </div>
            <ul class="text-sm text-text-secondary leading-relaxed pl-13 flex flex-col gap-2">
              <li><strong class="text-text-primary">What it is:</strong> Your overall success rate over the last 4 weeks.</li>
              <li><strong class="text-text-primary">Example:</strong> Goal is 3 days/week. You hit 3 days. That's 100%!</li>
            </ul>
          </div>

          <!-- Item: Log Fidelity -->
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 dark:bg-surface-sunken dark:text-text-secondary">
                <i data-lucide="clipboard-check" class="w-5 h-5"></i>
              </div>
              <h3 class="text-xl font-bold text-text-primary">Log Fidelity</h3>
            </div>
            <ul class="text-sm text-text-secondary leading-relaxed pl-13 flex flex-col gap-2">
              <li><strong class="text-text-primary">What it is:</strong> A measure of your tracking depth.</li>
              <li><strong class="text-text-primary">How to boost it:</strong> Don't just tick the box! Add a numeric value, jot down a quick note, or attach tags to your check-in.</li>
            </ul>
          </div>
        </div>

        <!-- Section: Behavioral Insights (Timeline Layout) -->
        <div class="flex flex-col mt-6">
          <h2 class="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-8">Behavioral Insights</h2>
          
          <div class="relative">
            <!-- Continuous vertical line -->
            <div class="absolute left-5 top-2 bottom-2 w-px bg-divider"></div>

            <div class="flex flex-col gap-10">
              
              <!-- Timeline Node: Comebacks -->
              <div class="relative pl-14">
                <div class="absolute left-1 top-0 w-8 h-8 rounded-full bg-surface-base border-2 border-emerald-500 text-emerald-500 flex items-center justify-center z-10">
                  <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
                </div>
                <h3 class="text-lg font-bold text-text-primary mb-2 mt-1">Strong Comebacks</h3>
                <ul class="text-sm text-text-secondary leading-relaxed flex flex-col gap-2">
                  <li><strong class="text-text-primary">The Scenario:</strong> You completely missed your target last week.</li>
                  <li><strong class="text-text-primary">The Action:</strong> You bounced back and crushed it this week.</li>
                  <li><strong class="text-text-primary">The Takeaway:</strong> You are highly resilient and don't let failure snowball.</li>
                </ul>
              </div>

              <!-- Timeline Node: Slump Resistant -->
              <div class="relative pl-14">
                <div class="absolute left-1 top-0 w-8 h-8 rounded-full bg-surface-base border-2 border-blue-500 text-blue-500 flex items-center justify-center z-10">
                  <i data-lucide="shield" class="w-3.5 h-3.5"></i>
                </div>
                <h3 class="text-lg font-bold text-text-primary mb-2 mt-1">Slump Resistant</h3>
                <ul class="text-sm text-text-secondary leading-relaxed flex flex-col gap-2">
                  <li><strong class="text-text-primary">The Scenario:</strong> You had 0 check-ins for a whole week.</li>
                  <li><strong class="text-text-primary">The Action:</strong> You returned to log at least one rep the next week.</li>
                  <li><strong class="text-text-primary">The Takeaway:</strong> You know how to keep a dying habit alive.</li>
                </ul>
              </div>

              <!-- Timeline Node: Momentum -->
              <div class="relative pl-14">
                <div class="absolute left-1 top-0 w-8 h-8 rounded-full bg-surface-base border-2 border-purple-500 text-purple-500 flex items-center justify-center z-10">
                  <i data-lucide="zap" class="w-3.5 h-3.5"></i>
                </div>
                <h3 class="text-lg font-bold text-text-primary mb-2 mt-1">Momentum Master</h3>
                <ul class="text-sm text-text-secondary leading-relaxed flex flex-col gap-2">
                  <li><strong class="text-text-primary">The Scenario:</strong> You hit your target for the week.</li>
                  <li><strong class="text-text-primary">The Action:</strong> You hit it again the very next week.</li>
                  <li><strong class="text-text-primary">The Takeaway:</strong> Success breeds success. You are chaining wins together.</li>
                </ul>
              </div>

              <!-- Timeline Node: Weekend Variance -->
              <div class="relative pl-14">
                <div class="absolute left-1 top-0 w-8 h-8 rounded-full bg-surface-base border-2 border-amber-500 text-amber-500 flex items-center justify-center z-10">
                  <i data-lucide="sun" class="w-3.5 h-3.5"></i>
                </div>
                <h3 class="text-lg font-bold text-text-primary mb-2 mt-1">Weekend Warrior</h3>
                <ul class="text-sm text-text-secondary leading-relaxed flex flex-col gap-2">
                  <li><strong class="text-text-primary">The Discovery:</strong> You log significantly more on weekends than weekdays (or vice-versa).</li>
                  <li><strong class="text-text-primary">The Takeaway:</strong> We map your schedule so you know exactly when you thrive.</li>
                </ul>
              </div>

              <!-- Timeline Node: Habit Stacking -->
              <div class="relative pl-14">
                <div class="absolute left-1 top-0 w-8 h-8 rounded-full bg-surface-base border-2 border-rose-500 text-rose-500 flex items-center justify-center z-10">
                  <i data-lucide="link" class="w-3.5 h-3.5"></i>
                </div>
                <h3 class="text-lg font-bold text-text-primary mb-2 mt-1">Habit Stacking</h3>
                <ul class="text-sm text-text-secondary leading-relaxed flex flex-col gap-2">
                  <li><strong class="text-text-primary">The Discovery:</strong> We found a mathematical correlation between two of your habits.</li>
                  <li><strong class="text-text-primary">The Takeaway:</strong> Whenever you do Habit A, you almost always do Habit B. Leverage this powerful "stack"!</li>
                </ul>
              </div>

            </div>
          </div>
        </div>

      </div>
    `;
  }
};
