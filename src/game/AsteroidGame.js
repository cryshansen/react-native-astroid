import { Asteroid } from './Asteroid';
import { Ship } from './Ship';
import { Missile } from './Missile';
import { EnemyShip } from './EnemyShip';
import { SpaceMine } from './SpaceMine';
import { Garbage } from './Garbage';

const INITIAL_ASTEROIDS = 5;
const INITIAL_LIVES = 3;
const MAX_MISSILES = 5;
const ENEMY_SPAWN_TIME = 30; // seconds after level start

export class AsteroidGame {
  constructor(screenWidth, screenHeight) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this._reset();
  }

  _reset() {
    const { screenWidth, screenHeight } = this;
    this.score = 0;
    this.lives = INITIAL_LIVES;
    this.level = 1;
    this.time = 0;
    this.gameOver = false;
    this.gameStarted = false;
    this.enemySpawned = false;

    this.ship = new Ship({ screenWidth, screenHeight });
    this.asteroids = [];
    this.missiles = [];
    this.enemyShips = [];
    this.spaceMines = [];
    this.garbage = [];

    this._spawnAsteroids(INITIAL_ASTEROIDS);
    this._spawnMines(2);
  }

  _spawnAsteroids(count) {
    const { screenWidth, screenHeight } = this;
    const cx = screenWidth / 2;
    const cy = screenHeight / 2;
    for (let i = 0; i < count; i++) {
      let x, y;
      // Keep asteroids away from screen center on spawn
      do {
        x = Math.random() * screenWidth;
        y = Math.random() * screenHeight;
      } while ((x - cx) ** 2 + (y - cy) ** 2 < 110 ** 2);
      this.asteroids.push(new Asteroid({ x, y, screenWidth, screenHeight }));
    }
  }

  _spawnMines(count) {
    const { screenWidth, screenHeight } = this;
    for (let i = 0; i < count; i++) {
      this.spaceMines.push(new SpaceMine({ screenWidth, screenHeight }));
    }
  }

  _nextLevel() {
    this.level++;
    this.time = 0;
    this.enemySpawned = false;
    this._spawnAsteroids(INITIAL_ASTEROIDS + this.level);
    this._spawnMines(this.level);
  }

  fireMissile() {
    if (!this.ship || this.ship.destroyed) return;
    if (this.missiles.length >= MAX_MISSILES) return;
    const tip = this.ship.getTip();
    this.missiles.push(new Missile({
      x: tip.x,
      y: tip.y,
      heading: this.ship.heading,
      shipSpeed: this.ship.getSpeed(),
      screenWidth: this.screenWidth,
      screenHeight: this.screenHeight,
    }));
  }

  hyperJump() {
    if (!this.ship || this.ship.destroyed) return;
    this.ship.x = Math.random() * this.screenWidth;
    this.ship.y = Math.random() * this.screenHeight;
    this.ship.vx = 0;
    this.ship.vy = 0;
    this.ship.invincible = true;
    this.ship.invincibleTimer = 2.0;
  }

  start() {
    this.gameStarted = true;
  }

  reset() {
    this._reset();
  }

  update(dt, controls) {
    if (!this.gameStarted || this.gameOver) return;

    this.time += dt;

    // Ship
    if (this.ship && !this.ship.destroyed) {
      this.ship.update(dt, controls);
    }

    // Asteroids
    for (const a of this.asteroids) a.update(dt);

    // Missiles
    for (const m of this.missiles) m.update(dt);

    // Enemy ships
    const px = this.ship ? this.ship.x : this.screenWidth / 2;
    const py = this.ship ? this.ship.y : this.screenHeight / 2;
    for (const e of this.enemyShips) e.update(dt, px, py);

    // Garbage
    for (const g of this.garbage) g.update(dt);

    // Spawn enemy ship
    if (!this.enemySpawned && this.time >= ENEMY_SPAWN_TIME) {
      this.enemySpawned = true;
      this.enemyShips.push(new EnemyShip({
        screenWidth: this.screenWidth,
        screenHeight: this.screenHeight,
      }));
    }

    // --- Collision: missiles vs asteroids ---
    for (const missile of this.missiles) {
      if (missile.destroyed) continue;
      for (const asteroid of this.asteroids) {
        if (asteroid.destroyed) continue;
        if (asteroid.collidesWith(missile.x, missile.y, missile.radius)) {
          missile.destroyed = true;
          asteroid.destroyed = true;
          this.score += asteroid.value;
          this._spawnDebris(asteroid);
          this._splitAsteroid(asteroid);
          break;
        }
      }
    }

    // --- Collision: missiles vs enemy ships ---
    for (const missile of this.missiles) {
      if (missile.destroyed) continue;
      for (const enemy of this.enemyShips) {
        if (enemy.destroyed) continue;
        if (enemy.collidesWith(missile.x, missile.y, missile.radius)) {
          missile.destroyed = true;
          enemy.destroyed = true;
          this.score += 100;
          break;
        }
      }
    }

    // --- Collision: ship vs asteroids ---
    if (this.ship && !this.ship.destroyed && !this.ship.invincible) {
      for (const asteroid of this.asteroids) {
        if (asteroid.destroyed) continue;
        if (asteroid.collidesWith(this.ship.x, this.ship.y, this.ship.radius)) {
          this._shipDestroyed();
          asteroid.destroyed = true;
          this._spawnDebris(asteroid);
          break;
        }
      }
    }

    // --- Collision: ship vs enemy ships ---
    if (this.ship && !this.ship.destroyed && !this.ship.invincible) {
      for (const enemy of this.enemyShips) {
        if (enemy.destroyed) continue;
        if (enemy.collidesWith(this.ship.x, this.ship.y, this.ship.radius)) {
          this._shipDestroyed();
          enemy.destroyed = true;
          break;
        }
      }
    }

    // --- Collision: ship vs space mines ---
    if (this.ship && !this.ship.destroyed && !this.ship.invincible) {
      for (const mine of this.spaceMines) {
        if (mine.destroyed) continue;
        if (mine.collidesWith(this.ship.x, this.ship.y, this.ship.radius)) {
          this._shipDestroyed();
          mine.destroyed = true;
          this.score = Math.max(0, this.score - 25);
          break;
        }
      }
    }

    // Purge destroyed objects
    this.asteroids = this.asteroids.filter(a => !a.destroyed);
    this.missiles = this.missiles.filter(m => !m.destroyed);
    this.enemyShips = this.enemyShips.filter(e => !e.destroyed);
    this.spaceMines = this.spaceMines.filter(s => !s.destroyed);
    this.garbage = this.garbage.filter(g => !g.destroyed);

    // Level complete when all asteroids and enemies are gone
    if (this.asteroids.length === 0 && this.enemyShips.length === 0) {
      this._nextLevel();
    }
  }

  _spawnDebris(asteroid) {
    for (let i = 0; i < 4; i++) {
      this.garbage.push(new Garbage({
        x: asteroid.x,
        y: asteroid.y,
        speed: asteroid.speed * 1.5,
        heading: Math.random() * 360,
        screenWidth: this.screenWidth,
        screenHeight: this.screenHeight,
      }));
    }
  }

  _splitAsteroid(asteroid) {
    if (asteroid.radius < 15) return; // too small to split further
    const newRadius = Math.round(asteroid.radius / 2);
    for (let i = 0; i < 2; i++) {
      const offsetAngle = i === 0 ? 50 : -50;
      this.asteroids.push(new Asteroid({
        x: asteroid.x,
        y: asteroid.y,
        radius: newRadius,
        speed: asteroid.speed * 1.4,
        heading: (asteroid.heading + offsetAngle + 360) % 360,
        screenWidth: this.screenWidth,
        screenHeight: this.screenHeight,
      }));
    }
  }

  _shipDestroyed() {
    this.lives--;
    this.score = Math.max(0, this.score - 25);
    if (this.lives <= 0) {
      this.gameOver = true;
      this.ship = null;
    } else {
      // Respawn at center with brief invincibility
      this.ship.x = this.screenWidth / 2;
      this.ship.y = this.screenHeight / 2;
      this.ship.vx = 0;
      this.ship.vy = 0;
      this.ship.invincible = true;
      this.ship.invincibleTimer = 3.0;
    }
  }

  getSnapshot() {
    return {
      score: this.score,
      lives: this.lives,
      level: this.level,
      time: Math.floor(this.time),
      gameOver: this.gameOver,
      gameStarted: this.gameStarted,
      ship: this.ship,
      asteroids: this.asteroids,
      missiles: this.missiles,
      enemyShips: this.enemyShips,
      spaceMines: this.spaceMines,
      garbage: this.garbage,
    };
  }
}
