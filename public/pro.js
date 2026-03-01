const socket = io();
let currentPuzzle = null;

/* =========================
   LOGIN / START
========================= */
function joinGame() {
    const name = document.getElementById("name").value;
    const password = document.getElementById("password").value;

    socket.emit("joinGame", { name, password });
}
socket.on("teacherMode", () => {
    document.getElementById("startBtn").style.display = "block";
    document.getElementById("waiting").style.display = "none";
});
function startGame() {
    socket.emit("startGame");
}

/* =========================
   SOCKET EVENTS
========================= */
socket.on("gameStarted", (data) => {
    loadPuzzle(data.puzzle);
});

socket.on("nextPuzzle", (data) => {
    loadPuzzle(data);
});

socket.on("updatePlayers", (players) => {

    const ranking = Object.values(players)
        .sort((a,b)=>b.score-a.score);

    let html = "";

    ranking.forEach((p,i)=>{
        const medals = ["🥇","🥈","🥉"];
        html += `
            <div class="player">
                <span>${medals[i] || ""} ${p.name}</span>
                <span>${p.score}</span>
            </div>
        `;
    });

    document.getElementById("leaderboard").innerHTML = html;
});

socket.on("timerUpdate", (seconds) => {

    if (seconds <= 0) {
        document.getElementById("timer").innerText = "Tempo scaduto!";
        return;
    }

    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;

    document.getElementById("timer").innerText =
        "Tempo: " +
        String(min).padStart(2, "0") +
        ":" +
        String(sec).padStart(2, "0");
});

socket.on("gameOver", (finalPlayers) => {

    const ranking = Object.values(finalPlayers)
        .sort((a,b)=>b.score-a.score);

    let html = "";

    ranking.slice(0,3).forEach((p,i)=>{
        const medals = ["🥇","🥈","🥉"];
        html += `<div>${medals[i]} ${p.name} - ${p.score}</div>`;
    });

    document.getElementById("podium-list").innerHTML = html;
    document.getElementById("podium").classList.remove("hidden");
});

/* =========================
   LOAD PUZZLE DINAMICO
========================= */
function loadPuzzle(puzzleData) {

    currentPuzzle = puzzleData;

    const size = puzzleData.size;
    const puzzle = puzzleData.puzzle;

    const container = document.getElementById("game");
    container.innerHTML = "";

    container.style.gridTemplateColumns = `repeat(${size}, 55px)`;
    container.style.gridTemplateRows = `repeat(${size}, 55px)`;

    // 🔥 Calcolo blocchi dinamico
    let blockRows, blockCols;

    if (size === 4) {
        blockRows = 2;
        blockCols = 2;
    } else if (size === 6) {
        blockRows = 2;
        blockCols = 3;
    } else {
        blockRows = 3;
        blockCols = 3;
    }

    puzzle.split("").forEach((cell, index) => {
const input = document.createElement("input");
input.maxLength = 1;
input.className = "cell";

// 👇 AGGIUNGI QUESTE DUE RIGHE
input.inputMode = "numeric";
input.pattern = "[1-9]*";

        const row = Math.floor(index / size);
        const col = index % size;

        // 🔥 Bordo base
        input.style.border = "1px solid #bbb";

        // 🔥 Blocchi dinamici
        if (row % blockRows === 0)
            input.style.borderTop = "3px solid black";

        if (col % blockCols === 0)
            input.style.borderLeft = "3px solid black";

        if ((row + 1) % blockRows === 0)
            input.style.borderBottom = "3px solid black";

        if ((col + 1) % blockCols === 0)
            input.style.borderRight = "3px solid black";

        if (cell !== "." && cell !== "-") {
            input.value = cell;
            input.disabled = true;
        }

        input.addEventListener("focus", () => {
            highlight(row, col, size, blockRows, blockCols);
        });

        input.addEventListener("input", (event) => {
            checkSolution(event, index);
        });

        container.appendChild(input);
    });
}

/* =========================
   CHECK SOLUTION
========================= */
function checkSolution(event, index) {

    if (!/^[1-9]$/.test(event.target.value)) {
        event.target.value = "";
        return;
    }

    const inputs = document.querySelectorAll(".cell");
    let attempt = "";

    inputs.forEach(i => attempt += i.value || ".");

    if (event.target.value !== currentPuzzle.solution[index]) {
        event.target.style.color = "red";
        socket.emit("error");
    } else {
        event.target.style.color = "black";
    }

    if (attempt === currentPuzzle.solution) {
        document.getElementById("overlay").classList.remove("hidden");
        document.getElementById("victorySound").play();
        socket.emit("correctSolution");
    }
}

/* =========================
   HIGHLIGHT DINAMICO
========================= */
function highlight(row, col, size, blockRows, blockCols) {

    const inputs = document.querySelectorAll(".cell");

    inputs.forEach((cell, index) => {

        const r = Math.floor(index / size);
        const c = index % size;

        cell.style.backgroundColor = "";

        // Riga e colonna
        if (r === row || c === col)
            cell.style.backgroundColor = "#e6f2ff";

        // Blocco
        if (
            Math.floor(r / blockRows) === Math.floor(row / blockRows) &&
            Math.floor(c / blockCols) === Math.floor(col / blockCols)
        ) {
            cell.style.backgroundColor = "#d0e7ff";
        }
    });
}

/* =========================
   OVERLAY
========================= */
function closeOverlay() {
    document.getElementById("overlay").classList.add("hidden");
}

function closePodium() {
    document.getElementById("podium").classList.add("hidden");
}
window.onload = () => {
    socket.emit("startGame");
};