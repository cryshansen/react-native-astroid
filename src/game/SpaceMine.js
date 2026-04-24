let _id = 0;

const MINE_RADIUS = 13;

export class SpaceMine {
  constructor({ screenWidth, screenHeight }) {
    this.id = `mine_${++_id}`;
    this.x = Math.random() * screenWidth;
    this.y = Math.random() * screenHeight;
    this.radius = MINE_RADIUS;
    this.size = MINE_RADIUS * 2;
    this.destroyed = false;
    this.value = 10;
  }

  collidesWith(cx, cy, cr) {
    const dx = this.x - cx;
    const dy = this.y - cy;
    return dx * dx + dy * dy < (this.radius + cr) * (this.radius + cr);
  }
}
