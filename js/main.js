const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 1200 }, debug: false }
    },
    scene: [
        BootScene,
        PlatformSelectScene,
        MenuScene,
        ForestLevel,
        DesertLevel,
        OceanLevel,
        BossScene,
        ScoreScene,
    ]
};

const game = new Phaser.Game(config);
