import React from 'react';
import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';
import { isSaireEventDescription } from '@/features/notificationForms/utils/saireEventPrefill';
import { isSairePaletteAtiva } from '@/features/apps/AppInterruptorProvider';
import {
  buildComunicacaoCasoFichaBlocks,
  type ComunicacaoCasoFichaRow,
} from '@/features/notificationForms/utils/caseFichaLayout';
import type { ModoLocalidadeEvento } from '@/features/notificationForms/types/index2';
import type { FormData } from '@/features/notificationForms/components/types';
import {
  formatNotificacaoForExport,
  prepareDataForExport,
  type ExportOptions,
} from '@/features/notificationForms/components/exportUtilities';

type ExportRow = Record<string, string | number | boolean | undefined>;

type NotificacaoListItem = {
  id: number;
  original?: Record<string, unknown>;
  [key: string]: unknown;
};

const pageBase = {
  paddingTop: 22,
  paddingBottom: 28,
  paddingHorizontal: 24,
  fontSize: 10,
  fontFamily: 'Helvetica' as const,
  backgroundColor: '#ffffff',
};

const pdfStylesDefault = StyleSheet.create({
  page: pageBase,
  header: {
    backgroundColor: '#1d4ed8',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 700,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#dbeafe',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 3,
  },
  sectionBlock: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 700,
    backgroundColor: '#1d4ed8',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 3,
    marginTop: 8,
    marginBottom: 6,
  },
  infoGrid: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  infoRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  infoLabel: {
    width: '36%',
    backgroundColor: '#f9fafb',
    paddingVertical: 7,
    paddingHorizontal: 9,
    fontWeight: 700,
    color: '#374151',
  },
  infoValue: {
    width: '64%',
    paddingVertical: 7,
    paddingHorizontal: 9,
    color: '#111827',
  },
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 24,
    right: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 6,
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
  },
});

const pdfStylesSaire = StyleSheet.create({
  page: pageBase,
  header: {
    backgroundColor: '#ff4d94',
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 700,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#ffffff',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 3,
  },
  sectionBlock: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 700,
    backgroundColor: '#be185d',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 3,
    marginTop: 8,
    marginBottom: 6,
  },
  infoGrid: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  infoRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  infoLabel: {
    width: '36%',
    backgroundColor: '#fdf2f8',
    paddingVertical: 7,
    paddingHorizontal: 9,
    fontWeight: 700,
    color: '#9d174d',
  },
  infoValue: {
    width: '64%',
    paddingVertical: 7,
    paddingHorizontal: 9,
    color: '#111827',
  },
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 24,
    right: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 6,
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
  },
});

type PdfStyles = typeof pdfStylesDefault;

const fallbackValue = (value?: string | null): string => {
  if (value === undefined || value === null) return '—';
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : '—';
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

const createFilename = (patientName: string, prefix = 'comunicacao_caso'): string => {
  const safeName = (patientName || 'paciente')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 24);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `${prefix}_${safeName || 'paciente'}_${timestamp}.pdf`;
};

function resolveModo(exportOptions?: ExportOptions): ModoLocalidadeEvento {
  return exportOptions?.modoLocalidadeEvento ?? 'NAO_USA';
}

function resolveIsSaire(data: ExportRow): boolean {
  return isSairePaletteAtiva() && isSaireEventDescription(String(data.Evento ?? ''));
}

const PdfFieldRow: React.FC<{
  styles: PdfStyles;
  label: string;
  value: string;
  showBottomBorder?: boolean;
}> = ({ styles, label, value, showBottomBorder = true }) => (
  <View
    style={[
      styles.infoRow,
      !showBottomBorder ? { borderBottomWidth: 0 } : {},
    ]}
  >
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const ComunicacaoCasoPdfPage: React.FC<{
  data: ExportRow;
  modo: ModoLocalidadeEvento;
  generatedAt: string;
}> = ({ data, modo, generatedAt }) => {
  const isSaire = resolveIsSaire(data);
  const styles = isSaire ? pdfStylesSaire : pdfStylesDefault;
  const blocks = buildComunicacaoCasoFichaBlocks(data, modo, '—');
  const eventoNome = fallbackValue(String(data.Evento ?? ''));
  const paciente = fallbackValue(String(data['Nome do Paciente'] ?? ''));

  return (
    <Page size="A4" style={styles.page} wrap>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>COMUNICAÇÃO DE CASO</Text>
        <Text style={styles.headerSubtitle}>
          {isSaire ? eventoNome : 'Sistema Saúde Pará, SES-PA'}
        </Text>
        <Text style={styles.headerSubtitle}>
          Paciente: {paciente}
          {' · '}
          Gerado em {generatedAt}
        </Text>
      </View>

      {blocks.map((block) => (
        <View key={block.title} style={styles.sectionBlock} wrap={block.rows.length > 10}>
          <Text style={styles.sectionTitle} minPresenceAhead={96}>
            {block.title}
          </Text>
          <View style={styles.infoGrid}>
            {block.rows.map((row: ComunicacaoCasoFichaRow, rowIndex: number) => (
              <PdfFieldRow
                key={`${block.title}-${row.label}`}
                styles={styles}
                label={row.label}
                value={fallbackValue(row.value)}
                showBottomBorder={rowIndex < block.rows.length - 1}
              />
            ))}
          </View>
        </View>
      ))}

      <Text style={styles.footer} fixed>
        Documento gerado automaticamente pelo sistema Saúde Pará
      </Text>
    </Page>
  );
};

const ComunicacaoCasoPdfDocument: React.FC<{
  rows: ExportRow[];
  modo: ModoLocalidadeEvento;
}> = ({ rows, modo }) => {
  const generatedAt = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Belem',
  });
  return (
    <Document>
      {rows.map((data, index) => (
        <ComunicacaoCasoPdfPage
          key={`${String(data['Nome do Paciente'] ?? 'paciente')}-${index}`}
          data={data}
          modo={modo}
          generatedAt={generatedAt}
        />
      ))}
    </Document>
  );
};

export async function exportarComunicacaoCasoDocumentoPDF(
  formData: FormData,
  exportOptions?: ExportOptions,
): Promise<void> {
  const data = prepareDataForExport(formData, exportOptions);
  const blob = await pdf(
    <ComunicacaoCasoPdfDocument rows={[data]} modo={resolveModo(exportOptions)} />,
  ).toBlob();
  downloadBlob(blob, createFilename(String(formData.paciente || 'paciente')));
}

export async function buildComunicacoesCasoDocumentosPdfBytes(
  notificacoes: NotificacaoListItem[],
  exportOptions?: ExportOptions,
): Promise<ArrayBuffer> {
  const rows = notificacoes.map((item) =>
    formatNotificacaoForExport(item as never, exportOptions),
  );
  const blob = await pdf(
    <ComunicacaoCasoPdfDocument rows={rows} modo={resolveModo(exportOptions)} />,
  ).toBlob();
  return blob.arrayBuffer();
}

export async function exportarComunicacoesCasoDocumentosPDF(
  notificacoes: NotificacaoListItem[],
  exportOptions?: ExportOptions,
): Promise<void> {
  const bytes = await buildComunicacoesCasoDocumentosPdfBytes(
    notificacoes,
    exportOptions,
  );
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const currentDate = new Date().toISOString().split('T')[0];
  downloadBlob(blob, `notificacoes_fichas_${currentDate}.pdf`);
}
