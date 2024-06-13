const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();
app.use(express.json());

const config = JSON.parse(fs.readFileSync(`./players/player${process.env.PLAYER_ID}.json`));

let isOffensive = false;

app.post('/notify', (req, res) => {
  gameId = req.body.gameId;
  opponent = req.body.opponent;
  isOffensive = req.body.isOffensive;
  res.sendStatus(200);
});

app.post('/play', async (req, res) => {
  if (isOffensive) {
    const attackNumber = Math.floor(Math.random() * 10) + 1;
    res.status(200).json({attackNumber});
  } else {
    const defenseArray = Array.from({ length: config.defenseSetLength }, () => Math.floor(Math.random() * 10) + 1);
    res.status(200).json({defenseArray});
  }
});

app.post('/shutdown', (req, res) => {
  console.log(`Shutting down player ${process.env.PLAYER_ID}`);
  res.sendStatus(200);
  process.exit();
});

app.listen(process.env.PORT, async () => {
  console.log(`Player ${config.name} listening on port ${process.env.PORT}`);
  await axios.post(`http://localhost:3000/join`, {
    id: process.env.PLAYER_ID,
    port: process.env.PORT,
    name: config.name,
    score: 0
  });
});
