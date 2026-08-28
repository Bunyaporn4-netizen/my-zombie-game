const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'play.html'));
});

app.get('/play.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'play.html'));
});

app.get('/host.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'host.html'));
});

const globalStats = {};

io.on('connection', (socket) => {
  socket.on('submitAnswer', (data) => {
    if (data && data.optionText) {
      const { optionText } = data;
      globalStats[optionText] = (globalStats[optionText] || 0) + 1;
    }
  });

  socket.on('getFinalRanking', () => {
    socket.emit('showFinalRanking', globalStats);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));