/** Exportação client-side da página atual (CSV/XLSX simples). */

function escapeCsv(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportRowsAsCsv(
  rows: Array<Record<string, unknown>>,
  columns: Array<{ key: string; label: string }>,
  filename: string,
) {
  const header = columns.map((c) => escapeCsv(c.label)).join(',');
  const lines = rows.map((row) => columns.map((c) => escapeCsv(row[c.key])).join(','));
  const bom = '\uFEFF';
  const blob = new Blob([bom + [header, ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8',
  });
  downloadBlob(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

/**
 * XLSX mínimo (SpreadsheetML) — sem dependência extra.
 * Suficiente para “página atual”; export completo continua no backend.
 */
export function exportRowsAsXlsx(
  rows: Array<Record<string, unknown>>,
  columns: Array<{ key: string; label: string }>,
  filename: string,
) {
  const escapeXml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const headerCells = columns
    .map((c) => `<Cell><Data ss:Type="String">${escapeXml(c.label)}</Data></Cell>`)
    .join('');
  const body = rows
    .map((row) => {
      const cells = columns
        .map((c) => {
          const v = row[c.key];
          const isNum = typeof v === 'number' && Number.isFinite(v);
          return `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${escapeXml(
            v == null ? '' : String(v),
          )}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('');

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Pagina">
  <Table>
   <Row>${headerCells}</Row>
   ${body}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const name = filename.endsWith('.xls') || filename.endsWith('.xlsx') ? filename.replace(/\.xlsx$/i, '.xls') : `${filename}.xls`;
  downloadBlob(blob, name);
}
