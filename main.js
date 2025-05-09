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
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
    this.invulnerabilityDuration = 1000; // 1 second of invulnerability after taking damage
    this.hitEffectTimer = 0;
    this.hitEffectDuration = 100; // Duration of the hit effect
  }

  draw(deltaTime) {
    /* The laser beam energy level bar */
    let currentEnergy = Math.floor(this.maxEnergy - this.energyUsed);

    /* Energy text - moved above the bar */
    context.save();
    context.fillStyle = "white";
    context.font = "1rem sans-serif";
    context.fillText(`Energy: ${Math.ceil(currentEnergy)}`, 15, 60);
    context.restore();

    /* The laser beam energy level bar outline */
    context.save();
    context.beginPath();
    context.lineWidth = 2;
    context.strokeStyle = "gold";
    context.strokeRect(9, 69, this.maxEnergy + 2, 22);
    context.restore();

    /* The laser beam energy level */
    context.save();
    context.beginPath();
    // Color changes based on energy level
    let r = this.energyUsed;
    let g = currentEnergy;
    let b = 0;
    context.fillStyle = `rgb(${r},${g},${b})`;
    context.fillRect(10, 70, currentEnergy, 20);
    context.fill();
    context.restore();

    /* Health bar - moved to top right */
    const healthBarWidth = 200;
    const healthBarX = this.game.width - healthBarWidth - 20;
    const healthBarY = 40;

    /* Draw heart icon */
    context.save();
    context.fillStyle = "red";
    context.beginPath();
    const heartX = healthBarX - 30;
    const heartY = healthBarY;
    const heartSize = 20;
    
    // Draw heart shape
    context.moveTo(heartX + heartSize/2, heartY + heartSize/4);
    context.bezierCurveTo(
      heartX + heartSize/2, heartY, 
      heartX, heartY, 
      heartX, heartY + heartSize/4
    );
    context.bezierCurveTo(
      heartX, heartY + heartSize/2, 
      heartX + heartSize/2, heartY + heartSize, 
      heartX + heartSize/2, heartY + heartSize
    );
    context.bezierCurveTo(
      heartX + heartSize/2, heartY + heartSize, 
      heartX + heartSize, heartY + heartSize/2, 
      heartX + heartSize, heartY + heartSize/4
    );
    context.bezierCurveTo(
      heartX + heartSize, heartY, 
      heartX + heartSize/2, heartY, 
      heartX + heartSize/2, heartY + heartSize/4
    );
    context.fill();
    context.restore();

    /* Health text - moved above the bar */
    context.save();
    context.fillStyle = "white";
    context.font = "bold 1rem sans-serif";
    context.textAlign = "right";
    context.fillText(`Health: ${Math.ceil(this.health)}`, healthBarX + healthBarWidth, healthBarY - 5);
    context.restore();

    /* Health bar background */
    context.save();
    context.fillStyle = "rgba(0, 0, 0, 0.5)";
    context.fillRect(healthBarX - 1, healthBarY - 1, healthBarWidth + 2, 22);
    context.restore();

    /* Health bar outline */
    context.save();
    context.beginPath();
    context.lineWidth = 2;
    context.strokeStyle = "#7b00ff"; // Changed to match sound toggle button
    context.strokeRect(healthBarX - 1, healthBarY - 1, healthBarWidth + 2, 22);
    context.restore();

    /* Health bar fill */
    context.save();
    context.beginPath();
    // Color changes based on health percentage
    const healthPercent = this.health / this.maxHealth;
    let healthColor;
    if (healthPercent > 0.6) {
      healthColor = "#00ff00"; // Green for high health
    } else if (healthPercent > 0.3) {
      healthColor = "#ffff00"; // Yellow for medium health
    } else {
      healthColor = "#ff0000"; // Red for low health
    }
    context.fillStyle = healthColor;
    context.fillRect(healthBarX, healthBarY, (this.health / this.maxHealth) * healthBarWidth, 20);
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

    // Drawing the player object with hit effect
    context.save();
    if (this.hitEffectTimer > 0) {
      context.globalAlpha = 0.5;
      context.filter = "brightness(200%)";
    }
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
    context.restore();
  }

  shoot() {
    const projectile = this.game.getProjectiles();
    if (projectile) {
      projectile.start(this.x + this.width / 2, this.y);
    }
  }

  takeDamage(amount) {
    if (!this.isInvulnerable) {
      this.health -= amount;
      this.isInvulnerable = true;
      this.invulnerabilityTimer = 0;
      this.hitEffectTimer = this.hitEffectDuration;

      // Create hit effect particles
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i) / 5;
        const speed = 2;
        const particle = {
          x: this.x + this.width / 2,
          y: this.y + this.height / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 20
        };
        this.game.hitParticles.push(particle);
      }

      if (this.health <= 0) {
        this.health = 0;
        this.game.gameOver = true;
        this.game.playSound("explosion");
      }
    }
  }

  update(deltaTime) {
    if (this.isInvulnerable) {
      this.invulnerabilityTimer += deltaTime;
      if (this.invulnerabilityTimer >= this.invulnerabilityDuration) {
        this.isInvulnerable = false;
      }
    }

    if (this.hitEffectTimer > 0) {
      this.hitEffectTimer -= deltaTime;
    }

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
    this.healthBarVisible = false;
    this.healthBarTimer = 0;
    this.healthBarDuration = 1000; // 1 second visibility
    this.hitEffectTimer = 0;
    this.hitEffectDuration = 100; // Duration of the hit effect
    this.hitParticles = [];
  }

  draw() {
    context.save();
    // Apply hit effect if active
    if (this.hitEffectTimer > 0) {
      context.globalAlpha = 0.7;
      context.filter = "brightness(200%)";
    }
    
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
    context.restore();

    // Draw hit particles
    this.hitParticles.forEach((particle, index) => {
      context.save();
      context.fillStyle = "rgba(255, 255, 255, 0.8)";
      context.beginPath();
      context.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      context.fill();
      context.restore();

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;

      if (particle.life <= 0) {
        this.hitParticles.splice(index, 1);
      }
    });

    // Draw health bar for all invaders only when visible
    if (this.lives !== undefined && this.healthBarVisible) {
      const healthBarWidth = 60;
      const healthBarX = this.x + (this.width - healthBarWidth) / 2;
      const healthBarY = this.y - 10;

      // Health bar background
      context.save();
      context.fillStyle = "rgba(0, 0, 0, 0.5)";
      context.fillRect(healthBarX - 1, healthBarY - 1, healthBarWidth + 2, 8);
      context.restore();

      // Health bar outline
      context.save();
      context.strokeStyle = "white";
      context.lineWidth = 1;
      context.strokeRect(healthBarX - 1, healthBarY - 1, healthBarWidth + 2, 8);
      context.restore();

      // Health bar fill
      context.save();
      context.fillStyle = "red";
      context.fillRect(healthBarX, healthBarY, (this.lives / this.maxLives) * healthBarWidth, 6);
      context.restore();
    }
  }

  update(dx, dy, deltaTime) {
    if (this.y < this.pseudoy) this.y += 0.5; // Provides the drive in look.
    this.x += dx;
    this.y += dy;

    // Update hit effect timer
    if (this.hitEffectTimer > 0) {
      this.hitEffectTimer -= deltaTime;
    }

    // Update health bar visibility timer
    if (this.healthBarVisible) {
      this.healthBarTimer += deltaTime;
      if (this.healthBarTimer >= this.healthBarDuration) {
        this.healthBarVisible = false;
        this.healthBarTimer = 0;
      }
    }

    this.draw();
  }

  showHealthBar() {
    this.healthBarVisible = true;
    this.healthBarTimer = 0;
    this.hitEffectTimer = this.hitEffectDuration;
    
    // Create hit effect particles
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 2;
      const particle = {
        x: this.x + this.width / 2,
        y: this.y + this.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 20
      };
      this.hitParticles.push(particle);
    }
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
    
    // Boss health bar
    const healthBarWidth = 150;
    const healthBarX = this.x + (this.width - healthBarWidth) / 2;
    const healthBarY = this.y - 20;

    // Health bar background
    context.save();
    context.fillStyle = "rgba(0, 0, 0, 0.5)";
    context.fillRect(healthBarX - 1, healthBarY - 1, healthBarWidth + 2, 12);
    context.restore();

    // Health bar outline
    context.save();
    context.strokeStyle = "white";
    context.lineWidth = 1;
    context.strokeRect(healthBarX - 1, healthBarY - 1, healthBarWidth + 2, 12);
    context.restore();

    // Health bar fill
    context.save();
    context.fillStyle = "red";
    context.fillRect(healthBarX, healthBarY, (this.lives / this.maxLives) * healthBarWidth, 10);
    context.restore();

    // Health text
    context.save();
    context.fillStyle = "white";
    context.font = "1rem sans-serif";
    context.textAlign = "center";
    context.fillText(`${Math.round(this.lives)}`, this.x + this.width / 2, healthBarY + 8);
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
      this.game.playSound("explosion");
    } else if (invader.type == "beetlemorph") {
      this.frameY = 1;
      this.game.playSound("explosion");
    } else {
      // for the boss
      this.frameY = 2;
      this.game.playSound("explosion");
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

    /* Sound system */
    this.sounds = {
      shoot: document.querySelector("#shootSound"),
      explosion: document.querySelector("#explosionSound"),
      enemyDeath: document.querySelector("#enemyDeathSound"),
      playerHit: document.querySelector("#playerHitSound")
    };
    this.soundEnabled = true;
    this.setupSoundToggle();

    // Preload all sounds
    Object.values(this.sounds).forEach(sound => {
      sound.load();
    });

    this.keys = [];
    this.player = new Player(this);
    this.gameOver = false;
    this.hitParticles = [];

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
        this.keys.push(e.key);
      }
      if (e.key === " ") {
        this.player.shoot();
        this.playSound("shoot");
      }
      if (e.key === "r" && this.gameOver) {
        this.reset();
      }
    });
    window.addEventListener("keyup", (e) => {
      if (this.keys.indexOf(e.key) > -1)
        this.keys.splice(this.keys.indexOf(e.key), 1);
    });
  }

  setupSoundToggle() {
    const soundToggle = document.querySelector("#soundToggle");
    const icon = soundToggle.querySelector(".icon");
    const text = soundToggle.querySelector(".text");
    
    soundToggle.addEventListener("click", () => {
      this.soundEnabled = !this.soundEnabled;
      icon.textContent = this.soundEnabled ? "🔊" : "🔇";
      text.textContent = this.soundEnabled ? "Sound On" : "Sound Off";
      
      // Play a test sound when toggling
      if (this.soundEnabled) {
        this.playSound("shoot");
      }
    });
  }

  playSound(soundName) {
    if (this.soundEnabled && this.sounds[soundName]) {
      try {
        // Create a new instance of the audio to allow overlapping sounds
        const sound = this.sounds[soundName].cloneNode();
        // Adjust volume based on sound type
        if (soundName === "shoot") {
          sound.volume = 0.3; // Lower volume for bullet sound
        } else if (soundName === "explosion") {
          sound.volume = 0.4; // Slightly lower volume for explosion sound
        } else {
          sound.volume = 0.5; // Default volume for other sounds
        }
        sound.play().catch(error => {
          console.log("Error playing sound:", error);
        });
      } catch (error) {
        console.log("Error with sound:", error);
      }
    }
  }

  reset() {
    this.gameOver = false;
    this.score = 0;
    this.waveCount = 1;
    this.player.health = this.player.maxHealth;
    this.gridArray = [new Grid(this)];
    this.hitParticles = [];
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
    context.font = "1.5rem sans-serif";
    context.fillText(`SCORE:  ${this.score}`, 10, 32);
    context.restore();

    // Draw hit particles
    this.hitParticles.forEach((particle, index) => {
      context.save();
      context.fillStyle = "rgba(255, 255, 255, 0.8)";
      context.beginPath();
      context.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
      context.fill();
      context.restore();

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;

      if (particle.life <= 0) {
        this.hitParticles.splice(index, 1);
      }
    });

    if (this.gameOver) {
      context.save();
      context.fillStyle = "rgba(0, 0, 0, 0.75)";
      context.fillRect(0, 0, this.width, this.height);
      context.fillStyle = "white";
      context.font = "3rem sans-serif";
      context.textAlign = "center";
      context.fillText("GAME OVER", this.width / 2, this.height / 2);
      context.font = "1.5rem sans-serif";
      context.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 50);
      context.fillText("Press R to restart", this.width / 2, this.height / 2 + 100);
      context.restore();
    }
  }

  render(deltaTime) {
    if (!this.gameOver) {
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
    } else {
      this.draw();
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
            game.playSound("enemyDeath");
          } else {
            if (object.animationTimer % object.animationInterval == 0) {
              invader.lives -= object.damage;
              invader.showHealthBar();
              object.animationTimer = 0;
              // Play explosion sound for hits
              game.playSound("explosion");
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
        game.player.takeDamage(5);
        game.playSound("playerHit");
      }
      return true;
    }
  }
}
