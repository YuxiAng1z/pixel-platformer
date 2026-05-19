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
