const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

function sendHTML(res, fileName) {
  const publicPath = path.join(__dirname, 'public', fileName);
  const rootPath = path.join(__dirname, fileName);
  if (fs.existsSync(publicPath)) {
    res.sendFile(publicPath);
  } else {
    res.sendFile(rootPath);
  }
}

app.get('/', (req, res) => sendHTML(res, 'play.html'));
app.get('/play.html', (req, res) => sendHTML(res, 'play.html'));
app.get('/host.html', (req, res) => sendHTML(res, 'host.html'));

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