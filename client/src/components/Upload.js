import { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [previewHeaders, setPreviewHeaders] = useState([]);
  const [mapping, setMapping] = useState({
    transactionId: '',
    amount: '',
    referenceNumber: '',
    date: ''
  });
  const [history, setHistory] = useState([]);
  const [editingJob, setEditingJob] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/upload');
      setHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      readPreview(selectedFile);
      setEditingJob(null);
      setStatus({ type: '', message: '' });
    }
  };

  const readPreview = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (json.length > 0) {
        setPreviewHeaders(json[0]);
        setPreviewData(json.slice(1, 11));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAction = async () => {
    const missingFields = Object.entries(mapping)
      .filter(([key, value]) => !value && ['transactionId', 'amount', 'referenceNumber', 'date'].includes(key))
      .map(([key]) => key);

    if (missingFields.length > 0) {
      setStatus({ type: 'danger', message: `Please map mandatory fields: ${missingFields.join(', ')}` });
      return;
    }

    setIsProcessing(true);
    try {
      if (editingJob) {
        await api.patch(`/upload/${editingJob._id}/mapping`, { columnMapping: mapping });
        setStatus({ type: 'success', message: 'Intelligence mapping updated. Re-processing sequence initiated.' });
        setEditingJob(null);
        fetchHistory();
      } else {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('columnMapping', JSON.stringify(mapping));

        const res = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setStatus({ type: 'success', message: `System ingestion complete. Job ${res.data.jobId} is being analyzed.` });
        fetchHistory();
      }
    } catch (error) {
      setStatus({ type: 'danger', message: error.response?.data?.error || 'System fault during data ingestion.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const startEditMapping = (job) => {
    setEditingJob(job);
    setMapping(job.columnMapping || {});
    setPreviewHeaders(Object.values(job.columnMapping || {}));
    setFile(null);
    setStatus({ type: '', message: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container pb-5">
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="glass-card mb-4 animate-fade-in">
            <div className="px-4 py-3 border-bottom border-light border-opacity-10 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 text-gradient">{editingJob ? 'Refine Logic Mapping' : 'Data Ingestion'}</h5>


              <span className="badge bg-primary rounded-pill px-3">
                {editingJob ? 'Modification' : 'New Stream'}
              </span>
            </div>


            <div className="p-4">
              {status.message && (
                <div className={`alert alert-${status.type} border-0 rounded-4 small mb-4 animate-fade-in`}>
                  <i className={`bi bi-${status.type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'} me-2`}></i>
                  {status.message}
                </div>
              )}
              {!editingJob && (
                <div className="mb-5">
                  <label className="form-label text-muted small fw-bold text-uppercase tracking-widest">Select Data Source</label>
                  <div className="input-group">
                    <input
                      type="file"
                      className="form-control"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileChange}
                    />
                  </div>
                  <p className="text-muted small mt-2 opacity-50">Supported vectors: .CSV, .XLSX, .XLS</p>
                </div>

              )}
              {(previewHeaders.length > 0 || editingJob) && (
                <div className="row g-4">
                  <div className="col-md-5">
                    <div className="p-4 rounded-4 bg-white bg-opacity-5 border border-white border-opacity-5 shadow-inner">
                      <h6 className="fw-bold mb-4 small text-uppercase tracking-wider text-primary-light">Intelligence Mapping</h6>
                      {['transactionId', 'amount', 'referenceNumber', 'date'].map(field => (
                        <div className="mb-3" key={field}>
                          <label className="form-label text-capitalize small fw-medium text-muted">
                            {field.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          <select
                            className="form-select border-white border-opacity-10"
                            value={mapping[field]}
                            onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}
                          >
                            <option value="">Auto-detect disabled</option>
                            {previewHeaders.map((header, idx) => (
                              <option key={idx} value={header}>{header}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                      <div className="mt-4 pt-2">
                        <button className="btn-premium w-100 py-3" onClick={handleAction} disabled={isProcessing || (!file && !editingJob)}>
                          {isProcessing ? (
                            <><span className="spinner-border spinner-border-sm me-2"></span>Inhibiting...</>
                          ) : (
                            editingJob ? 'Update Logic' : 'Initiate Upload'
                          )}
                        </button>
                        {editingJob && (
                          <button className="btn btn-link w-100 mt-2 text-muted small text-decoration-none opacity-50" onClick={() => setEditingJob(null)}>
                            Abort Operation
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-7">
                    <h6 className="fw-bold mb-4 small text-uppercase tracking-wider text-muted">Vector Preview</h6>
                    <div className="table-responsive glass-card border-white border-opacity-5" style={{ maxHeight: '420px', background: 'rgba(0,0,0,0.1)' }}>
                      <table className="table table-custom table-sm mb-0">
                        <thead>
                          <tr>{previewHeaders.map((h, i) => <th key={i} className="px-3 py-3 border-0">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {previewData.map((row, i) => (
                            <tr key={i}>
                              {previewHeaders.map((_, colIdx) => (
                                <td key={colIdx} className="px-3 py-2 opacity-50 small border-white border-opacity-5">{row[colIdx]}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="glass-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="px-4 py-3 border-bottom border-light border-opacity-10 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0 small text-uppercase tracking-wider">Ingestion Stream</h5>
              <button className="btn btn-link p-0 text-primary-light" onClick={fetchHistory}>
                <i className="bi bi-arrow-repeat fs-5"></i>
              </button>
            </div>
            <div className="list-group list-group-flush" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {history.map(job => (
                <div key={job._id} className="list-group-item bg-transparent border-light border-opacity-5 p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="overflow-hidden">
                      <p className="mb-1 fw-bold text-truncate small" style={{ maxWidth: '180px' }}>{job.fileName}</p>
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                        <span className="opacity-25 text-muted">|</span>
                        <span className="text-primary-light" style={{ fontSize: '0.65rem', fontWeight: '600' }}>
                          #{job._id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <span className={`badge ${job.status === 'Completed' ? 'bg-success' :
                      job.status === 'Failed' ? 'bg-danger' :
                        'bg-warning'
                      } rounded-pill`} style={{ fontSize: '0.6rem' }}>
                      {job.status}
                    </span>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm flex-grow-1 bg-white bg-opacity-5 text-primary-light border border-primary border-opacity-20 py-2"
                      onClick={() => navigate(`/reconcile/${job._id}`)}
                      disabled={job.status !== 'Completed'}
                    >
                      Audit
                    </button>
                    <button
                      className="btn btn-sm bg-white bg-opacity-5 text-muted border border-white border-opacity-10 px-3"
                      onClick={() => startEditMapping(job)}
                    >
                      <i className="bi bi-gear-fill"></i>
                    </button>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <div className="p-5 text-center text-muted opacity-25">
                  <i className="bi bi-cloud-arrow-up fs-1 mb-3 d-block"></i>
                  <p className="small">Workspace Empty</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;


