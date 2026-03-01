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
let timerInterval = null;

const GAME_DURATION = 90 * 60;
const TEACHER_PASSWORD = "DOCENTE123";
let teacherSocketId = null;

function generatePuzzle() {
    const puzzle = sudoku.getSudoku("easy");

    return {
        size: 9,
        puzzle: puzzle.puzzle.replace(/-/g, "."),
        solution: puzzle.solution
    };
}

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
        }

        io.emit("updatePlayers", players);
    });

    socket.on("startGame", () => {

        if (teacherSocketId && socket.id !== teacherSocketId) return;
        if (gameStarted) return;

        gameStarted = true;
        gameStartTime = Math.floor(Date.now() / 1000);
        const puzzle = generatePuzzle();

        io.emit("gameStarted", puzzle);

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
        if (players[socket.id]) {
            players[socket.id].score += 10;
            io.emit("updatePlayers", players);
        }
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
        io.emit("updatePlayers", players);
    });
});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});