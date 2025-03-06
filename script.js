// Three.js variables
let scene, camera, renderer;
let letterMesh, keyboardGroup;
let font;
let particles = [];
let letterParticles = [];
let animationMixers = [];
let clock = new THREE.Clock();
let backgroundParticles = [];

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
let isInputLocked = false;  // Add input lock state
let isGameActive = false;   // Add game active state
let is3DInitialized = false; // Track if 3D is initialized
let isGameCompleted = false; // Track if game is completed
let isDisintegrating = false; // Track if letter is disintegrating

// Preload sounds (using lowercase for filenames)
const letterSounds = {};
'abcdefghijklmnopqrstuvwxyz'.split('').forEach(letter => {
    letterSounds[letter] = new Audio(`sounds/${letter.toUpperCase()}.wav`);
});
const celebrationSound = new Audio('sounds/celebration.mp3');

// Motivational messages in Chinese with English translations
const messages = [
    "做得好！🎉 (Well done!)",
    "太棒了！🌟 (Awesome!)",
    "继续加油！💪 (Keep it up!)",
    "你很厉害！😊 (You're amazing!)",
    "真聪明！🚀 (So smart!)",
    "了不起！🏆 (Fantastic!)",
    "超级棒！👍 (Super great!)",
    "好厉害哦！🎈 (Really awesome!)",
    "你是最棒的！🌈 (You're the best!)",
    "干得漂亮！✨ (Nicely done!)",
    "哇，太强了！💥 (Wow, so strong!)",
    "进步真大！🎊 (Great progress!)"
];

// QWERTY layout
const qwertyLayout = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

// Colors for 3D elements
const colors = {
    background: 0x1a237e,
    letter: 0xffffff,
    keyDefault: 0xe3f2fd,
    keyHighlight: 0xffeb3b,
    keyBorder: 0x2196f3,
    keyText: 0x333333,
    particles: [0xff5722, 0x4caf50, 0x2196f3, 0xffeb3b, 0xe91e63]
};

// Initialize Three.js scene
function initThreeJS() {
    try {
        console.log("Initializing Three.js...");
        
        // Check if Three.js is loaded
        if (typeof THREE === 'undefined') {
            console.error("Three.js is not loaded!");
            // Continue with 2D mode if Three.js is not available
            return false;
        }
        
        // Create scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(colors.background);
        
        // Create camera with position based on screen size
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Set camera position based on screen size
        if (window.innerWidth > 1200) {
            // For larger screens, move camera back a bit
            camera.position.z = 25;
        } else if (window.innerHeight < 600 && window.innerWidth > window.innerHeight) {
            // For landscape mode with small height
            camera.position.z = 30;
        } else {
            // Default position
            camera.position.z = 20;
        }
        
        // Create renderer with proper settings for fullscreen
        renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
        
        // Check if canvas container exists
        const container = document.getElementById('canvas-container');
        if (!container) {
            console.error("Canvas container not found!");
            return false;
        }
        
        // Clear any existing canvas
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        // Add renderer to container
        container.appendChild(renderer.domElement);
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);
        
        // Add point lights for dramatic effect
        const pointLight1 = new THREE.PointLight(0x4caf50, 1, 100);
        pointLight1.position.set(10, 10, 10);
        scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xff5722, 1, 100);
        pointLight2.position.set(-10, -10, 10);
        scene.add(pointLight2);
        
        // Create keyboard group
        keyboardGroup = new THREE.Group();
        scene.add(keyboardGroup);
        
        // Check if FontLoader is available
        if (typeof THREE.FontLoader === 'undefined') {
            console.error("FontLoader is not available!");
            // Continue with basic 3D without text
            createBackgroundParticles();
            animate();
            return true;
        }
        
        // Load font for 3D text
        const fontLoader = new THREE.FontLoader();
        fontLoader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function(loadedFont) {
            console.log("Font loaded successfully");
            font = loadedFont;
            
            // Create background particles
            createBackgroundParticles();
            
            // Start animation loop
            animate();
        }, 
        // onProgress callback
        function(xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        // onError callback
        function(err) {
            console.error("Error loading font:", err);
            // Continue with basic 3D without text
            createBackgroundParticles();
            animate();
        });
        
        // Handle window resize
        window.addEventListener('resize', onWindowResize);
        
        // Handle fullscreen change
        document.addEventListener('fullscreenchange', onFullscreenChange);
        document.addEventListener('webkitfullscreenchange', onFullscreenChange);
        document.addEventListener('mozfullscreenchange', onFullscreenChange);
        document.addEventListener('MSFullscreenChange', onFullscreenChange);
        
        return true;
    } catch (error) {
        console.error("Error initializing Three.js:", error);
        return false;
    }
}

// Handle fullscreen change
function onFullscreenChange() {
    try {
        console.log("Fullscreen change detected");
        // Force resize after a short delay to ensure browser has updated dimensions
        setTimeout(onWindowResize, 100);
    } catch (error) {
        console.error("Error handling fullscreen change:", error);
    }
}

// Handle window resize
function onWindowResize() {
    try {
        console.log("Window resize detected:", window.innerWidth, "x", window.innerHeight);
        
        if (camera && renderer) {
            // Update camera
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            
            // Update renderer size to match window
            renderer.setSize(window.innerWidth, window.innerHeight);
            
            // Adjust camera position based on screen size
            if (window.innerWidth > 1200) {
                // For larger screens, move camera back a bit
                camera.position.z = 25;
            } else if (window.innerHeight < 600 && window.innerWidth > window.innerHeight) {
                // For landscape mode with small height
                camera.position.z = 30;
            } else {
                // Default position
                camera.position.z = 20;
            }
        }
        
        // Recreate keyboard to adjust for new screen size
        if (isGameActive) {
            createKeyboard();
        }
    } catch (error) {
        console.error("Error handling window resize:", error);
    }
}

// Create background particles
function createBackgroundParticles() {
    try {
        const particleCount = 100;
        const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        
        for (let i = 0; i < particleCount; i++) {
            const material = new THREE.MeshBasicMaterial({
                color: colors.particles[Math.floor(Math.random() * colors.particles.length)],
                transparent: true,
                opacity: 0.7
            });
            
            const particle = new THREE.Mesh(particleGeometry, material);
            
            // Random position
            particle.position.x = Math.random() * 40 - 20;
            particle.position.y = Math.random() * 40 - 20;
            particle.position.z = Math.random() * 20 - 10;
            
            // Random speed
            particle.userData = {
                speed: {
                    x: (Math.random() - 0.5) * 0.05,
                    y: (Math.random() - 0.5) * 0.05,
                    z: (Math.random() - 0.5) * 0.05
                }
            };
            
            scene.add(particle);
            backgroundParticles.push(particle);
        }
    } catch (error) {
        console.error("Error creating background particles:", error);
    }
}

// Update background particles
function updateBackgroundParticles() {
    try {
        backgroundParticles.forEach(particle => {
            particle.position.x += particle.userData.speed.x;
            particle.position.y += particle.userData.speed.y;
            particle.position.z += particle.userData.speed.z;
            
            // Wrap around if out of bounds
            if (particle.position.x > 20) particle.position.x = -20;
            if (particle.position.x < -20) particle.position.x = 20;
            if (particle.position.y > 20) particle.position.y = -20;
            if (particle.position.y < -20) particle.position.y = 20;
            if (particle.position.z > 10) particle.position.z = -10;
            if (particle.position.z < -10) particle.position.z = 10;
        });
    } catch (error) {
        console.error("Error updating background particles:", error);
    }
}

// Animation loop
function animate() {
    try {
        requestAnimationFrame(animate);
        
        // Update mixers
        const delta = clock.getDelta();
        animationMixers.forEach(mixer => mixer.update(delta));
        
        // Update background particles
        updateBackgroundParticles();
        
        // Update celebration particles
        updateParticles();
        
        // Update letter particles
        updateLetterParticles();
        
        // Rotate letter mesh if it exists and not disintegrating
        if (letterMesh && !isDisintegrating) {
            letterMesh.rotation.y += 0.005;
        }
        
        // Render scene
        renderer.render(scene, camera);
    } catch (error) {
        console.error("Error in animation loop:", error);
    }
}

// Create 3D letter
function create3DLetter(letter) {
    try {
        // Remove existing letter mesh
        if (letterMesh) {
            scene.remove(letterMesh);
        }
        
        if (!font || !is3DInitialized) return;
        
        // Create text geometry
        const textGeometry = new THREE.TextGeometry(letter, {
            font: font,
            size: 5,
            height: 1,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.2,
            bevelSize: 0.1,
            bevelOffset: 0,
            bevelSegments: 5
        });
        
        textGeometry.center();
        
        // Create material
        const textMaterial = new THREE.MeshStandardMaterial({
            color: colors.letter,
            metalness: 0.3,
            roughness: 0.4,
            emissive: 0x333333,
            emissiveIntensity: 0.2
        });
        
        // Create mesh
        letterMesh = new THREE.Mesh(textGeometry, textMaterial);
        letterMesh.position.y = 5;
        scene.add(letterMesh);
        
        // Add a subtle glow effect
        const glowGeometry = new THREE.TextGeometry(letter, {
            font: font,
            size: 5.1,
            height: 0.1,
            curveSegments: 8,
            bevelEnabled: false
        });
        
        glowGeometry.center();
        
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0x4444ff,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        });
        
        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        glowMesh.position.y = 5;
        glowMesh.position.z = -0.1;
        letterMesh.add(glowMesh);
        
        // Animate letter appearance
        gsap.from(letterMesh.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.5,
            ease: "back.out(1.7)"
        });
        
        // Add a subtle floating animation
        gsap.to(letterMesh.position, {
            y: "+=0.2",
            duration: 1.5,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
        });
        
        return letterMesh;
    } catch (error) {
        console.error("Error creating 3D letter:", error);
        return null;
    }
}

// Create QWERTY keyboard
function createKeyboard() {
    try {
        // Create HTML keyboard for interaction
        const keyboard = document.getElementById('keyboard');
        keyboard.innerHTML = ''; // Clear existing keyboard
        
        qwertyLayout.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'key-row';
            row.forEach(letter => {
                const key = document.createElement('div');
                key.className = 'key';
                key.textContent = letter;
                key.dataset.letter = letter.toLowerCase();
                key.addEventListener('click', () => {
                    if (!isInputLocked && isGameActive) {
                        const event = new KeyboardEvent('keypress', { key: letter.toLowerCase() });
                        document.dispatchEvent(event);
                    }
                });
                rowDiv.appendChild(key);
            });
            keyboard.appendChild(rowDiv);
        });
        
        // Create 3D keyboard if 3D is initialized
        if (is3DInitialized) {
            create3DKeyboard();
        }
    } catch (error) {
        console.error("Error creating keyboard:", error);
    }
}

// Create 3D keyboard
function create3DKeyboard() {
    try {
        // Clear existing keyboard
        while (keyboardGroup.children.length > 0) {
            keyboardGroup.remove(keyboardGroup.children[0]);
        }
        
        if (!font || !is3DInitialized) return;
        
        // Position keyboard based on screen size
        if (window.innerWidth > 1200) {
            // For larger screens, position keyboard lower
            keyboardGroup.position.y = -8;
        } else if (window.innerHeight < 600 && window.innerWidth > window.innerHeight) {
            // For landscape mode with small height
            keyboardGroup.position.y = -4;
        } else {
            // Default position
            keyboardGroup.position.y = -5;
        }
        
        keyboardGroup.position.z = 0;
        
        // Adjust key size based on screen size
        let keySize = 1;
        let keySpacing = 1.2;
        let textSize = 0.5;
        
        if (window.innerWidth > 1200) {
            // Smaller keys for larger screens
            keySize = 0.8;
            keySpacing = 1.0;
            textSize = 0.4;
        } else if (window.innerHeight < 600 && window.innerWidth > window.innerHeight) {
            // Smaller keys for landscape mode
            keySize = 0.7;
            keySpacing = 0.9;
            textSize = 0.35;
        }
        
        // Create keys
        let rowOffset = 0;
        qwertyLayout.forEach((row, rowIndex) => {
            // Center each row
            const rowWidth = row.length * keySpacing;
            const startX = -rowWidth / 2 + (keySpacing / 2);
            
            row.forEach((letter, colIndex) => {
                // Create key box
                const keyGeometry = new THREE.BoxGeometry(keySize, keySize, keySize / 2);
                const keyMaterial = new THREE.MeshPhongMaterial({
                    color: colors.keyDefault,
                    specular: 0x111111,
                    shininess: 30
                });
                
                const keyMesh = new THREE.Mesh(keyGeometry, keyMaterial);
                keyMesh.position.x = startX + colIndex * keySpacing;
                keyMesh.position.y = -rowIndex * keySpacing * 1.2;
                keyMesh.position.z = 0;
                keyMesh.userData = { letter: letter.toLowerCase() };
                
                // Add letter text if font is available
                if (font) {
                    try {
                        const textGeometry = new THREE.TextGeometry(letter, {
                            font: font,
                            size: textSize,
                            height: keySize / 10,
                            curveSegments: 4,
                            bevelEnabled: false
                        });
                        
                        textGeometry.center();
                        
                        const textMaterial = new THREE.MeshBasicMaterial({ color: colors.keyText });
                        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                        textMesh.position.z = keySize / 3;
                        
                        keyMesh.add(textMesh);
                    } catch (error) {
                        console.error("Error creating key text:", error);
                    }
                }
                
                keyboardGroup.add(keyMesh);
            });
            
            rowOffset += row.length;
        });
        
        // Animate keyboard appearance
        gsap.from(keyboardGroup.position, {
            y: -15,
            duration: 1,
            ease: "elastic.out(1, 0.5)"
        });
    } catch (error) {
        console.error("Error creating 3D keyboard:", error);
    }
}

// Highlight 3D key
function highlight3DKey(letter) {
    try {
        if (!is3DInitialized) return;
        
        keyboardGroup.children.forEach(keyMesh => {
            if (keyMesh.userData.letter === letter.toLowerCase()) {
                gsap.to(keyMesh.position, {
                    z: 1,
                    duration: 0.2,
                    yoyo: true,
                    repeat: 3
                });
                
                keyMesh.material.color.set(colors.keyHighlight);
                
                // Reset color after animation
                setTimeout(() => {
                    keyMesh.material.color.set(colors.keyDefault);
                }, 2000);
            }
        });
    } catch (error) {
        console.error("Error highlighting 3D key:", error);
    }
}

// Highlight key (only on wrong press)
function highlightKey(letter) {
    try {
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => {
            key.classList.remove('highlight');
            if (key.dataset.letter === letter.toLowerCase()) {
                key.classList.add('highlight');
            }
        });
        
        // Also highlight 3D key if 3D is initialized
        if (is3DInitialized) {
            highlight3DKey(letter);
        }
    } catch (error) {
        console.error("Error highlighting key:", error);
    }
}

// Play sound for letter
function playSound(letter) {
    try {
        const sound = letterSounds[letter.toLowerCase()];
        if (sound) {
            sound.currentTime = 0; // Reset sound to beginning
            sound.play().catch(err => console.log(`Sound for ${letter} failed: ${err}`));
        }
    } catch (error) {
        console.error("Error playing sound:", error);
    }
}

// Update progress bar and stage indicator
function updateProgress() {
    try {
        const progress = document.getElementById('progress');
        if (!progress) return;
        
        const totalLetters = stages[currentStageIndex].letters.length;
        const completed = currentLetterIndex;
        const percentage = (completed / totalLetters) * 100;
        progress.style.width = `${percentage}%`;

        const stageIndicator = document.getElementById('stage-indicator');
        if (stageIndicator) {
            stageIndicator.textContent = `第${currentStageIndex + 1}阶段`;
        }
    } catch (error) {
        console.error("Error updating progress:", error);
    }
}

// Create celebration particles
function createCelebrationParticles() {
    try {
        if (!is3DInitialized || !letterMesh) return;
        
        const particleCount = 50;
        const particleGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        
        for (let i = 0; i < particleCount; i++) {
            const material = new THREE.MeshBasicMaterial({
                color: colors.particles[Math.floor(Math.random() * colors.particles.length)],
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(particleGeometry, material);
            
            // Start from letter position
            particle.position.copy(letterMesh.position);
            
            // Random velocity
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.3,
                    (Math.random() - 0.5) * 0.3,
                    (Math.random() - 0.5) * 0.3
                ),
                life: 100
            };
            
            scene.add(particle);
            particles.push(particle);
        }
    } catch (error) {
        console.error("Error creating celebration particles:", error);
    }
}

// Update celebration particles
function updateParticles() {
    try {
        if (!is3DInitialized) return;
        
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            
            // Update position
            particle.position.add(particle.userData.velocity);
            
            // Update life
            particle.userData.life--;
            
            // Remove if dead
            if (particle.userData.life <= 0) {
                scene.remove(particle);
                particles.splice(i, 1);
            }
        }
    } catch (error) {
        console.error("Error updating particles:", error);
    }
}

// Show next letter
function nextLetter() {
    try {
        // If we're disintegrating, don't proceed
        if (isDisintegrating) return;
        
        const letterDisplay = document.getElementById('letter-display');
        if (!letterDisplay) return;
        
        if (currentLetterIndex < stages[currentStageIndex].letters.length) {
            currentLetter = stages[currentStageIndex].letters[currentLetterIndex];
            letterDisplay.textContent = currentLetter;
            letterDisplay.classList.add('bounce');
            setTimeout(() => {
                letterDisplay.classList.remove('bounce');
                isInputLocked = false;  // Unlock input after animation
            }, 500);
            
            // Create 3D letter if 3D is initialized
            if (is3DInitialized) {
                create3DLetter(currentLetter);
            }
            
            playSound(currentLetter);
            updateProgress();
        } else {
            // Check if this is the last stage
            if (currentStageIndex === stages.length - 1) {
                isGameCompleted = true;
            }
            
            celebrate();
            currentStageIndex++;
            if (currentStageIndex < stages.length) {
                setTimeout(startStage, 3000); // Wait for celebration
            } else {
                isGameActive = false;  // Game is complete
                const feedback = document.getElementById('feedback');
                if (feedback) {
                    feedback.textContent = '游戏完成！🏆 (Game Complete!)';
                }
                
                // Play a bigger celebration for game completion
                if (typeof confetti === 'function') {
                    setTimeout(() => {
                        confetti({
                            particleCount: 200,
                            spread: 160,
                            origin: { y: 0.6 },
                            colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
                        });
                    }, 500);
                }
            }
        }
    } catch (error) {
        console.error("Error showing next letter:", error);
    }
}

// Celebrate stage completion
function celebrate() {
    try {
        isInputLocked = true;  // Lock input during celebration
        
        // Canvas confetti
        if (typeof confetti === 'function') {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
        
        // 3D celebration particles if 3D is initialized
        if (is3DInitialized) {
            createCelebrationParticles();
            
            // Camera celebration animation
            gsap.to(camera.position, {
                z: 25,
                duration: 0.5,
                yoyo: true,
                repeat: 1,
                ease: "power2.inOut"
            });
        }
        
        // Only play celebration sound if game is completed
        if (isGameCompleted) {
            celebrationSound.play().catch(err => console.log("Celebration sound failed:", err));
        }
        
        // Show random message
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const feedback = document.getElementById('feedback');
        if (feedback) {
            feedback.textContent = randomMessage;
        }
        
        setTimeout(() => {
            if (feedback) {
                feedback.textContent = '';
            }
            isInputLocked = false;  // Unlock input after celebration
        }, 3000);
    } catch (error) {
        console.error("Error celebrating:", error);
        isInputLocked = false; // Make sure to unlock input even if there's an error
    }
}

// Start a stage
function startStage() {
    try {
        currentLetterIndex = 0;
        isInputLocked = false;  // Ensure input is unlocked
        updateProgress();
        nextLetter();
    } catch (error) {
        console.error("Error starting stage:", error);
    }
}

// Initialize the game
function initGame() {
    try {
        console.log("Initializing game...");
        
        // Try to initialize Three.js
        is3DInitialized = initThreeJS();
        console.log("3D initialized:", is3DInitialized);
        
        // Set up fullscreen button
        setupFullscreenButton();
        
        // Start game on button click
        const startButton = document.getElementById('start-button');
        if (!startButton) {
            console.error("Start button not found!");
            return;
        }
        
        startButton.addEventListener('click', () => {
            console.log("Start button clicked");
            
            const startScreen = document.getElementById('start-screen');
            const gameScreen = document.getElementById('game-screen');
            
            if (startScreen) startScreen.style.display = 'none';
            if (gameScreen) gameScreen.style.display = 'block';
            
            // Add stage indicator
            const letterDisplay = document.getElementById('letter-display');
            if (!letterDisplay) {
                console.error("Letter display not found!");
                return;
            }
            
            // Check if stage indicator already exists
            let stageIndicator = document.getElementById('stage-indicator');
            if (!stageIndicator) {
                stageIndicator = document.createElement('div');
                stageIndicator.id = 'stage-indicator';
                gameScreen.insertBefore(stageIndicator, letterDisplay);
            }
            
            // Check if progress bar already exists
            let progressBar = document.getElementById('progress-bar');
            if (!progressBar) {
                progressBar = document.createElement('div');
                progressBar.id = 'progress-bar';
                const progress = document.createElement('div');
                progress.id = 'progress';
                progressBar.appendChild(progress);
                gameScreen.insertBefore(progressBar, letterDisplay);
            }
            
            isGameActive = true;  // Start the game
            createKeyboard();
            startStage();
            
            // Enter fullscreen mode automatically when game starts
            toggleFullscreen();
        });
    } catch (error) {
        console.error("Error initializing game:", error);
    }
}

// Set up fullscreen button
function setupFullscreenButton() {
    try {
        const fullscreenButton = document.getElementById('fullscreen-button');
        if (!fullscreenButton) {
            console.error("Fullscreen button not found!");
            return;
        }
        
        fullscreenButton.addEventListener('click', toggleFullscreen);
        
        // Update button icon based on fullscreen state
        document.addEventListener('fullscreenchange', updateFullscreenButtonIcon);
        document.addEventListener('webkitfullscreenchange', updateFullscreenButtonIcon);
        document.addEventListener('mozfullscreenchange', updateFullscreenButtonIcon);
        document.addEventListener('MSFullscreenChange', updateFullscreenButtonIcon);
    } catch (error) {
        console.error("Error setting up fullscreen button:", error);
    }
}

// Update fullscreen button icon
function updateFullscreenButtonIcon() {
    try {
        const fullscreenButton = document.getElementById('fullscreen-button');
        if (!fullscreenButton) return;
        
        const icon = fullscreenButton.querySelector('i');
        if (!icon) return;
        
        if (document.fullscreenElement || 
            document.webkitFullscreenElement || 
            document.mozFullScreenElement || 
            document.msFullscreenElement) {
            // We're in fullscreen mode
            icon.className = 'fas fa-compress';
        } else {
            // We're not in fullscreen mode
            icon.className = 'fas fa-expand';
        }
    } catch (error) {
        console.error("Error updating fullscreen button icon:", error);
    }
}

// Toggle fullscreen mode
function toggleFullscreen() {
    try {
        const docEl = document.documentElement;
        
        if (!document.fullscreenElement && 
            !document.mozFullScreenElement && 
            !document.webkitFullscreenElement && 
            !document.msFullscreenElement) {
            // Enter fullscreen
            if (docEl.requestFullscreen) {
                docEl.requestFullscreen();
            } else if (docEl.msRequestFullscreen) {
                docEl.msRequestFullscreen();
            } else if (docEl.mozRequestFullScreen) {
                docEl.mozRequestFullScreen();
            } else if (docEl.webkitRequestFullscreen) {
                docEl.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    } catch (error) {
        console.error("Error toggling fullscreen:", error);
    }
}

// Handle keypresses
document.addEventListener('keypress', (event) => {
    try {
        // Ignore input if locked or game is not active or disintegrating
        if (isInputLocked || !isGameActive || isDisintegrating) return;

        const pressedKey = event.key.toLowerCase();
        const currentLetterLower = currentLetter.toLowerCase();
        
        if (pressedKey === currentLetterLower) {
            isInputLocked = true;  // Lock input immediately after correct press
            
            const feedback = document.getElementById('feedback');
            if (feedback) {
                feedback.textContent = '✅ 好棒！🎉';
            }
            
            const letterDisplay = document.getElementById('letter-display');
            if (letterDisplay) {
                letterDisplay.classList.add('correct');
            }
            
            // Animate 3D letter for correct input if 3D is initialized
            if (is3DInitialized && letterMesh) {
                // First do a quick scale animation
                gsap.to(letterMesh.scale, {
                    x: 1.2,
                    y: 1.2,
                    z: 1.2,
                    duration: 0.2,
                    ease: "power2.out",
                    onComplete: () => {
                        // Then start the disintegration effect
                        createLetterDisintegrationEffect();
                    }
                });
            } else {
                // If 3D is not initialized, use the standard approach
                setTimeout(() => {
                    if (letterDisplay) {
                        letterDisplay.classList.remove('correct');
                    }
                    if (feedback) {
                        feedback.textContent = '';
                    }
                    
                    const keys = document.querySelectorAll('.key');
                    keys.forEach(key => key.classList.remove('highlight'));
                    
                    currentLetterIndex++;
                    nextLetter();
                    isInputLocked = false;
                }, 1000);
            }
        } else if (/^[a-z]$/.test(pressedKey)) {
            // Only show error feedback if not already showing feedback
            const feedback = document.getElementById('feedback');
            if (feedback && !feedback.textContent) {
                feedback.textContent = '❌ 再试一次！😊';
                highlightKey(currentLetter);
                
                // Play the letter sound as a hint
                playSound(currentLetter);
                
                // Shake 3D letter for wrong input if 3D is initialized
                if (is3DInitialized && letterMesh) {
                    gsap.to(letterMesh.position, {
                        x: "+=0.5",
                        duration: 0.1,
                        yoyo: true,
                        repeat: 5
                    });
                }
                
                setTimeout(() => {
                    if (feedback && feedback.textContent === '❌ 再试一次！😊') {
                        feedback.textContent = '';
                    }
                }, 2000);
            }
        }
    } catch (error) {
        console.error("Error handling keypress:", error);
    }
});

// Initialize the game when the page loads
window.addEventListener('load', function() {
    console.log("Window loaded, initializing game...");
    setTimeout(initGame, 500); // Slight delay to ensure all resources are loaded
});

// Create letter disintegration effect
function createLetterDisintegrationEffect() {
    try {
        if (!letterMesh || !is3DInitialized) return;
        
        isDisintegrating = true;
        
        // Clear any existing letter particles
        letterParticles.forEach(particle => {
            scene.remove(particle);
        });
        letterParticles = [];
        
        // Get the geometry vertices from the letter mesh
        const geometry = letterMesh.geometry;
        
        // Create a raycaster for sampling points on the letter surface
        const raycaster = new THREE.Raycaster();
        const direction = new THREE.Vector3(0, 0, 1);
        
        // Create particles based on the letter shape
        const particleCount = 300;
        const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        
        // Create a shockwave effect
        const shockwaveGeometry = new THREE.RingGeometry(0.1, 2, 32);
        const shockwaveMaterial = new THREE.MeshBasicMaterial({
            color: 0x4444ff,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
        shockwave.position.copy(letterMesh.position);
        shockwave.rotation.x = Math.PI / 2; // Make it horizontal
        scene.add(shockwave);
        
        // Animate shockwave
        gsap.to(shockwave.scale, {
            x: 10,
            y: 10,
            z: 1,
            duration: 1,
            ease: "power2.out",
            onUpdate: () => {
                shockwaveMaterial.opacity = 0.7 * (1 - shockwave.scale.x / 10);
            },
            onComplete: () => {
                scene.remove(shockwave);
            }
        });
        
        // Sample points on the letter surface
        for (let i = 0; i < particleCount; i++) {
            // Create a random position within the letter's bounding box
            const box = new THREE.Box3().setFromObject(letterMesh);
            const position = new THREE.Vector3(
                Math.random() * (box.max.x - box.min.x) + box.min.x,
                Math.random() * (box.max.y - box.min.y) + box.min.y,
                Math.random() * (box.max.z - box.min.z) + box.min.z
            );
            
            // Create particle material with random color variations
            const hue = Math.random() * 0.1 + 0.6; // Blue to purple range
            const color = new THREE.Color().setHSL(hue, 0.8, 0.5);
            
            // Randomly choose between sphere and cube particles
            let particleMesh;
            if (Math.random() > 0.7) {
                // Create cube particle
                const cubeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
                const cubeMaterial = new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.8
                });
                particleMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
            } else {
                // Create sphere particle
                const material = new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.8
                });
                particleMesh = new THREE.Mesh(particleGeometry, material);
            }
            
            particleMesh.position.copy(position);
            
            // Add random velocity for the particle
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            );
            
            // Add random rotation
            const rotation = new THREE.Vector3(
                Math.random() * 0.1,
                Math.random() * 0.1,
                Math.random() * 0.1
            );
            
            // Add random scale change
            const scaleChange = Math.random() * 0.01;
            
            // Store particle data
            particleMesh.userData = {
                velocity: velocity,
                rotation: rotation,
                scaleChange: scaleChange,
                life: 100 + Math.random() * 50
            };
            
            scene.add(particleMesh);
            letterParticles.push(particleMesh);
        }
        
        // Add a flash effect
        const flashGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });
        
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(letterMesh.position);
        scene.add(flash);
        
        // Animate flash
        gsap.to(flash.scale, {
            x: 20,
            y: 20,
            z: 20,
            duration: 0.5,
            ease: "power2.out",
            onUpdate: () => {
                flashMaterial.opacity = 1 * (1 - flash.scale.x / 20);
            },
            onComplete: () => {
                scene.remove(flash);
            }
        });
        
        // Hide the original letter mesh
        letterMesh.visible = false;
        
        // Set a timeout to move to the next letter
        setTimeout(() => {
            // Remove all particles
            letterParticles.forEach(particle => {
                scene.remove(particle);
            });
            letterParticles = [];
            
            // Remove the letter mesh
            if (letterMesh) {
                scene.remove(letterMesh);
                letterMesh = null;
            }
            
            isDisintegrating = false;
            
            // Move to the next letter
            currentLetterIndex++;
            nextLetter();
        }, 1500);
        
    } catch (error) {
        console.error("Error creating letter disintegration effect:", error);
        isDisintegrating = false;
        
        // Fallback to normal transition
        currentLetterIndex++;
        nextLetter();
    }
}

// Update letter particles
function updateLetterParticles() {
    try {
        if (!isDisintegrating) return;
        
        for (let i = letterParticles.length - 1; i >= 0; i--) {
            const particle = letterParticles[i];
            
            // Update position
            particle.position.add(particle.userData.velocity);
            
            // Update rotation
            particle.rotation.x += particle.userData.rotation.x;
            particle.rotation.y += particle.userData.rotation.y;
            particle.rotation.z += particle.userData.rotation.z;
            
            // Update scale
            particle.scale.x -= particle.userData.scaleChange;
            particle.scale.y -= particle.userData.scaleChange;
            particle.scale.z -= particle.userData.scaleChange;
            
            // Update opacity
            if (particle.material.opacity > 0) {
                particle.material.opacity -= 0.01;
            }
            
            // Update life
            particle.userData.life--;
            
            // Remove if dead or too small
            if (particle.userData.life <= 0 || particle.scale.x <= 0.1) {
                scene.remove(particle);
                letterParticles.splice(i, 1);
            }
        }
    } catch (error) {
        console.error("Error updating letter particles:", error);
    }
}