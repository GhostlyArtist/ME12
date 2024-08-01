var sfx = {
   swapJewels: new Howl({
      src: [
         'https://assets.codepen.io/21542/howler-push.mp3',
      ]
   }),
   boost: new Howl({
      src: [
         'https://assets.codepen.io/21542/howler-sfx-levelup.mp3'
      ],
      loop: false,
      onend: function() {
         console.log("Done playing sfx!")
      }
   })
}


var music = {
   overworld: new Howl({
      src: [
         "https://assets.codepen.io/21542/howler-demo-bg-music.mp3"
      ]
   })
}

// Prevent default touch behavior to avoid page refresh on swipe down
document.addEventListener('touchmove', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchend', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

const gameBoard = document.getElementById("game-board");
const boardSize = 8;
const jewelTypes = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'white'];
let draggedItem = null;
let touchedItem = null;
let score = 0;
let timer = 60;
let timerInterval;
let isPaused = false;
const leaderboardKey = 'leaderboard'; // Key for localStorage
const gameStateKey = 'gameState'; // Key for saving game state

const modal = document.getElementById("game-over-modal");
const leaderboardModal = document.getElementById("leaderboard-modal");
const finalScoreElement = document.getElementById("final-score");
const leaderboardElement = document.getElementById("leaderboard");

const retryButton = document.getElementById("no-button");
const yesButton = document.getElementById("yes-button");
const closeLeaderboardButton = document.getElementById("close-leaderboard");
const pauseButton = document.getElementById("pause-button");
const startButton = document.getElementById("start-button");

retryButton.addEventListener("click", () => {
    modal.style.display = "none";
    initGame();
});

yesButton.addEventListener("click", () => {
    const playerName = prompt("Enter your name:");
    if (playerName) {
        saveScore(playerName, score);
    }
    showLeaderboard();
    modal.style.display = "none";
    leaderboardModal.style.display = "block";
});

closeLeaderboardButton.addEventListener("click", () => {
    leaderboardModal.style.display = "none";
    initGame();
});

pauseButton.addEventListener("click", () => {
    if (isPaused) {
        resumeGame();
    } else {
        pauseGame();
    }
});

startButton.addEventListener("click", () => {
    startCountdown();
});
    // Example: Start the game when the page loads

document.addEventListener('DOMContentLoaded', (event) => {
    const nameForm = document.getElementById('nameForm');
    const playerNameInput = document.getElementById('playerName');
    const leaderboardList = document.getElementById('leaderboardList');

    // Function to populate the previous name
    function populatePreviousName() {
        const previousName = localStorage.getItem('playerName');
        if (previousName) {
            playerNameInput.value = previousName;
        }
    }

    // Function to handle form submission
        nameForm.addEventListener ('submit', (event) => {
        event.preventDefault();
        const playerName = playerNameInput.value;
        if (playerName) {
            localStorage.setItem('playerName', playerName);
            addToLeaderboard(playerName);
        }
    });

    // Function to add a name to the leaderboard
    function addToLeaderboard(name) {
        const listItem = document.createElement('li');
        listItem.textContent = name;
        leaderboardList.appendChild(listItem);
    }

    // Populate the previous name when the page loads
    populatePreviousName();
});

function initGame() {
    score = 0;
    timer = 60;
    document.getElementById('score').innerText = `Score: ${score}`;
    document.getElementById('timer').innerText = `Time: ${timer}`;
    initBoard();
    showStartButton();
}

function showStartButton() {
    const startOverlay = document.getElementById('start-overlay');
  const countdownText = document.getElementById('start-button');
    countdownText.innerText = 'READY'; // Reset the button text to "READY"
    startOverlay.style.display = 'flex';
}

function startCountdown() {
    const startOverlay = document.getElementById('start-overlay');
    const countdownText = document.getElementById('start-button');
    let countdown = 3;

    countdownText.innerText = countdown;

    const countdownInterval = setInterval(() => {
        if (countdown >1) {
            countdown--;
            countdownText.innerText = countdown;
        } else {
            clearInterval(countdownInterval);
            startOverlay.style.display = 'none';
            startTimer();
        }
    }, 1000);
}

function saveScore(name, score) {
    const leaderboard = JSON.parse(localStorage.getItem(leaderboardKey)) || [];
    const existingEntry = leaderboard.find(entry => entry.name === name);
    if (existingEntry) {
        if (score > existingEntry.score) {
            existingEntry.score = score;
        }
    } else {
        leaderboard.push({ name, score });
    }
    leaderboard.sort((a, b) => b.score - a.score);
    localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard));
}

function showLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem(leaderboardKey)) || [];
    leaderboardElement.innerHTML = leaderboard.map(entry => `<p>${entry.name}: ${entry.score}</p>`).join('');
}

function pauseGame() {
    isPaused = true;
    clearInterval(timerInterval);
    pauseButton.innerText = "Resume";
    gameBoard.classList.add('paused'); // Add paused class to game board
}

function resumeGame() {
    isPaused = false;
    startTimer();
    pauseButton.innerText = "Pause";
    gameBoard.classList.remove('paused'); // Remove paused class from game board
}

function saveGameState() {
    const gameState = {
        score,
        timer,
        board: Array.from(document.querySelectorAll('.jewel')).map(jewel => ({
            type: jewel.classList[1],
            row: jewel.dataset.row,
            col: jewel.dataset.col
        }))
    };
    localStorage.setItem(gameStateKey, JSON.stringify(gameState));
}

function loadGameState() {
    const gameState = JSON.parse(localStorage.getItem(gameStateKey));
    if (gameState) {
        score = gameState.score;
        timer = gameState.timer;
        document.getElementById('score').innerText = `Score: ${score}`;
        document.getElementById('timer').innerText = `Time: ${timer}`;
        gameBoard.innerHTML = '';
        gameState.board.forEach(jewelData => {
            const jewel = createJewel(jewelData.type, jewelData.row, jewelData.col);
            gameBoard.appendChild(jewel);
        });
        addEventListeners();
    } else {
        initBoard();
    }
}

// Generate a random jewel type
function getRandomJewel() {
    const randomIndex = Math.floor(Math.random() * jewelTypes.length);
    return jewelTypes[randomIndex];
}

// Create a jewel element
function createJewel(type, row, col) {
    const jewel = document.createElement('div');
    jewel.classList.add('jewel', type);
    jewel.dataset.row = row;
    jewel.dataset.col = col;
    jewel.draggable = true;
    return jewel;
}

// Initialize the game board
function initBoard() {
    gameBoard.innerHTML = '';
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const jewelType = getRandomJewel();
            const jewel = createJewel(jewelType, row, col);
            gameBoard.appendChild(jewel);
        }
    }
    addEventListeners();
    checkAllMatches();
}

// Add event listeners to jewels
function addEventListeners() {
    document.querySelectorAll('.jewel').forEach(jewel => {
        // Mouse events
        jewel.addEventListener('dragstart', onDragStart);
        jewel.addEventListener('dragover', onDragOver);
        jewel.addEventListener('drop', onDrop);

        // Touch events
        jewel.addEventListener('touchstart', onTouchStart, { passive: false });
        jewel.addEventListener('touchmove', onTouchMove, { passive: false });
        jewel.addEventListener('touchend', onTouchEnd, { passive: false });
    });
}

// Handle drag start
function onDragStart(event) {
    if (isPaused) return; // Prevent interaction when paused
    draggedItem = event.target;
}

// Handle drag over
function onDragOver(event) {
    if (isPaused) return; // Prevent interaction when paused
    event.preventDefault();
}

// Handle drop
function onDrop(event) {
    if (isPaused) return; // Prevent interaction when paused
    event.preventDefault();
    const targetItem = event.target;

    if (targetItem.classList.contains('jewel') && targetItem !== draggedItem) {
        swapJewelsWithEffect(draggedItem, targetItem);
    }
}

// Handle touch start
function onTouchStart(event) {
    if (isPaused) return; // Prevent interaction when paused
    event.preventDefault(); // Prevent scrolling
    touchedItem = event.target;
}

// Handle touch move
function onTouchMove(event) {
    if (isPaused) return; // Prevent interaction when paused
    event.preventDefault(); // Prevent scrolling
    const touch = event.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    if (element && element.classList.contains('jewel') && element !== touchedItem) {
        swapJewelsWithEffect(touchedItem, element);
        touchedItem = null; // Reset touchedItem to prevent multiple swaps
    }
}

// Handle touch end
function onTouchEnd(event) {
    if (isPaused) return; // Prevent interaction when paused
    event.preventDefault(); // Prevent scrolling
    touchedItem = null;
}

// Swap jewels with animation
function animateSwap(jewel1, jewel2) {
    const jewel1Pos = { row: jewel1.dataset.row, col: jewel1.dataset.col };
    const jewel2Pos = { row: jewel2.dataset.row, col: jewel2.dataset.col };

    const jewelSize = jewel1.offsetWidth; // Get the current size of the jewel

    jewel1.style.transform = `translate(${(jewel2Pos.col - jewel1Pos.col) * jewelSize}px, ${(jewel2Pos.row - jewel1Pos.row) * jewelSize}px)`;
    jewel2.style.transform = `translate(${(jewel1Pos.col - jewel2Pos.col) * jewelSize}px, ${(jewel1Pos.row - jewel2Pos.row) * jewelSize}px)`;

    return new Promise(resolve => {
        setTimeout(() => {
            jewel1.style.transform = '';
            jewel2.style.transform = '';

            swapJewels(jewel1, jewel2);
            resolve();
        }, 300);
    });
}

function swapJewelsWithEffect(jewel1, jewel2) {
    sfx.swapJewels.play(); // Play swap sound effect
    animateSwap(jewel1, jewel2).then(() => {
        if (!checkAllMatches()) {
            // If there's no match, swap back
            animateSwap(jewel1, jewel2); // Swap back with animation
        } else {
            score += 100; // Increase score for a successful match
            document.getElementById('score').innerText = `Score: ${score}`;
            sfx.boost.play(); // Play boost sound effect if match found
        }
    });
}

// Swap two jewels
function swapJewels(jewel1, jewel2) {
    const jewel1Class = jewel1.className;
    const jewel2Class = jewel2.className;

    jewel1.className = jewel2Class;
    jewel2.className = jewel1Class;
}

// Check for all matches
function checkAllMatches() {
    let hasMatches = false;

    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const jewel = getJewelAt(row, col);
            if (jewel) {
                const match = getMatch(jewel);
                if (match.length >= 3) {
                    hasMatches = true;
                    createParticleEffect(jewel);
                    removeMatches(match);
                }
            }
        }
    }
    return hasMatches;
}

// Get a jewel at a specific position
function getJewelAt(row, col) {
    return document.querySelector(`.jewel[data-row="${row}"][data-col="${col}"]`);
}

// Get a match for a specific jewel
function getMatch(jewel) {
    const row = parseInt(jewel.dataset.row);
    const col = parseInt(jewel.dataset.col);
    const jewelType = jewel.classList[1];
    let match = [jewel];

    // Check horizontally
    for (let offset = -2; offset <= 2; offset++) {
        if (offset === 0) continue;
        const currentCol = col + offset;
        const currentJewel = getJewelAt(row, currentCol);
        if (currentJewel && currentJewel.classList.contains(jewelType)) {
            match.push(currentJewel);
        } else {
            break;
        }
    }

    if (match.length >= 3) return match;

    // Check vertically
    match = [jewel];
    for (let offset = -2; offset <= 2; offset++) {
        if (offset === 0) continue;
        const currentRow = row + offset;
        const currentJewel = getJewelAt(currentRow, col);
        if (currentJewel && currentJewel.classList.contains(jewelType)) {
            match.push(currentJewel);
        } else {
            break;
        }
    }

    return match.length >= 3 ? match : [];
}

// Remove matched jewels
function removeMatches(match) {
    match.forEach(jewel => {
        jewel.classList.add('matched');
        setTimeout(() => {
            jewel.classList.remove(...jewel.classList);
            jewel.classList.add('jewel');
        }, 300);
    });
    setTimeout(() => {
        cascading();
    }, 300);
}

// Cascading effect after removing matches
function cascading() {
    for (let col = 0; col < boardSize; col++) {
        for (let row = boardSize - 1; row >= 0; row--) {
            const jewel = getJewelAt(row, col);
            if (!jewel.classList[1]) {
                for (let rowAbove = row - 1; rowAbove >= 0; rowAbove--) {
                    const jewelAbove = getJewelAt(rowAbove, col);
                    if (jewelAbove.classList[1]) {
                        const jewelClass = jewelAbove.classList[1];
                        jewel.classList.add(jewelClass);
                        jewelAbove.classList.remove(jewelClass);
                        break;
                    }
                }
            }
            if (!jewel.classList[1]) {
                const newJewelType = getRandomJewel();
                jewel.classList.add(newJewelType);
            }
        }
    }

    setTimeout(() => {
        if (checkAllMatches()) {
            score += 50; // Increase score for a cascading match
            document.getElementById('score').innerText = `Score: ${score}`;
        }
    }, 200);
}

// Create particle effects
function createParticleEffect(element) {
    const particles = 5;
    for (let i = 0; i < particles; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 4 + 2; // Increase velocity for faster particles
        const xVelocity = Math.cos(angle) * velocity;
        const yVelocity = Math.sin(angle) * velocity;

        particle.style.left = `${element.offsetLeft + element.offsetWidth / 2}px`;
        particle.style.top = `${element.offsetTop + element.offsetHeight / 2}px`;

        gameBoard.appendChild(particle);

        let lifetime = 0;

     const interval = setInterval(() => {
            lifetime += 0.016; // Assume each frame is roughly 16ms

            const x = parseFloat(particle.style.left) + xVelocity;
            const y = parseFloat(particle.style.top) + yVelocity;

            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;

            if (lifetime > 0.65) { // Shorten particle lifetime
                clearInterval(interval);
                particle.remove();
            }
        }, 16);
    }
}

// Start the timer
function startTimer() {
    timerInterval = setInterval(() => {
        timer--;
        document.getElementById('timer').innerText = `Time: ${timer}`;
        if (timer <= 0) {
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
}

// End the game
function endGame() {
    clearInterval(timerInterval);
    finalScoreElement.innerText = `Final Score: ${score}`;
    modal.style.display = "block";
}

 document.querySelector(".play-music").addEventListener("click", () => {
      if (!music.overworld.playing()) {
         music.overworld.play();
      }
   })
   document.querySelector(".stop-music").addEventListener("click", () => {
       music.overworld.pause();
   })


// Initialize the game
initGame();
