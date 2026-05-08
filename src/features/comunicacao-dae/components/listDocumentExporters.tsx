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
import { ComunicacaoDae } from '@/services/ComunicacaoDaeService';
import {
  formatComunicacaoDaeAgravoCodigos,
  formatComunicacaoDaeAgravoNomes,
} from '@/features/comunicacao-dae/comunicacaoDaeAgravoUtils';
import { calcularSemanaEpidemiologica } from '@/utils/timezoneUtils';

const fallbackValue = (value?: string | number | null): string => {
  if (value === undefined || value === null) return '-';
  const text = String(value).trim();
  return text.length > 0 ? text : '-';
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

const formatAnexoTipo = (value?: string): string => {
  if (!value) return '-';
  if (value === 'FICHA_NOTIFICACAO') return 'Ficha de notificacao';
  if (value === 'RELATORIO_INVESTIGACAO') return 'Relatorio de investigacao';
  return value;
};

const formatBytes = (size?: number): string => {
  if (!size || Number.isNaN(size)) return '-';
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
};

const createFilename = (baseName: string, extension: 'pdf' | 'docx'): string =>
  `${baseName}_${new Date().toISOString().slice(0, 10)}.${extension}`;

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
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    fontSize: 9,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#1d4ed8',
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 700,
    textAlign: 'center',
  },
  subtitle: {
    color: '#dbeafe',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 3,
  },
  table: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 2,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  headerCell: {
    backgroundColor: '#f3f4f6',
  },
  cell: {
    paddingVertical: 6,
    paddingHorizontal: 5,
    justifyContent: 'center',
  },
  borderedRight: {
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  cellHeaderText: {
    fontSize: 8,
    fontWeight: 700,
    color: '#1f2937',
  },
  cellText: {
    fontSize: 8,
    color: '#111827',
  },
  footer: {
    marginTop: 10,
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'right',
  },
  sectionTitle: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
    marginTop: 10,
  },
  infoGrid: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  infoRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
  },
  infoLabel: {
    width: '34%',
    backgroundColor: '#f9fafb',
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontWeight: 700,
    color: '#374151',
  },
  infoValue: {
    width: '66%',
    paddingVertical: 6,
    paddingHorizontal: 8,
    color: '#111827',
  },
  paragraphBlock: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 3,
    padding: 8,
  },
  anexoRow: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 3,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 5,
  },
  anexoTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: '#111827',
  },
  anexoMeta: {
    fontSize: 8,
    color: '#4b5563',
    marginTop: 2,
  },
});

const formatSemanaEpidemiologica = (dateString?: string | null): string => {
  const se = calcularSemanaEpidemiologica(dateString);
  return se ? `SE ${se.semana.toString().padStart(2, '0')}/${se.ano}` : '-';
};

const columnWidths = {
  id: '6%',
  data: '11%',
  semana: '9%',
  paciente: '14%',
  origem: '6%',
  unidade: '13%',
  dae: '15%',
  municipio: '13%',
  anexos: '6%',
  // codigos: removed — replaced by unidade notificadora
} as const;

interface PdfCellProps {
  text: string;
  width: string;
  isHeader?: boolean;
  borderedRight?: boolean;
}

const PdfCell = ({ text, width, isHeader = false, borderedRight = false }: PdfCellProps) => (
  <View style={[pdfStyles.cell, { width }, isHeader ? pdfStyles.headerCell : {}, borderedRight ? pdfStyles.borderedRight : {}]}>
    <Text style={isHeader ? pdfStyles.cellHeaderText : pdfStyles.cellText}>{text}</Text>
  </View>
);

const ComunicacoesDaeListPdfDocument = ({ comunicacoes }: { comunicacoes: ComunicacaoDae[] }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={pdfStyles.page}>
      <View style={pdfStyles.header}>
        <Text style={pdfStyles.title}>RELATORIO DE COMUNICACOES DAE</Text>
        <Text style={pdfStyles.subtitle}>
          Total de comunicacoes: {comunicacoes.length} | Gerado em {new Date().toLocaleString('pt-BR')}
        </Text>
      </View>

      <View style={pdfStyles.table}>
        <View style={pdfStyles.row}>
          <PdfCell text="ID" width={columnWidths.id} isHeader borderedRight />
          <PdfCell text="Data" width={columnWidths.data} isHeader borderedRight />
          <PdfCell text="SE" width={columnWidths.semana} isHeader borderedRight />
          <PdfCell text="Paciente" width={columnWidths.paciente} isHeader borderedRight />
          <PdfCell text="Origem" width={columnWidths.origem} isHeader borderedRight />
          <PdfCell text="Unidade" width={columnWidths.unidade} isHeader borderedRight />
          <PdfCell text="DAE" width={columnWidths.dae} isHeader borderedRight />
          <PdfCell text="Municipio" width={columnWidths.municipio} isHeader borderedRight />
          <PdfCell text="Anx" width={columnWidths.anexos} isHeader />
        </View>

        {comunicacoes.map((item, index) => (
          <View
            key={`${item.id_comunicacao}-${index}`}
            style={[pdfStyles.row, index === comunicacoes.length - 1 ? pdfStyles.lastRow : {}]}
          >
            <PdfCell text={`#${fallbackValue(item.id_comunicacao)}`} width={columnWidths.id} borderedRight />
            <PdfCell text={formatDateTime(item.data_comunicacao)} width={columnWidths.data} borderedRight />
            <PdfCell text={formatSemanaEpidemiologica(item.data_comunicacao)} width={columnWidths.semana} borderedRight />
            <PdfCell text={fallbackValue(item.nome_paciente)} width={columnWidths.paciente} borderedRight />
            <PdfCell text={fallbackValue(item.origem_tipo)} width={columnWidths.origem} borderedRight />
            <PdfCell text={fallbackValue(item.origem?.nome)} width={columnWidths.unidade} borderedRight />
            <PdfCell text={fallbackValue(formatComunicacaoDaeAgravoNomes(item))} width={columnWidths.dae} borderedRight />
            <PdfCell text={fallbackValue(item.tipo_municipio?.descricao)} width={columnWidths.municipio} borderedRight />
            <PdfCell text={String(item.comunicacao_dae_anexo?.length || 0)} width={columnWidths.anexos} />
          </View>
        ))}
      </View>

      <Text style={pdfStyles.footer}>Sistema Saude Para - Modulo Comunicacao DAE</Text>
    </Page>
  </Document>
);

const buildListWordDocument = (comunicacoes: ComunicacaoDae[]): WordDocument =>
  new WordDocument({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [new TextRun({ text: 'RELATORIO DE COMUNICACOES DAE', bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 220 },
            children: [
              new TextRun({
                text: `Total de comunicacoes: ${comunicacoes.length} | Gerado em ${new Date().toLocaleString('pt-BR')}`,
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, color: 'D1D5DB', size: 1 },
              bottom: { style: BorderStyle.SINGLE, color: 'D1D5DB', size: 1 },
              left: { style: BorderStyle.SINGLE, color: 'D1D5DB', size: 1 },
              right: { style: BorderStyle.SINGLE, color: 'D1D5DB', size: 1 },
              insideHorizontal: { style: BorderStyle.SINGLE, color: 'E5E7EB', size: 1 },
              insideVertical: { style: BorderStyle.SINGLE, color: 'E5E7EB', size: 1 },
            },
            rows: [
              new TableRow({
                children: [
                  'ID',
                  'Data',
                  'Sem. Epidemiologica',
                  'Paciente',
                  'Origem',
                  'Unidade Notificadora',
                  'DAE',
                  'Municipio',
                  'Anexos',
                ].map(
                  (header) =>
                    new TableCell({
                      shading: { fill: 'F3F4F6' },
                      children: [
                        new Paragraph({
                          children: [new TextRun({ text: header, bold: true })],
                        }),
                      ],
                    })
                ),
              }),
              ...comunicacoes.map(
                (item) =>
                  new TableRow({
                    children: [
                      `#${fallbackValue(item.id_comunicacao)}`,
                      formatDateTime(item.data_comunicacao),
                      formatSemanaEpidemiologica(item.data_comunicacao),
                      fallbackValue(item.nome_paciente),
                      fallbackValue(item.origem_tipo),
                      fallbackValue(item.origem?.nome),
                      fallbackValue(formatComunicacaoDaeAgravoNomes(item)),
                      fallbackValue(item.tipo_municipio?.descricao),
                      String(item.comunicacao_dae_anexo?.length || 0),
                    ].map(
                      (value) =>
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: value })] })],
                        })
                    ),
                  })
              ),
            ],
          }),
        ],
      },
    ],
  });

const ComunicacaoDaeDetalhadaPdfDocument = ({ comunicacao }: { comunicacao: ComunicacaoDae }) => {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Numero da comunicacao', value: comunicacao.id_comunicacao ? `#${comunicacao.id_comunicacao}` : '-' },
    { label: 'Data da comunicacao', value: formatDateTime(comunicacao.data_comunicacao) },
    { label: 'Semana Epidemiologica', value: formatSemanaEpidemiologica(comunicacao.data_comunicacao) },
    { label: 'Nome do paciente', value: fallbackValue(comunicacao.nome_paciente) },
    { label: 'Tipo de origem', value: fallbackValue(comunicacao.origem_tipo) },
    { label: 'Unidade notificadora', value: fallbackValue(comunicacao.origem?.nome) },
    { label: 'DAE', value: fallbackValue(formatComunicacaoDaeAgravoNomes(comunicacao)) },
    { label: 'Codigo DAE', value: fallbackValue(formatComunicacaoDaeAgravoCodigos(comunicacao)) },
    { label: 'Municipio de ocorrencia', value: fallbackValue(comunicacao.tipo_municipio?.descricao) },
    { label: 'Municipio de residencia', value: fallbackValue(comunicacao.tipo_municipio_residencia?.descricao) },
    { label: 'Digitador', value: fallbackValue(comunicacao.digitador) },
    { label: 'Telefone do digitador', value: fallbackValue(comunicacao.telefone_digitador) },
  ];

  const anexos = comunicacao.comunicacao_dae_anexo || [];

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>COMUNICACAO DAE DETALHADA</Text>
          <Text style={pdfStyles.subtitle}>Gerado em {new Date().toLocaleString('pt-BR')}</Text>
        </View>

        <Text style={pdfStyles.sectionTitle}>Dados da comunicacao</Text>
        <View style={pdfStyles.infoGrid}>
          {rows.map((row, index) => (
            <View
              key={`${row.label}-${index}`}
              style={[
                pdfStyles.infoRow,
                index === rows.length - 1
                  ? {
                      borderBottomWidth: 0,
                    }
                  : {},
              ]}
            >
              <Text style={pdfStyles.infoLabel}>{row.label}</Text>
              <Text style={pdfStyles.infoValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        <Text style={pdfStyles.sectionTitle}>Observacoes</Text>
        <View style={pdfStyles.paragraphBlock}>
          <Text>{fallbackValue(comunicacao.observacao_descricao)}</Text>
        </View>

        <Text style={pdfStyles.sectionTitle}>Anexos</Text>
        {anexos.length > 0 ? (
          <View>
            {anexos.map((anexo, index) => (
              <View key={`${anexo.id_anexo}-${index}`} style={pdfStyles.anexoRow}>
                <Text style={pdfStyles.anexoTitle}>
                  {index + 1}. {fallbackValue(anexo.nome_arquivo_original)}
                </Text>
                <Text style={pdfStyles.anexoMeta}>
                  Tipo: {formatAnexoTipo(anexo.tipo_anexo)} | Tamanho: {formatBytes(Number(anexo.tamanho_bytes))}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={pdfStyles.paragraphBlock}>
            <Text>Nenhum anexo informado.</Text>
          </View>
        )}
      </Page>
    </Document>
  );
};

const buildDetalhadoWordDocument = (comunicacao: ComunicacaoDae): WordDocument => {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Numero da comunicacao', value: comunicacao.id_comunicacao ? `#${comunicacao.id_comunicacao}` : '-' },
    { label: 'Data da comunicacao', value: formatDateTime(comunicacao.data_comunicacao) },
    { label: 'Semana Epidemiologica', value: formatSemanaEpidemiologica(comunicacao.data_comunicacao) },
    { label: 'Nome do paciente', value: fallbackValue(comunicacao.nome_paciente) },
    { label: 'Tipo de origem', value: fallbackValue(comunicacao.origem_tipo) },
    { label: 'Unidade notificadora', value: fallbackValue(comunicacao.origem?.nome) },
    { label: 'DAE', value: fallbackValue(formatComunicacaoDaeAgravoNomes(comunicacao)) },
    { label: 'Codigo DAE', value: fallbackValue(formatComunicacaoDaeAgravoCodigos(comunicacao)) },
    { label: 'Municipio de ocorrencia', value: fallbackValue(comunicacao.tipo_municipio?.descricao) },
    { label: 'Municipio de residencia', value: fallbackValue(comunicacao.tipo_municipio_residencia?.descricao) },
    { label: 'Digitador', value: fallbackValue(comunicacao.digitador) },
    { label: 'Telefone do digitador', value: fallbackValue(comunicacao.telefone_digitador) },
  ];

  const anexos = comunicacao.comunicacao_dae_anexo || [];

  return new WordDocument({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [new TextRun({ text: 'COMUNICACAO DAE DETALHADA', bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 220 },
            children: [new TextRun({ text: `Gerado em ${new Date().toLocaleString('pt-BR')}` })],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, color: 'D1D5DB', size: 1 },
              bottom: { style: BorderStyle.SINGLE, color: 'D1D5DB', size: 1 },
              left: { style: BorderStyle.SINGLE, color: 'D1D5DB', size: 1 },
              right: { style: BorderStyle.SINGLE, color: 'D1D5DB', size: 1 },
              insideHorizontal: { style: BorderStyle.SINGLE, color: 'E5E7EB', size: 1 },
              insideVertical: { style: BorderStyle.SINGLE, color: 'E5E7EB', size: 1 },
            },
            rows: rows.map(
              (row) =>
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 35, type: WidthType.PERCENTAGE },
                      shading: { fill: 'F9FAFB' },
                      children: [new Paragraph({ children: [new TextRun({ text: row.label, bold: true })] })],
                    }),
                    new TableCell({
                      width: { size: 65, type: WidthType.PERCENTAGE },
                      children: [new Paragraph({ children: [new TextRun({ text: row.value })] })],
                    }),
                  ],
                })
            ),
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 220, after: 120 },
            children: [new TextRun({ text: 'Observacoes', bold: true })],
          }),
          new Paragraph({
            spacing: { after: 220 },
            children: [new TextRun({ text: fallbackValue(comunicacao.observacao_descricao) })],
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 120 },
            children: [new TextRun({ text: 'Anexos', bold: true })],
          }),
          ...(anexos.length > 0
            ? anexos.flatMap((anexo, index) => [
                new Paragraph({
                  spacing: { after: 70 },
                  children: [
                    new TextRun({ text: `${index + 1}. `, bold: true }),
                    new TextRun({ text: fallbackValue(anexo.nome_arquivo_original) }),
                  ],
                }),
                new Paragraph({
                  spacing: { after: 160 },
                  children: [
                    new TextRun({
                      text: `Tipo: ${formatAnexoTipo(anexo.tipo_anexo)} | Tamanho: ${formatBytes(
                        Number(anexo.tamanho_bytes)
                      )}`,
                    }),
                  ],
                }),
              ])
            : [new Paragraph({ text: 'Nenhum anexo informado.' })]),
        ],
      },
    ],
  });
};

export const exportarComunicacoesDaeListaPDF = async (
  comunicacoes: ComunicacaoDae[],
  nomeArquivo: string = 'comunicacoes_dae'
): Promise<void> => {
  const blob = await pdf(<ComunicacoesDaeListPdfDocument comunicacoes={comunicacoes} />).toBlob();
  downloadBlob(blob, createFilename(nomeArquivo, 'pdf'));
};

export const exportarComunicacoesDaeListaWord = async (
  comunicacoes: ComunicacaoDae[],
  nomeArquivo: string = 'comunicacoes_dae'
): Promise<void> => {
  const doc = buildListWordDocument(comunicacoes);
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, createFilename(nomeArquivo, 'docx'));
};

export const exportarComunicacaoDaeDetalhadaPDF = async (
  comunicacao: ComunicacaoDae
): Promise<void> => {
  const blob = await pdf(<ComunicacaoDaeDetalhadaPdfDocument comunicacao={comunicacao} />).toBlob();
  const filenameBase = `comunicacao_dae_${comunicacao.id_comunicacao}_detalhada`;
  downloadBlob(blob, createFilename(filenameBase, 'pdf'));
};

export const exportarComunicacaoDaeDetalhadaWord = async (
  comunicacao: ComunicacaoDae
): Promise<void> => {
  const doc = buildDetalhadoWordDocument(comunicacao);
  const blob = await Packer.toBlob(doc);
  const filenameBase = `comunicacao_dae_${comunicacao.id_comunicacao}_detalhada`;
  downloadBlob(blob, createFilename(filenameBase, 'docx'));
};
