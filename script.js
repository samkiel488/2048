const grid = document.querySelector(".grid");
const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("high-score");
const resetButton = document.getElementById("reset");
const undoButton = document.getElementById("undo");
const hintButton = document.getElementById("hint");
const themeToggle = document.getElementById("theme-toggle");
const timerDisplay = document.getElementById("timer");

let gridArray = Array.from({ length: 4 }, () => Array(4).fill(0));
let score = 0;
let highScore = localStorage.getItem("2048-high-score") || 0;
let history = [];
let startTime, timerInterval;

function init() {
    gridArray = Array.from({ length: 4 }, () => Array(4).fill(0));
    score = 0;
    scoreDisplay.textContent = score;
    highScoreDisplay.textContent = highScore;
    addRandomTile();
    addRandomTile();
    renderGrid();
    startTimer();
}

function addRandomTile() {
    const emptyCells = [];
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            if (gridArray[row][col] === 0) {
                emptyCells.push({ row, col });
            }
        }
    }
    if (emptyCells.length > 0) {
        const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        gridArray[row][col] = Math.random() < 0.9 ? 2 : 4;
    }
}

function renderGrid() {
    grid.innerHTML = '';
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const tileValue = gridArray[row][col];
            const tile = document.createElement('div');
            tile.classList.add('tile');
            if (tileValue > 0) {
                tile.classList.add(`tile-${tileValue}`);
                const tileNumber = document.createElement('span');
                tileNumber.textContent = tileValue;
                tile.appendChild(tileNumber);
            }
            grid.appendChild(tile);
        }
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
        moveTiles('up');
    } else if (e.key === 'ArrowDown') {
        moveTiles('down');
    } else if (e.key === 'ArrowLeft') {
        moveTiles('left');
    } else if (e.key === 'ArrowRight') {
        moveTiles('right');
    }
});

let touchStartX, touchStartY;

grid.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

grid.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
            moveTiles('right');
        } else {
            moveTiles('left');
        }
    } else {
        if (deltaY > 0) {
            moveTiles('down');
        } else {
            moveTiles('up');
        }
    }
});

function moveTiles(direction) {
    let moved = false;
    const oldGrid = JSON.parse(JSON.stringify(gridArray));
    if (direction === 'up' || direction === 'down') {
        for (let col = 0; col < 4; col++) {
            const column = gridArray.map(row => row[col]);
            const newColumn = mergeTiles(column, direction === 'down');
            if (JSON.stringify(column) !== JSON.stringify(newColumn)) {
                moved = true;
                for (let row = 0; row < 4; row++) {
                    gridArray[row][col] = newColumn[row];
                }
            }
        }
    } else if (direction === 'left' || direction === 'right') {
        for (let row = 0; row < 4; row++) {
            const newRow = mergeTiles(gridArray[row], direction === 'right');
            if (JSON.stringify(gridArray[row]) !== JSON.stringify(newRow)) {
                moved = true;
                gridArray[row] = newRow;
            }
        }
    }

    if (moved) {
        saveState();
        addRandomTile();
        renderGrid();
        checkGameOver();
        checkWin();
    }
}

function mergeTiles(tiles, reverse) {
    let filteredTiles = tiles.filter(tile => tile !== 0);
    if (reverse) filteredTiles.reverse();

    for (let i = 0; i < filteredTiles.length - 1; i++) {
        if (filteredTiles[i] === filteredTiles[i + 1]) {
            filteredTiles[i] *= 2;
            score += filteredTiles[i];
            scoreDisplay.textContent = score;
            if (score > highScore) {
                highScore = score;
                highScoreDisplay.textContent = highScore;
                localStorage.setItem("2048-high-score", highScore);
            }
            filteredTiles.splice(i + 1, 1); // Remove the merged tile
        }
    }

    while (filteredTiles.length < 4) {
        filteredTiles.push(0); // Add empty tiles (0) to make the row/column complete
    }

    if (reverse) filteredTiles.reverse(); // If reverse true, reverse the tiles back
    return filteredTiles; // Return the new row/column
}

function checkGameOver() {
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            if (gridArray[row][col] === 0) return; // If any cell empty, game no finish
            if (row < 3 && gridArray[row][col] === gridArray[row + 1][col]) return; // If any tile fit merge vertically, game no finish
            if (col < 3 && gridArray[row][col] === gridArray[row][col + 1]) return; // If any tile fit merge horizontally, game no finish
        }
    }
    alert("Game Over!\nJust try again, you're not a failure"); // If no move remain, game finish
    stopTimer(); // Stop the timer
}

function checkWin() {
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            if (gridArray[row][col] === 2048) { // If any tile reach 2048
                alert("You Win finally! Congrats you'll be getting a gift from SAMKIEL"); // Player don win
                stopTimer(); // Stop the timer
                return;
            }
        }
    }
}

function saveState() {
    history.push({
        grid: JSON.parse(JSON.stringify(gridArray)), // Save the current grid
        score: score, // Save the current score
    });
    if (history.length > 5) history.shift(); // If history pass 5, remove the oldest one
}

function undo() {
    if (history.length > 0) {
        const prevState = history.pop(); // Get the last state
        gridArray = prevState.grid; // Restore the grid
        score = prevState.score; // Restore the score
        scoreDisplay.textContent = score; // Show the old score for screen
        renderGrid(); // Show the old grid for screen
    }
}

function startTimer() {
    startTime = Date.now(); // Save the start time
    timerInterval = setInterval(updateTimer, 1000); // Update the timer every second
}

function updateTimer() {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000); // Calculate how many seconds don pass
    timerDisplay.textContent = `${elapsedTime}s`; // Show the time for screen
}

function stopTimer() {
    clearInterval(timerInterval); // Stop the timer
}

function getHint() {
    const directions = ['up', 'down', 'left', 'right']; // All possible directions
    alert("Wait lemme consult the gods \nAbracadabra...🔃");
    return `The gods have spoken\nMove  ${directions[Math.floor(Math.random() * directions.length)]}!`; // Suggest one random direction
}

function toggleDarkMode() {
    document.body.dataset.theme = document.body.dataset.theme === "dark" ? "light" : "dark"; // Switch between dark and light mode
}

// Event listeners
resetButton.addEventListener('click', init); // If player click reset button, start new game
undoButton.addEventListener('click', undo); // If player click undo button, undo last move
hintButton.addEventListener('click', () => alert(getHint())); // If player click hint button, give hint
themeToggle.addEventListener('click', toggleDarkMode); // If player click dark mode button, toggle dark mode

// Make we begin the experience hehe
init();