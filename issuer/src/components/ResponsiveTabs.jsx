import { useCallback, useEffect, useRef, useState } from 'react';

function splitTabLabel(label) {
  const match = String(label || '').match(/^(\S+)\s+(.+)$/);
  if (!match) {
    return { icon: label, text: label };
  }
  return { icon: match[1], text: match[2] };
}

export default function ResponsiveTabs({ tabs, activeTab, onTabChange, children }) {
  const measureRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const checkOverflow = useCallback(() => {
    const el = measureRef.current;
    if (!el) return;
    setCollapsed(el.scrollWidth > el.clientWidth + 1);
  }, []);

  useEffect(() => {
    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    if (measureRef.current?.parentElement) {
      observer.observe(measureRef.current.parentElement);
    }
    return () => observer.disconnect();
  }, [checkOverflow, tabs]);

  useEffect(() => {
    setMenuOpen(false);
  }, [activeTab]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-tabs-menu]')) setMenuOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  const activeTabData = tabs.find((t) => t.id === activeTab);
  const activeParts = splitTabLabel(activeTabData?.label || '');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobile(media.matches);
    update();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hidden measure element to detect overflow */}
      <div
        ref={measureRef}
        className="flex gap-1 overflow-hidden"
        style={{ height: 0, visibility: 'hidden', position: 'absolute' }}
        aria-hidden="true"
      >
        {tabs.map((tab) => (
          <div key={tab.id} className="px-6 py-3 text-base font-semibold whitespace-nowrap">
            {tab.label}
          </div>
        ))}
      </div>

      {isMobile ? (
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const parts = splitTabLabel(tab.label);
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                aria-label={parts.text}
                title={parts.text}
                className={`flex-1 py-3 rounded-t-lg font-semibold text-lg transition-all cursor-pointer border-none ${
                  tab.id === activeTab
                    ? 'bg-[#30414B] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <span aria-hidden="true">{parts.icon}</span>
              </button>
            );
          })}
        </div>
      ) : collapsed ? (
        /* Hamburger dropdown mode */
        <div className="relative mb-0" data-tabs-menu>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-full flex items-center justify-between px-5 py-3 bg-[#30414B] text-white rounded-t-lg font-semibold text-base cursor-pointer border-none"
            aria-expanded={menuOpen}
          >
            <span>{activeTabData?.label || ''}</span>
            <span className="text-sm ml-2">{menuOpen ? '▲' : '▼'}</span>
          </button>

          {menuOpen && (
            <div className="absolute top-full left-0 right-0 bg-white border-2 border-t-0 border-[#30414B] rounded-b-lg shadow-lg z-50">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`w-full px-5 py-3 text-left font-semibold text-base transition-colors border-b border-gray-200 last:border-b-0 last:rounded-b-lg cursor-pointer ${
                    tab.id === activeTab
                      ? 'bg-[#30414B] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Horizontal tabs mode */
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-6 py-3 rounded-t-lg font-semibold text-base transition-all cursor-pointer border-none ${
                tab.id === activeTab
                  ? 'bg-[#30414B] text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content area connected to tabs */}
      <div className="bg-white border-2 border-[#30414B] rounded-b-lg rounded-tr-lg p-6 shadow-sm">
        {isMobile && (
          <h2 className="text-xl font-bold text-[#30414B] mb-4">{activeParts.text}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
