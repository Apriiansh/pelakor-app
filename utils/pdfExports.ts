// utils/pdfExport.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import { Laporan, DisposisiHistory, TindakLanjutHistory } from './api';

interface PDFExportOptions {
  laporan: Laporan[];
  disposisiHistory?: DisposisiHistory[];
  tindakLanjutHistory?: TindakLanjutHistory[];
  title?: string;
  startDate?: Date | null;
  endDate?: Date | null;
}

export const generateLaporanPDF = async (options: PDFExportOptions): Promise<string> => {
  try {
    const pdfDoc = await PDFDocument.create();
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    let logoImage;
    try {
      const logoAsset = Asset.fromModule(require('@/assets/images/logo-kabupaten-ogan-ilir.png'));
      await logoAsset.downloadAsync();
      const logoUri = logoAsset.localUri || logoAsset.uri;

      const base64Logo = await FileSystem.readAsStringAsync(logoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      logoImage = await pdfDoc.embedPng(`data:image/png;base64,${base64Logo}`);
    } catch (error) {
      console.warn('Failed to load logo:', error);
    }

    let page = pdfDoc.addPage([842, 595]); 
    const { width, height } = page.getSize();
    let currentY = height - 50;

    const checkAndAddNewPage = (requiredHeight: number) => {
      if (currentY - requiredHeight < 50) {
        page = pdfDoc.addPage([595, 842]);
        currentY = height - 50;
        return true;
      }
      return false;
    };

    if (logoImage) {
      const logoWidth = 60;
      const logoHeight = 60;
      page.drawImage(logoImage, {
        x: 50,
        y: currentY - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
    }

    page.drawText('PEMERINTAH KABUPATEN OGAN ILIR', {
      x: logoImage ? 130 : 50,
      y: currentY - 15,
      size: 16,
      font: timesBold,
      color: rgb(0, 0, 0),
    });

    page.drawText('LAPORAN ARSIP PELAPORAN', {
      x: logoImage ? 130 : 50,
      y: currentY - 35,
      size: 14,
      font: timesBold,
      color: rgb(0, 0, 0),
    });

    page.drawText(options.title || 'Daftar Laporan Selesai', {
      x: logoImage ? 130 : 50,
      y: currentY - 55,
      size: 12,
      font: timesRoman,
      color: rgb(0, 0, 0),
    });

    currentY -= 100;

    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    page.drawText(`Tanggal Cetak: ${dateStr}`, {
      x: width - 200,
      y: currentY,
      size: 10,
      font: timesRoman,
      color: rgb(0.4, 0.4, 0.4),
    });

    currentY -= 30;

    const tableHeaders = ['No', 'Judul Laporan', 'Pelapor', 'Tgl Disposisi', 'Tgl Tindak Lanjut', 'Tgl Selesai'];
    const colWidths = [30, 250, 150, 100, 130, 100]; // Adjusted for new columns in landscape
    const tableStartX = 50;
    const rowHeight = 25;

    checkAndAddNewPage(rowHeight * 2);

    page.drawRectangle({
      x: tableStartX - 5,
      y: currentY - rowHeight,
      width: colWidths.reduce((sum, w) => sum + w, 0) + 10,
      height: rowHeight,
      color: rgb(0.9, 0.9, 0.9),
    });

    let colX = tableStartX;
    tableHeaders.forEach((header, index) => {
      page.drawText(header, {
        x: colX + 5,
        y: currentY - 15,
        size: 10,
        font: timesBold,
        color: rgb(0, 0, 0),
      });
      colX += colWidths[index];
    });

    currentY -= rowHeight;

    options.laporan.forEach((laporan, index) => {
      checkAndAddNewPage(rowHeight);

      if (index % 2 === 0) {
        page.drawRectangle({
          x: tableStartX - 5,
          y: currentY - rowHeight,
          width: colWidths.reduce((sum, w) => sum + w, 0) + 10,
          height: rowHeight,
          color: rgb(0.98, 0.98, 0.98),
        });
      }

      const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID');
      };

      const tindakLanjutDates = laporan.tanggal_tindak_lanjut?.map(d => formatDate(d)).join(', ') || '-';

      const rowData = [
        (index + 1).toString(),
        truncateText(laporan.judul_laporan, 40),
        truncateText(laporan.pelapor || '-', 25),
        formatDate(laporan.tanggal_disposisi),
        truncateText(tindakLanjutDates, 20),
        formatDate(laporan.updated_at)
      ];

      colX = tableStartX;
      rowData.forEach((data, colIndex) => {
        page.drawText(data, {
          x: colX + 5,
          y: currentY - 15,
          size: 9,
          font: timesRoman,
          color: rgb(0, 0, 0),
        });
        colX += colWidths[colIndex];
      });

      currentY -= rowHeight;
    });

    const tableWidth = colWidths.reduce((sum, w) => sum + w, 0);
    const tableHeight = (options.laporan.length + 1) * rowHeight;

    page.drawRectangle({
      x: tableStartX - 5,
      y: currentY,
      width: tableWidth + 10,
      height: tableHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    let dividerX = tableStartX - 5;
    colWidths.forEach(width => {
      dividerX += width;
      if (dividerX < tableStartX + tableWidth) {
        page.drawLine({
          start: { x: dividerX, y: currentY },
          end: { x: dividerX, y: currentY + tableHeight },
          thickness: 0.5,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
    });

    currentY -= 50;

    checkAndAddNewPage(60);
    page.drawText(`Total Laporan: ${options.laporan.length}`, {
      x: tableStartX,
      y: currentY,
      size: 12,
      font: timesBold,
      color: rgb(0, 0, 0),
    });

    const totalPages = pdfDoc.getPageCount();
    pdfDoc.getPages().forEach((p, pageIndex) => {
      p.drawText(`Halaman ${pageIndex + 1} dari ${totalPages}`, {
        x: width - 120,
        y: 30, // Position relative to bottom
        size: 8,
        font: timesRoman,
        color: rgb(0.5, 0.5, 0.5),
      });
    });

    const pdfBytes = await pdfDoc.saveAsBase64();
    const fileName = `laporan_${Date.now()}.pdf`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, pdfBytes, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Bagikan Laporan PDF',
      });
    } else {
      console.log('PDF saved to:', fileUri);
    }

    return fileUri;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Gagal membuat PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};