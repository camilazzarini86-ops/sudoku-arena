const socket = io();
let currentPuzzle = null;

/* =========================
   LOGIN
========================= */
function joinGame() {
    const name = document.getElementById("name").value;
    const password = document.getElementById("password").value;

    socket.emit("joinGame", { name, password });

    document.getElementById("login").style.display = "none";
    document.getElementById("waiting").style.display = "block";
}

/* =========================
   DOCENTE
========================= */
socket.on("teacherMode", () => {
    document.getElementById("startBtn").style.display = "block";
    document.getElementById("waiting").style.display = "none";
});

function startGame() {
    socket.emit("startGame");
}

/* =========================
   PARTITA AVVIATA
========================= */
socket.on("gameStarted", (puzzle) => {
    document.getElementById("waiting").style.display = "none";
    loadPuzzle(puzzle);
});

/* =========================
   TIMER
========================= */
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

/* =========================
   CLASSIFICA
========================= */
socket.on("updatePlayers", (players) => {

    const ranking = Object.values(players)
        .sort((a, b) => b.score - a.score);

    let html = "";

    ranking.forEach((p, i) => {
        const medals = ["🥇", "🥈", "🥉"];
        html += `
            <div style="display:flex;justify-content:space-between;padding:5px 0;">
                <span>${medals[i] || ""} ${p.name}</span>
                <span>${p.score}</span>
            </div>
        `;
    });

    document.getElementById("leaderboard").innerHTML = html;
});

function loadPuzzle(puzzleData) {

    currentPuzzle = puzzleData;

    const size = puzzleData.size;
    const puzzle = puzzleData.puzzle;

    const container = document.getElementById("game");
    container.innerHTML = "";
    container.style.display = "grid";
    container.style.gridTemplateColumns = `repeat(${size}, 45px)`;

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
        input.style.width = "45px";
        input.style.height = "45px";
        input.style.textAlign = "center";
        input.style.fontSize = "18px";
        input.style.border = "1px solid #999";

        const row = Math.floor(index / size);
        const col = index % size;

        if (row % blockRows === 0)
            input.style.borderTop = "3px solid black";

        if (col % blockCols === 0)
            input.style.borderLeft = "3px solid black";

        if ((row + 1) % blockRows === 0)
            input.style.borderBottom = "3px solid black";

        if ((col + 1) % blockCols === 0)
            input.style.borderRight = "3px solid black";

        if (cell !== ".") {
            input.value = cell;
            input.disabled = true;
            input.style.backgroundColor = "#f2f2f2";
            input.style.fontWeight = "bold";
        }

        input.addEventListener("input", (event) => {

            if (!new RegExp(`^[1-${size}]$`).test(event.target.value)) {
                event.target.value = "";
                return;
            }

            if (event.target.value !== currentPuzzle.solution[index]) {
                event.target.style.color = "red";
            } else {
                event.target.style.color = "black";
            }

            const inputs = document.querySelectorAll(".cell");
            let attempt = "";
            inputs.forEach(i => attempt += i.value || ".");

            if (attempt === currentPuzzle.solution) {
                socket.emit("correctSolution");
                alert("🎉 Livello completato!");
            }
        });

        container.appendChild(input);
    });
}
        
