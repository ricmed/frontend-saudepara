import { Document, Page, StyleSheet, Text, View, pdf } from '@react-pdf/renderer';
import {
  AlignmentType,
  BorderStyle,
  Document as WordDocument,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

export interface ComunicacaoDaeFormExportAnexo {
  nome_arquivo: string;
  tipo_anexo: string;
  tamanho_bytes?: number;
}

export interface ComunicacaoDaeFormExportData {
  idComunicacao?: number;
  dataComunicacao?: string;
  nomePaciente?: string;
  origemTipo?: string;
  origemNome?: string;
  daeNome?: string;
  daeCodigo?: string;
  municipioOcorrencia?: string;
  municipioResidencia?: string;
  digitador?: string;
  telefoneDigitador?: string;
  observacao?: string;
  anexos?: ComunicacaoDaeFormExportAnexo[];
}

const fallbackValue = (value?: string | number | null): string => {
  if (value === undefined || value === null) return '-';
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : '-';
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return '-';
  try {
    const date = new Date(value);
    return date.toLocaleString('pt-BR', {
      timeZone: 'America/Belem',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return fallbackValue(value);
  }
};

const formatBytes = (size?: number): string => {
  if (!size || Number.isNaN(size)) return '-';
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
};

const formatAnexoTipo = (tipo?: string): string => {
  if (!tipo) return '-';
  if (tipo === 'FICHA_NOTIFICACAO') return 'Ficha de notificacao';
  if (tipo === 'RELATORIO_INVESTIGACAO') return 'Relatorio de investigacao';
  return tipo;
};

const createFilenameBase = (data: ComunicacaoDaeFormExportData): string => {
  const idPart = data.idComunicacao ? `comunicacao_dae_${data.idComunicacao}` : 'comunicacao_dae_rascunho';
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return `${idPart}_${timestamp}`;
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

const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 22,
    paddingBottom: 24,
    paddingHorizontal: 24,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
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
  sectionTitle: {
    color: '#1d4ed8',
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
    marginTop: 8,
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
  paragraphBlock: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    padding: 9,
    color: '#111827',
    lineHeight: 1.5,
  },
  anexoRow: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 9,
    marginBottom: 6,
  },
  anexoTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 2,
  },
  anexoMeta: {
    fontSize: 9,
    color: '#4b5563',
  },
  footer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
  },
});

const PdfFieldRow: React.FC<{ label: string; value: string; showBottomBorder?: boolean }> = ({
  label,
  value,
  showBottomBorder = true,
}) => (
  <View
    style={[
      pdfStyles.infoRow,
      !showBottomBorder
        ? {
            borderBottomWidth: 0,
          }
        : {},
    ]}
  >
    <Text style={pdfStyles.infoLabel}>{label}</Text>
    <Text style={pdfStyles.infoValue}>{value}</Text>
  </View>
);

const ComunicacaoDaePdfDocument: React.FC<{ data: ComunicacaoDaeFormExportData }> = ({ data }) => {
  const anexos = data.anexos ?? [];
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Numero da comunicacao', value: data.idComunicacao ? `#${data.idComunicacao}` : 'Rascunho' },
    { label: 'Data da comunicacao', value: formatDateTime(data.dataComunicacao) },
    { label: 'Nome do paciente', value: fallbackValue(data.nomePaciente) },
    { label: 'Tipo de origem', value: fallbackValue(data.origemTipo) },
    { label: 'Unidade notificadora', value: fallbackValue(data.origemNome) },
    { label: 'DAE', value: fallbackValue(data.daeNome) },
    { label: 'Codigo DAE', value: fallbackValue(data.daeCodigo) },
    { label: 'Municipio de ocorrencia', value: fallbackValue(data.municipioOcorrencia) },
    { label: 'Municipio de residencia', value: fallbackValue(data.municipioResidencia) },
    { label: 'Digitador', value: fallbackValue(data.digitador) },
    { label: 'Telefone do digitador', value: fallbackValue(data.telefoneDigitador) },
  ];

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.headerTitle}>COMUNICACAO DAE</Text>
          <Text style={pdfStyles.headerSubtitle}>Doencas, Agravos e Eventos de Saude Publica</Text>
        </View>

        <Text style={pdfStyles.sectionTitle}>Dados da comunicacao</Text>
        <View style={pdfStyles.infoGrid}>
          {rows.map((row, index) => (
            <PdfFieldRow
              key={`${row.label}-${index}`}
              label={row.label}
              value={row.value}
              showBottomBorder={index < rows.length - 1}
            />
          ))}
        </View>

        <Text style={pdfStyles.sectionTitle}>Observacoes</Text>
        <View style={pdfStyles.paragraphBlock}>
          <Text>{fallbackValue(data.observacao)}</Text>
        </View>

        <Text style={pdfStyles.sectionTitle}>Anexos</Text>
        {anexos.length > 0 ? (
          <View>
            {anexos.map((anexo, index) => (
              <View key={`${anexo.nome_arquivo}-${index}`} style={pdfStyles.anexoRow}>
                <Text style={pdfStyles.anexoTitle}>
                  {index + 1}. {fallbackValue(anexo.nome_arquivo)}
                </Text>
                <Text style={pdfStyles.anexoMeta}>
                  Tipo: {formatAnexoTipo(anexo.tipo_anexo)} | Tamanho: {formatBytes(anexo.tamanho_bytes)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={pdfStyles.paragraphBlock}>
            <Text>Nenhum anexo informado.</Text>
          </View>
        )}

        <Text style={pdfStyles.footer}>Documento gerado automaticamente pelo sistema Saude Para</Text>
      </Page>
    </Document>
  );
};

const createWordFieldTable = (rows: Array<{ label: string; value: string }>): Table =>
  new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders: {
      top: { style: BorderStyle.SINGLE, color: 'E5E7EB', size: 1 },
      bottom: { style: BorderStyle.SINGLE, color: 'E5E7EB', size: 1 },
      left: { style: BorderStyle.SINGLE, color: 'E5E7EB', size: 1 },
      right: { style: BorderStyle.SINGLE, color: 'E5E7EB', size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, color: 'E5E7EB', size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, color: 'E5E7EB', size: 1 },
    },
    rows: rows.map(
      (row) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 34, type: WidthType.PERCENTAGE },
              shading: { fill: 'F9FAFB' },
              children: [
                new Paragraph({
                  spacing: { before: 80, after: 80 },
                  children: [new TextRun({ text: row.label, bold: true })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 66, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  spacing: { before: 80, after: 80 },
                  children: [new TextRun({ text: row.value })],
                }),
              ],
            }),
          ],
        })
    ),
  });

const buildWordDocument = (data: ComunicacaoDaeFormExportData): WordDocument => {
  const anexos = data.anexos ?? [];
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Numero da comunicacao', value: data.idComunicacao ? `#${data.idComunicacao}` : 'Rascunho' },
    { label: 'Data da comunicacao', value: formatDateTime(data.dataComunicacao) },
    { label: 'Nome do paciente', value: fallbackValue(data.nomePaciente) },
    { label: 'Tipo de origem', value: fallbackValue(data.origemTipo) },
    { label: 'Unidade notificadora', value: fallbackValue(data.origemNome) },
    { label: 'DAE', value: fallbackValue(data.daeNome) },
    { label: 'Codigo DAE', value: fallbackValue(data.daeCodigo) },
    { label: 'Municipio de ocorrencia', value: fallbackValue(data.municipioOcorrencia) },
    { label: 'Municipio de residencia', value: fallbackValue(data.municipioResidencia) },
    { label: 'Digitador', value: fallbackValue(data.digitador) },
    { label: 'Telefone do digitador', value: fallbackValue(data.telefoneDigitador) },
  ];

  const anexoParagraphs =
    anexos.length > 0
      ? anexos.flatMap((anexo, index) => [
          new Paragraph({
            spacing: { after: 70 },
            children: [
              new TextRun({ text: `${index + 1}. `, bold: true }),
              new TextRun({ text: fallbackValue(anexo.nome_arquivo) }),
            ],
          }),
          new Paragraph({
            spacing: { after: 170 },
            children: [
              new TextRun({
                text: `Tipo: ${formatAnexoTipo(anexo.tipo_anexo)} | Tamanho: ${formatBytes(anexo.tamanho_bytes)}`,
              }),
            ],
          }),
        ])
      : [new Paragraph({ text: 'Nenhum anexo informado.' })];

  return new WordDocument({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [new TextRun({ text: 'COMUNICACAO DAE', bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 260 },
            children: [new TextRun({ text: 'Doencas, Agravos e Eventos de Saude Publica' })],
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 140, after: 120 },
            children: [new TextRun({ text: 'Dados da comunicacao', bold: true })],
          }),
          createWordFieldTable(rows),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 220, after: 120 },
            children: [new TextRun({ text: 'Observacoes', bold: true })],
          }),
          new Paragraph({
            spacing: { after: 220 },
            children: [new TextRun({ text: fallbackValue(data.observacao) })],
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 120 },
            children: [new TextRun({ text: 'Anexos', bold: true })],
          }),
          ...anexoParagraphs,
        ],
      },
    ],
  });
};

export const exportarComunicacaoDaeFormularioPDF = async (
  data: ComunicacaoDaeFormExportData
): Promise<void> => {
  const blob = await pdf(<ComunicacaoDaePdfDocument data={data} />).toBlob();
  downloadBlob(blob, `${createFilenameBase(data)}.pdf`);
};

export const exportarComunicacaoDaeFormularioWord = async (
  data: ComunicacaoDaeFormExportData
): Promise<void> => {
  const doc = buildWordDocument(data);
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${createFilenameBase(data)}.docx`);
};
