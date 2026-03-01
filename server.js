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
let teacherSocketId = null;
const TEACHER_PASSWORD = "DOCENTE123";
io.on("connection", (socket) => {

   socket.on("joinGame", (data) => {

    let name;
    let password = null;

    if (typeof data === "string") {
        name = data;
    } else {
        name = data.name;
        password = data.password;
    }

    players[socket.id] = {
        name,
        score: 0,
        level: 0
    };

    // SOLO modalità PRO usa password
    if (password === TEACHER_PASSWORD) {
        teacherSocketId = socket.id;
        socket.emit("teacherMode");
    }

    io.emit("updatePlayers", players);
});
    });
   socket.on("startGame", () => {

    // 🔐 Solo docente può avviare (se esiste un docente)
    if (teacherSocketId && socket.id !== teacherSocketId) {
        return;
    }

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