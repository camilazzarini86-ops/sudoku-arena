const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const sudoku = require("sudoku-gen");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

/* =========================
   VARIABILI GLOBALI
========================= */

let players = {};
let puzzles = [];
let currentLevel = 0;
let gameStarted = false;
let gameStartTime = null;
let timerInterval = null;

const GAME_DURATION = 90 * 60; // 90 minuti
const TEACHER_PASSWORD = "DOCENTE123";
let teacherSocketId = null;

/* =========================
   GENERAZIONE PUZZLE
========================= */

function generatePuzzleBySize(size) {

    if (size === 4) {
        return {
            size: 4,
            puzzle: "1..4.3....2.4..1.",
            solution: "1234432121343412"
        };
    }

    if (size === 6) {
        return {
            size: 6,
            puzzle: "1..4..4..1..2..5..5..2..3..6..6..3..",
            solution: "123456456123234561561234345612612345"
        };
    }

    const puzzle = sudoku.getSudoku("easy");

    return {
        size: 9,
        puzzle: puzzle.puzzle.replace(/-/g, "."),
        solution: puzzle.solution
    };
}

/* =========================
   SOCKET
========================= */

io.on("connection", (socket) => {

    socket.on("joinGame", (data) => {

        const name = data.name;
        const password = data.password;

        players[socket.id] = {
            name,
            score: 0
        };

        if (password === TEACHER_PASSWORD) {
            teacherSocketId = socket.id;
            socket.emit("teacherMode");
            console.log("DOCENTE RICONOSCIUTO");
        }

        io.emit("updatePlayers", players);
    });

    socket.on("startGame", () => {

        if (teacherSocketId && socket.id !== teacherSocketId) return;
        if (gameStarted) return;

        gameStarted = true;
        gameStartTime = Math.floor(Date.now() / 1000);
        currentLevel = 0;

        puzzles = [
            generatePuzzleBySize(4),
            generatePuzzleBySize(6),
            generatePuzzleBySize(9)
        ];

        io.emit("gameStarted", puzzles[currentLevel]);

        timerInterval = setInterval(() => {

            const now = Math.floor(Date.now() / 1000);
            const remaining = GAME_DURATION - (now - gameStartTime);

            io.emit("timerUpdate", remaining);

            if (remaining <= 0) {
                clearInterval(timerInterval);
                io.emit("gameOver", players);
            }

        }, 1000);
    });

    socket.on("correctSolution", () => {

        if (!players[socket.id]) return;

        // 🔥 Punteggio diverso per livello
        if (currentLevel === 0) players[socket.id].score += 5;
        if (currentLevel === 1) players[socket.id].score += 10;
        if (currentLevel === 2) players[socket.id].score += 20;

        io.emit("updatePlayers", players);

        currentLevel++;

        if (currentLevel < puzzles.length) {
            io.emit("nextPuzzle", puzzles[currentLevel]);
        } else {
            clearInterval(timerInterval);
            io.emit("gameOver", players);
        }
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
        io.emit("updatePlayers", players);
    });
});

/* =========================
   START SERVER
========================= */

server.listen(3000, () => {
    console.log("Server running on port 3000");
});