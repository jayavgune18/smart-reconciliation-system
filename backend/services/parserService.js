const fs = require('fs');
const csv = require('csv-parser');
const xlsx = require('xlsx');

class ParserService {
  /**
   * Main router for statement parsing
   * @param {string} filePath - Absolute file path
   * @param {string} ext - Extension e.g., '.csv' or '.xlsx'
   * @returns {Promise<Array>} Normalized transactions list
   */
  static parseFile(filePath, ext) {
    if (ext === '.csv') {
      return this.parseCSV(filePath);
    } else {
      return this.parseExcel(filePath);
    }
  }

  /**
   * Helper to dynamically map and normalize row columns to schema properties
   */
  static normalizeHeaders(row) {
    const keys = Object.keys(row);
    const normalized = {};

    // Dynamic field scanners
    const idFields = ['id', 'ref', 'utr', 'reference', 'number', 'txnid', 'transactionid'];
    const dateFields = ['date', 'time', 'timestamp', 'txn_date', 'valdate', 'valuedate'];
    const amountFields = ['amount', 'value', 'txn_amount', 'balance', 'credit', 'debit', 'amt'];
    const descFields = ['description', 'narration', 'remark', 'details', 'particulars', 'desc'];

    // Map properties based on header matches
    for (const key of keys) {
      const lowerKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (idFields.some(f => lowerKey.includes(f)) && !normalized.transactionId) {
        normalized.transactionId = row[key];
      } else if (dateFields.some(f => lowerKey.includes(f)) && !normalized.date) {
        normalized.date = row[key];
      } else if (amountFields.some(f => lowerKey.includes(f)) && !normalized.amount) {
        normalized.amount = row[key];
      } else if (descFields.some(f => lowerKey.includes(f)) && !normalized.description) {
        normalized.description = row[key];
      }
    }

    // Secondary fallback mapping if some values are missing
    if (!normalized.date) normalized.date = row[keys[0]]; // Assume first column is date
    if (!normalized.description) normalized.description = row[keys[1]] || 'Unspecified';
    if (!normalized.amount) normalized.amount = row[keys[2]] || 0;
    if (!normalized.transactionId) normalized.transactionId = row[keys[3]] || '';

    // Data cleaning
    let cleanAmount = String(normalized.amount).replace(/[^0-9.-]/g, ''); // Strip currency symbols
    normalized.amount = parseFloat(cleanAmount) || 0;

    const parsedDate = new Date(normalized.date);
    normalized.date = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    normalized.description = String(normalized.description).trim();
    normalized.transactionId = String(normalized.transactionId).trim();

    return normalized;
  }

  /**
   * Parse CSV Ingestion
   */
  static parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          try {
            const mapped = this.normalizeHeaders(row);
            results.push(mapped);
          } catch (e) {
            // Skip faulty rows silently
          }
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }

  /**
   * Parse Excel sheet Ingestion
   */
  static parseExcel(filePath) {
    return new Promise((resolve, reject) => {
      try {
        const workbook = xlsx.readFile(filePath);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet data to JSON array
        const rawRows = xlsx.utils.sheet_to_json(worksheet);
        const results = rawRows.map(row => this.normalizeHeaders(row));
        resolve(results);
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = ParserService;
