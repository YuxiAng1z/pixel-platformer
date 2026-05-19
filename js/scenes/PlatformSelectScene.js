class PlatformSelectScene extends Phaser.Scene {
    constructor() { super({ key: 'PlatformSelectScene' }); }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a2e');
        // Stars bg
        for (let i = 0; i < 80; i++) {
            const s = this.add.circle(Phaser.Math.Between(0,800), Phaser.Math.Between(0,600),
                Phaser.Math.Between(1,3), 0xffffff, Phaser.Math.FloatBetween(0.3,1));
            this.tweens.add({ targets: s, alpha: 0.1, duration: Phaser.Math.Between(800,2000), yoyo: true, repeat: -1 });
        }

        this.add.text(400, 160, i18n.t('platform_title'), {
            fontSize: '36px', fill: '#ffffff', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);

        this._makeCard(200, 320, 'platform_pc',   'platform_pc_desc',   'pc');
        this._makeCard(600, 320, 'platform_mobile','platform_mobile_desc','mobile');
    }

    _makeCard(x, y, titleKey, descKey, value) {
        const bg = this.add.rectangle(x, y, 240, 200, 0x16213e).setInteractive();
        bg.setStrokeStyle(3, 0x00e5ff);
        this.add.text(x, y - 40, i18n.t(titleKey), {
            fontSize: '26px', fill: '#00e5ff', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.add.text(x, y + 10, i18n.t(descKey), {
            fontSize: '16px', fill: '#aaaaaa', wordWrap: { width: 200 }, align: 'center'
        }).setOrigin(0.5);

        bg.on('pointerover', () => { bg.setStrokeStyle(4, 0xffffff); this.tweens.add({ targets: bg, scaleX:1.05, scaleY:1.05, duration:100 }); });
        bg.on('pointerout',  () => { bg.setStrokeStyle(3, 0x00e5ff); this.tweens.add({ targets: bg, scaleX:1, scaleY:1, duration:100 }); });
        bg.on('pointerdown', () => {
            localStorage.setItem('pixel_platform', value);
            this.registry.set('platform', value);
            this.scene.start('MenuScene');
        });
    }
}
window.PlatformSelectScene = PlatformSelectScene;
