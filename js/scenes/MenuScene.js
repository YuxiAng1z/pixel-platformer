class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // 生成全局纹理 (怪物、门等)
        this.generateTextures();

        // 蓝天背景
        this.cameras.main.setBackgroundColor('#4A90E2');

        // 画几朵云装饰
        const addCloud = (x, y) => {
            this.add.circle(x, y, 30, 0xffffff).setAlpha(0.9);
            this.add.circle(x + 30, y - 15, 40, 0xffffff).setAlpha(0.9);
            this.add.circle(x + 60, y, 30, 0xffffff).setAlpha(0.9);
            this.add.rectangle(x, y + 15, 60, 20, 0xffffff).setOrigin(0,0).setAlpha(0.9);
        };
        addCloud(100, 150);
        addCloud(600, 100);
        addCloud(400, 250);
        
        // 画地面
        this.add.rectangle(0, 500, 800, 100, 0x8B4513).setOrigin(0,0);
        this.add.rectangle(0, 500, 800, 20, 0x228B22).setOrigin(0,0); // 草地表层

        // 画个方块人 (代表玩家)
        this.add.rectangle(384, 468, 32, 32, 0xff0000).setOrigin(0,0);
        // 画个树
        this.add.rectangle(200, 440, 20, 60, 0x8B4513).setOrigin(0,0);
        this.add.circle(210, 420, 40, 0x006400);

        // 标题文本
        const titleText = this.add.text(400, 150, '像素风闯关游戏', {
            fontSize: '56px',
            fill: '#FFF500',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 8
        });
        titleText.setOrigin(0.5);
        titleText.setShadow(3, 3, '#000000', 5, true, true);

        // 标题浮动动画
        this.tweens.add({
            targets: titleText,
            y: 135,
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        // 开始按钮背景
        const btnBg = this.add.rectangle(400, 320, 240, 60, 0x32CD32).setInteractive();
        btnBg.setStrokeStyle(4, 0xffffff);
        btnBg.setOrigin(0.5);

        // 提示文本
        const startText = this.add.text(400, 320, '开始游戏', {
            fontSize: '28px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        });
        startText.setOrigin(0.5);

        // 按钮交互动画
        btnBg.on('pointerover', () => {
            btnBg.setFillStyle(0x3CB371);
            this.tweens.add({ targets: [btnBg, startText], scaleX: 1.1, scaleY: 1.1, duration: 100 });
        });
        btnBg.on('pointerout', () => {
            btnBg.setFillStyle(0x32CD32);
            this.tweens.add({ targets: [btnBg, startText], scaleX: 1.0, scaleY: 1.0, duration: 100 });
        });
        btnBg.on('pointerdown', () => {
            // 点击特效
            btnBg.setFillStyle(0x2E8B57);
            this.tweens.add({ targets: [btnBg, startText], scaleX: 0.9, scaleY: 0.9, duration: 50, yoyo: true, onComplete: () => {
                this.startGame();
            }});
        });

        // 监听空格键
        this.input.keyboard.on('keydown-SPACE', () => this.startGame());

        // 读取历史数据并显示
        let attempts = localStorage.getItem('mario_attempts') || 0;
        let highScore = localStorage.getItem('mario_highscore') || 0;
        const statsText = this.add.text(400, 240, `闯关次数: ${attempts}    最高分: ${highScore}`, {
            fontSize: '24px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        statsText.setOrigin(0.5);
    }

    startGame() {
        // 更新闯关次数
        let attempts = parseInt(localStorage.getItem('mario_attempts') || '0');
        localStorage.setItem('mario_attempts', attempts + 1);

        // 初始化生命值和当前得分，以及怪物击杀记录
        this.registry.set('lives', 3);
        this.registry.set('score', 0);
        this.registry.set('dead_enemies', []);
        // 进入第一关（森林关卡）
        this.scene.start('ForestLevel');
    }

    generateTextures() {
        let g = this.add.graphics();
        
        // 森林怪物 (紫色带刺)
        g.clear();
        g.fillStyle(0x800080);
        g.fillRect(0, 10, 32, 22);
        g.fillStyle(0x4b0082); // 刺
        g.fillTriangle(0, 10, 8, 0, 16, 10);
        g.fillTriangle(16, 10, 24, 0, 32, 10);
        // 眼睛
        g.fillStyle(0xffffff); g.fillRect(6, 14, 6, 6); g.fillRect(20, 14, 6, 6);
        g.fillStyle(0xff0000); g.fillRect(8, 16, 2, 2); g.fillRect(22, 16, 2, 2);
        g.generateTexture('enemy_forest', 32, 32);

        // 沙漠怪物 (橙色带甲)
        g.clear();
        g.fillStyle(0xFF4500);
        g.fillCircle(16, 16, 16);
        g.fillStyle(0x000000);
        g.fillRect(6, 12, 20, 8); // 墨镜
        g.generateTexture('enemy_desert', 32, 32);

        // 海洋水母 (半透明青色)
        g.clear();
        g.fillStyle(0x00FFFF, 0.7);
        g.fillCircle(16, 12, 12);
        g.fillRect(4, 12, 24, 10);
        // 触手
        g.fillRect(6, 22, 4, 10); g.fillRect(14, 22, 4, 10); g.fillRect(22, 22, 4, 10);
        g.generateTexture('enemy_ocean', 32, 32);

        // 门
        g.clear();
        g.fillStyle(0x8B4513); g.fillRect(0, 0, 40, 100);
        g.fillStyle(0x654321); g.fillRect(5, 5, 30, 90); // 门框内
        g.fillStyle(0xffd700); g.fillCircle(30, 50, 6); // 把手
        g.generateTexture('door_closed', 40, 100);

        g.clear();
        g.fillStyle(0x000000); g.fillRect(0, 0, 40, 100);
        g.fillStyle(0x8B4513); g.fillRect(0, 0, 5, 100); // 只剩门框
        g.generateTexture('door_open', 40, 100);

        g.destroy();
    }
}
window.MenuScene = MenuScene;
