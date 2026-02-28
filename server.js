const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const sudoku = require("sudoku-gen");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = {};
let puzzles = [];
let gameStarted = false;

let gameStartTime = null;
const GAME_DURATION = 90 * 60; // 90 minuti
let timerInterval = null;

/* =========================
   GENERAZIONE SEQUENZA
========================= */
function generatePuzzleSequence() {

    let sequence = [];

    // 🔹 4x4 (2x2)
   sequence.push({
    size: 4,
    puzzle: "1..4.41.2..3.3.1",
    solution: "1234341221434321"
});

    // 🔹 6x6 (2x3)
 sequence.push({
    size: 6,
    puzzle: "1.3..6.5.12.2.1.6..64..13..6.5.4.31.",
    solution: "123456456123231564564231312645645312"
});


    // 🔹 9x9 progressivi
    const difficulties = ["easy", "medium", "hard", "expert"];

    for (let i = 0; i < 12; i++) {
        const difficulty = difficulties[Math.floor(i / 3)];
        const puzzle = sudoku.getSudoku(difficulty);

        sequence.push({
            size: 9,
            puzzle: puzzle.puzzle,
            solution: puzzle.solution
        });
    }

    return sequence;
}

/* =========================
   MULTIPLAYER SOCKET
========================= */
io.on("connection", (socket) => {

    socket.on("joinGame", (name) => {

        players[socket.id] = {
            name,
            score: 0,
            level: 0
        };

        io.emit("updatePlayers", players);

        if (gameStarted) {
            socket.emit("gameStarted", puzzles[players[socket.id].level]);
        }
    });

    socket.on("startGame", () => {

        if (!gameStarted) {

            puzzles = generatePuzzleSequence();
            gameStarted = true;
            gameStartTime = Math.floor(Date.now() / 1000);

            io.emit("gameStarted", puzzles[0]);

            timerInterval = setInterval(() => {

                const now = Math.floor(Date.now() / 1000);
                const elapsed = now - gameStartTime;
                const remaining = GAME_DURATION - elapsed;

                io.emit("timerUpdate", remaining);

                if (remaining <= 0) {
                    clearInterval(timerInterval);
                    io.emit("gameOver", players);
                }

            }, 1000);
        }
    });

    socket.on("correctSolution", () => {

        const player = players[socket.id];
        if (!player) return;

        player.score += 100;
        player.level++;

        if (player.level < puzzles.length) {
            socket.emit("nextPuzzle", puzzles[player.level]);
        }

        io.emit("updatePlayers", players);
    });

    socket.on("error", () => {
        if (players[socket.id]) {
            players[socket.id].score -= 10;
            io.emit("updatePlayers", players);
        }
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
        io.emit("updatePlayers", players);
    });

});

/* =========================
   API SINGLE PLAYER
========================= */
app.get("/api/single/:difficulty", (req, res) => {
    const difficulty = req.params.difficulty;
    const puzzle = sudoku.getSudoku(difficulty);

    res.json({
        size: 9,
        puzzle: puzzle.puzzle,
        solution: puzzle.solution
    });
});

/* =========================
   START SERVER
========================= */
server.listen(3000, () => {
    console.log("Server attivo su http://localhost:3000");
});