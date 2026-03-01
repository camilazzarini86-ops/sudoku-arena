const socket = io();
let currentPuzzle = null;

/* LOGIN */
function joinGame() {
    const name = document.getElementById("name").value;
    const password = document.getElementById("password").value;

    socket.emit("joinGame", { name, password });

    document.getElementById("login").style.display = "none";
    document.getElementById("waiting").style.display = "block";
}

/* DOCENTE */
socket.on("teacherMode", () => {
    document.getElementById("startBtn").style.display = "block";
    document.getElementById("waiting").style.display = "none";
});

function startGame() {
    socket.emit("startGame");
}

/* PARTITA */
socket.on("gameStarted", (puzzle) => {
    document.getElementById("waiting").style.display = "none";
    loadPuzzle(puzzle);
});

/* TIMER */
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

/* CLASSIFICA */
socket.on("updatePlayers", (players) => {

    const ranking = Object.values(players)
        .sort((a,b)=>b.score-a.score);

    let html = "";

    ranking.forEach((p,i)=>{
        html += `<div>${p.name} - ${p.score}</div>`;
    });

    document.getElementById("leaderboard").innerHTML = html;
});

/* GRIGLIA */
function loadPuzzle(puzzleData) {

    currentPuzzle = puzzleData;

    const size = puzzleData.size;
    const puzzle = puzzleData.puzzle;

    const container = document.getElementById("game");
    container.innerHTML = "";
    container.style.display = "grid";
    container.style.gridTemplateColumns = `repeat(${size}, 40px)`;

    puzzle.split("").forEach((cell, index) => {

        const input = document.createElement("input");
        input.maxLength = 1;
        input.className = "cell";
        input.style.width = "40px";
        input.style.height = "40px";
        input.style.textAlign = "center";

        if (cell !== ".") {
            input.value = cell;
            input.disabled = true;
        }

        input.addEventListener("input", (event) => {

            if (!/^[1-9]$/.test(event.target.value)) {
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
                alert("Livello completato!");
            }
        });

        container.appendChild(input);
    });
}