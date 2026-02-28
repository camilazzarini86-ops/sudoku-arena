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
const GAME_DURATION = 90 * 60;
let timerInterval = null;

function generatePuzzleSequence() {
    const difficulties = ["easy", "medium", "hard", "expert"];
    let sequence = [];

    for (let i = 0; i < 20; i++) {
        const difficulty = difficulties[Math.floor(i / 5)];
        const puzzle = sudoku.getSudoku(difficulty);

        sequence.push({
            size: 9,
            puzzle: puzzle.puzzle.replace(/-/g, "."),
            solution: puzzle.solution
        });
    }

    return sequence;
}

io.on("connection", (socket) => {

    socket.on("joinGame", (name) => {

        players[socket.id] = {
            name,
            score: 0,
            level: 0
        };

        io.emit("updatePlayers", players);

        if (gameStarted) {
            socket.emit("gameStarted", {
                puzzle: puzzles[0]
            });
        }
    });

    socket.on("startGame", () => {

        if (!gameStarted) {

            puzzles = generatePuzzleSequence();
            gameStarted = true;
            gameStartTime = Math.floor(Date.now() / 1000);

            io.emit("gameStarted", {
                puzzle: puzzles[0]
            });

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
            socket.emit("nextPuzzle", {
                puzzle: puzzles[player.level]
            });
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

app.get("/api/single/:difficulty", (req, res) => {
    const difficulty = req.params.difficulty;
    const puzzle = sudoku.getSudoku(difficulty);

    res.json({
        size: 9,
        puzzle: puzzle.puzzle.replace(/-/g, "."),
        solution: puzzle.solution
    });
});

/* ⭐ QUESTA È LA PARTE FONDAMENTALE PER RENDER ⭐ */
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server attivo sulla porta " + PORT);
});