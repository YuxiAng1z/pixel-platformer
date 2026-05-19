class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {
        const W = 400, H = 30, x = 200, y = 300;
        this.cameras.main.setBackgroundColor('#111');
        this.add.text(400, 250, i18n.t('loading'), {
            fontSize: '28px', fill: '#fff', fontStyle: 'bold'
        }).setOrigin(0.5);

        const bar = this.add.graphics();
        this.load.on('progress', v => {
            bar.clear();
            bar.fillStyle(0x333333); bar.fillRect(x, y, W, H);
            bar.fillStyle(0x00e5ff); bar.fillRect(x, y, W * v, H);
        });

        this.load.image('player',        'assets/sprites/player.png');
        this.load.image('enemy_forest',  'assets/sprites/enemy_forest.png');
        this.load.image('enemy_desert',  'assets/sprites/enemy_desert.png');
        this.load.image('enemy_ocean',   'assets/sprites/enemy_ocean.png');
        this.load.image('boss_ocean',    'assets/sprites/boss_ocean.png');
        this.load.image('coin',          'assets/sprites/coin.png');
    }

    create() {
        audioManager.init();
        // Check if platform already chosen
        const platform = localStorage.getItem('pixel_platform');
        if (platform) {
            this.registry.set('platform', platform);
            this.scene.start('MenuScene');
        } else {
            this.scene.start('PlatformSelectScene');
        }
    }
}
window.BootScene = BootScene;
