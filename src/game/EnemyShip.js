let _id = 0;

export class EnemyShip {
  constructor({ screenWidth, screenHeight }) {
    this.id = `enemy_${++_id}`;
    // Spawn on a random edge so it enters from outside
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) { this.x = 0; this.y = Math.random() * screenHeight; }
    else if (edge === 1) { this.x = screenWidth; this.y = Math.random() * screenHeight; }
    else if (edge === 2) { this.x = Math.random() * screenWidth; this.y = 0; }
    else { this.x = Math.random() * screenWidth; this.y = screenHeight; }

    this.heading = Math.random() * 360;
    this.speed = 80; // px/s
    this.radius = 15;
    this.destroyed = false;
    this.aimTimer = 0;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  update(dt, playerX, playerY) {
    // Re-aim at player every 2 seconds
    this.aimTimer += dt;
    if (this.aimTimer >= 2) {
      this.aimTimer = 0;
      const dx = playerX - this.x;
      const dy = playerY - this.y;
      const target = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
      const diff = ((target - this.heading + 540) % 360) - 180;
      this.heading = (this.heading + diff * 0.6 + 360) % 360;
    }

    const rad = (this.heading * Math.PI) / 180;
    this.x += Math.sin(rad) * this.speed * dt;
    this.y -= Math.cos(rad) * this.speed * dt;

    const r = this.radius;
    if (this.x < -r) this.x = this.screenWidth + r;
    else if (this.x > this.screenWidth + r) this.x = -r;
    if (this.y < -r) this.y = this.screenHeight + r;
    else if (this.y > this.screenHeight + r) this.y = -r;
  }

  collidesWith(cx, cy, cr) {
    const dx = this.x - cx;
    const dy = this.y - cy;
    return dx * dx + dy * dy < (this.radius + cr) * (this.radius + cr);
  }
}
