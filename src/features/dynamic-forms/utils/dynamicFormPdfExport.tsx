import React from 'react';
import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';
import type { FormField, FormSchema } from '@/services/FormService';
import { isHepatiteCriancaHBVForm } from '@/features/dynamic-forms/utils/hepatiteCriancaHbvLimits';
import { getValueAtPath } from '@/features/dynamic-forms/utils/formResponsesListUtils';
import {
  EMPTY_PDF_LABEL_MAPS,
  formatPdfFieldValue,
  loadPdfLabelMaps,
  shouldSkipPdfField,
  type PdfLabelMaps,
} from '@/features/dynamic-forms/utils/formPdfLabelMaps';
import { CRIANCA_LAB_DEPRECATED_KEYS } from '@/features/dynamic-forms/components/CriancaLabSorologiaEsquemaPanel';
import {
  isHepatitePdfFieldVisible,
  shouldIncludeHepatiteSectionInPdf,
} from '@/features/dynamic-forms/utils/hepatiteCriancaPdfExport';
import { createDefaultFieldStates, evaluateRules } from '@/utils/rulesEngine';

const SKIP_FIELD_TYPES = new Set(['file', 'signature', 'table', 'hidden', 'estabelecimento-search']);

export interface DynamicFormPdfExportMeta {
  title: string;
  subtitle?: string;
  submissionId?: number;
  statusLabel?: string;
}

const fallbackValue = (value?: string | null): string => {
  if (value === undefined || value === null) return '—';
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : '—';
};

const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 22,
    paddingBottom: 28,
    paddingHorizontal: 24,
    fontSize: 9,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#2563eb',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 700,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#dbeafe',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 1.35,
  },
  sectionBlock: {
    marginBottom: 8,
  },
  tabTitle: {
    color: '#1e40af',
    fontSize: 11,
    fontWeight: 700,
    marginTop: 10,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
  },
  sectionHeaderGroup: {
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 700,
    backgroundColor: '#2563eb',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 3,
    marginTop: 8,
    marginBottom: 6,
  },
  sectionDescription: {
    color: '#4b5563',
    fontSize: 8,
    marginBottom: 6,
    lineHeight: 1.4,
  },
  infoGrid: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  infoRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  infoLabel: {
    width: '40%',
    backgroundColor: '#eff6ff',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontWeight: 700,
    color: '#1e3a8a',
    fontSize: 8,
  },
  infoValue: {
    width: '60%',
    paddingVertical: 6,
    paddingHorizontal: 8,
    color: '#111827',
    fontSize: 9,
    lineHeight: 1.35,
  },
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 24,
    right: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 6,
    fontSize: 7,
    color: '#6b7280',
    textAlign: 'center',
  },
});

/** Seções com até N linhas tentam ficar inteiras na mesma página. */
const PDF_SMALL_SECTION_MAX_ROWS = 10;
/** Espaço mínimo (pt) após título de seção/aba — evita cabeçalho órfão no fim da página. */
const PDF_SECTION_MIN_PRESENCE_AHEAD = 96;
const PDF_TAB_MIN_PRESENCE_AHEAD = 112;

const PdfFieldRow: React.FC<{ label: string; value: string; showBottomBorder?: boolean }> = ({
  label,
  value,
  showBottomBorder = true,
}) => (
  <View wrap={false} style={[pdfStyles.infoRow, !showBottomBorder ? { borderBottomWidth: 0 } : {}]}>
    <Text style={pdfStyles.infoLabel}>{label}</Text>
    <Text style={pdfStyles.infoValue}>{value}</Text>
  </View>
);

function shouldSkipField(field: FormField): boolean {
  if (shouldSkipPdfField(field)) return true;
  if (field.hidden) return true;
  if (CRIANCA_LAB_DEPRECATED_KEYS.has(field.key)) return true;
  const type = String(field.type || '').toLowerCase();
  return SKIP_FIELD_TYPES.has(type);
}

type PdfSectionBlock = {
  tabLabel?: string;
  sectionTitle: string;
  sectionDescription?: string;
  rows: Array<{ label: string; value: string }>;
};

function buildPdfBlocks(
  schema: FormSchema,
  formData: Record<string, unknown>,
  maps: PdfLabelMaps,
): PdfSectionBlock[] {
  const hbvForm = isHepatiteCriancaHBVForm({ schema });
  const tabs = [...(schema.tabs ?? [])].sort((a, b) => a.order - b.order);
  const tabLabelById = new Map(tabs.map((t) => [t.id, t.label]));

  const ruleVisibility: Record<string, boolean> | undefined = hbvForm
    ? (() => {
        const defaultStates = createDefaultFieldStates(schema.sections ?? []);
        const evaluated = evaluateRules(schema.rules, formData, defaultStates);
        const visibility: Record<string, boolean> = {};
        for (const [key, state] of Object.entries(evaluated)) {
          visibility[key] = state.visible !== false;
        }
        return visibility;
      })()
    : undefined;

  const sections = [...(schema.sections ?? [])].sort((a, b) => a.order - b.order);
  const blocks: PdfSectionBlock[] = [];
  let lastTabId: string | undefined;

  for (const section of sections) {
    if (hbvForm && !shouldIncludeHepatiteSectionInPdf(section.id, formData)) continue;

    const rows: Array<{ label: string; value: string }> = [];
    const fields = [...(section.fields ?? [])].sort((a, b) => a.order - b.order);

    for (const field of fields) {
      if (shouldSkipField(field)) continue;
      if (hbvForm && !isHepatitePdfFieldVisible(field.key, ruleVisibility)) continue;

      const raw = getValueAtPath(formData, field.key);
      const label = String(field.customLabel || field.label || field.key).trim();
      rows.push({
        label,
        value: formatPdfFieldValue(field, raw, maps, formData, hbvForm),
      });
    }

    if (rows.length === 0) continue;

    const tabId = section.tab;
    const tabLabel =
      tabId && tabId !== lastTabId ? tabLabelById.get(tabId) : undefined;
    if (tabId) lastTabId = tabId;

    blocks.push({
      tabLabel,
      sectionTitle: section.title,
      sectionDescription: section.description,
      rows,
    });
  }

  return blocks;
}

const DynamicFormPdfDocument: React.FC<{
  meta: DynamicFormPdfExportMeta;
  blocks: PdfSectionBlock[];
}> = ({ meta, blocks }) => {
  const generatedAt = new Date().toLocaleString('pt-BR', { timeZone: 'America/Belem' });

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page} wrap>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.headerTitle}>{meta.title}</Text>
          {meta.subtitle ? <Text style={pdfStyles.headerSubtitle}>{meta.subtitle}</Text> : null}
          <Text style={pdfStyles.headerSubtitle}>
            {meta.submissionId ? `Notificação #${meta.submissionId}` : 'Rascunho / pré-visualização'}
            {meta.statusLabel ? ` · ${meta.statusLabel}` : ''}
            {' · Gerado em '}
            {generatedAt}
          </Text>
        </View>

        {blocks.map((block, blockIndex) => {
          const keepSectionTogether = block.rows.length <= PDF_SMALL_SECTION_MAX_ROWS;
          return (
            <View
              key={`${block.sectionTitle}-${blockIndex}`}
              style={pdfStyles.sectionBlock}
              wrap={!keepSectionTogether}
            >
              {block.tabLabel ? (
                <Text style={pdfStyles.tabTitle} minPresenceAhead={PDF_TAB_MIN_PRESENCE_AHEAD}>
                  {block.tabLabel}
                </Text>
              ) : null}
              <View style={pdfStyles.sectionHeaderGroup} wrap={false}>
                <Text
                  style={pdfStyles.sectionTitle}
                  minPresenceAhead={keepSectionTogether ? undefined : PDF_SECTION_MIN_PRESENCE_AHEAD}
                >
                  {block.sectionTitle}
                </Text>
                {block.sectionDescription ? (
                  <Text style={pdfStyles.sectionDescription}>{block.sectionDescription}</Text>
                ) : null}
              </View>
              <View style={pdfStyles.infoGrid}>
                {block.rows.map((row, rowIndex) => (
                  <PdfFieldRow
                    key={`${row.label}-${rowIndex}`}
                    label={row.label}
                    value={fallbackValue(row.value)}
                    showBottomBorder={rowIndex < block.rows.length - 1}
                  />
                ))}
              </View>
            </View>
          );
        })}

        <Text style={pdfStyles.footer} fixed>
          Documento gerado automaticamente pelo Sistema Saúde Pará
        </Text>
      </Page>
    </Document>
  );
};

const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

function createFilename(meta: DynamicFormPdfExportMeta): string {
  const base = meta.submissionId
    ? `ficha_${meta.submissionId}`
    : 'ficha_rascunho';
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const slug = meta.title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
  return `${slug || base}_${timestamp}.pdf`;
}

export async function exportDynamicFormPdf(
  schema: FormSchema,
  formData: Record<string, unknown>,
  meta: DynamicFormPdfExportMeta,
): Promise<void> {
  const maps = await loadPdfLabelMaps(schema).catch(() => EMPTY_PDF_LABEL_MAPS);
  const blocks = buildPdfBlocks(schema, formData, maps);
  if (blocks.length === 0) {
    throw new Error('Não há dados para exportar.');
  }
  const blob = await pdf(<DynamicFormPdfDocument meta={meta} blocks={blocks} />).toBlob();
  downloadBlob(blob, createFilename(meta));
}
