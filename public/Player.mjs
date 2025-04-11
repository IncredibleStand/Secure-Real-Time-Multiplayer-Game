class Player {
  constructor({ id, x = 10, y = 10, score = 0, rank = null }) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.score = score;
    this.rank = rank;
    this.width = 30;  // Width of player avatar
    this.height = 30; // Height of player avatar
  }

  /**
   * Move player based on direction and amount
   * @param {string} direction - 'up', 'down', 'left', or 'right'
   * @param {number} amount - Number of pixels to move
   */
  movePlayer(direction, amount) {
    const canvasWidth = 640;
    const canvasHeight = 480;
    
    switch (direction) {
      case 'up':
        this.y = Math.max(0, this.y - amount);
        break;
      case 'down':
        this.y = Math.min(canvasHeight - this.height, this.y + amount);
        break;
      case 'left':
        this.x = Math.max(0, this.x - amount);
        break;
      case 'right':
        this.x = Math.min(canvasWidth - this.width, this.x + amount);
        break;
      default:
        break;
    }
  }

  /**
   * Check collision with collectible
   * @param {Object} collectible - Collectible object
   * @returns {boolean} - True if collision detected
   */
  collision(collectible) {
    // Check if player rectangle intersects with collectible rectangle
    return (
      this.x < collectible.x + collectible.width &&
      this.x + this.width > collectible.x &&
      this.y < collectible.y + collectible.height &&
      this.y + this.height > collectible.y
    );
  }

  /**
   * Calculate player rank based on scores
   * @param {Array} players - Array of all player objects
   * @returns {string} - Rank string in format "Rank: currentRank/totalPlayers"
   */
  calculateRank(players) {
    // Sort players by score in descending order
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    
    // Find current player's position
    const currentRank = sortedPlayers.findIndex(player => player.id === this.id) + 1;
    
    return `Rank: ${currentRank}/${players.length}`;
  }
}

// Export the Player class
export { Player };