import { APP_CONFIG } from '../../config/appConfig.js';

export const GridCard = {
  /**
   * Render a grid card used in Create, Onboarding, and Insights pages.
   * @param {Object} options 
   * @param {string} options.id - The preset or habit ID
   * @param {string} options.name - The title of the card
   * @param {string} options.category - The category ID (e.g. 'health')
   * @param {string} options.icon - Lucide icon name
   * @param {boolean} [options.isSelected] - Whether the card is in a selected state (onboarding)
   * @param {string} options.actionAttr - Data attribute string or onclick for click handling
   * @param {string} [options.subtitleHtml] - Custom subtitle HTML (defaults to uppercase category name)
   */
  render(options) {
    const { id, name, category, icon, isSelected, actionAttr, subtitleHtml } = options;
    
    const cardSelectedClasses = isSelected
      ? 'ring-2 ring-slate-200 dark:ring-slate-700 scale-95 bg-slate-50 dark:bg-slate-800' 
      : 'shadow-sm hover:-translate-y-1 hover:shadow-md';

    if (category === 'blank') {
      return `
        <button 
          type="button"
          ${actionAttr}
          class="group onboarding-preset-card relative overflow-hidden flex flex-col items-center pt-6 pb-4 px-3 rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 transition-all duration-300 min-h-[105px] justify-between ${cardSelectedClasses}"
        >
          <!-- Full-Width Top Accent Color Line -->
          <div class="absolute top-0 left-0 right-0 h-1 bg-slate-800 dark:bg-slate-400"></div>
          
          <i data-lucide="${icon || 'plus'}" class="w-5 h-5 text-slate-500 dark:text-slate-400 mb-1.5 transition-transform duration-300 group-hover:scale-110"></i>
          <span class="text-[8px] font-extrabold tracking-widest text-slate-400 uppercase">Custom</span>
          <span class="text-xs font-bold text-text-primary line-clamp-2 text-center leading-tight w-full mt-1">${name}</span>
          <span class="text-[10px] text-text-secondary mt-0.5">${subtitleHtml || 'Blank'}</span>
        </button>
      `;
    }

    const categoryMeta = APP_CONFIG.categories.find(cat => cat.id === category);
    const colorKey = categoryMeta ? categoryMeta.defaultColor : null;
    
    const colorHexMap = {
      pastelMint: '#10b981',
      pastelAmber: '#f59e0b',
      pastelSky: '#0ea5e9',
      pastelRose: '#f43f5e',
      pastelLavender: '#8b5cf6',
      pastelPink: '#ec4899'
    };
    const themeHex = colorHexMap[colorKey] || '#64748b';
    
    const isEmoji = (str) => /\p{Emoji}/u.test(str) && !/^[a-zA-Z0-9_-]+$/.test(str);
    const iconName = (!icon || isEmoji(icon)) ? 'target' : icon;

    return `
      <button 
        type="button"
        ${actionAttr}
        class="group onboarding-preset-card relative overflow-hidden flex flex-col items-center pt-6 pb-4 px-3 rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 transition-all duration-300 ${cardSelectedClasses} min-h-[105px] justify-between"
      >
        <!-- Full-Width Top Accent Color Line -->
        <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${themeHex};"></div>
        
        <i data-lucide="${iconName}" class="w-5 h-5 mb-1.5 transition-transform duration-300 group-hover:scale-110" style="color: ${themeHex};"></i>
        <span class="text-[8px] font-extrabold tracking-widest uppercase opacity-60" style="color: ${themeHex};">${category}</span>
        <span class="text-xs font-bold text-text-primary line-clamp-2 text-center leading-tight w-full mt-1">${name}</span>
        ${subtitleHtml ? subtitleHtml : `<span class="text-[10px] text-text-secondary mt-0.5 uppercase tracking-wider opacity-0 h-0 overflow-hidden">${category}</span>`}
      </button>
    `;
  }
};
