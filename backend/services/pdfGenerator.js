const PDFDocument = require('pdfkit');

class PdfGenerator {
  /**
   * Generates a beautifully styled financial reconciliation audit PDF
   * @param {Object} job - ReconciliationJob document
   * @param {Array} matches - ReconciliationMatch documents
   * @param {res} res - Express response stream
   */
  static generateReport(job, matches, res) {
    const doc = new PDFDocument({ margin: 50 });

    // Stream PDF directly to HTTP response
    doc.pipe(res);

    // ==========================================
    // 1. BRAND HEADER & BRANDING
    // ==========================================
    doc.fillColor('#0F172A') // Slate-900
       .fontSize(24)
       .text('ANTIGRAVITY FINANCIAL RECON', 50, 50)
       .fontSize(10)
       .fillColor('#64748B') // Slate-500
       .text('Intelligent Reconciliation & Risk Audit System', 50, 80);

    doc.moveTo(50, 95).lineTo(550, 95).strokeColor('#E2E8F0').stroke();

    // ==========================================
    // 2. METADATA SUMMARY CARD (Glassmorphism layout)
    // ==========================================
    doc.fillColor('#0F172A')
       .fontSize(14)
       .text('Audit Report Summary', 50, 115);

    doc.rect(50, 135, 500, 95).fill('#F8FAFC'); // Light background fill

    doc.fillColor('#0F172A').fontSize(10);
    doc.text(`Job Name: ${job.name}`, 65, 145);
    doc.text(`Status: Completed`, 65, 165);
    doc.text(`Created By: ${job.createdBy ? job.createdBy.name : 'System'}`, 65, 185);
    doc.text(`Date Run: ${new Date(job.createdAt).toLocaleString()}`, 65, 205);

    doc.text(`Total Bank Records: ${job.stats.totalBank}`, 320, 145);
    doc.text(`Total Internal Records: ${job.stats.totalInternal}`, 320, 165);
    doc.text(`Reconciled Matches: ${job.stats.matchedCount}`, 320, 185);
    doc.text(`Discrepancies Flagged: ${job.stats.discrepancyCount}`, 320, 205);

    // ==========================================
    // 3. SEPARATOR & REPORT TITLE
    // ==========================================
    doc.moveTo(50, 245).lineTo(550, 245).strokeColor('#E2E8F0').stroke();

    doc.fillColor('#0F172A')
       .fontSize(14)
       .text('Matched Pairs & Discrepancies Details', 50, 260);

    // ==========================================
    // 4. TRANSACTION MATCH DETAILS TABLE
    // ==========================================
    let y = 290;
    
    // Draw Header
    doc.rect(50, y, 500, 20).fill('#0F172A');
    doc.fillColor('#FFFFFF').fontSize(8);
    doc.text('Bank Narration', 55, y + 6, { width: 140, truncate: true });
    doc.text('Internal Narration', 200, y + 6, { width: 140, truncate: true });
    doc.text('Amount', 350, y + 6, { width: 60 });
    doc.text('Confidence', 420, y + 6, { width: 60 });
    doc.text('Match Type', 485, y + 6, { width: 60 });

    y += 25;

    // Draw rows
    matches.slice(0, 15).forEach((match) => {
      // Check if page boundary exceeded, add page dynamically
      if (y > 700) {
        doc.addPage();
        y = 50; // Reset height on new page
        
        // Redraw Header
        doc.rect(50, y, 500, 20).fill('#0F172A');
        doc.fillColor('#FFFFFF').fontSize(8);
        doc.text('Bank Narration', 55, y + 6);
        doc.text('Internal Narration', 200, y + 6);
        doc.text('Amount', 350, y + 6);
        doc.text('Confidence', 420, y + 6);
        doc.text('Match Type', 485, y + 6);
        y += 25;
      }

      doc.fillColor('#334155').fontSize(7);
      
      const bankDesc = match.bankTransactionId ? match.bankTransactionId.description : 'Missing';
      const intDesc = match.internalTransactionId ? match.internalTransactionId.description : 'Missing';
      const amount = match.bankTransactionId ? match.bankTransactionId.amount : (match.internalTransactionId ? match.internalTransactionId.amount : 0);

      doc.text(bankDesc, 55, y, { width: 140, height: 15, truncate: true });
      doc.text(intDesc, 200, y, { width: 140, height: 15, truncate: true });
      doc.text(`$${Math.abs(amount).toFixed(2)}`, 350, y);
      doc.text(`${match.confidenceScore}%`, 420, y);
      
      // Color code Match Type labels
      const type = match.matchType.toUpperCase();
      if (type === 'EXACT') doc.fillColor('#15803D'); // Green
      else if (type === 'AI_PREDICTED') doc.fillColor('#0284C7'); // Blue
      else if (type === 'PARTIAL') doc.fillColor('#D97706'); // Orange
      else doc.fillColor('#B91C1C'); // Red
      
      doc.text(type, 485, y);

      // Draw bottom row divider
      doc.moveTo(50, y + 16).lineTo(550, y + 16).strokeColor('#F1F5F9').stroke();
      y += 20;
    });

    if (matches.length > 15) {
      doc.fillColor('#64748B')
         .fontSize(8)
         .text(`... and ${matches.length - 15} additional transactions logged inside the system.`, 50, y + 10);
    }

    // ==========================================
    // 5. FOOTER SECTION
    // ==========================================
    doc.fillColor('#94A3B8')
       .fontSize(8)
       .text('This is a computer-generated audit log verified by the Antigravity AI Engine.', 50, 740, { align: 'center' });

    doc.end();
  }
}

module.exports = PdfGenerator;
