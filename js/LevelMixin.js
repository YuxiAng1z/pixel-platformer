/**
 * Mixin for all level scenes: coin spawning, timer, HUD, shared death/goal logic.
 * Usage: call LevelMixin.init(scene, { levelKey, nextScene, bgm, timerSeconds, coinBonus, levelBonus })
 */
const LevelMixin = {
    setup(scene, opts) {
        scene._lm = {
            coins: 0, totalCoins: opts.totalCoins || 0,
            timeLeft: opts.timerSeconds || 90,
            timerActive: false,
            levelKey: opts.levelKey,
            nextScene: opts.nextScene,
            levelBonus: opts.levelBonus || 1000,
        };
        scene.isFinished = false;
        const timerMode = scene.registry.get('timerMode');

        // HUD
        const lives = scene.registry.get('lives');
        scene._hudLives = scene.add.text(16, 16, '❤️'.repeat(Math.max(0, lives)), {
            fontSize: '22px', fill: '#ff4757', stroke: '#000', strokeThickness: 3
        }).setScrollFactor(0).setDepth(50);

        scene._hudScore = scene.add.text(784, 16, `${i18n.t('score')}: ${scene.registry.get('score')||0}`, {
            fontSize: '22px', fill: '#ffd700', stroke: '#000', strokeThickness: 3
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(50);

        scene._hudCoins = scene.add.text(16, 46, `🪙 0/${opts.totalCoins||0}`, {
            fontSize: '20px', fill: '#ffd700', stroke: '#000', strokeThickness: 3
        }).setScrollFactor(0).setDepth(50);

        if (timerMode) {
            scene._hudTimer = scene.add.text(400, 16, `⏱ ${scene._lm.timeLeft}`, {
                fontSize: '24px', fill: '#ffffff', stroke: '#000', strokeThickness: 4, fontStyle:'bold'
            }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(50);
            scene._lm.timerActive = true;

            scene.time.addEvent({
                delay: 1000,
                repeat: opts.timerSeconds - 1,
                callback: () => {
                    if (scene.isFinished || !scene._lm.timerActive) return;
                    scene._lm.timeLeft--;
                    if (scene._hudTimer) scene._hudTimer.setText(`⏱ ${scene._lm.timeLeft}`);
                    if (scene._lm.timeLeft <= 10 && scene._hudTimer) scene._hudTimer.setFill('#ff4757');
                    if (scene._lm.timeLeft <= 0) {
                        scene._lm.timerActive = false;
                        audioManager.playSFX('time_up');
                        scene.handlePlayerDeath();
                    }
                }
            });
        }

        audioManager.playBGM(opts.bgm || 'menu');
        LevelMixin._setupPauseButton(scene);
    },

    _setupPauseButton(scene) {
        scene._paused = false;
        scene._pauseObjs = [];

        // Pause button top-right
        const pauseBtn = scene.add.text(760, 16, '⏸', {
            fontSize: '26px', fill: '#ffffff', stroke: '#000', strokeThickness: 3
        }).setScrollFactor(0).setDepth(60).setInteractive({ useHandCursor: true });

        pauseBtn.on('pointerover', () => pauseBtn.setAlpha(0.7));
        pauseBtn.on('pointerout',  () => pauseBtn.setAlpha(1));
        pauseBtn.on('pointerdown', () => {
            if (!scene._paused) LevelMixin._openPause(scene);
        });
    },

    _openPause(scene) {
        scene._paused = true;
        scene.physics.world.pause();
        scene.tweens.pauseAll();
        if (scene._lm) scene._lm.timerActive = false;

        const objs = [];

        // Darken overlay
        objs.push(scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.55)
            .setScrollFactor(0).setDepth(80));

        // Panel
        objs.push(scene.add.rectangle(400, 300, 340, 320, 0x0f3460, 1)
            .setScrollFactor(0).setDepth(81)
            .setStrokeStyle(2, 0x00e5ff));

        // Title
        objs.push(scene.add.text(400, 190, '⏸  PAUSE', {
            fontSize: '30px', fill: '#00e5ff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(82));

        const mkBtn = (label, y, color, cb) => {
            const bg = scene.add.rectangle(400, y, 260, 48, color)
                .setScrollFactor(0).setDepth(82).setInteractive({ useHandCursor: true });
            bg.setStrokeStyle(2, 0xffffff, 0.3);
            const txt = scene.add.text(400, y, label, {
                fontSize: '20px', fill: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3
            }).setOrigin(0.5).setScrollFactor(0).setDepth(83);
            bg.on('pointerover', () => bg.setAlpha(0.8));
            bg.on('pointerout',  () => bg.setAlpha(1));
            bg.on('pointerdown', cb);
            objs.push(bg, txt);
        };

        // Resume
        mkBtn('▶  继续游戏', 255, 0x27ae60, () => LevelMixin._closePause(scene, objs));

        // Restart
        mkBtn('↺  重新开始', 315, 0xe67e22, () => {
            objs.forEach(o => o.destroy());
            scene._paused = false;
            scene.physics.world.resume();
            scene.tweens.resumeAll();
            audioManager.stopBGM();
            scene.scene.restart();
        });

        // Settings (timer + language)
        mkBtn('⚙  设置', 375, 0x2980b9, () => LevelMixin._openPauseSettings(scene, objs));

        // Back to menu
        mkBtn('🏠  主菜单', 435, 0x8e44ad, () => {
            objs.forEach(o => o.destroy());
            scene._paused = false;
            scene.physics.world.resume();
            scene.tweens.resumeAll();
            audioManager.stopBGM();
            scene.scene.start('MenuScene');
        });

        scene._pauseObjs = objs;
    },

    _closePause(scene, objs) {
        objs.forEach(o => o.destroy());
        scene._paused = false;
        scene.physics.world.resume();
        scene.tweens.resumeAll();
        if (scene._lm && scene.registry.get('timerMode')) scene._lm.timerActive = true;
    },

    _openPauseSettings(scene, pauseObjs) {
        // Remove old settings if any
        if (scene._settingObjs) { scene._settingObjs.forEach(o=>o.destroy()); scene._settingObjs=null; }

        const objs = [];
        const panel = scene.add.rectangle(400, 300, 360, 280, 0x16213e)
            .setScrollFactor(0).setDepth(90).setStrokeStyle(2, 0x00e5ff);
        objs.push(panel);

        objs.push(scene.add.text(400, 195, '⚙ 设置', {
            fontSize:'22px', fill:'#00e5ff', fontStyle:'bold', stroke:'#000', strokeThickness:3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(91));

        // Close settings
        const closeBtn = scene.add.text(570, 178, '✕', {
            fontSize:'20px', fill:'#aaa'
        }).setScrollFactor(0).setDepth(91).setInteractive({ useHandCursor: true });
        closeBtn.on('pointerdown', () => { objs.forEach(o=>o.destroy()); scene._settingObjs = null; });
        objs.push(closeBtn);

        // Timer mode toggle
        objs.push(scene.add.text(240, 235, i18n.t('timerMode'), {
            fontSize:'18px', fill:'#fff', stroke:'#000', strokeThickness:2
        }).setScrollFactor(0).setDepth(91));
        const timerVal = scene.add.text(560, 235,
            scene.registry.get('timerMode') ? i18n.t('timerOn') : i18n.t('timerOff'), {
            fontSize:'18px', fill: scene.registry.get('timerMode') ? '#2ecc71':'#e74c3c', fontStyle:'bold'
        }).setOrigin(1,0).setScrollFactor(0).setDepth(91).setInteractive({ useHandCursor: true });
        timerVal.on('pointerdown', () => {
            const cur = scene.registry.get('timerMode')||false;
            scene.registry.set('timerMode', !cur);
            timerVal.setText(!cur ? i18n.t('timerOn') : i18n.t('timerOff'));
            timerVal.setFill(!cur ? '#2ecc71' : '#e74c3c');
        });
        objs.push(timerVal);

        // Language
        objs.push(scene.add.text(240, 280, i18n.t('language'), {
            fontSize:'18px', fill:'#fff', stroke:'#000', strokeThickness:2
        }).setScrollFactor(0).setDepth(91));
        const langs = ['zh-CN','zh-TW','en','ja'], labels = ['简中','繁中','EN','日'];
        langs.forEach((l, idx) => {
            const lx = 380 + idx * 50, ly = 280;
            const isAct = i18n.getLang() === l;
            const lb = scene.add.rectangle(lx, ly+12, 42, 26, isAct ? 0x00e5ff : 0x2c3e50)
                .setScrollFactor(0).setDepth(91).setInteractive({ useHandCursor: true });
            const lt = scene.add.text(lx, ly+12, labels[idx], {
                fontSize:'12px', fill: isAct?'#000':'#fff', fontStyle:'bold'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(92);
            lb.on('pointerdown', () => {
                i18n.setLang(l);
                objs.forEach(o=>o.destroy());
                pauseObjs.forEach(o=>o.destroy());
                scene._paused = false;
                scene.physics.world.resume();
                scene.tweens.resumeAll();
                audioManager.stopBGM();
                scene.scene.restart();
            });
            objs.push(lb, lt);
        });

        // Music toggle
        objs.push(scene.add.text(240, 330, 'BGM', {
            fontSize:'18px', fill:'#fff', stroke:'#000', strokeThickness:2
        }).setScrollFactor(0).setDepth(91));
        const musicBtn = scene.add.text(560, 330, audioManager.muted?'OFF':'ON', {
            fontSize:'18px', fill: audioManager.muted?'#e74c3c':'#2ecc71', fontStyle:'bold'
        }).setOrigin(1,0).setScrollFactor(0).setDepth(91).setInteractive({ useHandCursor: true });
        musicBtn.on('pointerdown', () => {
            const muted = audioManager.toggle();
            musicBtn.setText(muted?'OFF':'ON');
            musicBtn.setFill(muted?'#e74c3c':'#2ecc71');
            if (!muted) audioManager.playBGM(scene._lm ? scene._lm.levelKey : 'menu');
        });
        objs.push(musicBtn);

        scene._settingObjs = objs;
    },

    addScore(scene, amount) {
        let s = (scene.registry.get('score') || 0) + amount;
        scene.registry.set('score', s);
        if (scene._hudScore) scene._hudScore.setText(`${i18n.t('score')}: ${s}`);
    },

    collectCoin(scene, player, coin) {
        if (!coin.active) return;
        coin.destroy();
        scene._lm.coins++;
        LevelMixin.addScore(scene, 50);
        audioManager.playSFX('coin');
        if (scene._hudCoins) scene._hudCoins.setText(`🪙 ${scene._lm.coins}/${scene._lm.totalCoins}`);
    },

    spawnCoins(scene, positions) {
        scene._coins = scene.physics.add.staticGroup();
        positions.forEach(([x, y]) => {
            const c = scene.add.image(x, y, 'coin').setDisplaySize(20, 20);
            scene._coins.add(c);
            scene.tweens.add({ targets: c, y: y - 8, duration: 700, yoyo: true, repeat: -1, ease:'Sine.easeInOut' });
        });
        scene.physics.add.overlap(scene.player, scene._coins,
            (pl, coin) => LevelMixin.collectCoin(scene, pl, coin), null, scene);
    },

    hitEnemy(scene, player, enemy, scoreAmt) {
        if (player.isDead) return;
        if (player.body.velocity.y > 0 && player.body.bottom <= enemy.body.y + 26) {
            const dead = scene.registry.get('dead_enemies') || [];
            if (enemy.enemyId) dead.push(enemy.enemyId);
            scene.registry.set('dead_enemies', dead);
            enemy.destroy();
            player.setVelocityY(-380);
            audioManager.playSFX('stomp');
            LevelMixin.addScore(scene, scoreAmt || 100);
        } else {
            player.die();
        }
    },

    reachGoal(scene, player) {
        if (player.isDead || scene.isFinished) return;
        scene.isFinished = true;
        scene._lm.timerActive = false;
        player.body.setVelocity(0, 0);
        player.active = false;
        audioManager.playSFX('level_clear');

        const timeBonus = scene.registry.get('timerMode') ? scene._lm.timeLeft * 10 : 0;
        const coinBonus = scene._lm.coins * 50;
        const lives = scene.registry.get('lives') || 0;
        const livesBonus = lives * 500;
        const total = scene._lm.levelBonus + timeBonus + coinBonus + livesBonus;
        LevelMixin.addScore(scene, total);

        scene.time.delayedCall(900, () => {
            scene.scene.start('ScoreScene', {
                levelCompleted: i18n.t(scene._lm.levelKey),
                nextLevel: scene._lm.nextScene,
                timeBonus, coinBonus, livesBonus, levelBonus: scene._lm.levelBonus
            });
        });
    },

    handlePlayerDeath(scene) {
        let lives = scene.registry.get('lives');
        lives--;
        scene.registry.set('lives', lives);
        if (lives > 0) {
            scene.time.delayedCall(200, () => scene.scene.restart());
        } else {
            scene.time.delayedCall(200, () => {
                audioManager.stopBGM();
                scene.scene.start('MenuScene');
            });
        }
    },

    checkFall(scene) {
        if (scene.player && scene.player.y > 680 && !scene.player.isDead) scene.player.die();
    },

    spawnEnemy(scene, x, y, key, vx, group) {
        const dead = scene.registry.get('dead_enemies') || [];
        const id = `${key}_${x}`;
        if (dead.includes(id)) return null;
        const e = scene.physics.add.sprite(x, y, key).setDisplaySize(36, 36);
        e.enemyId = id;
        e.body.setVelocityX(vx);
        e.body.setBounce(1, 0);
        e.body.setCollideWorldBounds(false);
        group.add(e);
        // Flip sprite on direction change
        scene.tweens.addCounter({ from: 0, to: 1, duration: 100, repeat: -1, onUpdate: () => {
            if (e.active) e.setFlipX(e.body.velocity.x > 0);
        }});
        return e;
    }
};
window.LevelMixin = LevelMixin;
