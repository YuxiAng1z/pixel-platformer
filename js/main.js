const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600,
    },
    input: {
        activePointers: 3, // support simultaneous joystick + jump on mobile
    },
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
