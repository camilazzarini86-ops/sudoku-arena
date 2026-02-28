let currentPuzzle = null;
let level = 0;
let score = 0;

const difficulties = ["easy", "medium", "hard", "expert"];

function generatePuzzle() {
    const difficulty = difficulties[Math.floor(level / 3)];
    return fetch(`/api/single/${difficulty}`)
        .then(res => res.json());
}

function loadPuzzle(puzzle) {

    currentPuzzle = puzzle;

    const container = document.getElementById("game");
    container.innerHTML = "";

    puzzle.puzzle.split("").forEach((cell, index) => {

        const input = document.createElement("input");
        input.maxLength = 1;
        input.className = "cell";

        const row = Math.floor(index / 9);
        const col = index % 9;

        if (row === 0 || row === 3 || row === 6)
            input.style.borderTop = "3px solid black";

        if (col === 0 || col === 3 || col === 6)
            input.style.borderLeft = "3px solid black";

        if (row === 8)
            input.style.borderBottom = "3px solid black";

        if (col === 8)
            input.style.borderRight = "3px solid black";

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

    const inputs = document.querySelectorAll(".cell");
    let attempt = "";

    inputs.forEach(i => attempt += i.value || ".");

    if (event.target.value !== currentPuzzle.solution[index]) {
        event.target.style.color = "red";
        score -= 5;
        updateScore();
    } else {
        event.target.style.color = "black";
    }

    if (attempt === currentPuzzle.solution) {
        score += 100;
        updateScore();
        document.getElementById("nextBtn").style.display = "inline-block";
    }
}

function updateScore() {
    document.getElementById("score").innerText = "Punteggio: " + score;
}

function nextLevel() {
    level++;
    document.getElementById("level").innerText = "Livello: " + (level + 1);
    document.getElementById("nextBtn").style.display = "none";
    startLevel();
}

function startLevel() {
    generatePuzzle().then(puzzle => {
        loadPuzzle(puzzle);
    });
}

startLevel();

function autoComplete() {

    const inputs = document.querySelectorAll(".cell");

    inputs.forEach((input, index) => {
        input.value = currentPuzzle.solution[index];
        input.style.color = "black";
    });

    score += 100;
    updateScore();

    document.getElementById("nextBtn").style.display = "inline-block";
}