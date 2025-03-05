// Define stages with capital letters (A to Z, ending with U-Z in Stage 5)
const stages = [
    { letters: ['A', 'B', 'C', 'D', 'E'] },
    { letters: ['F', 'G', 'H', 'I', 'J'] },
    { letters: ['K', 'L', 'M', 'N', 'O'] },
    { letters: ['P', 'Q', 'R', 'S', 'T'] },
    { letters: ['U', 'V', 'W', 'X', 'Y', 'Z'] }
];

// Game state
let currentStageIndex = 0;
let currentLetterIndex = 0;
let currentLetter = '';

// Preload sounds (using lowercase for filenames)
const letterSounds = {};
'abcdefghijklmnopqrstuvwxyz'.split('').forEach(letter => {
    letterSounds[letter] = new Audio(`sounds/${letter}.wav`);
});
const celebrationSound = new Audio('sounds/celebration.mp3');

// Motivational messages in Chinese with English translations
const messages = [
    '做得好！🎉 (Well done!)',
    '太棒了！🌟 (Awesome!)',
    '继续加油！💪 (Keep it up!)',
    '你很厉害！😊 (You’re amazing!)',
    '真聪明！🚀 (So smart!)',
    '了不起！🏆 (Fantastic!)',
    '超级棒！👍 (Super great!)',
    '好厉害哦！🎈 (Really awesome!)',
    '你是最棒的！🌈 (You’re the best!)',
    '干得漂亮！✨ (Nicely done!)',
    '哇，太强了！💥 (Wow, so strong!)',
    '进步真大！🎊 (Great progress!)'
];

// QWERTY layout
const qwertyLayout = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

// Create QWERTY keyboard
function createKeyboard() {
    const keyboard = document.getElementById('keyboard');
    qwertyLayout.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'key-row';
        row.forEach(letter => {
            const key = document.createElement('div');
            key.className = 'key';
            key.textContent = letter;
            key.dataset.letter = letter.toLowerCase();
            key.addEventListener('click', () => {
                const event = new KeyboardEvent('keypress', { key: letter.toLowerCase() });
                document.dispatchEvent(event);
            });
            rowDiv.appendChild(key);
        });
        keyboard.appendChild(rowDiv);
    });
}

// Highlight key (only on wrong press)
function highlightKey(letter) {
    const keys = document.querySelectorAll('.key');
    keys.forEach(key => {
        key.classList.remove('highlight');
        if (key.dataset.letter === letter.toLowerCase()) {
            key.classList.add('highlight');
        }
    });
}

// Play sound for letter
function playSound(letter) {
    letterSounds[letter.toLowerCase()].play().catch(() => console.log(`Sound for ${letter} failed`));
}

// Update progress bar and stage indicator
function updateProgress() {
    const progress = document.getElementById('progress');
    const totalLetters = stages[currentStageIndex].letters.length;
    const completed = currentLetterIndex;
    const percentage = (completed / totalLetters) * 100;
    progress.style.width = `${percentage}%`;

    const stageIndicator = document.getElementById('stage-indicator');
    stageIndicator.textContent = `第${currentStageIndex + 1}阶段`;
}

// Show next letter
function nextLetter() {
    const letterDisplay = document.getElementById('letter-display');
    if (currentLetterIndex < stages[currentStageIndex].letters.length) {
        currentLetter = stages[currentStageIndex].letters[currentLetterIndex];
        letterDisplay.textContent = currentLetter;
        letterDisplay.classList.add('bounce');
        setTimeout(() => letterDisplay.classList.remove('bounce'), 500);
        playSound(currentLetter);
        updateProgress();
    } else {
        celebrate();
        currentStageIndex++;
        if (currentStageIndex < stages.length) {
            setTimeout(startStage, 3000); // Wait for celebration
        } else {
            document.getElementById('feedback').textContent = '游戏完成！🏆 (Game Complete!)';
        }
    }
}

// Celebrate stage completion
function celebrate() {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    celebrationSound.play();
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    document.getElementById('feedback').textContent = randomMessage;
    setTimeout(() => document.getElementById('feedback').textContent = '', 3000);
}

// Start a stage
function startStage() {
    currentLetterIndex = 0;
    updateProgress();
    nextLetter();
}

// Start game on button click
document.getElementById('start-button').addEventListener('click', () => {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    // Add stage indicator
    const stageIndicator = document.createElement('div');
    stageIndicator.id = 'stage-indicator';
    document.getElementById('game-screen').insertBefore(stageIndicator, document.getElementById('letter-display'));
    // Add progress bar
    const progressBar = document.createElement('div');
    progressBar.id = 'progress-bar';
    const progress = document.createElement('div');
    progress.id = 'progress';
    progressBar.appendChild(progress);
    document.getElementById('game-screen').insertBefore(progressBar, document.getElementById('letter-display'));
    createKeyboard();
    startStage();
});

// Handle keypresses
document.addEventListener('keypress', (event) => {
    const pressedKey = event.key.toLowerCase();
    const currentLetterLower = currentLetter.toLowerCase();
    if (pressedKey === currentLetterLower) {
        document.getElementById('feedback').textContent = '✅ 好棒！🎉';
        const letterDisplay = document.getElementById('letter-display');
        letterDisplay.classList.add('correct');
        setTimeout(() => {
            letterDisplay.classList.remove('correct');
            document.getElementById('feedback').textContent = '';
            const keys = document.querySelectorAll('.key');
            keys.forEach(key => key.classList.remove('highlight'));
            currentLetterIndex++;
            nextLetter();
        }, 1000);
    } else if (/^[a-z]$/.test(pressedKey)) {
        document.getElementById('feedback').textContent = '❌ 再试一次！😊';
        highlightKey(currentLetter);
        setTimeout(() => document.getElementById('feedback').textContent = '', 2000);
    }
});