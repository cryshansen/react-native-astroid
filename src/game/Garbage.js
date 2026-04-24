let _id = 0;

export class Garbage {
  constructor({ x, y, speed, heading, screenWidth, screenHeight }) {
    this.id = `garbage_${++_id}`;
    this.x = x;
    this.y = y;
    this.speed = speed * 1.5;
    this.heading = heading;
    this.radius = 3;
    this.life = 1.0; // fades out over 1 second
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
  }
}
