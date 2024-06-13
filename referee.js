const express = require("express");
const axios = require("axios");
const fs = require("fs");
const createCsvWriter = require("csv-writer").createArrayCsvWriter;
const app = express();
app.use(express.json());

const players = [];
let allGames = [];
let games = [];
let currentRound = 1;
let winnerCount = 0;

app.post("/join", (req, res) => {
  console.log(`Player Joined: Player ${req.body.id}`);
  players.push(req.body);
  if (players.length === 8) startChampionship();
  res.sendStatus(200);
});

function startChampionship() {
  console.log(`startChampionship`);
  games = [
    { id: 1, attacker: players[0].id, defender: players[1].id, round: 1 },
    { id: 2, attacker: players[2].id, defender: players[3].id, round: 1 },
    { id: 3, attacker: players[4].id, defender: players[5].id, round: 1 },
    { id: 4, attacker: players[6].id, defender: players[7].id, round: 1 },
  ];
  notifyPlayers();
}

function nextRound() {
  const winners = games.map((game) => game.winner);
  if (winners.length === 1) {
    console.log(`Champion: Player ${winners[0]}`);
    axios.post(`http://localhost:300${winners[0]}/shutdown`);
    generateGameReport();
    return;
  }
  winnerCount = 0;
  currentRound++;
  games = [];

  for (let i = 0; i < winners.length / 2; i++) {
    games.push({
      id: i + 1,
      attacker: winners[i * 2],
      defender: winners[i * 2 + 1],
      round: currentRound,
    });
  }
  notifyPlayers();
}

function notifyPlayers() {
  games.forEach((game) => {
    const attacker = players.find((player) => player.id === game.attacker);
    const defender = players.find((player) => player.id === game.defender);
    axios.post(`http://localhost:${attacker.port}/notify`, {
      gameId: game.id,
      opponent: defender.id,
      isOffensive: true,
    });
    axios.post(`http://localhost:${defender.port}/notify`, {
      gameId: game.id,
      opponent: attacker.id,
      isOffensive: false,
    });
    allGames.push(game);
  });
  orchestrateGames();
}

function orchestrateGames() {
  games.forEach(async (game) => {
    let { attacker, defender } = game;
    await orchestratePlay(attacker, defender, game);
  });
}

async function orchestratePlay(attacker, defender, game) {
  let playerA = players.find((player) => player.id == attacker);
  let playerB = players.find((player) => player.id == defender);

  const attackResponse = await axios.post(
    `http://localhost:${playerA.port}/play`
  );
  const { attackNumber } = attackResponse.data;

  const denfenderResponse = await axios.post(
    `http://localhost:${playerB.port}/play`
  );
  const { defenseArray } = denfenderResponse.data;

  if (defenseArray.includes(attackNumber)) {
    game.attacker = playerB.id;
    game.defender = playerA.id;
    axios.post(`http://localhost:${playerB.port}/notify`, {
      gameId: game.id,
      opponent: playerA.id,
      isOffensive: true,
    });
    axios.post(`http://localhost:${playerA.port}/notify`, {
      gameId: game.id,
      opponent: playerB.id,
      isOffensive: false,
    });
    orchestratePlay(defender, attacker, game);
    return;
  } else {
    playerA.score++;
  }

  if (playerA.score == 5) {
    game.winner = playerA.id;
    game.losingScore = playerB.score;
    axios.post(`http://localhost:${playerB.port}/shutdown`);

    winnerCount++;
    if (winnerCount == 8 / Math.pow(2, currentRound)) {
      players.forEach((player) => (player.score = 0));
      nextRound();
    }
  } else {
    orchestratePlay(attacker, defender, game);
  }
}

function generateGameReport() {
  const finalReport = [];
  const csvWriter = createCsvWriter({
    path: "championshipreport.csv",
    header: ["Game Id", "Round", "Winner", "Loser", "Final Score"],
  });

  allGames
    .sort((a, b) => b.round - a.round)
    .forEach((game, index) => {
      let isChampion = false;
      if (index == 0) {
        console.log("got champion",game.winner);
        isChampion = true;
      }
      const winner = players.find((player) => player.id == game.winner);
      const loser = players.find(
        (player) =>
          player.id ==
          (game.attacker == game.winner ? game.defender : game.attacker)
      );
      const gameReport = [
        `${game.round}_${game.id}`,
        game.round,
        `#${winner.id} ${winner.name} ${isChampion ? '👑' : ''}`,
        `#${loser.id} ${loser.name}`,
        `5/${game.losingScore}`,
      ];
      finalReport.push(gameReport);
    });
  csvWriter
    .writeRecords(finalReport)
    .then(() => {
      console.log("CSV file written successfully");
    })
    .catch((err) => {
      console.error("Error writing CSV file:", err);
    });
  setTimeout(() => {
    process.exit();
  }, 500);
}

app.listen(3000, () => {
  console.log("Referee listening on port 3000");
  console.log("Waiting for players to join ...");
});
