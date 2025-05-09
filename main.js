// Accessing and setting up the canvas for the paint
const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");

canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.9;

// Add event listener for zooming with the mouse wheel
canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  if (event.deltaY < 0) {
    // Zoom in
    scaleFactor += 0.1;
  } else {
    // Zoom out
    scaleFactor = Math.max(0.1, scaleFactor - 0.1); // Prevent negative or zero scale
  }
});

// Initialize variables
let score = 0;
let highScore = localStorage.getItem("highScore") || 0; // Retrieve high score from localStorage
let powerUpActive = false;
let difficulty = "medium"; // Default difficulty
let volume = 100; // Default volume

// Function to update the score
function updateScore(points) {
  score += points;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore); // Save high score to localStorage
  }
  document.getElementById("score").textContent = `Score: ${score}`;
  document.getElementById(
    "high-score"
  ).textContent = `High Score: ${highScore}`;
}

// Function to draw the score and high score
function drawScore() {
  context.fillStyle = "white";
  context.font = "20px Arial";
  context.fillText(`Score: ${score}`, 10, 30);
  context.fillText(`High Score: ${highScore}`, 10, 60);
}

// Power-up logic
function activatePowerUp() {
  powerUpActive = true;
  setTimeout(() => {
    powerUpActive = false;
  }, 10000); // Power-up lasts for 10 seconds
}

// Handle difficulty changes
const difficultySelector = document.getElementById("difficulty");
difficultySelector.addEventListener("change", (event) => {
  difficulty = event.target.value;
  console.log(`Difficulty set to: ${difficulty}`);
  // Adjust game parameters based on difficulty
  if (difficulty === "easy") {
    enemySpeed = 1;
    spawnRate = 2000;
  } else if (difficulty === "medium") {
    enemySpeed = 2;
    spawnRate = 1500;
  } else if (difficulty === "hard") {
    enemySpeed = 3;
    spawnRate = 1000;
  }
});

// Initialize audio elements
const backgroundMusic = new Audio("assets/background-music.mp3");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5; // Default volume
backgroundMusic.play();

const shootSound = new Audio("assets/shoot.mp3");
shootSound.volume = 0.5;

const explosionSound = new Audio("assets/explosion.mp3");
explosionSound.volume = 0.5;

// Handle volume changes
const volumeControl = document.getElementById("volume");
volumeControl.value = 0.5; // Set initial volume
volumeControl.addEventListener("input", (event) => {
  const newVolume = parseFloat(event.target.value); // Get volume as a float between 0 and 1
  backgroundMusic.volume = newVolume;
  shootSound.volume = newVolume;
  explosionSound.volume = newVolume;
  console.log(`Volume set to: ${newVolume}`);
});

function playSound(sound) {
  sound.currentTime = 0; // Reset sound
  sound.play();
}

// Example: Play sound when shooting
function shoot() {
  playSound(shootSound);
}

// Player class
class Player {
  constructor(game) {
    this.game = game;
    this.width = 140;
    this.height = 120;
    this.x = this.game.width / 2 - this.width / 2;
    this.y = this.game.height * 0.98 - this.height;
    this.playerFrameX = 0;
    this.playerJetsFrameX = 1;
    this.energyUsed = 0;
    this.maxEnergy = 255;
    this.cooldown = 200;
    this.cooldownTimer = 0;
    this.health = 100;
    this.maxHealth = 100;
  }

  draw(deltaTime) {
    /* The laser beam energy level bar */
    let currentEnergy = Math.floor(this.maxEnergy - this.energyUsed);

    /* The laser beam energy level bar outline */
    context.save();
    context.beginPath();
    context.lineWidth = 2;
    context.strokeStyle = "gold";
    context.strokeRect(9, 39, this.maxEnergy + 2, 22);
    context.restore();

    /* The laser beam energy level */
    context.save();
    context.beginPath();
    context.fillStyle = `rgb(${this.energyUsed},${currentEnergy},${0})`;
    context.fillRect(10, 40, currentEnergy, 20);
    context.fill();
    context.restore();

    /* Checking key inputs for attack */
    if (this.game.keys.includes(" ")) {
      this.playerFrameX = 1;
    } else if (this.game.keys.includes("2") && currentEnergy > 0) {
      this.playerFrameX = 2;
      this.game.SmallLaser.activated = true;
      this.game.SmallLaser.update();
      this.energyUsed += 0.7;
    } else if (this.game.keys.includes("3") && currentEnergy > 0) {
      this.playerFrameX = 3;
      this.game.LargeLaser.activated = true;
      this.game.LargeLaser.update();
      this.energyUsed += 1;
    } else {
      if (this.cooldownTimer > this.cooldown && this.energyUsed > 0) {
        this.energyUsed -= 1;
        this.cooldownTimer = 0;
      }
      this.playerFrameX = 0;
      this.game.SmallLaser.activated = false;
      this.game.LargeLaser.activated = false;
      this.cooldownTimer += deltaTime;
    }

    // Drawing the player object
    context.beginPath();
    context.drawImage(
      this.game.playerImg,
      this.playerFrameX * this.width,
      0,
      this.width,
      this.height,
      this.x,
      this.y,
      this.width,
      this.height
    );
    context.drawImage(
      this.game.playerjetImg,
      this.playerJetsFrameX * this.width,
      0,
      this.width,
      this.height,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }

  shoot() {
    const projectile = this.game.getProjectiles();
    if (projectile) {
      projectile.start(this.x + this.width / 2, this.y);
    }
  }

  update(deltaTime) {
    if (
      (this.game.keys.includes("a") || this.game.keys.includes("ArrowLeft")) &&
      this.x > 0
    ) {
      this.x -= 3;
      this.playerJetsFrameX = 0;
    } else if (
      (this.game.keys.includes("d") || this.game.keys.includes("ArrowRight")) &&
      this.x < canvas.width - this.width
    ) {
      this.x += 3;
      this.playerJetsFrameX = 2;
    } else {
      this.playerJetsFrameX = 1;
    }
    this.draw(deltaTime);
  }
}

// Projectile class
class Projectile {
  constructor(game, entity) {
    this.game = game;
    this.entity = entity;
    this.width = 3;
    this.height = 15;
    this.damage = 1;
    this.x = this.game.player.x + this.game.player.width / 2 - this.width / 2;
    this.y = this.game.player.y - this.height;
    this.free = true;
    this.animationTimer = 0;
    this.animationInterval = 1;
  }

  draw() {
    if (!this.free) {
      context.beginPath();
      context.save();
      context.fillStyle = "gold";
      context.fillRect(this.x, this.y, this.width, this.height);
      context.restore();
    }
  }

  update(dy) {
    if (!this.free) {
      this.y -= dy;
      if (this.y < 0 - this.height) {
        this.reset();
      }

      if (this.y > this.game.height) {
        this.reset();
      }

      // Call to the collision_mechanism
      if (this.entity == "player") collision_mechanism(this, this.game, true);
      else collision_mechanism(this, this.game, false);
    }
  }

  start(x, y) {
    this.x = x - this.width / 2;
    this.y = y - this.height;
    this.free = false;
  }

  reset() {
    this.free = true;
  }
}

class Laser {
  constructor(game) {
    this.game = game;
    this.y = 0;
    this.height = canvas.height - this.game.player.height / 2;
    this.activated = false;
    this.animationInterval = 5;
    this.animationTimer = 0;
  }
  update() {
    if (this.activated) {
      this.x = this.game.player.x + this.game.player.width / 2 - this.width / 2;

      context.save();
      context.fillStyle = "gold";
      context.fillRect(this.x, this.y, this.width, this.height);
      context.restore();
      context.save();
      context.fillStyle = "yellow";
      context.fillRect(
        this.x + this.width / 4,
        this.y,
        this.width / 2,
        this.height
      );
      context.restore();
      context.save();
      context.fillStyle = "white";
      context.fillRect(
        this.x + this.width / 2.75,
        this.y,
        this.width / 4,
        this.height
      );
      context.restore();

      this.animationTimer++;
      // Call to the collision_mechanism
      collision_mechanism(this, this.game, true);
    }
  }
}

class SmallLaser extends Laser {
  constructor(game) {
    super(game);
    this.width = 5;
    this.damage = 0.1;
  }
  update() {
    super.update();
  }
}

class LargeLaser extends Laser {
  constructor(game) {
    super(game);
    this.width = 20;
    this.damage = 0.2;
  }
  update() {
    super.update();
  }
}

class Invaders {
  constructor(game, x, y, frameY, grid_height) {
    this.game = game;
    this.width = 80;
    this.height = 80;
    this.x = x;
    this.pseudoy = y;
    this.y = this.pseudoy - grid_height;
    this.frameX = 0;
    this.frameY = frameY;
    this.animationTimer = 0;
    this.animationInterval = 10;
    this.image = "";
  }

  draw() {
    // context.beginPath();
    // context.strokeStyle = "white";
    // context.strokeRect(this.x, this.y, this.width, this.height);
    // context.stroke();
    context.drawImage(
      this.image,
      this.frameX * this.width,
      this.frameY * this.height,
      this.width,
      this.height,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }

  update(dx, dy) {
    if (this.y < this.pseudoy) this.y += 0.5; // Provides the drive in look.
    this.x += dx;
    this.y += dy;
    this.draw();
  }

  shoot() {
    const projectile = this.game.getEnemyProjectiles();
    if (projectile) {
      projectile.start(this.x + this.width / 2, this.y + this.height);
    }
  }

  explode(invader) {
    const explosion = this.game.getexplosions();
    if (explosion) {
      explosion.start(
        this.x + this.width / 2,
        this.y + this.height / 2,
        invader
      );
    }
  }
}

class Beetlemorph extends Invaders {
  constructor(game, x, y, frameY, grid_height) {
    super(game, x, y, frameY, grid_height);
    this.lives = 1;
    this.maxLives = 1;
    this.type = "beetlemorph";
  }
  create() {
    this.image = this.game.beetlemorph;
  }
}

class Rhinomorph extends Invaders {
  constructor(game, x, y, frameY, grid_height) {
    super(game, x, y, frameY, grid_height);
    this.lives = 4;
    this.maxLives = 4;
    this.type = "rhinomorph";
  }
  create() {
    this.image = this.game.rhinomorph;
  }
  update(dx, dy) {
    super.update(dx, dy);
    this.frameX = Math.round(this.maxLives - this.lives);
  }
}

// Bosses
class Boss extends Invaders {
  constructor(game, x, y, frameY, grid_height) {
    super(game, x, y, frameY, grid_height);
    this.y = y + 80;
    this.game = game;
    this.height = 200;
    this.width = 200;
    this.frameX = 0;
    this.frameY = Math.floor(Math.random() * 4);
    this.animationInterval = 1000;
    this.animationTimer = 0;
    this.type = "boss";
    this.maxLives = 50;
    this.lives = 50;
  }
  create() {
    this.image = this.game.bossImg;
  }
  draw() {
    super.draw();
    // boss life status
    context.save();
    context.fillStyle = "white";
    context.font = "1.5rem impact";
    context.fillText(
      `${Math.round(this.lives)}`,
      this.x + this.width / 2 - 12.5,
      this.y + this.height / 2 + 2.5
    );
    context.restore();
  }
  update(dx, dy, deltaTime) {
    super.update(dx, dy, deltaTime);
    if (this.y < 0 + 80) this.y += 0.5;
    if (this.animationTimer > this.animationInterval) {
      this.frameX++;
      this.animationTimer = 0;
      if (this.frameX > 1) {
        this.frameX = 0;
      }
    }
    this.animationTimer += deltaTime;
    this.draw();
  }
}

class BossEnemy {
  constructor() {
    this.x = canvas.width / 2 - 50;
    this.y = 50;
    this.width = 100;
    this.height = 100;
    this.health = 500;
  }

  update() {
    // Boss movement logic
  }

  draw(context) {
    context.fillStyle = "purple";
    context.fillRect(this.x, this.y, this.width, this.height);
    context.fillStyle = "red";
    context.fillRect(this.x, this.y - 10, (this.health / 500) * this.width, 5); // Health bar
  }
}

class ShooterEnemy {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.width = 30;
    this.height = 30;
    this.shootInterval = 2000; // Shoots every 2 seconds
    this.lastShotTime = 0;
  }

  update(deltaTime) {
    this.y += this.speed * deltaTime;
    if (Date.now() - this.lastShotTime > this.shootInterval) {
      this.shoot();
      this.lastShotTime = Date.now();
    }
  }

  shoot() {
    // Add logic to shoot projectiles at the player
    console.log("Shooter enemy fired!");
  }

  draw(context) {
    context.fillStyle = "red";
    context.fillRect(this.x, this.y, this.width, this.height);
  }
}

// Enemy Waves - Grids
class Grid {
  constructor(game) {
    this.dx = 0.8;
    this.dy = 0;
    this.game = game;
    this.rows = Math.floor(Math.random() * 2) + 2;
    this.columns = Math.floor(Math.random() * 2) + 2;
    this.invaderArray = [];
    this.invaderType = [Beetlemorph, Rhinomorph];

    if (!this.game.bossActivated) {
      this.width = 80 * this.rows;
      this.height = 80 * this.columns;
      this.x = 0;
      this.y = -this.height;

      for (let i = 0; i < this.rows; i++) {
        for (let j = 0; j < this.columns; j++) {
          let type =
            this.invaderType[
              Math.floor(Math.random() * this.invaderType.length)
            ];
          let frameY = Math.floor(Math.random() * 4);
          this.invaderArray.push(
            new type(this.game, i * 80, (j + 1) * 80, frameY, this.height)
          );
        }
      }
    } else {
      this.width = 200;
      this.height = 200;
      this.x = 0;
      this.y = -this.height - 80;
      let frameY = Math.floor(Math.random() * 4);
      this.invaderArray.push(
        new Boss(this.game, this.x, this.y, frameY, this.height)
      );
    }

    let shootInterval = setInterval(() => {
      this.invaderArray.forEach((invader) => {
        if (Math.random() < 0.3) {
          invader.shoot();
        }
      });
    }, 1500);
  }

  update(deltaTime) {
    this.dy = 0;

    if (this.y < 0) {
      this.y += 0.5;
    }

    if (this.x < 0 || this.x > canvas.width - this.width) {
      this.dx = -this.dx;
      this.dy = 20;
    }

    this.y += this.dy;
    this.x += this.dx;

    this.invaderArray.forEach((invader) => {
      invader.update(this.dx, this.dy, deltaTime);
    });
  }

  destroy() {
    clearInterval(this.shootInterval);
  }
}

class Explosions {
  constructor(game) {
    this.game = game;
    this.imgwidth = 300;
    this.imgheight = 300;
    this.width = this.imgwidth * 0.7; // Scaling the image.
    this.height = this.imgheight * 0.7; // Scaling the image.
    this.x = undefined;
    this.y = undefined;
    this.free = true;
    this.frameX = 0;
    this.frameY = undefined;
    this.dx = undefined;
    this.dy = undefined;
    this.animationTimer = 0;
    this.animationInterval = 25;
  }

  draw() {
    if (!this.free) {
      context.beginPath();
      context.drawImage(
        this.game.explosionsImg,
        this.frameX * this.imgwidth,
        this.frameY * this.imgheight,
        this.imgwidth,
        this.imgheight,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  }

  update(deltaTime) {
    if (!this.free) {
      this.draw();
      if (this.animationTimer > this.animationInterval) {
        if (this.frameX < 20) {
          this.frameX++;
        } else {
          this.frameX = 0;
          this.reset();
        }
        this.animationTimer = 0;
      } else {
        this.animationTimer += deltaTime;
      }
    }
  }

  start(x, y, invader) {
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
    this.free = false;
    if (invader.type == "rhinomorph") {
      this.frameY = 0;
      // this.scale = 0.5;
    } else if (invader.type == "beetlemorph") {
      this.frameY = 1;
      // this.scale = 0.5;
    } else {
      // for the boss
      this.frameY = 2;
      // this.scale = 1;
    }
  }

  reset() {
    this.free = true;
  }
}

class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // "shield", "double-damage", "speed-boost"
    this.width = 20;
    this.height = 20;
  }

  applyEffect(player) {
    if (this.type === "shield") {
      player.shieldActive = true;
      setTimeout(() => (player.shieldActive = false), 10000); // Shield lasts 10 seconds
    } else if (this.type === "double-damage") {
      player.damageMultiplier = 2;
      setTimeout(() => (player.damageMultiplier = 1), 10000); // Double damage lasts 10 seconds
    } else if (this.type === "speed-boost") {
      player.speed *= 2;
      setTimeout(() => (player.speed /= 2), 10000); // Speed boost lasts 10 seconds
    }
  }

  draw(context) {
    context.fillStyle =
      this.type === "shield"
        ? "blue"
        : this.type === "double-damage"
        ? "yellow"
        : "green";
    context.fillRect(this.x, this.y, this.width, this.height);
  }
}

// Main Game class or the brain of the game
class Game {
  constructor() {
    this.width = canvas.width;
    this.height = canvas.height;

    /* Grid and invaders data */
    this.gridArray = [new Grid(this)];

    /* Boss's data */
    this.bossArray = [new Boss(this)];
    this.bossActivated = false;

    /* Image accessing section in the main game class */
    this.playerImg = document.querySelector("#player");
    this.playerjetImg = document.querySelector("#player_jets");
    this.beetlemorph = document.querySelector("#beetlemorph");
    this.rhinomorph = document.querySelector("#rhinomorph");
    this.explosionsImg = document.querySelector("#explosions");
    this.bossImg = document.querySelector("#boss");

    this.keys = [];
    this.player = new Player(this);

    /* Projectile handling */
    this.projectileArray = [];
    this.enemyProjectileArray = [];

    for (let i = 0; i < 10; i++) {
      this.projectileArray.push(new Projectile(this, "player"));
    }

    for (let i = 0; i < 10; i++) {
      this.enemyProjectileArray.push(new Projectile(this, "enemy"));
    }

    /* Explosions handling */
    this.explosionsArray = [];
    for (let i = 0; i < 10; i++) {
      this.explosionsArray.push(new Explosions(this));
    }

    /* Laser handling */
    this.LargeLaser = new LargeLaser(this);
    this.SmallLaser = new SmallLaser(this);

    /* Score Handling */
    this.score = 0;
    this.waveCount = 1;

    /* Event Listeners */
    window.addEventListener("keydown", (e) => {
      if (this.keys.indexOf(e.key) === -1) {
        // -1 index is returned only when the element is not present
        this.keys.push(e.key);
      }
      if (e.key === " ") {
        this.player.shoot();
        console.log("true");
      }
    });
    window.addEventListener("keyup", (e) => {
      if (this.keys.indexOf(e.key) > -1)
        this.keys.splice(this.keys.indexOf(e.key), 1);
    });
  }

  getProjectiles() {
    for (let i = 0; i < 10; i++) {
      if (this.projectileArray[i].free) return this.projectileArray[i];
    }
  }

  getEnemyProjectiles() {
    for (let i = 0; i < 10; i++) {
      if (this.enemyProjectileArray[i].free)
        return this.enemyProjectileArray[i];
    }
  }

  getexplosions() {
    for (let i = 0; i < 10; i++) {
      if (this.explosionsArray[i].free) return this.explosionsArray[i];
    }
  }

  draw() {
    context.save();
    context.fillStyle = "white";
    context.font = "1.5rem impact";
    context.fillText(`SCORE:  ${this.score}`, 10, 25);
    context.restore();
  }

  render(deltaTime) {
    this.draw();
    this.player.update(deltaTime);

    this.projectileArray.forEach((projectile) => {
      projectile.draw();
      projectile.update(8.5);
    });

    this.enemyProjectileArray.forEach((projectile) => {
      projectile.draw();
      projectile.update(-8.5);
    });

    this.explosionsArray.forEach((explosion) => {
      explosion.update(deltaTime);
    });
    this.gridArray.forEach((grid) => {
      if (grid.invaderArray.length == 0) {
        game.gridArray.splice(game.gridArray.indexOf(grid), 1);
      } else {
        grid.invaderArray.forEach((invader) => {
          invader.create();
        });
        grid.update(deltaTime);
      }
    });

    if (!this.gridArray[0]) {
      if (this.waveCount % 5 == 0) {
        // call to the boss function
        this.bossActivated = true;
      } else {
        this.bossActivated = false;
      }
      this.gridArray = [new Grid(this)];
      this.waveCount++;
    }
  }
}

// Object instantiation
const game = new Game();
let lastTime = 0;

// Animation loop
function animate(timeStamp) {
  const deltaTime = timeStamp - lastTime;
  lastTime = timeStamp;
  requestAnimationFrame(animate);
  context.clearRect(0, 0, canvas.width, canvas.height);
  game.render(deltaTime);
  drawScore();
}

animate(0); // Initial call for the animate function

// Collision mechanism
function collision_mechanism(object, game, player) {
  if (player) {
    game.gridArray.forEach((grid) => {
      grid.invaderArray.forEach((invader) => {
        if (
          object.y < invader.y + invader.height &&
          object.y + object.height > invader.y &&
          object.x + object.width > invader.x &&
          object.x < invader.x + invader.width
        ) {
          if (invader.lives <= 1) {
            invader.explode(invader);
            game.score += invader.maxLives;
            grid.invaderArray.splice(grid.invaderArray.indexOf(invader), 1);
          } else {
            if (object.animationTimer % object.animationInterval == 0) {
              invader.lives -= object.damage;
              object.animationTimer = 0;
            }
          }
          if (object.damage == 1) {
            object.reset();
          }
          return true;
        }
      });
    });
  } else {
    if (
      object.y < game.player.y + game.player.height &&
      object.y + object.height > game.player.y &&
      object.x + object.width > game.player.x &&
      object.x < game.player.x + game.player.width
    ) {
      if (object.damage == 1) {
        object.reset();
      }
      return true;
    }
  }
}
