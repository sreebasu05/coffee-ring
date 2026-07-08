import { APP_CONFIG } from '../../config/appConfig.js';

export const GridCard = {
  /**
   * Render a grid card used in Create, Onboarding, and Insights pages.
   */
  render(options) {
    const { id, name, category, icon, isSelected, actionAttr, subtitleHtml } = options;
    
    // Resolve category color config
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
    
    // Custom blank card category defaults to dark slate theme
    const themeHex = category === 'blank'
      ? '#0f172a'
      : (colorHexMap[colorKey] || '#64748b');
      
    const isEmoji = (str) => /\p{Emoji}/u.test(str) && !/^[a-zA-Z0-9_-]+$/.test(str);
    const iconName = (!icon || isEmoji(icon)) ? 'target' : icon;

    // Selections styling overrides (color only on selection, otherwise black and white)
    const activeTopBorderBg = isSelected ? themeHex : '#e2e8f0';
    const activeIconClass = isSelected ? '' : 'text-slate-400';
    const activeIconStyle = isSelected ? `style="color: ${themeHex};"` : '';
    
    const activeLabelClass = isSelected ? '' : 'text-slate-400';
    const activeLabelStyle = isSelected ? `style="color: ${themeHex};"` : '';
    
    const cardSelectedClasses = isSelected
      ? 'border-transparent bg-slate-50/50 scale-98 shadow-sm' 
      : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-md shadow-sm';
      
    const cardSelectedStyle = isSelected
      ? `border-color: ${themeHex}; box-shadow: 0 0 0 1px ${themeHex};`
      : '';

    return `
      <button 
        type="button"
        ${actionAttr}
        class="group onboarding-preset-card relative overflow-hidden flex flex-col items-center pt-6 pb-4 px-3 rounded-2xl border transition-all duration-300 ${cardSelectedClasses} min-h-[105px] justify-between"
        style="${cardSelectedStyle}"
      >
        <!-- Full-Width Top Accent Color Line -->
        <div class="absolute top-0 left-0 right-0 h-1" style="background-color: ${activeTopBorderBg};"></div>
        
        <i data-lucide="${iconName}" class="w-5 h-5 mb-1.5 transition-transform duration-300 group-hover:scale-110 ${activeIconClass}" ${activeIconStyle}></i>
        <span class="text-[8px] font-extrabold tracking-widest uppercase ${activeLabelClass}" ${activeLabelStyle}>${category === 'blank' ? 'Custom' : category}</span>
        <span class="text-xs font-bold text-text-primary line-clamp-2 text-center leading-tight w-full mt-1">${name}</span>
        ${subtitleHtml ? subtitleHtml : `<span class="text-[10px] text-text-secondary mt-0.5 uppercase tracking-wider opacity-0 h-0 overflow-hidden">${category}</span>`}
      </button>
    `;
  }
};
