export const GlossaryPage = {
  render() {
    return `
      <div id="glossary-page" class="flex flex-col gap-6 pb-12 px-1 max-w-sm mx-auto">
        
        <!-- Hero Header -->
        <div class="flex flex-col gap-2 mt-4 text-left px-2 animate-fade-up">
          <h1 class="text-3xl font-normal tracking-tight text-text-primary leading-tight">How It All Works</h1>
          <p class="text-sm text-text-secondary leading-relaxed">
            Coffee Ring isn't just a checkbox app. Here's the psychology that makes your data actually mean something.
          </p>
        </div>

        <!-- Divider -->
        <div class="flex items-center gap-3 px-4 animate-fade-up delay-1">
          <div class="flex-1 h-px bg-divider"></div>
          <span class="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em]">Core Metrics</span>
          <div class="flex-1 h-px bg-divider"></div>
        </div>

        <!-- Consistency -->
        <div class="glossary-item flex flex-col gap-2 px-2 animate-fade-up delay-2 cursor-pointer" data-glossary-toggle="consistency">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-surface-sunken flex items-center justify-center text-text-primary shadow-sm">
                <i data-lucide="target" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-text-primary">Consistency</h3>
                <p class="text-[11px] text-text-secondary">Your weekly success rate</p>
              </div>
            </div>
            <i data-lucide="chevron-down" class="w-4 h-4 text-text-secondary transition-transform glossary-chevron"></i>
          </div>
          <div class="glossary-body" id="glossary-consistency">
            <div class="flex flex-col gap-3 pt-3 pl-13">
              <p class="text-sm text-text-secondary leading-relaxed">
                Think of this as your batting average. If your goal is to hit the gym 3 times a week, and you actually showed up all 3 days -- boom, that's <strong class="text-text-primary">100% consistency</strong>.
              </p>
              <p class="text-sm text-text-secondary leading-relaxed">
                We look at your <strong class="text-text-primary">trailing 4 weeks</strong> so old data never drags you down. It's always a fresh snapshot of who you are right now.
              </p>
              <div class="bg-surface-sunken rounded-xl p-3 border border-divider">
                <p class="text-xs text-text-secondary italic leading-relaxed">
                  "I hit my target 2 out of 3 weeks last month."<br/>
                  <span class="text-text-primary font-semibold not-italic">= 66% Consistency</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Log Fidelity -->
        <div class="glossary-item flex flex-col gap-2 px-2 animate-fade-up delay-3 cursor-pointer" data-glossary-toggle="fidelity">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-surface-sunken flex items-center justify-center text-text-primary shadow-sm">
                <i data-lucide="clipboard-check" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-text-primary">Log Fidelity</h3>
                <p class="text-[11px] text-text-secondary">How deeply are you tracking?</p>
              </div>
            </div>
            <i data-lucide="chevron-down" class="w-4 h-4 text-text-secondary transition-transform glossary-chevron"></i>
          </div>
          <div class="glossary-body" id="glossary-fidelity">
            <div class="flex flex-col gap-3 pt-3 pl-13">
              <p class="text-sm text-text-secondary leading-relaxed">
                Anyone can mindlessly tap a checkbox. But are you actually <strong class="text-text-primary">journaling your journey</strong>?
              </p>
              <p class="text-sm text-text-secondary leading-relaxed">
                Fidelity measures the <strong class="text-text-primary">richness</strong> of your check-ins. Every time you add a note, a numeric value, or a tag, your fidelity goes up. The richer your data, the smarter our insights become.
              </p>
              <div class="flex gap-2 flex-wrap">
                <span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">+ Notes</span>
                <span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30">+ Values</span>
                <span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 border border-violet-100 dark:bg-violet-500/15 dark:text-violet-400 dark:border-violet-500/30">+ Tags</span>
                <span class="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30">= High Fidelity</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Streaks -->
        <div class="glossary-item flex flex-col gap-2 px-2 animate-fade-up delay-4 cursor-pointer" data-glossary-toggle="streaks">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-surface-sunken flex items-center justify-center text-text-primary shadow-sm">
                <i data-lucide="flame" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-text-primary">Streaks</h3>
                <p class="text-[11px] text-text-secondary">Consecutive wins, counted</p>
              </div>
            </div>
            <i data-lucide="chevron-down" class="w-4 h-4 text-text-secondary transition-transform glossary-chevron"></i>
          </div>
          <div class="glossary-body" id="glossary-streaks">
            <div class="flex flex-col gap-3 pt-3 pl-13">
              <p class="text-sm text-text-secondary leading-relaxed">
                Streaks are the dopamine engine. We track two flavors:
              </p>
              <div class="flex flex-col gap-2">
                <div class="flex items-start gap-2">
                  <div class="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0"></div>
                  <p class="text-sm text-text-secondary"><strong class="text-text-primary">Weekly Streaks</strong> -- How many back-to-back weeks you've hit your target. Miss one week and it resets. Brutal, but motivating.</p>
                </div>
                <div class="flex items-start gap-2">
                  <div class="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0"></div>
                  <p class="text-sm text-text-secondary"><strong class="text-text-primary">Daily Streaks</strong> -- For the every-single-day habits. How many consecutive days you've shown up without a break.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="flex items-center gap-3 px-4 mt-4 animate-fade-up delay-4">
          <div class="flex-1 h-px bg-divider"></div>
          <span class="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em]">Behavioral Insights</span>
          <div class="flex-1 h-px bg-divider"></div>
        </div>

        <p class="text-sm text-text-secondary leading-relaxed text-center px-6 animate-fade-up delay-5">
          This is where Coffee Ring gets interesting. We analyze <strong class="text-text-primary">patterns in your behavior</strong> that you might not even notice yourself.
        </p>

        <!-- Timeline -->
        <div class="relative mt-2 animate-fade-up delay-5">
          <!-- Vertical line -->
          <div class="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-emerald-300 via-purple-300 to-rose-300 dark:from-emerald-600 dark:via-purple-600 dark:to-rose-600"></div>

          <div class="flex flex-col gap-8">
            
            <!-- Node: Comebacks -->
            <div class="glossary-item relative pl-14 cursor-pointer" data-glossary-toggle="comebacks">
              <div class="absolute left-1 top-0 w-8 h-8 rounded-full bg-surface-base border-2 border-emerald-500 text-emerald-500 flex items-center justify-center z-10 timeline-dot-pulse">
                <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-base font-bold text-text-primary">Strong Comebacks</h3>
                  <p class="text-[11px] text-text-secondary mt-0.5">The resilience metric</p>
                </div>
                <i data-lucide="chevron-down" class="w-4 h-4 text-text-secondary transition-transform glossary-chevron"></i>
              </div>
              <div class="glossary-body" id="glossary-comebacks">
                <div class="flex flex-col gap-3 pt-3">
                  <p class="text-sm text-text-secondary leading-relaxed">
                    Everyone has a bad week. The question isn't whether you'll fail -- it's <strong class="text-text-primary">what you do next</strong>.
                  </p>
                  <p class="text-sm text-text-secondary leading-relaxed">
                    If you completely miss your target one week but bounce right back and crush it the very next week, that's a <strong class="text-text-primary">comeback</strong>. We track how often you pull this off. A high comeback rate means you're mentally tough. Failure doesn't define your trajectory.
                  </p>
                </div>
              </div>
            </div>

            <!-- Node: Slump Resistant -->
            <div class="glossary-item relative pl-14 cursor-pointer" data-glossary-toggle="slump">
              <div class="absolute left-1 top-0 w-8 h-8 rounded-full bg-surface-base border-2 border-blue-500 text-blue-500 flex items-center justify-center z-10">
                <i data-lucide="shield" class="w-3.5 h-3.5"></i>
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-base font-bold text-text-primary">Slump Resistant</h3>
                  <p class="text-[11px] text-text-secondary mt-0.5">The survival metric</p>
                </div>
                <i data-lucide="chevron-down" class="w-4 h-4 text-text-secondary transition-transform glossary-chevron"></i>
              </div>
              <div class="glossary-body" id="glossary-slump">
                <div class="flex flex-col gap-3 pt-3">
                  <p class="text-sm text-text-secondary leading-relaxed">
                    This one's different from comebacks. A "slump" is when you go an <strong class="text-text-primary">entire week without a single check-in</strong>. Zero. Nothing. Total radio silence.
                  </p>
                  <p class="text-sm text-text-secondary leading-relaxed">
                    Being <strong class="text-text-primary">slump resistant</strong> means that even after going completely dark, you still come back the following week and log at least one rep. You know that the hardest part is just showing up -- even once.
                  </p>
                </div>
              </div>
            </div>

            <!-- Node: Momentum -->
            <div class="glossary-item relative pl-14 cursor-pointer" data-glossary-toggle="momentum">
              <div class="absolute left-1 top-0 w-8 h-8 rounded-full bg-surface-base border-2 border-purple-500 text-purple-500 flex items-center justify-center z-10">
                <i data-lucide="zap" class="w-3.5 h-3.5"></i>
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-base font-bold text-text-primary">Momentum Master</h3>
                  <p class="text-[11px] text-text-secondary mt-0.5">Success breeds success</p>
                </div>
                <i data-lucide="chevron-down" class="w-4 h-4 text-text-secondary transition-transform glossary-chevron"></i>
              </div>
              <div class="glossary-body" id="glossary-momentum">
                <div class="flex flex-col gap-3 pt-3">
                  <p class="text-sm text-text-secondary leading-relaxed">
                    Here's a powerful question: <strong class="text-text-primary">after you have a great week, do you keep going?</strong>
                  </p>
                  <p class="text-sm text-text-secondary leading-relaxed">
                    Momentum tracks how often a successful week is immediately followed by another successful week. If this number is high, it means you have the rare ability to chain wins together instead of letting success make you complacent.
                  </p>
                </div>
              </div>
            </div>

            <!-- Node: Weekend Warrior -->
            <div class="glossary-item relative pl-14 cursor-pointer" data-glossary-toggle="weekend">
              <div class="absolute left-1 top-0 w-8 h-8 rounded-full bg-surface-base border-2 border-amber-500 text-amber-500 flex items-center justify-center z-10">
                <i data-lucide="sun" class="w-3.5 h-3.5"></i>
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-base font-bold text-text-primary">Weekend Warrior</h3>
                  <p class="text-[11px] text-text-secondary mt-0.5">When do you thrive?</p>
                </div>
                <i data-lucide="chevron-down" class="w-4 h-4 text-text-secondary transition-transform glossary-chevron"></i>
              </div>
              <div class="glossary-body" id="glossary-weekend">
                <div class="flex flex-col gap-3 pt-3">
                  <p class="text-sm text-text-secondary leading-relaxed">
                    Some people are weekday machines -- gym at 6am before work, protein shake prepped, reading done by 9pm. Others come alive on Saturday and Sunday when there's no schedule holding them back.
                  </p>
                  <p class="text-sm text-text-secondary leading-relaxed">
                    We compare your <strong class="text-text-primary">weekday vs weekend log rates</strong> and let you know where your energy naturally flows. Use it to plan smarter, not harder.
                  </p>
                </div>
              </div>
            </div>

            <!-- Node: Habit Stacking -->
            <div class="glossary-item relative pl-14 cursor-pointer" data-glossary-toggle="stacking">
              <div class="absolute left-1 top-0 w-8 h-8 rounded-full bg-surface-base border-2 border-rose-500 text-rose-500 flex items-center justify-center z-10">
                <i data-lucide="link" class="w-3.5 h-3.5"></i>
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-base font-bold text-text-primary">Habit Stacking</h3>
                  <p class="text-[11px] text-text-secondary mt-0.5">Hidden correlations</p>
                </div>
                <i data-lucide="chevron-down" class="w-4 h-4 text-text-secondary transition-transform glossary-chevron"></i>
              </div>
              <div class="glossary-body" id="glossary-stacking">
                <div class="flex flex-col gap-3 pt-3">
                  <p class="text-sm text-text-secondary leading-relaxed">
                    This is arguably the most powerful insight we generate. We scan your entire check-in history and look for <strong class="text-text-primary">hidden pairs</strong> -- two habits that you almost always do on the same day.
                  </p>
                  <p class="text-sm text-text-secondary leading-relaxed">
                    Maybe you always read after going to the gym. Or you always drink water on days you meditate. We surface these correlations so you can <strong class="text-text-primary">intentionally leverage them</strong>. Anchor one habit to another and they both get stronger.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    `;
  },

  bindEvents() {
    document.querySelectorAll('[data-glossary-toggle]').forEach(item => {
      item.addEventListener('click', () => {
        const key = item.dataset.glossaryToggle;
        const body = document.getElementById('glossary-' + key);
        const chevron = item.querySelector('.glossary-chevron');
        
        if (!body) return;

        const isOpen = body.classList.contains('open');

        // Close all others first
        document.querySelectorAll('.glossary-body.open').forEach(openBody => {
          openBody.classList.remove('open');
          const parentChevron = openBody.closest('.glossary-item')?.querySelector('.glossary-chevron');
          if (parentChevron) parentChevron.style.transform = 'rotate(0deg)';
        });

        // Toggle current
        if (!isOpen) {
          body.classList.add('open');
          if (chevron) chevron.style.transform = 'rotate(180deg)';
        }
      });
    });
  }
};
