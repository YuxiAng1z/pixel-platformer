class DesertLevel extends Phaser.Scene {
    constructor() {
        super({ key: 'DesertLevel' });
    }

    create() {
        this.isFinished = false; // 修复：重置过关状态，防止重新开始后无法再次过关

        // 沙漠背景色
        this.cameras.main.setBackgroundColor('#F4A460'); // 沙黄色

        this.physics.world.setBounds(0, 0, 2400, 600);
        // 组建地形
        this.platforms = this.physics.add.staticGroup();
        this.invisibleWalls = this.physics.add.staticGroup();
        this.createGround();

        this.player = new Player(this, 100, 400);
        
        this.cameras.main.setBounds(0, 0, 2400, 600);
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

        this.goal = this.add.sprite(2280, 400, 'door_closed').setOrigin(0, 0);
        this.physics.add.existing(this.goal, true);

        this.enemies = this.physics.add.group();
        this.createEnemies();

        // 碰撞设置
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.enemies, this.invisibleWalls);
        this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.goal, this.reachGoal, null, this);

        this.events.on('update', this.checkPlayerFall, this);

        // UI: 显示生命值
        const lives = this.registry.get('lives');
        const hearts = '❤️'.repeat(Math.max(0, lives));
        this.add.text(20, 20, `生命: ${hearts}`, {
            fontSize: '24px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setScrollFactor(0);

        // UI: 显示当前分数
        const score = this.registry.get('score') || 0;
        this.scoreText = this.add.text(780, 20, `分数: ${score}`, {
            fontSize: '24px',
            fill: '#f1c40f',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(1, 0).setScrollFactor(0);

        this.createDecorations();
    }

    createDecorations() {
        // 金字塔
        let g = this.add.graphics();
        g.fillStyle(0xDAA520, 0.8);
        g.fillTriangle(400, 560, 600, 300, 800, 560);
        g.fillStyle(0xB8860B, 0.8);
        g.fillTriangle(600, 300, 800, 560, 900, 500);
        g.setDepth(-2);

        // 太阳
        this.add.circle(100, 100, 50, 0xFF4500).setScrollFactor(0).setDepth(-3);

        // 仙人掌 (改为 setOrigin(0,0) 并精确计算左上角坐标以防悬空或穿模)
        const drawCactus = (x, y) => {
            this.add.rectangle(x - 8, y - 60, 16, 60, 0x228B22).setOrigin(0, 0).setDepth(-1); // 主干
            this.add.rectangle(x - 20, y - 50, 10, 20, 0x228B22).setOrigin(0, 0).setDepth(-1); // 左枝垂直
            this.add.rectangle(x + 10, y - 60, 10, 20, 0x228B22).setOrigin(0, 0).setDepth(-1); // 右枝垂直
            this.add.rectangle(x - 20, y - 35, 20, 10, 0x228B22).setOrigin(0, 0).setDepth(-1); // 左横臂
            this.add.rectangle(x, y - 45, 20, 10, 0x228B22).setOrigin(0, 0).setDepth(-1); // 右横臂
        };
        drawCactus(300, 560);
        drawCactus(1100, 560);
        drawCactus(1600, 560);
    }

    createGround() {
        const groundColor = 0xD2B48C; // 浅沙色
        
        let ground1 = this.add.rectangle(0, 560, 1000, 40, groundColor).setOrigin(0, 0);
        this.platforms.add(ground1);

        // 大坑
        let ground2 = this.add.rectangle(1300, 560, 1100, 40, groundColor).setOrigin(0, 0); // 延长终点前的地面
        this.platforms.add(ground2);

        // 阶梯状平台
        this.platforms.add(this.add.rectangle(750, 490, 100, 20, groundColor).setOrigin(0, 0));
        this.platforms.add(this.add.rectangle(900, 390, 100, 20, groundColor).setOrigin(0, 0));
        this.platforms.add(this.add.rectangle(1050, 290, 100, 20, groundColor).setOrigin(0, 0));

        // 隐形空气墙防止怪物掉落
        this.invisibleWalls.add(this.add.rectangle(0, 500, 10, 100).setAlpha(0));
        this.invisibleWalls.add(this.add.rectangle(1000, 500, 10, 100).setAlpha(0));
        this.invisibleWalls.add(this.add.rectangle(1300, 500, 10, 100).setAlpha(0));
        this.invisibleWalls.add(this.add.rectangle(2400, 500, 10, 100).setAlpha(0));
    }

    createEnemies() {
        let deadEnemies = this.registry.get('dead_enemies') || [];
        
        if (!deadEnemies.includes('desert_enemy_1')) {
            let enemy1 = this.add.sprite(584, 484, 'enemy_desert').setOrigin(0, 0);
            enemy1.enemyId = 'desert_enemy_1';
            this.enemies.add(enemy1);
            enemy1.body.setVelocityX(-80);
            enemy1.body.setBounce(1, 0);
        }
        
        if (!deadEnemies.includes('desert_enemy_2')) {
            let enemy2 = this.add.sprite(1584, 484, 'enemy_desert').setOrigin(0, 0);
            enemy2.enemyId = 'desert_enemy_2';
            this.enemies.add(enemy2);
            enemy2.body.setVelocityX(-80);
            enemy2.body.setBounce(1, 0);
        }
    }

    hitEnemy(player, enemy) {
        if (player.isDead) return;
        if (player.body.velocity.y > 0 && player.body.bottom <= enemy.body.y + 24) {
            let deadEnemies = this.registry.get('dead_enemies') || [];
            deadEnemies.push(enemy.enemyId);
            this.registry.set('dead_enemies', deadEnemies);
            
            enemy.destroy();
            player.setVelocityY(-350);
            
            let score = this.registry.get('score') || 0;
            score += 150;
            this.registry.set('score', score);
            this.scoreText.setText(`分数: ${score}`);
        } else {
            player.die();
        }
    }

    reachGoal(player, goal) {
        if (player.isDead || this.isFinished) return;
        this.isFinished = true;
        player.body.setVelocity(0, 0);
        player.active = false;
        
        goal.setTexture('door_open');

        let currentScore = this.registry.get('score') || 0;
        let lives = this.registry.get('lives') || 0;
        let levelBonus = 1500;
        let livesBonus = lives * 500;
        this.registry.set('score', currentScore + levelBonus + livesBonus);
        
        this.time.delayedCall(1000, () => {
            this.scene.start('ScoreScene', {
                levelCompleted: '沙漠关卡',
                nextLevel: 'OceanLevel'
            });
        });
    }

    handlePlayerDeath() {
        let lives = this.registry.get('lives');
        lives--;
        this.registry.set('lives', lives);
        
        if (lives > 0) {
            this.scene.restart();
        } else {
            this.scene.start('MenuScene');
        }
    }

    checkPlayerFall() {
        if (this.player && this.player.y > 650 && !this.player.isDead) {
            this.player.die();
        }
    }
}
window.DesertLevel = DesertLevel;
