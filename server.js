const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

// อาร์เรย์สำหรับเก็บข้อมูลผู้เล่นทั้งหมด
const playerResults = [];

// ฟังก์ชันคำนวณเปอร์เซ็นต์สายเรียนจริง
function calculateStats() {
  const total = playerResults.length;
  if (total === 0) {
    return { "สายวิทย์-คณิต": 25, "สายอาชีพ": 25, "สายศิลป์": 25, "สายภาษา": 25 };
  }

  const counts = { "สายวิทย์-คณิต": 0, "สายอาชีพ": 0, "สายศิลป์": 0, "สายภาษา": 0 };
  
  playerResults.forEach(p => {
    // เทียบข้อความสายเรียน
    if (p.resultType.includes("วิทย์") || p.resultType.includes("คณิต")) counts["สายวิทย์-คณิต"]++;
    else if (p.resultType.includes("อาชีพ")) counts["สายอาชีพ"]++;
    else if (p.resultType.includes("ศิลป์")) counts["สายศิลป์"]++;
    else if (p.resultType.includes("ภาษา")) counts["สายภาษา"]++;
  });

  return {
    "สายวิทย์-คณิต": Math.round((counts["สายวิทย์-คณิต"] / total) * 100),
    "สายอาชีพ": Math.round((counts["สายอาชีพ"] / total) * 100),
    "สายศิลป์": Math.round((counts["สายศิลป์"] / total) * 100),
    "สายภาษา": Math.round((counts["สายภาษา"] / total) * 100)
  };
}

io.on('connection', (socket) => {
  // บรอดแคสต์สถิติสายเรียนให้ผู้เล่นทุกคนทันทีที่เชื่อมต่อ
  socket.emit('updateStats', calculateStats());

  socket.on('submitAnswer', (data) => {
    const playerData = {
      id: socket.id,
      playerName: data.playerName,
      score: data.score,
      resultType: data.optionText,
      timestamp: new Date().toLocaleString('th-TH')
    };

    playerResults.push(playerData);

    // อัปเดตข้อมูลไปหน้า admin และส่งสถิติใหม่ให้ผู้เล่นทุกคน
    io.emit('updateAdminData', playerResults);
    io.emit('updateStats', calculateStats());
  });

  socket.on('getAdminData', () => {
    socket.emit('updateAdminData', playerResults);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});