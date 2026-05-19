class ScoreScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ScoreScene' });
    }

    init(data) {
        this.levelCompleted = data.levelCompleted || '未知关卡';
        this.nextLevel = data.nextLevel || 'MenuScene';
    }

    create() {
        this.cameras.main.setBackgroundColor('#2c3e50');

        // 生成彩纸纹理
        let g = this.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillRect(0,0,10,10);
        g.generateTexture('confetti', 10, 10);
        g.destroy();

        const isGameBeaten = this.nextLevel === 'GameComplete';
        const titleStr = isGameBeaten ? '🎉 恭喜全部通关！ 🎉' : '关卡完成！';
        const titleColor = isGameBeaten ? '#ffdf00' : '#2ecc71';

        // 结算标题
        const titleText = this.add.text(400, 150, titleStr, {
            fontSize: isGameBeaten ? '56px' : '48px',
            fill: titleColor,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 5
        });
        titleText.setOrigin(0.5);

        // 如果通关，加个缩放呼吸动画和彩带
        if (isGameBeaten) {
            this.tweens.add({
                targets: titleText,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 800,
                yoyo: true,
                repeat: -1
            });

            // 撒花粒子效果
            const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
            this.add.particles(0, -50, 'confetti', {
                x: { min: 0, max: 800 },
                lifespan: 4000,
                speedY: { min: 100, max: 300 },
                speedX: { min: -100, max: 100 },
                angle: { min: 0, max: 360 },
                gravityY: 150,
                scale: { start: 1, end: 0 },
                tint: colors,
                frequency: 50
            });
        }

        // 显示完成的关卡
        const levelText = this.add.text(400, 250, `已通过: ${this.levelCompleted}`, {
            fontSize: '32px',
            fill: '#ecf0f1'
        });
        levelText.setOrigin(0.5);

        // 获取并显示得分
        const currentScore = this.registry.get('score') || 0;
        const scoreText = this.add.text(400, 320, `当前总得分: ${currentScore}`, {
            fontSize: '28px',
            fill: '#f1c40f'
        });
        scoreText.setOrigin(0.5);

        // 更新最高分
        let highScore = parseInt(localStorage.getItem('mario_highscore') || '0');
        if (currentScore > highScore) {
            localStorage.setItem('mario_highscore', currentScore);
            const newRecordText = this.add.text(400, 370, '新纪录！', {
                fontSize: '24px', fill: '#e74c3c', fontStyle: 'bold'
            }).setOrigin(0.5);
            this.tweens.add({ targets: newRecordText, alpha: 0, duration: 500, yoyo: true, repeat: -1 });
        }
        
        const btnTextStr = isGameBeaten ? '回到主菜单' : '进入下一关';
        
        // 下一步按钮
        const btnBg = this.add.rectangle(400, 480, 220, 60, 0x3498db).setInteractive();
        const btnText = this.add.text(400, 480, btnTextStr, {
            fontSize: '24px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // 按钮交互
        btnBg.on('pointerover', () => btnBg.setFillStyle(0x2980b9));
        btnBg.on('pointerout', () => btnBg.setFillStyle(0x3498db));
        btnBg.on('pointerdown', () => {
            if (isGameBeaten) {
                this.scene.start('MenuScene');
            } else {
                this.scene.start(this.nextLevel);
            }
        });
    }
}
window.ScoreScene = ScoreScene;
