const fetch = require('node-fetch');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const playerResults = [];
let globalStats = {
    "สายวิทย์-คณิต": 0,
    "สายอาชีพ": 0,
    "สายศิลป์": 0,
    "สายภาษา": 0
};

const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyGRRMqhp0C7tmQUsemo0VdmRlSPvRw4ArwFS8kR5Eua15R9Xi3cUteoy68hj3fGX-emg/exec";

// ดึงสถิติล่าสุดจาก Google Sheets เมื่อเซิร์ฟเวอร์เริ่มทำงานหรือตื่นขึ้นมา
function fetchLatestStats() {
    fetch(GOOGLE_SHEET_URL)
        .then(res => res.json())
        .then(data => {
            if (data && data.stats) {
                globalStats = data.stats;
                io.emit('updateStats', globalStats);
            }
        })
        .catch(err => console.error("Error fetching stats:", err));
}

// เรียกดึงสถิติทันทีที่เริ่มต้น
fetchLatestStats();

io.on('connection', (socket) => {
    // ส่งสถิติล่าสุดให้คนที่เพิ่งเปิดเข้ามาเล่น
    socket.emit('updateStats', globalStats);

    socket.on('resetData', async () => {
  playerResults.length = 0;
  io.emit('updateAdminData', []);
  io.emit('resetTable');
  
  // เรียกดึงสถิติล่าสุดจาก Google Sheets ใหม่ทันทีที่สั่งรีเซ็ต
  if (typeof fetchLatestStats === 'function') {
    await fetchLatestStats();
  }
});
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
    // ถ้า Apps Script คำนวณ stats ส่งกลับมา ให้อัปเดตและ broadcast ทันที
    if (resData && resData.stats) {
      globalStats = resData.stats;
      io.emit('updateStats', globalStats);
    } else {
      fetchLatestStats(); // ถ้าไม่มี ให้สั่งดึงใหม่
    }
  })
  .catch(err => console.error("Error posting to sheet:", err));

        io.emit('updateAdminData', playerResults);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});