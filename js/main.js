const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1200 }, // 增强重力，使跳跃不再轻飘飘，更具真实感
            debug: false
        }
    },
    scene: [MenuScene, ForestLevel, ScoreScene, DesertLevel, OceanLevel]
};

const game = new Phaser.Game(config);
