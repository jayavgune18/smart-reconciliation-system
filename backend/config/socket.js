const socketIO = require('socket.io');

let io;

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: '*', // In production, replace with specific domains
      methods: ['GET', 'POST', 'PUT']
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected to Socket.IO: ${socket.id}`);

    socket.on('join_job', (jobId) => {
      socket.join(jobId);
      console.log(`User joined job room: ${jobId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

// Helper to broadcast processing logs or fraud alerts
const notifyJobUpdate = (jobId, data) => {
  if (io) {
    io.to(jobId).emit('job_progress', data);
  }
};

const broadcastFraudAlert = (alertData) => {
  if (io) {
    io.emit('fraud_alert', alertData);
  }
};

module.exports = {
  initSocket,
  getIO,
  notifyJobUpdate,
  broadcastFraudAlert
};
