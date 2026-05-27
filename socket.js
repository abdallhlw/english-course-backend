module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('authenticate', (userId) => {
      socket.join('user_' + userId);
      if(socket.handshake.query.role === 'admin') socket.join('admins');
    });
    
    socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
  });
  
  return {
    notifyUser: (userId, data) => {
      io.to('user_' + userId).emit('notification', data);
    },
    notifyAll: (data) => {
      io.emit('notification', data);
    },
    notifyRole: (role, data) => {
      io.emit('notification', { ...data, targetRole: role });
    }
  };
};