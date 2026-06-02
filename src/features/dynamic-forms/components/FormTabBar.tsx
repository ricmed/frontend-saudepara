import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { FormTab } from '@/services/FormService';

export interface FormTabBarProps {
  tabs: FormTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
}

type IndicatorState = { left: number; width: number };

/**
 * Abas do formulário dinâmico: indicador deslizante, hover suave, teclado (←/→ Home/End).
 * Fica fora dos cards de seção — não altera o layout do conteúdo.
 */
export const FormTabBar: React.FC<FormTabBarProps> = ({ tabs, activeTabId, onTabChange }) => {
  const navRef = useRef<HTMLElement>(null);
  const tabButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<IndicatorState>({ left: 0, width: 0 });
  const [indicatorReady, setIndicatorReady] = useState(false);

  const fewTabs = tabs.length <= 2;

  const updateIndicator = useCallback(() => {
    const nav = navRef.current;
    const btn = tabButtonRefs.current[activeTabId];
    if (!nav || !btn) return;
    const navRect = nav.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setIndicator({
      left: btnRect.left - navRect.left + nav.scrollLeft,
      width: btnRect.width,
    });
    setIndicatorReady(true);
  }, [activeTabId]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator, tabs]);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return undefined;

    const ro = new ResizeObserver(() => updateIndicator());
    ro.observe(nav);
    window.addEventListener('resize', updateIndicator);
    nav.addEventListener('scroll', updateIndicator, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateIndicator);
      nav.removeEventListener('scroll', updateIndicator);
    };
  }, [updateIndicator]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    const idx = tabs.findIndex((t) => t.id === activeTabId);
    if (idx < 0) return;

    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight') nextIdx = Math.min(idx + 1, tabs.length - 1);
    else if (e.key === 'ArrowLeft') nextIdx = Math.max(idx - 1, 0);
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = tabs.length - 1;
    else return;

    if (nextIdx === idx) return;
    e.preventDefault();
    const nextTab = tabs[nextIdx];
    onTabChange(nextTab.id);
    requestAnimationFrame(() => tabButtonRefs.current[nextTab.id]?.focus());
  };

  return (
    <div className="mb-6">
      <nav
        ref={navRef}
        role="tablist"
        aria-label="Abas do formulário"
        onKeyDown={handleKeyDown}
        className={`relative -mb-px flex items-stretch gap-0.5 rounded-t-xl border border-blue-200/70 border-b-blue-300/40 bg-gradient-to-b from-blue-100/85 via-blue-50/90 to-white shadow-sm shadow-blue-900/[0.04] ${
          fewTabs ? 'flex-wrap sm:flex-nowrap' : 'scrollbar-hide overflow-x-auto'
        }`}
      >
        {/* Faixa “selecionado” — mesma cor das seções (blue-600), desliza entre abas */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 z-0 h-full max-h-[calc(100%-2px)] rounded-t-lg bg-blue-600 shadow-[0_4px_14px_rgba(37,99,235,0.35)] motion-reduce:transition-none transition-[left,width,opacity] duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]"
          style={{
            left: indicator.left,
            width: indicator.width,
            opacity: indicatorReady ? 1 : 0,
          }}
        />

        {tabs.map((tab) => {
          const isActive = activeTabId === tab.id;

          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabButtonRefs.current[tab.id] = el;
              }}
              type="button"
              role="tab"
              id={`form-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`form-tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative z-10 shrink-0 rounded-t-lg px-4 pb-3.5 pt-3 text-base
                motion-reduce:transition-none transition-[color,font-weight] duration-200 ease-out
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                ${fewTabs ? 'min-w-0 sm:flex-1 sm:px-6' : ''}
                ${
                  isActive
                    ? 'font-semibold text-white'
                    : 'font-medium text-blue-900/45 hover:text-blue-900/75 active:text-blue-900/90'
                }
              `}
            >
              <span className={`block whitespace-nowrap ${fewTabs ? 'sm:text-center' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

/** Classe para fade-in leve ao trocar de aba (usar com `key={activeTabId}` no painel). */
export const FORM_TAB_PANEL_ANIMATE_CLASS =
  'motion-reduce:animate-none animate-form-tab-fade';

export default FormTabBar;
