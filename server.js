<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quiz Game - ตอบคำถาม 20 ข้อ</title>
  <script src="/socket.io/socket.io.js"></script>
  <style>
    * { box-sizing: border-box; font-family: 'Kanit', sans-serif, Tahoma; }
    body { background-color: #f4f6f9; margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .container { background: white; width: 100%; max-width: 600px; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); text-align: center; }
    h2 { color: #2c3e50; margin-bottom: 20px; }
    .question-box { font-size: 1.2rem; margin-bottom: 25px; font-weight: bold; color: #34495e; text-align: left; }
    .btn { display: block; width: 100%; padding: 15px; margin: 10px 0; background: #3498db; color: white; border: none; border-radius: 8px; font-size: 1rem; text-align: left; cursor: pointer; transition: 0.2s; }
    .btn:hover { background: #2980b9; transform: translateY(-2px); }
    .progress { font-size: 0.9rem; color: #7f8c8d; margin-bottom: 15px; text-align: right; }
    .thanks-screen { display: none; }
  </style>
</head>
<body>

  <div class="container" id="quiz-container">
    <div class="progress" id="progress">ข้อ 1 / 20</div>
    <div class="question-box" id="question-title">กำลังโหลดคำถาม...</div>
    <div id="options-container"></div>
  </div>

  <div class="container thanks-screen" id="thanks-screen">
    <h2>🎉 ขอบคุณที่ร่วมตอบคำถาม!</h2>
    <p>บันทึกคำตอบของคุณเรียบร้อยแล้ว รอรับชมผลสรุปภาพรวมจาก Host ได้เลยครับ</p>
  </div>

  <script>
    localStorage.clear();
    const socket = io();
    let questions = [];
    let currentIndex = 0;

    socket.on('initQuestions', (data) => {
      questions = data;
      showQuestion();
    });

    function showQuestion() {
      if (currentIndex >= questions.length) {
        document.getElementById('quiz-container').style.display = 'none';
        document.getElementById('thanks-screen').style.display = 'block';
        return;
      }

      const q = questions[currentIndex];
      document.getElementById('progress').innerText = `ข้อ ${currentIndex + 1} / ${questions.length}`;
      document.getElementById('question-title').innerText = q.title;

      const optsContainer = document.getElementById('options-container');
      optsContainer.innerHTML = '';

      q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.innerText = opt.text;
        btn.onclick = () => {
          socket.emit('submitAnswer', { questionId: q.id, optionText: opt.text });
          currentIndex++;
          showQuestion();
        };
        optsContainer.appendChild(btn);
      });
    }
  </script>
</body>
</html>