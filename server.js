const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  leaveUser,
  getRoomUsers,
} = require('./utils/user');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Socket Connection
io.on('connection', (socket) => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    socket.emit(
      'message',
      formatMessage('ChatCord Bot', 'Welcome to charcord!')
    );

    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage('ChatCord Bot', `A ${user.username} has joined the chat`)
      );

    // Room Info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Disconnect
  socket.on('disconnect', () => {
    const user = leaveUser(socket.id);
    console.log(user);
    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage('ChartCord Bot', `${user.username} has left the chat`)
      );

      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = 3000 | process.env.PORT;

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
