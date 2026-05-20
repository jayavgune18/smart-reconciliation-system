const ReconciliationJob = require('../models/ReconciliationJob');
const ReconciliationMatch = require('../models/ReconciliationMatch');
const PdfGenerator = require('../services/pdfGenerator');
const ExcelGenerator = require('../services/excelGenerator');

/**
 * Download Reconciliation PDF Report
 */
const downloadPdfReport = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await ReconciliationJob.findById(jobId).populate('createdBy', 'name email');
    if (!job) {
      res.statusCode = 404;
      return next(new Error('Reconciliation Job not found.'));
    }

    const matches = await ReconciliationMatch.find({ jobId })
      .populate('bankTransactionId')
      .populate('internalTransactionId');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ReconReport-${jobId}.pdf`);

    PdfGenerator.generateReport(job, matches, res);
  } catch (error) {
    next(error);
  }
};

/**
 * Download Reconciliation Excel Sheet Report
 */
const downloadExcelReport = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await ReconciliationJob.findById(jobId).populate('createdBy', 'name email');
    if (!job) {
      res.statusCode = 404;
      return next(new Error('Reconciliation Job not found.'));
    }

    const matches = await ReconciliationMatch.find({ jobId })
      .populate('bankTransactionId')
      .populate('internalTransactionId');

    const buffer = ExcelGenerator.generateReport(job, matches);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=ReconExcel-${jobId}.xlsx`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  downloadPdfReport,
  downloadExcelReport
};
