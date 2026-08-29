import "server-only";
import ExcelJS from "exceljs";
import { NextResponse } from "next/server";

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExportSheet {
  name: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
}

/**
 * Builds a .xlsx workbook from one or more sheets and returns it as a
 * downloadable response. The one place every export route goes through, so
 * every spreadsheet in the app looks and behaves the same way (bold header
 * row, sensible column widths, frozen header).
 */
export async function xlsxResponse(filename: string, sheets: ExportSheet[]): Promise<NextResponse> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "DentoCrafts Lab Leaderboard";
  workbook.created = new Date();

  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name, {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    worksheet.columns = sheet.columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 16 }));
    worksheet.getRow(1).font = { bold: true };
    worksheet.addRows(sheet.rows);
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
