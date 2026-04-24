const MAX_SPEED = 200;       // px/s
const ACCELERATION = 120;   // px/s²
const DRAG = 25;             // px/s² passive deceleration
const ROTATION_SPEED = 200; // deg/s
export const SHIP_RADIUS = 12;

export class Ship {
  constructor({ screenWidth, screenHeight }) {
    this.id = 'player_ship';
    this.x = screenWidth / 2;
    this.y = screenHeight / 2;
    this.heading = 0; // 0 = facing up/north
    this.vx = 0;
    this.vy = 0;
    this.radius = SHIP_RADIUS;
    this.destroyed = false;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  update(dt, controls) {
    if (controls.left) {
      this.heading = (this.heading - ROTATION_SPEED * dt + 360) % 360;
    }
    if (controls.right) {
      this.heading = (this.heading + ROTATION_SPEED * dt) % 360;
    }
    if (controls.up) {
      const rad = (this.heading * Math.PI) / 180;
      this.vx += Math.sin(rad) * ACCELERATION * dt;
      this.vy -= Math.cos(rad) * ACCELERATION * dt;
    }
    if (controls.down) {
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > 0) {
        const factor = Math.max(0, 1 - (ACCELERATION * 2 * dt) / speed);
        this.vx *= factor;
        this.vy *= factor;
      }
    }

    // Passive drag (only when not thrusting)
    if (!controls.up) {
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > 0) {
        const factor = Math.max(0, 1 - (DRAG * dt) / speed);
        this.vx *= factor;
        this.vy *= factor;
      }
    }

    // Cap speed
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > MAX_SPEED) {
      this.vx = (this.vx / speed) * MAX_SPEED;
      this.vy = (this.vy / speed) * MAX_SPEED;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Wrap
    if (this.x < 0) this.x = this.screenWidth;
    else if (this.x > this.screenWidth) this.x = 0;
    if (this.y < 0) this.y = this.screenHeight;
    else if (this.y > this.screenHeight) this.y = 0;

    if (this.invincible) {
      this.invincibleTimer -= dt;
      if (this.invincibleTimer <= 0) this.invincible = false;
    }
  }

  getSpeed() {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }

  // Nose tip for missile spawn point
  getTip() {
    const rad = (this.heading * Math.PI) / 180;
    return {
      x: this.x + Math.sin(rad) * (this.radius + 6),
      y: this.y - Math.cos(rad) * (this.radius + 6),
    };
  }
}
