let _id = 0;

const MISSILE_SPEED = 280; // px/s
const MISSILE_LIFETIME = 2.0; // seconds

export class Missile {
  constructor({ x, y, heading, shipSpeed, screenWidth, screenHeight }) {
    this.id = `missile_${++_id}`;
    this.x = x;
    this.y = y;
    this.heading = heading;
    this.radius = 4;
    this.speed = Math.max(MISSILE_SPEED, Math.abs(shipSpeed) + MISSILE_SPEED);
    this.life = MISSILE_LIFETIME;
    this.destroyed = false;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  update(dt) {
    const rad = (this.heading * Math.PI) / 180;
    this.x += Math.sin(rad) * this.speed * dt;
    this.y -= Math.cos(rad) * this.speed * dt;
    this.life -= dt;
    if (this.life <= 0) this.destroyed = true;

    if (this.x < 0) this.x = this.screenWidth;
    else if (this.x > this.screenWidth) this.x = 0;
    if (this.y < 0) this.y = this.screenHeight;
    else if (this.y > this.screenHeight) this.y = 0;
  }
}
