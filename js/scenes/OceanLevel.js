class OceanLevel extends Phaser.Scene {
    constructor() {
        super({ key: 'OceanLevel' });
    }

    create() {
        this.isFinished = false; // 修复：重置过关状态

        // 海洋背景色
        this.cameras.main.setBackgroundColor('#00008B'); // 深蓝色

        this.physics.world.setBounds(0, 0, 2400, 600);
        
        this.platforms = this.physics.add.staticGroup();
        this.createGround();

        this.player = new Player(this, 100, 400);
        
        // 修改海洋关卡的物理特性（模拟水下：引力减小，移动变慢，跳跃更轻盈）
        // 全局引力是 1200，减去 900 后实际引力为 300
        this.player.body.setGravityY(-900); 
        this.player.moveSpeed = 120;
        this.player.jumpForce = -450;
        
        this.cameras.main.setBounds(0, 0, 2400, 600);
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

        this.goal = this.add.sprite(2280, 400, 'door_closed').setOrigin(0, 0);
        this.physics.add.existing(this.goal, true);

        this.enemies = this.physics.add.group();
        this.createEnemies();

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
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
        // 画海草
        const drawSeaweed = (x, y) => {
            for(let i=0; i<4; i++) {
                this.add.rectangle(x + Math.sin(i)*10, y - i*15, 8, 20, 0x2E8B57).setOrigin(0,0).setDepth(-1);
            }
        };
        drawSeaweed(200, 560);
        drawSeaweed(700, 560);
        drawSeaweed(1400, 560);
        drawSeaweed(1900, 560);
        
        // 珊瑚
        this.add.circle(400, 540, 20, 0xFF7F50).setDepth(-1);
        this.add.circle(415, 550, 15, 0xFF6347).setDepth(-1);
        this.add.circle(1200, 540, 25, 0xFF1493).setDepth(-1);

        // 气泡生成器
        this.time.addEvent({
            delay: 800,
            callback: () => {
                if(!this.scene.isActive()) return;
                let x = Phaser.Math.Between(100, 2300);
                let bubble = this.add.circle(x, 600, Phaser.Math.Between(4, 10), 0xffffff, 0.5);
                this.physics.add.existing(bubble);
                bubble.body.setVelocityY(Phaser.Math.Between(-150, -50));
                bubble.body.setAllowGravity(false);
                this.tweens.add({
                    targets: bubble,
                    x: x + Phaser.Math.Between(-30, 30),
                    duration: 2000,
                    yoyo: true,
                    repeat: -1
                });
                // 气泡生命周期
                this.time.delayedCall(8000, () => {
                    if(bubble && bubble.active) bubble.destroy();
                });
            },
            loop: true
        });
    }

    createGround() {
        const groundColor = 0x20B2AA; // 蓝绿色海底
        
        let ground1 = this.add.rectangle(0, 560, 1600, 40, groundColor).setOrigin(0, 0);
        this.platforms.add(ground1);

        let ground2 = this.add.rectangle(2000, 560, 400, 40, groundColor).setOrigin(0, 0);
        this.platforms.add(ground2);

        // 浮动平台
        this.platforms.add(this.add.rectangle(560, 290, 80, 20, groundColor).setOrigin(0, 0));
        this.platforms.add(this.add.rectangle(860, 190, 80, 20, groundColor).setOrigin(0, 0));
        this.platforms.add(this.add.rectangle(1160, 390, 80, 20, groundColor).setOrigin(0, 0));
        this.platforms.add(this.add.rectangle(1560, 240, 80, 20, groundColor).setOrigin(0, 0));
    }

    createEnemies() {
        let deadEnemies = this.registry.get('dead_enemies') || [];

        if (!deadEnemies.includes('ocean_enemy_1')) {
            let enemy1 = this.add.sprite(684, 384, 'enemy_ocean').setOrigin(0, 0);
            enemy1.enemyId = 'ocean_enemy_1';
            this.enemies.add(enemy1);
            enemy1.body.setVelocityY(-50); // 上下移动
            enemy1.body.setBounce(0, 1);
            // 让它不受重力影响，只在天上飘
            enemy1.body.setAllowGravity(false);
            
            // 加点墙来限制上下移动范围
            let topWall = this.add.rectangle(684, 195, 32, 10, 0x000000, 0).setOrigin(0, 0);
            this.physics.add.existing(topWall, true);
            this.physics.add.collider(enemy1, topWall);
            let bottomWall = this.add.rectangle(684, 545, 32, 10, 0x000000, 0).setOrigin(0, 0);
            this.physics.add.existing(bottomWall, true);
            this.physics.add.collider(enemy1, bottomWall);
        }

        if (!deadEnemies.includes('ocean_enemy_2')) {
            let enemy2 = this.add.sprite(1484, 334, 'enemy_ocean').setOrigin(0, 0);
            enemy2.enemyId = 'ocean_enemy_2';
            this.enemies.add(enemy2);
            enemy2.body.setVelocityY(-60);
            enemy2.body.setBounce(0, 1);
            enemy2.body.setAllowGravity(false);
            
            let topWall2 = this.add.rectangle(1484, 145, 32, 10, 0x000000, 0).setOrigin(0, 0);
            this.physics.add.existing(topWall2, true);
            this.physics.add.collider(enemy2, topWall2);
            let bottomWall2 = this.add.rectangle(1484, 545, 32, 10, 0x000000, 0).setOrigin(0, 0);
            this.physics.add.existing(bottomWall2, true);
            this.physics.add.collider(enemy2, bottomWall2);
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
            score += 200;
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
        let levelBonus = 2000;
        let livesBonus = lives * 500;
        this.registry.set('score', currentScore + levelBonus + livesBonus);
        
        this.time.delayedCall(1000, () => {
            this.scene.start('ScoreScene', {
                levelCompleted: '海洋关卡',
                nextLevel: 'GameComplete'
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
window.OceanLevel = OceanLevel;
