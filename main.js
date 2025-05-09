// Accessing and setting up the canvas for the paint
const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

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
    this.activePowerUps = [];
    this.rapidFire = false;
    this.shield = false;
    this.doubleScore = false;
    this.powerUpTimers = {};
    this.lives = 3;
    this.isDead = false;
    this.respawnTimer = 0;
    this.respawnDelay = 1500;
  }

  draw(deltaTime) {
    // Hide player and health bar if dead (during respawn delay)
    if (this.isDead) return;

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

    // Draw active power-ups
    let puX = 10, puY = 70;
    this.activePowerUps.forEach((pu, i) => {
      const typeObj = POWERUP_TYPES.find(t => t.type === pu.type);
      context.save();
      context.globalAlpha = 0.8;
      context.beginPath();
      context.arc(puX + i * 38, puY, 16, 0, Math.PI * 2);
      context.fillStyle = typeObj.color;
      context.fill();
      context.globalAlpha = 1;
      context.font = "1rem bold";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "#222";
      context.fillText(typeObj.icon, puX + i * 38, puY + 1);
      // Timer
      if (typeObj.duration > 0) {
        context.font = "0.7rem monospace";
        context.fillStyle = "#fff";
        context.fillText(
          Math.ceil(this.powerUpTimers[pu.type] / 1000),
          puX + i * 38,
          puY + 18
        );
      }
      context.restore();
    });

    // Draw health bar above player
    const barWidth = this.width;
    const barHeight = 12;
    const healthRatio = this.health / this.maxHealth;
    context.save();
    context.beginPath();
    context.fillStyle = '#222';
    context.fillRect(this.x, this.y - barHeight - 6, barWidth, barHeight);
    context.fillStyle = healthRatio > 0.5 ? '#0f0' : healthRatio > 0.2 ? '#ff0' : '#f00';
    context.fillRect(this.x, this.y - barHeight - 6, barWidth * healthRatio, barHeight);
    context.strokeStyle = '#fff';
    context.lineWidth = 2;
    context.strokeRect(this.x, this.y - barHeight - 6, barWidth, barHeight);
    context.restore();
  }

  shoot() {
    const projectile = this.game.getProjectiles();
    if (projectile) {
      projectile.start(this.x + this.width / 2, this.y);
      playSFX(sfx_shoot);
    }
  }

  update(deltaTime) {
    if (this.isDead) {
      this.respawnTimer += deltaTime;
      if (this.respawnTimer > this.respawnDelay) {
        this.isDead = false;
        this.respawnTimer = 0;
        this.health = this.maxHealth;
        this.x = this.game.width / 2 - this.width / 2;
        this.y = this.game.height * 0.98 - this.height;
      }
      return;
    }
    this.updatePowerUps(deltaTime);
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

  collectPowerUp(powerUp) {
    if (powerUp.type === "health_restore") {
      this.health = Math.min(this.maxHealth, this.health + 40);
      playSFX(sfx_powerup);
    } else {
      this.activePowerUps.push({
        type: powerUp.type,
        expires: Date.now() + powerUp.duration
      });
      this.powerUpTimers[powerUp.type] = powerUp.duration;
      if (powerUp.type === "rapid_fire") this.rapidFire = true;
      if (powerUp.type === "shield") this.shield = true;
      if (powerUp.type === "double_score") this.doubleScore = true;
      playSFX(sfx_powerup);
    }
  }

  updatePowerUps(deltaTime) {
    const now = Date.now();
    this.activePowerUps = this.activePowerUps.filter(pu => {
      if (now < pu.expires) {
        this.powerUpTimers[pu.type] -= deltaTime;
        return true;
      } else {
        if (pu.type === "rapid_fire") this.rapidFire = false;
        if (pu.type === "shield") this.shield = false;
        if (pu.type === "double_score") this.doubleScore = false;
        return false;
      }
    });
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
    playSFX(sfx_shoot);
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

  update(dx, dy, deltaTime) {
    if (this.y < this.pseudoy) this.y += 0.5;
    // Zig-zag movement
    const zigzagAmplitude = 30;
    const zigzagFrequency = 0.002;
    this.x += dx + Math.sin(Date.now() * zigzagFrequency + this.pseudoy) * 1.5;
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

    this.shootInterval = setInterval(() => {
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
    playSFX(sfx_explosion);
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
      if (e.key.toLowerCase() === "r" && this.showGameOverScreen) {
        this.restart();
      }
    });
    window.addEventListener("keyup", (e) => {
      if (this.keys.indexOf(e.key) > -1)
        this.keys.splice(this.keys.indexOf(e.key), 1);
    });

    this.powerUps = [];
    this.powerUpSpawnTimer = 0;
    this.powerUpSpawnInterval = 8000 + Math.random() * 4000;
    this.gameOver = false;
    this.showGameOverScreen = false;
    this.leaderboardHandled = false;
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
    // Draw lives
    context.font = "1.2rem impact";
    context.fillStyle = "#f44";
    context.fillText(`LIVES: ${this.player.lives}`, 10, 55);
    context.restore();
    // Game Over screen
    if (this.showGameOverScreen) {
      context.save();
      context.globalAlpha = 0.85;
      context.fillStyle = '#000';
      context.fillRect(0, 0, this.width, this.height);
      context.globalAlpha = 1;
      context.fillStyle = '#fff';
      context.font = '3rem impact';
      context.textAlign = 'center';
      context.fillText('GAME OVER', this.width / 2, this.height / 2 - 40);
      context.font = '2rem impact';
      context.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 10);
      context.font = '1.5rem impact';
      context.fillText('Press R to Restart', this.width / 2, this.height / 2 + 60);
      context.restore();
    }
  }

  render(deltaTime) {
    if (this.showGameOverScreen) {
      // Leaderboard logic
      if (!this.leaderboardHandled) {
        if (isHighScore(this.score)) {
          let name = prompt('New High Score! Enter your name:','Player');
          if (!name) name = 'Player';
          addHighScore(name, this.score);
        }
        this.leaderboardHandled = true;
      }
      this.draw();
      pauseBGM();
      // Draw leaderboard overlay if toggled
      if (showLeaderboard || this.showGameOverScreen) {
        drawLeaderboardOverlay();
      }
      return;
    }
    this.draw();
    if (!this.player.isDead) this.player.update(deltaTime);
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
    // Remove empty grids
    for (let i = this.gridArray.length - 1; i >= 0; i--) {
      const grid = this.gridArray[i];
      if (grid.invaderArray.length == 0) {
        if (grid.shootInterval) clearInterval(grid.shootInterval);
        this.gridArray.splice(i, 1);
      } else {
        grid.invaderArray.forEach((invader) => {
          invader.create();
        });
        grid.update(deltaTime);
      }
    }
    // Always spawn a new grid if none exist and game is not over
    if (this.gridArray.length === 0 && !this.showGameOverScreen) {
      // Failsafe: forcibly spawn a new grid regardless of state
      this.bossActivated = false;
      this.gridArray = [new Grid(this)];
      this.waveCount++;
    }
    // Power-up spawn logic (random drop or timer)
    this.powerUpSpawnTimer += deltaTime;
    if (this.powerUpSpawnTimer > this.powerUpSpawnInterval) {
      // Random spawn location
      const x = 40 + Math.random() * (this.width - 80);
      this.spawnPowerUp(x, 0);
      this.powerUpSpawnTimer = 0;
      this.powerUpSpawnInterval = 8000 + Math.random() * 4000;
    }

    // Draw and update power-ups
    this.powerUps.forEach(pu => {
      pu.draw();
      pu.update();
    });
    this.powerUps = this.powerUps.filter(pu => !pu.collected);
  }

  spawnPowerUp(x, y) {
    // Randomly select a power-up type
    const typeObj = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    this.powerUps.push(new PowerUp(this, x, y, typeObj));
  }

  restart() {
    this.score = 0;
    this.waveCount = 1;
    this.player.lives = 3;
    this.player.health = this.player.maxHealth;
    this.player.isDead = false;
    this.player.x = this.width / 2 - this.player.width / 2;
    this.player.y = this.height * 0.98 - this.player.height;
    this.gridArray = [new Grid(this)];
    this.projectileArray.forEach(p => p.reset());
    this.enemyProjectileArray.forEach(p => p.reset());
    this.explosionsArray.forEach(e => e.reset());
    this.powerUps = [];
    this.showGameOverScreen = false;
    this.leaderboardHandled = false;
    playBGM();
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
            // Power-up drop chance
            if (Math.random() < 0.25) {
              game.spawnPowerUp(
                invader.x + invader.width / 2,
                invader.y + invader.height / 2
              );
            }
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
    if (game.player.isDead) return false;
    if (
      object.y < game.player.y + game.player.height &&
      object.y + object.height > game.player.y &&
      object.x + object.width > game.player.x &&
      object.x < game.player.x + game.player.width
    ) {
      if (!game.player.shield && !game.player.isDead) {
        game.player.health -= 25;
        if (game.player.health <= 0) {
          game.player.lives--;
          if (game.player.lives > 0) {
            game.player.isDead = true;
            // Immediately respawn after short delay
            setTimeout(() => {
              game.player.isDead = false;
              game.player.health = game.player.maxHealth;
              game.player.x = game.width / 2 - game.player.width / 2;
              game.player.y = game.height * 0.98 - game.player.height;
            }, 600); // 600ms respawn delay
          } else {
            game.showGameOverScreen = true;
          }
        }
      }
      if (object.damage == 1) {
        object.reset();
      }
      return true;
    }
  }
}

// --- POWER-UP SYSTEM ---
const POWERUP_TYPES = [
  {
    type: "rapid_fire",
    color: "#ff0",
    duration: 7000,
    icon: "⚡"
  },
  {
    type: "shield",
    color: "#0ff",
    duration: 7000,
    icon: "🛡️"
  },
  {
    type: "double_score",
    color: "#f0f",
    duration: 7000,
    icon: "✖2"
  },
  {
    type: "health_restore",
    color: "#0f0",
    duration: 0,
    icon: "❤"
  }
];

class PowerUp {
  constructor(game, x, y, typeObj) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.radius = 18;
    this.type = typeObj.type;
    this.color = typeObj.color;
    this.icon = typeObj.icon;
    this.duration = typeObj.duration;
    this.active = false;
    this.collected = false;
    this.timer = 0;
    this.dy = 2 + Math.random();
  }
  draw() {
    if (!this.collected) {
      context.save();
      context.beginPath();
      context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      context.fillStyle = this.color;
      context.globalAlpha = 0.7;
      context.fill();
      context.globalAlpha = 1;
      context.font = "1.2rem bold";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "#222";
      context.fillText(this.icon, this.x, this.y + 2);
      context.restore();
    }
  }
  update() {
    if (!this.collected) {
      this.y += this.dy;
      // Remove if off screen
      if (this.y - this.radius > this.game.height) this.collected = true;
      // Collision with player
      if (
        this.x + this.radius > this.game.player.x &&
        this.x - this.radius < this.game.player.x + this.game.player.width &&
        this.y + this.radius > this.game.player.y &&
        this.y - this.radius < this.game.player.y + this.game.player.height
      ) {
        this.collected = true;
        this.game.player.collectPowerUp(this);
      }
    }
  }
}

// --- AUDIO SYSTEM ---
const bgm = document.getElementById('bgm');
const sfx_shoot = document.getElementById('sfx_shoot');
const sfx_explosion = document.getElementById('sfx_explosion');
const sfx_powerup = document.getElementById('sfx_powerup');
const muteBtn = document.getElementById('muteBtn');
let isMuted = false;

function playSFX(audio) {
  if (!isMuted) {
    audio.currentTime = 0;
    audio.play();
  }
}

function playBGM() {
  if (!isMuted) {
    bgm.volume = 0.5;
    bgm.play();
  }
}

function pauseBGM() {
  bgm.pause();
}

muteBtn.onclick = function () {
  isMuted = !isMuted;
  bgm.muted = isMuted;
  sfx_shoot.muted = isMuted;
  sfx_explosion.muted = isMuted;
  sfx_powerup.muted = isMuted;
  muteBtn.textContent = isMuted ? '🔇' : '🔊';
  if (!isMuted) playBGM();
  else pauseBGM();
};

document.addEventListener('DOMContentLoaded', () => {
  playBGM();
});
// --- END AUDIO SYSTEM ---

// --- LEADERBOARD SYSTEM ---
function getLeaderboard() {
  return JSON.parse(localStorage.getItem('spaceArcadeLeaderboard') || '[]');
}
function saveLeaderboard(lb) {
  localStorage.setItem('spaceArcadeLeaderboard', JSON.stringify(lb));
}
function addHighScore(name, score) {
  let lb = getLeaderboard();
  lb.push({ name, score });
  lb = lb.sort((a, b) => b.score - a.score).slice(0, 5);
  saveLeaderboard(lb);
}
function isHighScore(score) {
  const lb = getLeaderboard();
  return lb.length < 5 || score > lb[lb.length - 1].score;
}

// Add leaderboard button
if (!document.getElementById('leaderboardBtn')) {
  const btn = document.createElement('button');
  btn.id = 'leaderboardBtn';
  btn.textContent = '🏆';
  btn.style.position = 'fixed';
  btn.style.top = '10px';
  btn.style.right = '50px';
  btn.style.zIndex = 10;
  btn.style.fontSize = '1.2rem';
  document.body.appendChild(btn);
}
let showLeaderboard = false;
document.getElementById('leaderboardBtn').onclick = () => {
  showLeaderboard = !showLeaderboard;
};

// --- END LEADERBOARD SYSTEM ---

// Draw leaderboard overlay function:
function drawLeaderboardOverlay() {
  const lb = getLeaderboard();
  context.save();
  context.globalAlpha = 0.92;
  context.fillStyle = '#111';
  context.fillRect(canvas.width/2-180, canvas.height/2-140, 360, 260);
  context.globalAlpha = 1;
  context.fillStyle = '#fff';
  context.font = '2rem impact';
  context.textAlign = 'center';
  context.fillText('LEADERBOARD', canvas.width/2, canvas.height/2-100);
  context.font = '1.3rem monospace';
  lb.forEach((entry, i) => {
    context.fillStyle = i === 0 ? '#ffd700' : '#fff';
    context.fillText(
      `${i+1}. ${entry.name.padEnd(10)}  ${entry.score}`,
      canvas.width/2,
      canvas.height/2-50 + i*35
    );
  });
  if (lb.length === 0) {
    context.fillStyle = '#fff';
    context.font = '1.1rem monospace';
    context.fillText('No high scores yet!', canvas.width/2, canvas.height/2-10);
  }
  context.font = '1rem monospace';
  context.fillStyle = '#aaa';
  context.fillText('Press Ctrl+R to close', canvas.width/2, canvas.height/2+110);
  context.restore();
}
