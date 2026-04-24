let _id = 0;

export class Asteroid {
  constructor({ x, y, radius, speed, heading, screenWidth, screenHeight }) {
    this.id = `asteroid_${++_id}`;
    this.radius = radius ?? 25; // 50 px diameter — typical draggable-item size
    this.x = x ?? Math.random() * screenWidth;
    this.y = y ?? Math.random() * screenHeight;
    this.speed = speed ?? (Math.random() * 70 + 30); // 30–100 px/s
    this.heading = heading ?? Math.random() * 360; // degrees, 0 = north
    this.rotation = 0;
    this.rotationSpeed = (Math.random() < 0.5 ? 1 : -1) * (Math.random() * 90 + 30);
    this.destroyed = false;
    this.value = Math.round(this.radius * 2); // larger = more points
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  update(dt) {
    const rad = (this.heading * Math.PI) / 180;
    this.x += Math.sin(rad) * this.speed * dt;
    this.y -= Math.cos(rad) * this.speed * dt; // y decreases = up
    this.rotation = (this.rotation + this.rotationSpeed * dt) % 360;

    // Wrap around screen edges
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
