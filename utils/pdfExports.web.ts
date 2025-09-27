// utils/pdfExports.web.ts
import { Laporan, DisposisiHistory, TindakLanjutHistory } from './api';

interface PDFExportOptions {
  laporan: Laporan[];
  disposisiHistory?: DisposisiHistory[];
  tindakLanjutHistory?: TindakLanjutHistory[];
  title?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  logoBase64?: string; // Tambahkan properti ini
}

export const generateLaporanPDF = async (options: PDFExportOptions): Promise<string> => {
  try {
    const logoBase64 = options.logoBase64 || '';

    // Create HTML content for PDF
    const htmlContent = generateHTMLContent(options, logoBase64);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }

    // Write HTML content to the new window
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // The print dialog is now triggered by a script inside the new window's HTML.
    // We just need to focus the window.
    printWindow.focus();

    return 'PDF print dialog opened successfully.';
  } catch (error) {
    console.error('Error generating PDF on web:', error);
    throw new Error('Gagal membuat PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

// Function to get logo as base64
const getLogoBase64 = (): string => {
  // This will be passed as parameter from the main function
  return '';
};

const generateHTMLContent = (options: PDFExportOptions, logoBase64: string = ''): string => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID');
  };

  // Get logo base64
  // logoBase64 is now passed as parameter

  const tableRows = options.laporan.map((laporan, index) => {
    // Format multiple tindak lanjut dates with line breaks for better display
    const tindakLanjutDates = laporan.tanggal_tindak_lanjut && laporan.tanggal_tindak_lanjut.length > 0
      ? laporan.tanggal_tindak_lanjut.map(d => formatDate(d)).join('<br/>')
      : '-';
    
    // Truncate long text to match mobile version
    const truncateText = (text: string, maxLength: number): string => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength - 3) + '...';
    };
    
    return `
      <tr ${index % 2 === 0 ? 'class="even-row"' : ''}>
        <td class="text-center">${index + 1}</td>
        <td class="text-wrap">${truncateText(laporan.judul_laporan, 60)}</td>
        <td class="text-wrap">${truncateText(laporan.pelapor || '-', 30)}</td>
        <td class="text-center">${formatDate(laporan.tanggal_disposisi)}</td>
        <td class="text-center">${tindakLanjutDates}</td>
        <td class="text-center">${formatDate(laporan.updated_at)}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${options.title || 'Laporan Selesai'}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @media print {
          body { 
            margin: 0; 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page { 
            size: A4 landscape;
            margin: 0.5cm 0.8cm;
          }
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 11px;
          line-height: 1.3;
          color: #333;
          background: white;
          margin: 0;
          padding: 0;
        }
        
        .header {
          text-align: center;
          margin-bottom: 25px;
          padding: 15px 0;
          border-bottom: 3px solid #2196F3;
          page-break-inside: avoid;
        }
        
        .logo-section {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-bottom: 15px;
        }
        
        .logo {
          width: 50px;
          height: 50px;
          object-fit: contain;
          flex-shrink: 0;
        }
        
        .header-text {
          text-align: left;
          flex: 1;
          max-width: 400px;
        }
        
        .header h1 {
          font-size: 16px;
          font-weight: bold;
          color: #1565C0;
          margin-bottom: 5px;
          line-height: 1.2;
        }
        
        .header h2 {
          font-size: 14px;
          font-weight: bold;
          color: #333;
          margin-bottom: 5px;
          line-height: 1.2;
        }
        
        .header p {
          font-size: 12px;
          color: #666;
          margin: 0;
        }
        
        .print-info {
          text-align: right;
          font-size: 9px;
          color: #888;
          margin-bottom: 15px;
          padding-right: 10px;
        }
        
        .content {
          width: 100%;
          max-width: 100%;
          padding: 0 5px;
        }
        
        .table-container {
          overflow: hidden;
          margin: 0 -5px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 9px;
          table-layout: fixed;
          page-break-inside: auto;
        }
        
        th, td {
          border: 1px solid #333;
          padding: 4px 6px;
          vertical-align: top;
          word-wrap: break-word;
          overflow: hidden;
        }
        
        th {
          background-color: #e6e6e6 !important;
          color: #000 !important;
          font-weight: bold;
          text-align: center;
          font-size: 9px;
          line-height: 1.2;
          padding: 6px 4px;
          page-break-inside: avoid;
        }
        
        .even-row {
          background-color: #f8f8f8 !important;
        }
        
        /* Add table border styling to match mobile */
        table {
          border: 1px solid #000;
        }
        
        /* Add vertical dividers */
        td:not(:last-child), th:not(:last-child) {
          border-right: 0.5px solid #777;
        }
        
        .text-center {
          text-align: center;
        }
        
        .text-wrap {
          word-wrap: break-word;
          word-break: break-word;
          hyphens: auto;
        }
        
        .summary {
          margin-top: 15px;
          padding: 12px;
          background-color: #f0f8ff !important;
          border-radius: 5px;
          border-left: 4px solid #2196F3;
          page-break-inside: avoid;
        }
        
        .summary h3 {
          color: #1565C0;
          margin-bottom: 8px;
          font-size: 11px;
        }
        
        .summary p {
          margin-bottom: 3px;
          font-size: 10px;
        }
        
        .no-data {
          text-align: center;
          padding: 40px;
          color: #666;
          font-style: italic;
        }
        
        /* Improved column widths to match mobile layout */
        .col-no { width: 4%; min-width: 25px; }
        .col-title { width: 35%; min-width: 140px; }
        .col-reporter { width: 20%; min-width: 90px; }
        .col-disposisi { width: 13%; min-width: 65px; }
        .col-tindak { width: 16%; min-width: 80px; }
        .col-selesai { width: 12%; min-width: 60px; }
        
        /* Screen styles */
        @media screen {
          body {
            padding: 20px;
            background-color: #f5f5f5;
          }
          
          .content {
            background: white;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 1200px;
            margin: 0 auto;
          }
          
          table {
            font-size: 11px;
          }
          
          th {
            font-size: 11px;
          }
        }
        
        /* Print specific adjustments */
        @media print {
          .table-container {
            margin: 0;
          }
          
          .content {
            padding: 0;
          }
          
          body {
            font-size: 10px;
          }
          
          table {
            font-size: 8px;
          }
          
          th {
            font-size: 8px;
          }
          
          .summary {
            font-size: 9px;
          }
          
          /* Prevent orphaned rows */
          tr {
            page-break-inside: avoid;
          }
          
          /* Keep header with at least 3 rows */
          thead {
            display: table-header-group;
          }
        }
      </style>
    </head>
    <body>
      <div class="content">
        <div class="header">
          <div class="logo-section">
            ${logoBase64 ? `<img id="pdf-logo" src="${logoBase64}" alt="Logo Kabupaten Ogan Ilir" class="logo">` : ''}
            <div class="header-text">
              <h1>PEMERINTAH KABUPATEN OGAN ILIR</h1>
              <h2>LAPORAN ARSIP PELAPORAN</h2>
              <p>${options.title || 'Daftar Laporan Selesai'}</p>
            </div>
          </div>
        </div>
        
        <div class="print-info">
          Tanggal Cetak: ${dateStr}
        </div>
        
        ${options.laporan.length > 0 ? `
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th class="col-no">No</th>
                  <th class="col-title">Judul Laporan</th>
                  <th class="col-reporter">Pelapor</th>
                  <th class="col-disposisi">Tgl Disposisi</th>
                  <th class="col-tindak">Tgl Tindak Lanjut</th>
                  <th class="col-selesai">Tgl Selesai</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
          </div>
          
          <div class="summary">
            <h3>Ringkasan</h3>
            <p><strong>Total Laporan:</strong> ${options.laporan.length}</p>
            ${options.startDate || options.endDate ? `
              <p><strong>Filter Periode:</strong> 
                ${options.startDate ? options.startDate.toLocaleDateString('id-ID') : 'Awal'} - 
                ${options.endDate ? options.endDate.toLocaleDateString('id-ID') : 'Akhir'}
              </p>
            ` : ''}
          </div>
        ` : `
          <div class="no-data">
            <h3>Tidak Ada Data</h3>
            <p>Tidak ada laporan yang sesuai dengan kriteria yang dipilih.</p>
          </div>
        `}
      </div>

      <script>
        // This script runs inside the new window.
        // It waits for the logo to load before triggering the print dialog.
        window.addEventListener('load', function() {
          const logo = document.getElementById('pdf-logo');
          
          const triggerPrint = () => {
            // Use a small timeout to ensure the image has been painted by the browser.
            setTimeout(() => {
              window.print();
            }, 100); // A short delay is often sufficient.
          };

          if (logo) {
            if (logo.complete) { // If image is already loaded (e.g., from cache)
              triggerPrint();
            } else {
              logo.onload = triggerPrint;
              logo.onerror = triggerPrint; // Print even if logo fails to load
            }
          } else {
            triggerPrint(); // If there's no logo, print immediately
          }
        });
      </script>
    </body>
    </html>
  `;
};