import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import type { FormSchema } from '@/services/FormService';
import {
  FORM_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type FormTemplate,
} from '../data/formTemplates';

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (template: FormTemplate) => void;
}

export const TemplateGalleryModal: React.FC<Props> = ({ open, onClose, onApply }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState<FormTemplate | null>(null);

  if (!open) return null;

  const filtered = FORM_TEMPLATES.filter((t) => {
    const matchCat = activeCategory === 'all' || t.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch =
      !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const totalFields = (schema: FormSchema) =>
    schema.sections.reduce((acc, s) => acc + s.fields.length, 0);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Escolher um template</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Comece com uma estrutura pronta e personalize como quiser.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">

          {/* ── Painel esquerdo: filtros ──────────────────────────────── */}
          <aside className="w-44 flex-shrink-0 border-r border-gray-100 py-4 px-3 flex flex-col gap-1">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeCategory === cat.key
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </aside>

          {/* ── Área principal ────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-h-0">

            {/* Busca */}
            <div className="px-5 pt-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar template..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>

            {/* Grid de cards */}
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  Nenhum template encontrado.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filtered.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setPreview(tpl)}
                      className={`text-left p-4 rounded-xl border-2 transition-all group ${
                        preview?.id === tpl.id
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl leading-none flex-shrink-0">{tpl.emoji}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 text-sm leading-tight">{tpl.name}</p>
                          <p className="text-xs text-gray-500 mt-1 leading-snug line-clamp-2">
                            {tpl.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {tpl.categoryLabel}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {tpl.schema.sections.length} seç. · {totalFields(tpl.schema)} campos
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Painel de preview ─────────────────────────────────────── */}
          {preview && (
            <aside className="w-56 flex-shrink-0 border-l border-gray-100 flex flex-col">
              <div className="px-4 py-4 flex-1 overflow-y-auto">
                <div className="text-4xl text-center mb-3">{preview.emoji}</div>
                <h3 className="font-bold text-gray-900 text-sm text-center">{preview.name}</h3>
                <p className="text-xs text-gray-500 text-center mt-1 leading-snug">{preview.description}</p>

                <div className="mt-4 space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Estrutura</p>
                  {preview.schema.sections.map((sec) => (
                    <div key={sec.id} className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs font-semibold text-gray-700 truncate">{sec.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {sec.fields.length} {sec.fields.length === 1 ? 'campo' : 'campos'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { onApply(preview); onClose(); }}
                  className="w-full px-3 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Usar este template
                </button>
              </div>
            </aside>
          )}
        </div>

        {/* ── Rodapé ────────────────────────────────────────────────────── */}
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <p className="text-xs text-gray-400">
            {filtered.length} template{filtered.length !== 1 ? 's' : ''} disponível{filtered.length !== 1 ? 'is' : ''}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
          >
            Começar do zero
          </button>
        </div>
      </div>
    </div>
  );
};
