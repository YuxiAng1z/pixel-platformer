class ForestLevel extends Phaser.Scene {
    constructor() {
        super({ key: 'ForestLevel' });
    }

    create() {
        this.isFinished = false; // 修复：重置过关状态

        // 背景颜色 (蓝天)
        this.cameras.main.setBackgroundColor('#87CEEB');

        // 世界边界设置 (宽2000，高600)
        this.physics.world.setBounds(0, 0, 2000, 600);
        
        // 组建地形
        this.platforms = this.physics.add.staticGroup();
        this.invisibleWalls = this.physics.add.staticGroup(); // 隐形墙，用于限制怪物移动范围
        this.createGround();
        this.createClouds();
        this.createTrees();

        // 玩家
        this.player = new Player(this, 100, 400);
        
        // 相机跟随
        this.cameras.main.setBounds(0, 0, 2000, 600);
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

        // 终点门
        this.goal = this.add.sprite(1880, 400, 'door_closed').setOrigin(0, 0);
        this.physics.add.existing(this.goal, true);

        // 敌人
        this.enemies = this.physics.add.group();
        this.createEnemies();

        // 碰撞设置
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.enemies, this.invisibleWalls); // 怪物碰到隐形墙会回头
        
        // 玩家与敌人的交互
        this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);
        
        // 玩家到达终点
        this.physics.add.overlap(this.player, this.goal, this.reachGoal, null, this);

        // 掉出屏幕外死亡检测
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
            fill: '#f1c40f', // 金黄色
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(1, 0).setScrollFactor(0);
    }

    createTrees() {
        const createTree = (x, y) => {
            // 树干
            this.add.rectangle(x + 15, y, 20, 60, 0x8B4513).setOrigin(0, 0).setDepth(-1);
            // 树叶
            this.add.circle(x + 25, y - 20, 40, 0x006400).setDepth(-1);
        };
        // 在背景随机位置种几棵树
        createTree(200, 500);
        createTree(450, 500);
        createTree(750, 500);
        createTree(1100, 500);
        createTree(1500, 500);
    }

    createClouds() {
        const createCloud = (x, y) => {
            this.add.circle(x, y, 30, 0xffffff).setDepth(-2).setAlpha(0.9);
            this.add.circle(x + 25, y - 10, 40, 0xffffff).setDepth(-2).setAlpha(0.9);
            this.add.circle(x + 50, y, 30, 0xffffff).setDepth(-2).setAlpha(0.9);
            this.add.rectangle(x, y + 10, 50, 20, 0xffffff).setOrigin(0,0).setDepth(-2).setAlpha(0.9);
        };
        createCloud(150, 100);
        createCloud(500, 150);
        createCloud(900, 80);
        createCloud(1400, 120);
        createCloud(1800, 100);
    }

    createGround() {
        // 地板块 (棕色)
        const groundColor = 0x8B4513;
        
        // 基础地面
        let ground1 = this.add.rectangle(0, 560, 800, 40, groundColor).setOrigin(0, 0);
        this.platforms.add(ground1);

        // 断层
        let ground2 = this.add.rectangle(1000, 560, 600, 40, groundColor).setOrigin(0, 0);
        this.platforms.add(ground2);
        
        let ground3 = this.add.rectangle(1700, 560, 400, 40, groundColor).setOrigin(0, 0);
        this.platforms.add(ground3);

        // 一些跳跃平台
        let plat1 = this.add.rectangle(525, 440, 150, 20, groundColor).setOrigin(0, 0);
        this.platforms.add(plat1);

        let plat2 = this.add.rectangle(775, 340, 150, 20, groundColor).setOrigin(0, 0);
        this.platforms.add(plat2);

        // 为怪物添加隐形空气墙，防止它们掉下悬崖
        this.invisibleWalls.add(this.add.rectangle(0, 500, 10, 100).setAlpha(0));
        this.invisibleWalls.add(this.add.rectangle(800, 500, 10, 100).setAlpha(0));
        this.invisibleWalls.add(this.add.rectangle(1000, 500, 10, 100).setAlpha(0));
        this.invisibleWalls.add(this.add.rectangle(1600, 500, 10, 100).setAlpha(0));
    }

    createEnemies() {
        let deadEnemies = this.registry.get('dead_enemies') || [];
        
        if (!deadEnemies.includes('forest_enemy_1')) {
            let enemy1 = this.add.sprite(484, 484, 'enemy_forest').setOrigin(0, 0);
            enemy1.enemyId = 'forest_enemy_1';
            this.enemies.add(enemy1);
            enemy1.body.setVelocityX(-50);
            enemy1.body.setBounce(1, 0);
        }
        
        if (!deadEnemies.includes('forest_enemy_2')) {
            let enemy2 = this.add.sprite(1184, 484, 'enemy_forest').setOrigin(0, 0);
            enemy2.enemyId = 'forest_enemy_2';
            this.enemies.add(enemy2);
            enemy2.body.setVelocityX(-50);
            enemy2.body.setBounce(1, 0);
        }
    }

    hitEnemy(player, enemy) {
        if (player.isDead) return;

        // 检测图形的上方和人物的下方 (增加容差至 24 像素，防止穿模后判定为碰到侧面)
        if (player.body.velocity.y > 0 && player.body.bottom <= enemy.body.y + 24) {
            // 记录已死亡怪物
            let deadEnemies = this.registry.get('dead_enemies') || [];
            deadEnemies.push(enemy.enemyId);
            this.registry.set('dead_enemies', deadEnemies);
            
            // 踩死敌人
            enemy.destroy();
            player.setVelocityY(-350); // 踩完后弹跳更高
            
            // 加分
            let score = this.registry.get('score') || 0;
            score += 100;
            this.registry.set('score', score);
            this.scoreText.setText(`分数: ${score}`);
        } else {
            // 被敌人碰到，玩家死亡
            player.die();
        }
    }

    reachGoal(player, goal) {
        if (player.isDead || this.isFinished) return;
        this.isFinished = true;
        
        // 停止玩家控制
        player.body.setVelocity(0, 0);
        player.active = false;
        
        // 开门动画
        goal.setTexture('door_open');
        
        // 增加通关分和生命分
        let currentScore = this.registry.get('score') || 0;
        let lives = this.registry.get('lives') || 0;
        let levelBonus = 1000;
        let livesBonus = lives * 500;
        this.registry.set('score', currentScore + levelBonus + livesBonus);
        
        // 过关延迟
        this.time.delayedCall(1000, () => {
            this.scene.start('ScoreScene', {
                levelCompleted: '森林关卡',
                nextLevel: 'DesertLevel'
            });
        });
    }

    handlePlayerDeath() {
        let lives = this.registry.get('lives');
        lives--;
        this.registry.set('lives', lives);
        
        if (lives > 0) {
            // 重启当前关卡
            this.scene.restart();
        } else {
            // 生命耗尽，回到主菜单
            this.scene.start('MenuScene');
        }
    }

    checkPlayerFall() {
        if (this.player && this.player.y > 650 && !this.player.isDead) {
            this.player.die();
        }
    }

    update() {
        // Player update 已经在 Player 类中的 preUpdate 处理了
    }
}
window.ForestLevel = ForestLevel;
