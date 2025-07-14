const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

// Game variables
let score = 0;
let misses = 0;
const maxMisses = 100;
let circles = [];
let effects = []; // New array for effects
let gameOver = false;

// Get references to UI elements
const spawnRateSlider = document.getElementById('spawnRate');
const initialVelocitySlider = document.getElementById('initialVelocity');

// Initial values from sliders
let currentSpawnRate = spawnRateSlider.value / 100; // Convert to probability (e.g., 5 -> 0.05)
let currentInitialVelocity = parseInt(initialVelocitySlider.value);

function gameLoop() {
  if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (Math.random() < currentSpawnRate) {
    spawnCircle();
  }

  for (let i = circles.length - 1; i >= 0; i--) {
    const circle = circles[i];
    circle.update();
    circle.draw();

    if (circle.y - circle.radius > canvas.height) {
      if (!isPrime(circle.number)) {
        misses++;
        if (misses >= maxMisses) {
          gameOver = true;
        }
      }
      circles.splice(i, 1);
    }
  }

  // Update and draw effects
  for (let i = effects.length - 1; i >= 0; i--) {
    const effect = effects[i];
    effect.update();
    effect.draw();
    if (effect.life <= 0) {
      if (effect.onComplete) {
        effect.onComplete();
      }
      effects.splice(i, 1);
    }
  }

  // Draw score and misses
  ctx.fillStyle = '#000';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + score, 20, 40);
  ctx.fillText('Misses: ' + misses, canvas.width - 120, 40);

  requestAnimationFrame(gameLoop);
}

class Circle {
  constructor(x, y, radius, number, vx, vy) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.number = number;
    this.vx = vx;
    this.vy = vy;
    this.gravity = 0.1;
  }

  update() {
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = isPrime(this.number) ? '#ff0000' : '#0000ff';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `${this.radius / 1.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.number, this.x, this.y);
  }
}

// New Effect class
class Effect {
  constructor(x, y, radius, color, onComplete) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.life = 60; // frames
    this.maxLife = 60;
    this.onComplete = onComplete; // Callback function
  }

  update() {
    this.life--;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.life / this.maxLife;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * (1 + (this.maxLife - this.life) / this.maxLife), 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

function spawnCircle(x, y, number, vx, vy) {
  const num = number || Math.floor(Math.random() * 99) + 2;
  const radius = 25 + num / 2;
  const startX = x || Math.random() * (canvas.width - radius * 2) + radius;
  const startY = y || canvas.height + radius;
  const startVX = vx || (Math.random() * 2 - 1);
  const startVY = vy || -currentInitialVelocity - Math.random() * (currentInitialVelocity / 2);
  circles.push(new Circle(startX, startY, radius, num, startVX, startVY));
}

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  for (let i = circles.length - 1; i >= 0; i--) {
    const circle = circles[i];
    const dx = mouseX - circle.x;
    const dy = mouseY - circle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < circle.radius) {
      // Define the action to take after the effect completes
      const onEffectComplete = () => {
        if (isPrime(circle.number)) {
          misses++;
          if (misses >= maxMisses) {
            gameOver = true;
          }
        } else {
          const factors = getTwoLargestFactors(circle.number);
          if (factors) {
            const [factor1, factor2] = factors;
            spawnCircle(circle.x, circle.y, factor1, -2, -currentInitialVelocity / 2);
            spawnCircle(circle.x, circle.y, factor2, 2, -currentInitialVelocity / 2);
            score += circle.number;
          }
        }
      };

      // Create an effect at the circle's position with a callback
      effects.push(new Effect(circle.x, circle.y, circle.radius, isPrime(circle.number) ? 'red' : 'blue', onEffectComplete));

      // Remove the original circle immediately
      circles.splice(i, 1);
    }
  }
});

// Event listeners for sliders
spawnRateSlider.addEventListener('input', (e) => {
  currentSpawnRate = e.target.value / 100;
});

initialVelocitySlider.addEventListener('input', (e) => {
  currentInitialVelocity = parseInt(e.target.value);
});

let gameStarted = false;

const startButton = document.getElementById('startButton');
startButton.addEventListener('click', () => {
  if (!gameStarted) {
    gameStarted = true;
    gameLoop();
    startButton.style.display = 'none'; // Hide the button once game starts
  }
});

// Modify gameLoop to only run if gameStarted is true
function gameLoop() {
  if (!gameStarted) return; // Add this line
  // ... rest of your gameLoop function
