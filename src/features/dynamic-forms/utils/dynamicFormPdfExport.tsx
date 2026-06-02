import React from 'react';
import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';
import axios from 'axios';
import { getRuntimeApiRoot } from '@/config/runtimeApiBase';
import type { FormField, FormSchema } from '@/services/FormService';
import { applySinanFichaToField, formatOptionLabelPlain } from '@/features/dynamic-forms/utils/sinanFichaUi';
import { isHepatiteCriancaHBVForm } from '@/features/dynamic-forms/utils/hepatiteCriancaHbvLimits';
import {
  collectSchemaReferenceMapsNeeded,
  EMPTY_RESPONSE_LIST_LABEL_MAPS,
  formatCellValueForResponseList,
  getValueAtPath,
  type ResponseListLabelMaps,
} from '@/features/dynamic-forms/utils/formResponsesListUtils';
import { CRIANCA_LAB_DEPRECATED_KEYS } from '@/features/dynamic-forms/components/CriancaLabSorologiaEsquemaPanel';

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

const formatDatePtBr = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';
  const raw = String(value).trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return raw || '—';
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

const PdfFieldRow: React.FC<{ label: string; value: string; showBottomBorder?: boolean }> = ({
  label,
  value,
  showBottomBorder = true,
}) => (
  <View style={[pdfStyles.infoRow, !showBottomBorder ? { borderBottomWidth: 0 } : {}]}>
    <Text style={pdfStyles.infoLabel}>{label}</Text>
    <Text style={pdfStyles.infoValue}>{value}</Text>
  </View>
);

function shouldSkipField(field: FormField): boolean {
  if (field.hidden) return true;
  if (CRIANCA_LAB_DEPRECATED_KEYS.has(field.key)) return true;
  const type = String(field.type || '').toLowerCase();
  return SKIP_FIELD_TYPES.has(type);
}

function formatFieldValueForPdf(
  field: FormField,
  raw: unknown,
  maps: ResponseListLabelMaps,
  hbvForm: boolean,
): string {
  if (raw === null || raw === undefined || raw === '') return '—';

  const resolved = applySinanFichaToField(field, hbvForm);
  const type = String(resolved.type || '').toLowerCase();

  if (type === 'date') return formatDatePtBr(raw);

  const opts = resolved.options ?? resolved.customOptions ?? undefined;
  if (opts?.length) {
    const code = String(raw).trim();
    const found = opts.find(
      (o) => o.value === code || String(o.value) === String(raw),
    );
    if (found) {
      const plain = formatOptionLabelPlain(found, resolved);
      return plain.trim() || '—';
    }
  }

  const fromList = formatCellValueForResponseList(raw, resolved, maps).trim();
  return fromList.length > 0 ? fromList : '—';
}

async function loadReferenceLabelMaps(schema: FormSchema): Promise<ResponseListLabelMaps> {
  const need = collectSchemaReferenceMapsNeeded(schema);
  const maps: ResponseListLabelMaps = {
    municipioById: {},
    crsById: {},
    paisById: {},
  };

  const api = getRuntimeApiRoot();

  const tasks: Promise<void>[] = [];

  if (need.municipio) {
    tasks.push(
      axios
        .get<Array<{ idtipo_municipio?: number; descricao?: string }>>(`${api}/tipo-municipio/select`, {
          withCredentials: true,
        })
        .then(({ data }) => {
          if (!Array.isArray(data)) return;
          for (const m of data) {
            const id = m.idtipo_municipio;
            if (id == null) continue;
            maps.municipioById[String(id)] = (m.descricao || '').trim() || `Município ${id}`;
          }
        })
        .catch(() => undefined),
    );
  }

  if (need.pais) {
    tasks.push(
      axios
        .get<Array<{ idtipo_pais?: number; descricao?: string }>>(`${api}/tipo-pais/select`, {
          withCredentials: true,
        })
        .then(({ data }) => {
          if (!Array.isArray(data)) return;
          for (const p of data) {
            const id = p.idtipo_pais;
            if (id == null) continue;
            maps.paisById[String(id)] = (p.descricao || '').trim() || `País ${id}`;
          }
        })
        .catch(() => undefined),
    );
  }

  if (need.crs) {
    tasks.push(
      axios
        .get<Array<{ idcrs?: number; descricao?: string; nome?: string }>>(`${api}/crs/select`, {
          withCredentials: true,
        })
        .then(({ data }) => {
          if (!Array.isArray(data)) return;
          for (const c of data) {
            const id = c.idcrs;
            if (id == null) continue;
            maps.crsById[String(id)] = (c.descricao || c.nome || '').trim() || `CRS ${id}`;
          }
        })
        .catch(() => undefined),
    );
  }

  await Promise.all(tasks);
  return maps;
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
  maps: ResponseListLabelMaps,
): PdfSectionBlock[] {
  const hbvForm = isHepatiteCriancaHBVForm({ schema });
  const tabs = [...(schema.tabs ?? [])].sort((a, b) => a.order - b.order);
  const tabLabelById = new Map(tabs.map((t) => [t.id, t.label]));

  const sections = [...(schema.sections ?? [])].sort((a, b) => a.order - b.order);
  const blocks: PdfSectionBlock[] = [];
  let lastTabId: string | undefined;

  for (const section of sections) {
    const rows: Array<{ label: string; value: string }> = [];
    const fields = [...(section.fields ?? [])].sort((a, b) => a.order - b.order);

    for (const field of fields) {
      if (shouldSkipField(field)) continue;
      const raw = getValueAtPath(formData, field.key);
      const label = String(field.customLabel || field.label || field.key).trim();
      rows.push({
        label,
        value: formatFieldValueForPdf(field, raw, maps, hbvForm),
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

        {blocks.map((block, blockIndex) => (
          <View key={`${block.sectionTitle}-${blockIndex}`}>
            {block.tabLabel ? <Text style={pdfStyles.tabTitle}>{block.tabLabel}</Text> : null}
            <Text style={pdfStyles.sectionTitle}>{block.sectionTitle}</Text>
            {block.sectionDescription ? (
              <Text style={pdfStyles.sectionDescription}>{block.sectionDescription}</Text>
            ) : null}
            <View style={pdfStyles.infoGrid}>
              {block.rows.map((row, rowIndex) => (
                <PdfFieldRow
                  key={`${row.label}-${rowIndex}`}
                  label={row.label}
                  value={row.value}
                  showBottomBorder={rowIndex < block.rows.length - 1}
                />
              ))}
            </View>
          </View>
        ))}

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
  const maps = await loadReferenceLabelMaps(schema).catch(() => EMPTY_RESPONSE_LIST_LABEL_MAPS);
  const blocks = buildPdfBlocks(schema, formData, maps);
  if (blocks.length === 0) {
    throw new Error('Não há dados para exportar.');
  }
  const blob = await pdf(<DynamicFormPdfDocument meta={meta} blocks={blocks} />).toBlob();
  downloadBlob(blob, createFilename(meta));
}
