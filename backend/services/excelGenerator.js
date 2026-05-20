const xlsx = require('xlsx');

class ExcelGenerator {
  /**
   * Generates a structural multi-sheet Excel Reconciliation Report
   * @param {Object} job - ReconciliationJob document
   * @param {Array} matches - ReconciliationMatch documents
   * @returns {Buffer} Excel Workbook buffer
   */
  static generateReport(job, matches) {
    const workbook = xlsx.utils.book_new();

    // ==========================================
    // SHEET 1: JOB OVERVIEW STATISTICS
    // ==========================================
    const overviewData = [
      { Parameter: 'Job Name', Value: job.name },
      { Parameter: 'Reconciliation Date', Value: new Date(job.createdAt).toLocaleString() },
      { Parameter: 'Job Status', Value: job.status.toUpperCase() },
      { Parameter: 'Total Bank Ledger Records', Value: job.stats.totalBank },
      { Parameter: 'Total Company Ledger Records', Value: job.stats.totalInternal },
      { Parameter: 'Automatically Reconciled (100% ID)', Value: matches.filter(m => m.matchType === 'exact').length },
      { Parameter: 'AI Predicted Matches (NLP)', Value: matches.filter(m => m.matchType === 'ai_predicted').length },
      { Parameter: 'Partial Matches (Pending Verification)', Value: matches.filter(m => m.matchType === 'partial').length },
      { Parameter: 'Missing/Unreconciled Records', Value: matches.filter(m => m.matchType === 'unmatched').length }
    ];

    const overviewSheet = xlsx.utils.json_to_sheet(overviewData);
    xlsx.utils.book_append_sheet(workbook, overviewSheet, 'Summary Stats');

    // ==========================================
    // SHEET 2: DETAILED MATCH PAIRS
    // ==========================================
    const matchRows = matches.map((match, idx) => {
      const bank = match.bankTransactionId || {};
      const internal = match.internalTransactionId || {};

      return {
        'Index': idx + 1,
        'Match ID': match._id.toString(),
        'Bank Txn ID': bank.transactionId || 'N/A',
        'Bank Date': bank.date ? new Date(bank.date).toLocaleDateString() : 'N/A',
        'Bank Description': bank.description || 'N/A',
        'Company Txn ID': internal.transactionId || 'N/A',
        'Company Date': internal.date ? new Date(internal.date).toLocaleDateString() : 'N/A',
        'Company Description': internal.description || 'N/A',
        'Amount': bank.amount || internal.amount || 0,
        'Confidence Score (%)': match.confidenceScore,
        'Match Category': match.matchType.toUpperCase(),
        'Resolution Status': match.status.toUpperCase(),
        'Explanation': match.explanation || ''
      };
    });

    const matchSheet = xlsx.utils.json_to_sheet(matchRows);
    xlsx.utils.book_append_sheet(workbook, matchSheet, 'Reconciliation Ledger');

    // Generate output buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }
}

module.exports = ExcelGenerator;
