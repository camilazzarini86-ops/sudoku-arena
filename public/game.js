const socket = io();
let currentPuzzle = null;

function joinGame() {
    const name = document.getElementById("name").value;
    socket.emit("joinGame", name);
}

function startGame() {
    socket.emit("startGame");
}

socket.on("gameStarted", (data) => {
    console.log("GameStarted DATA:", data);
    loadPuzzle(data.puzzle);
});

socket.on("nextPuzzle", (data) => {
    loadPuzzle(data);  // ✅
});

socket.on("updatePlayers", (players) => {

    const ranking = Object.values(players)
        .sort((a,b)=>b.score-a.score);

    let html = "";

    ranking.forEach((p, i) => {

        let medal = "";
        if (i === 0) medal = "🥇";
        if (i === 1) medal = "🥈";
        if (i === 2) medal = "🥉";

        html += `
            <div class="player">
                <span>${medal} ${p.name}</span>
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

    let message = "🏆 CLASSIFICA FINALE 🏆\n\n";

    ranking.slice(0,3).forEach((p, i) => {
        const medals = ["🥇", "🥈", "🥉"];
        message += medals[i] + " " + p.name + " - " + p.score + " punti\n";
    });

    alert(message);
});

function loadPuzzle(puzzleData) {

    currentPuzzle = puzzleData;

    const size = puzzleData.size;
    const puzzle = puzzleData.puzzle;

    const container = document.getElementById("game");
    container.innerHTML = "";

    container.style.gridTemplateColumns = `repeat(${size}, 55px)`;
    container.style.gridTemplateRows = `repeat(${size}, 55px)`;

    puzzle.split("").forEach((cell, index) => {

        const input = document.createElement("input");
        input.maxLength = 1;
        input.className = "cell";

        const row = Math.floor(index / size);
        const col = index % size;

        input.style.border = "1px solid #aaa";

        if (cell !== "." && cell !== "-") {
            input.value = cell;
            input.disabled = true;
        }

        input.addEventListener("input", (event) => {
            checkSolution(event, index);
        });

        container.appendChild(input);
    });
}
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
       alert("🎉 Livello completato!");
    socket.emit("correctSolution");
    }
}
function highlight(row, col) {

    const inputs = document.querySelectorAll(".cell");
    const selected = inputs[row * 9 + col].value;

    inputs.forEach((cell, index) => {

        const r = Math.floor(index / 9);
        const c = index % 9;

        cell.style.backgroundColor = "";

        if (r === row || c === col) {
            cell.style.backgroundColor = "#e6f2ff";
        }

        if (selected && cell.value === selected) {
            cell.style.backgroundColor = "#cce0ff";
        }
    });
}
