const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = "123456";

let gameRunning = false;
let bets = {};
let timerStarted = false;

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    for (const entry of body.entry) {
      for (const event of entry.messaging) {
        if (event.message && event.message.text) {
          await handleMessage(event);
        }
      }
    }
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

async function handleMessage(event) {
  const sender = event.sender.id;
  const text = event.message.text.toLowerCase();

  if (text === "!angichua") {
    return sendMessage(sender, "ăn rồi có gì không");
  }

  if (text === "!toibuonqua") {
    return sendMessage(sender, "kệ mày ai hỏi");
  }

  if (text === "!menugame") {
    return sendMessage(sender, "Nhập /taixiu để chơi game tài xỉu");
  }

  if (text === "/taixiu") {
    gameRunning = true;
    bets = {};
    timerStarted = false;
    return sendMessage(sender, "Game bắt đầu! Nhập /datcuoctai hoặc /datcuocxiu");
  }

  if (text === "/datcuoctai" && gameRunning) {
    bets[sender] = "tai";
    sendMessage(sender, "Bạn đã cược TÀI");
    startTimer();
  }

  if (text === "/datcuocxiu" && gameRunning) {
    bets[sender] = "xiu";
    sendMessage(sender, "Bạn đã cược XỈU");
    startTimer();
  }

  if (text === "/dunggame") {
    gameRunning = false;
    bets = {};
    timerStarted = false;
    return sendMessage(sender, "Game đã dừng.");
  }
}

function startTimer() {
  if (timerStarted) return;
  timerStarted = true;

  setTimeout(() => {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const dice3 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2 + dice3;

    const result = total >= 11 ? "tai" : "xiu";

    for (let user in bets) {
      if (bets[user] === result) {
        sendMessage(user, `🎉 Bạn thắng!\nKết quả: ${dice1} - ${dice2} - ${dice3}\nTổng: ${total}`);
      } else {
        sendMessage(user, `😢 Bạn thua!\nKết quả: ${dice1} - ${dice2} - ${dice3}\nTổng: ${total}`);
      }
    }

    gameRunning = false;
    bets = {};
    timerStarted = false;
  }, 60000);
}

function sendMessage(sender, message) {
  axios.post(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    {
      recipient: { id: sender },
      message: { text: message },
    }
  );
}

app.listen(process.env.PORT || 3000);
