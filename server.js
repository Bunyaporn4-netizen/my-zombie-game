const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fetch = require('node-fetch');

const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzbUhFNflOPF1uLsozS8ejoUq9I7rdvM-2lT41Gbh18jqPNTV2w2cNYqPB7x2TCHw4jQw/exec'; // URL ของคุณ

app.use(express.static('public'));

let playerResults = [];
let globalStats = {
  "สายวิทย์-คณิต": 0,
  "สายอาชีพ": 0,
  "สายศิลป์": 0,
  "สายภาษา": 0
};

// ฟังก์ชันดึงสถิติล่าสุดจาก Google Sheets
function fetchLatestStats() {
  fetch(GOOGLE_SHEET_URL)
    .then(res => res.json())
    .then(data => {
      if (data && data.stats) {
        globalStats = data.stats;
        if (data.playerResults) {
          playerResults = data.playerResults;
        }
        io.emit('updateStats', globalStats);
      }
    })
    .catch(err => console.error("Error fetching stats:", err));
}

// เรียกดึงสถิติทันทีที่เริ่มต้น
fetchLatestStats();

io.on('connection', (socket) => {
  // ส่งข้อมูลปัจจุบันให้คนที่เพิ่งต่อเข้ามา
  socket.emit('updateStats', globalStats);
  socket.emit('updateAdminData', playerResults);

  // เมื่อมีคนส่งคำตอบ
  socket.on('submitAnswer', (data) => {
    const playerData = {
      id: socket.id,
      playerName: data.playerName || data.name || "ไม่ระบุชื่อ",
      score: data.score || 0,
      resultType: data.resultType || data.optionText,
      timestamp: new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })
    };

    playerResults.push(playerData);

    // ส่งข้อมูลไปบันทึกที่ Google Sheets
    fetch(GOOGLE_SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playerData)
    })
    .then(res => res.json())
    .then(resData => {
      if (resData && resData.stats) {
        globalStats = resData.stats;
        io.emit('updateStats', globalStats);
      } else {
        fetchLatestStats();
      }
    })
    .catch(err => console.error("Error posting to sheet:", err));

    io.emit('updateAdminData', playerResults);
  });
});

// http.listen ต้องอยู่ล่างสุดเสมอ
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});