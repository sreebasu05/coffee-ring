import { APP_CONFIG } from '../../config/appConfig.js';

export const GridCard = {
  /**
   * Render a grid card used in Create, Onboarding, and Insights pages.
   */
  render(options) {
    const { id, name, category, icon, isSelected, actionAttr, subtitleHtml, alwaysColor } = options;
    
    // Resolve category color config
    const categoryMeta = APP_CONFIG.categories.find(cat => cat.id === category);
    const colorKey = categoryMeta ? categoryMeta.defaultColor : null;
    
    const isCustom = category === 'blank' || id === 'custom';
    const themeHex = isCustom ? '#64748b' : APP_CONFIG.getHexColor(colorKey, '#64748b');

    const isEmoji = (str) => /\p{Emoji}/u.test(str) && !/^[a-zA-Z0-9_-]+$/.test(str);
    const iconName = (!icon || isEmoji(icon)) ? 'target' : icon;

    const showColor = isSelected || alwaysColor;
    const activeTopBorderBg = showColor ? themeHex : '#e2e8f0';

    const cardSelectedClasses = isSelected
      ? 'border-transparent bg-surface-sunken/50 scale-98 shadow-sm'
      : 'border-divider bg-surface-card hover:-translate-y-0.5 hover:shadow-md shadow-sm';

    const cardSelectedStyle = isSelected
      ? `border-color: ${themeHex}; box-shadow: 0 0 0 1px ${themeHex};`
      : '';

    return `
      <button 
        type="button"
        ${actionAttr}
        class="group onboarding-preset-card relative overflow-hidden flex flex-col items-center pt-6 pb-4 px-3 rounded-xl border transition-all duration-300 ${cardSelectedClasses} min-h-[105px] justify-between"
        style="${cardSelectedStyle}"
      >
        <!-- Top Horizontal Accent Line -->
        <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${activeTopBorderBg};"></div>
        
        <i data-lucide="${iconName}" class="w-5 h-5 mb-1.5 transition-transform duration-300 group-hover:scale-110" style="color: ${themeHex};"></i>
        <span class="text-[8px] font-extrabold tracking-widest uppercase text-text-secondary" style="color: ${themeHex};">${isCustom ? 'Custom' : category}</span>
        <span class="text-xs font-bold text-text-primary line-clamp-2 text-center leading-tight w-full mt-1">${name}</span>
        ${subtitleHtml ? subtitleHtml : `<span class="text-[10px] text-text-secondary mt-0.5 uppercase tracking-wider opacity-0 h-0 overflow-hidden">${category}</span>`}
      </button>
    `;
  }
};
