class BossScene extends Phaser.Scene {
    constructor() { super({ key: 'BossScene' }); }

    create() {
        this.cameras.main.setBackgroundColor('#000820');
        this.physics.world.setBounds(0, 0, 800, 600);

        // Carry over state
        this.bossHP    = 10;
        this.bossPhase = 1;
        this.isOver    = false;

        this._buildArena();
        this._spawnPlayer();
        this._spawnBoss();
        this._buildHUD();
        this._scheduleAttacks();

        if (this.registry.get('platform') === 'mobile') {
            this.mobileCtrl = new MobileControls(this);
            this.player.mobileCtrl = this.mobileCtrl;
        }

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.overlap(this.player, this.boss,
            () => this._onPlayerTouchBoss(), null, this);

        audioManager.playBGM('boss');
        this.events.on('update', () => LevelMixin.checkFall(this));
    }

    _buildArena() {
        this.platforms = this.physics.add.staticGroup();
        const G = 0x1a237e;
        // Floor
        const floor = this.add.rectangle(0, 560, 800, 40, G).setOrigin(0,0);
        this.platforms.add(floor);
        // Platforms
        [[50,420,150,16],[300,340,160,16],[600,420,150,16],
         [150,250,120,16],[480,260,120,16]].forEach(([x,y,w,h]) => {
            this.platforms.add(this.add.rectangle(x,y,w,h,G).setOrigin(0,0));
        });

        // Bg glow
        const bg = this.add.graphics();
        bg.fillStyle(0x0d47a1,0.15); bg.fillCircle(400,300,260);
        bg.fillStyle(0x1565c0,0.08); bg.fillCircle(400,300,350);

        // Arena border warning strips
        this.add.rectangle(0,0,800,8,0xff4757).setOrigin(0,0);
        this.add.rectangle(0,0,8,600,0xff4757).setOrigin(0,0);
        this.add.rectangle(792,0,8,600,0xff4757).setOrigin(0,0);
    }

    _spawnPlayer() {
        this.player = new Player(this, 100, 480);
        this.player.jumpForce = -620;
    }

    _spawnBoss() {
        this.boss = this.physics.add.image(600, 350, 'boss_ocean').setDisplaySize(90,90).setDepth(5);
        this.boss.body.setAllowGravity(false);
        this.boss.body.setVelocityX(-120);
        this.boss.setBounceX(1);
        this.boss.body.setCollideWorldBounds(true);
        // Floating bob
        this.tweens.add({ targets:this.boss, y: 320, duration:1000, yoyo:true, repeat:-1, ease:'Sine.easeInOut' });

        this.projectiles = this.physics.add.group();
        this.physics.add.overlap(this.player, this.projectiles, () => this.player.die(), null, this);
    }

    _buildHUD() {
        // Boss HP bar
        const bw = 400;
        this.add.text(400, 22, i18n.t('bossTitle'), {
            fontSize:'22px', fill:'#ff4757', fontStyle:'bold', stroke:'#000', strokeThickness:4
        }).setOrigin(0.5,0).setScrollFactor(0).setDepth(20);

        this._hpBarBg = this.add.rectangle(200,50,bw,16,0x333333).setScrollFactor(0).setDepth(20).setOrigin(0,0);
        this._hpBar  = this.add.rectangle(200,50,bw,16,0xff4757).setScrollFactor(0).setDepth(21).setOrigin(0,0);

        // Player lives
        this._livesText = this.add.text(16, 16, '❤️'.repeat(Math.max(0,this.registry.get('lives'))), {
            fontSize:'22px', fill:'#ff4757', stroke:'#000', strokeThickness:3
        }).setScrollFactor(0).setDepth(20);

        // Score
        this._scoreText = this.add.text(784, 16, `${i18n.t('score')}: ${this.registry.get('score')||0}`, {
            fontSize:'20px', fill:'#ffd700', stroke:'#000', strokeThickness:3
        }).setOrigin(1,0).setScrollFactor(0).setDepth(20);

        // Phase indicator
        this._phaseText = this.add.text(400, 76, 'Phase I', {
            fontSize:'16px', fill:'#00e5ff', stroke:'#000', strokeThickness:2
        }).setOrigin(0.5,0).setScrollFactor(0).setDepth(20);
    }

    _scheduleAttacks() {
        this._attackTimer = this.time.addEvent({
            delay: 1800,
            loop: true,
            callback: this._fireProjectile,
            callbackScope: this
        });
    }

    _fireProjectile() {
        if (this.isOver || !this.player || this.player.isDead) return;
        const count = this.bossPhase === 3 ? 3 : this.bossPhase === 2 ? 2 : 1;
        for (let i = 0; i < count; i++) {
            this.time.delayedCall(i * 220, () => {
                if (this.isOver) return;
                const ink = this.add.circle(this.boss.x, this.boss.y + 20, 9, 0x6a0dad);
                this.physics.add.existing(ink);
                ink.body.setAllowGravity(true);
                const dx = this.player.x - this.boss.x;
                const dy = this.player.y - this.boss.y;
                const len = Math.sqrt(dx*dx+dy*dy) || 1;
                const spd = 280 + this.bossPhase * 50;
                ink.body.setVelocity((dx/len)*spd + Phaser.Math.Between(-40,40), (dy/len)*spd);
                this.projectiles.add(ink);
                this.time.delayedCall(2500, () => { if(ink.active) ink.destroy(); });
            });
        }
    }

    _onPlayerTouchBoss() {
        if (this.isOver || this.player.isDead) return;
        // Stomp check: player falling + above boss top
        if (this.player.body.velocity.y > 0 && this.player.body.bottom <= this.boss.body.y + 30) {
            this.player.setVelocityY(-450);
            this._damageBoss();
        } else {
            this.player.die();
        }
    }

    _damageBoss() {
        this.bossHP--;
        audioManager.playSFX('boss_hit');
        // Flash
        this.boss.setTint(0xff0000);
        this.time.delayedCall(180, () => this.boss.clearTint());
        // Update HP bar
        const ratio = Math.max(0, this.bossHP / 10);
        this._hpBar.setDisplaySize(400 * ratio, 16);
        LevelMixin.addScore(this, 300);
        this._scoreText.setText(`${i18n.t('score')}: ${this.registry.get('score')||0}`);

        // Phase transitions
        if (this.bossHP <= 6 && this.bossPhase < 2) {
            this.bossPhase = 2;
            this._phaseText.setText('Phase II').setFill('#ff9800');
            this.boss.body.setVelocityX(-200);
            this._attackTimer.delay = 1100;
            this._hpBar.setFillStyle(0xff9800);
        }
        if (this.bossHP <= 3 && this.bossPhase < 3) {
            this.bossPhase = 3;
            this._phaseText.setText('Phase III').setFill('#ff4757');
            this.boss.body.setVelocityX(-300);
            this._attackTimer.delay = 700;
            this._hpBar.setFillStyle(0xff4757);
            // Tentacle sweep warning
            this._startSweep();
        }
        if (this.bossHP <= 0) this._bossDefeated();
    }

    _startSweep() {
        this._sweepTimer = this.time.addEvent({
            delay: 3000, loop: true,
            callback: () => {
                if (this.isOver) return;
                const sweep = this.add.rectangle(0, 440, 800, 30, 0x6a0dad, 0.5).setOrigin(0,0).setDepth(8);
                this.physics.add.existing(sweep, true);
                this.physics.add.overlap(this.player, sweep, () => this.player.die(), null, this);
                this.tweens.add({ targets: sweep, alpha: 0, duration: 700, onComplete: () => sweep.destroy() });
            }
        });
    }

    _bossDefeated() {
        this.isOver = true;
        this._attackTimer?.remove();
        this._sweepTimer?.remove();
        audioManager.playSFX('boss_die');
        audioManager.stopBGM();

        // Explosion particles
        this.projectiles.clear(true, true);
        for (let i = 0; i < 20; i++) {
            this.time.delayedCall(i * 60, () => {
                const ex = this.add.circle(
                    this.boss.x + Phaser.Math.Between(-60,60),
                    this.boss.y + Phaser.Math.Between(-60,60),
                    Phaser.Math.Between(8,22),
                    [0xff4757,0xff9800,0xffd700,0x00e5ff][Phaser.Math.Between(0,3)]
                );
                this.tweens.add({ targets:ex, scaleX:0, scaleY:0, alpha:0, duration:500, onComplete:()=>ex.destroy() });
            });
        }
        this.boss.destroy();

        // Big score bonus
        LevelMixin.addScore(this, 5000);

        this.time.delayedCall(2000, () => {
            this.scene.start('ScoreScene', {
                levelCompleted: i18n.t('ocean'),
                nextLevel: 'GameComplete',
                levelBonus: 5000, timeBonus: 0, coinBonus: 0, livesBonus: 0
            });
        });
    }

    handlePlayerDeath() {
        // Boss fight: retry without losing lives
        this.projectiles.clear(true, true);
        this.time.delayedCall(800, () => {
            this.player.isDead = false;
            this.player.clearTint();
            this.player.body.checkCollision.none = false;
            this.player.setPosition(100, 480);
            this.player.setVelocity(0, 0);
            this.player.jumpsLeft = 2;
            const lives = this.registry.get('lives');
            this._livesText.setText('❤️'.repeat(Math.max(0,lives)));
        });
    }

    update() {}
}
window.BossScene = BossScene;
