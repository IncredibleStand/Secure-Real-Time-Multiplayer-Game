class Collectible {
  constructor({ id, x = 0, y = 0, value = 1 }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.value = value;
    this.width = 10;
    this.height = 10;
  }
}

export { Collectible };