class BootScene extends Phaser.Scene {
    constructor() { super({ key: 'BootScene' }); }

    preload() {}

    create() {
        audioManager.init();
        this._generateTextures();

        const platform = localStorage.getItem('pixel_platform');
        if (platform) {
            this.registry.set('platform', platform);
            this.scene.start('MenuScene');
        } else {
            this.scene.start('PlatformSelectScene');
        }
    }

    _generateTextures() {
        const g = this.add.graphics();

        // ── Player (红帽蓝身) ──
        g.clear();
        g.fillStyle(0xcc0000); g.fillRect(2, 0, 28, 10);   // 帽子
        g.fillStyle(0xff0000); g.fillRect(0, 4, 32, 8);
        g.fillStyle(0xffcc99); g.fillRect(4, 10, 24, 12);  // 脸
        g.fillStyle(0x000000); g.fillRect(8, 14, 4, 4); g.fillRect(20, 14, 4, 4); // 眼
        g.fillStyle(0xffffff); g.fillRect(10,14,2,2); g.fillRect(22,14,2,2);      // 眼白
        g.fillStyle(0x0044cc); g.fillRect(0, 22, 32, 10);  // 身体
        g.fillStyle(0xffcc99); g.fillRect(0, 22, 6, 8); g.fillRect(26, 22, 6, 8);// 手
        g.fillStyle(0x8B4513); g.fillRect(4, 28, 10, 4); g.fillRect(18, 28, 10, 4); // 鞋
        g.generateTexture('player', 32, 32);

        // ── 森林怪（紫色尖刺） ──
        g.clear();
        g.fillStyle(0x800080); g.fillRect(0, 12, 32, 20);
        g.fillStyle(0x4b0082);
        g.fillTriangle(0,12,8,0,16,12);
        g.fillTriangle(16,12,24,0,32,12);
        g.fillStyle(0xffffff); g.fillRect(6,17,7,7); g.fillRect(19,17,7,7);
        g.fillStyle(0xff0000); g.fillRect(8,19,3,3); g.fillRect(21,19,3,3);
        g.fillStyle(0x000000); g.fillRect(10,23,3,2); g.fillRect(19,23,3,2); // 嘴
        g.generateTexture('enemy_forest', 32, 32);

        // ── 沙漠怪（橙色墨镜） ──
        g.clear();
        g.fillStyle(0xff6600); g.fillCircle(16, 16, 15);
        g.fillStyle(0xff8c00);
        g.fillCircle(16, 14, 11);
        g.fillStyle(0x111111); g.fillRect(4, 11, 24, 8); // 墨镜
        g.fillStyle(0x333333); g.fillRect(14,11,4,8);    // 镜框中
        g.fillStyle(0xff6600); g.fillRect(4,11,4,8); g.fillRect(24,11,4,8); // 两侧
        g.fillStyle(0xffcc00); g.fillCircle(8,24,4); g.fillCircle(24,24,4); // 脚
        g.generateTexture('enemy_desert', 32, 32);

        // ── 海洋水母（青色） ──
        g.clear();
        g.fillStyle(0x00cccc, 0.85); g.fillCircle(16, 12, 13);
        g.fillStyle(0x00ffff, 0.7);  g.fillCircle(16, 10, 9);
        g.fillStyle(0x00aaaa); g.fillRect(4, 20, 24, 6);
        g.fillStyle(0x00cccc);
        g.fillRect(6,26,4,8); g.fillRect(14,26,4,10); g.fillRect(22,26,4,8); // 触手
        g.fillStyle(0xffffff); g.fillCircle(11,10,3); g.fillCircle(21,10,3); // 眼
        g.fillStyle(0x006666); g.fillCircle(11,10,1); g.fillCircle(21,10,1);
        g.generateTexture('enemy_ocean', 32, 36);

        // ── Boss 章鱼 ──
        g.clear();
        g.fillStyle(0x4a0080); g.fillCircle(40, 35, 32); // 头
        g.fillStyle(0x6a00b0); g.fillCircle(40, 30, 24);
        // 触手 (8条)
        g.fillStyle(0x4a0080);
        const tentacleAngles = [200,225,250,275,300,315,330,345];
        tentacleAngles.forEach(a => {
            const rad = a * Math.PI / 180;
            const tx = 40 + Math.cos(rad) * 26;
            const ty = 35 + Math.sin(rad) * 26;
            g.fillRect(tx-4, ty-4, 8, 28);
        });
        g.fillStyle(0xff0000); g.fillCircle(30,28,6); g.fillCircle(50,28,6); // 眼
        g.fillStyle(0xff6600); g.fillCircle(30,28,3); g.fillCircle(50,28,3);
        g.fillStyle(0xffffff); g.fillCircle(29,27,1); g.fillCircle(49,27,1); // 眼白
        g.generateTexture('boss_ocean', 80, 80);

        // ── 金币 ──
        g.clear();
        g.fillStyle(0xffd700); g.fillCircle(10, 10, 9);
        g.fillStyle(0xffaa00); g.fillCircle(10, 10, 7);
        g.fillStyle(0xffd700); g.fillCircle(9, 9, 5);
        g.fillStyle(0xffee88); g.fillCircle(7, 7, 2);
        g.generateTexture('coin', 20, 20);

        g.destroy();
    }
}
window.BootScene = BootScene;
