class OceanLevel extends Phaser.Scene {
    constructor() { super({ key: 'OceanLevel' }); }

    create() {
        this.cameras.main.setBackgroundColor('#001a3a');
        this.physics.world.setBounds(0, 0, 2800, 600);
        this.cameras.main.setBounds(0, 0, 2800, 600);

        this.platforms = this.physics.add.staticGroup();
        this._buildGround();
        this._buildDecorations();

        this.player = new Player(this, 100, 440);
        // Underwater physics
        this.player.body.setGravityY(-750);
        this.player.moveSpeed = 150;
        this.player.jumpForce = -520;

        this.cameras.main.startFollow(this.player, true, 0.07, 0.07);

        if (this.registry.get('platform') === 'mobile') {
            this.mobileCtrl = new MobileControls(this);
            this.player.mobileCtrl = this.mobileCtrl;
        }

        // Boss trigger zone instead of door
        this.goal = this.physics.add.staticImage(2680, 300, 'boss_ocean')
            .setDisplaySize(70, 70).setAlpha(0.5).setDepth(5);
        this._addGoalPulse();

        this.enemies = this.physics.add.group();
        this._spawnEnemies();

        LevelMixin.setup(this, { levelKey:'ocean', nextScene:'BossScene', bgm:'ocean',
            timerSeconds:100, totalCoins:12, levelBonus:2000 });
        LevelMixin.spawnCoins(this, [
            [280,420],[500,350],[750,480],[950,300],[1150,430],
            [1350,370],[1550,480],[1750,310],[1950,420],[2150,360],
            [2350,430],[2550,300]
        ]);

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.overlap(this.player, this.enemies,
            (pl,en) => LevelMixin.hitEnemy(this, pl, en, 200), null, this);
        this.physics.add.overlap(this.player, this.goal,
            () => LevelMixin.reachGoal(this, this.player), null, this);

        this.events.on('update', () => {
            LevelMixin.checkFall(this);
            this._updateCurrents();
        });
    }

    _buildGround() {
        const C = 0x006994;
        const add = (x,y,w,h) => { const r=this.add.rectangle(x,y,w,h,C).setOrigin(0,0); this.platforms.add(r); return r; };

        add(0,   560, 1500, 40);
        add(1700,560, 600,  40);
        add(2500,560, 400,  40);

        // Floating platforms (more vertical challenge)
        add(300, 420, 100, 16); add(500, 340, 90, 16);  add(700, 260, 100, 16);
        add(900, 340, 90, 16);  add(1100,440, 100, 16);
        add(1300,270, 90, 16);  add(1500,370, 100, 16);
        add(1800,430, 100, 16); add(2000,330, 90, 16);
        add(2200,440, 100, 16); add(2400,300, 100, 16);
        add(2600,430, 80, 16);
    }

    _buildDecorations() {
        // Seaweed
        [[200,560],[600,560],[1000,560],[1400,560],[2000,560],[2600,560]].forEach(([x,y]) => {
            for(let i=0;i<3;i++){
                const g=this.add.graphics().setDepth(-1);
                g.fillStyle(0x2e7d32,0.8);
                for(let j=0;j<4;j++) g.fillRect(x+i*12+Math.sin(j)*6,y-j*16-16,8,18);
            }
        });
        // Corals
        [[350,555],[950,555],[1800,555],[2300,555]].forEach(([x,y]) => {
            const g=this.add.graphics().setDepth(-1);
            g.fillStyle(0xff4081);
            g.fillCircle(x,y,16); g.fillCircle(x+14,y+6,12); g.fillCircle(x-12,y+4,10);
        });
        // Bubbles
        this.time.addEvent({ delay:600, loop:true, callback:() => {
            if(!this.scene.isActive()) return;
            const x = Phaser.Math.Between(0,2800);
            const b = this.add.circle(x,600,Phaser.Math.Between(3,9),0xffffff,0.4).setDepth(2);
            this.physics.add.existing(b); b.body.setVelocityY(-Phaser.Math.Between(60,150));
            b.body.setAllowGravity(false);
            this.time.delayedCall(7000,()=>{ if(b&&b.active) b.destroy(); });
        }});
        // Light rays
        const rayG = this.add.graphics().setDepth(-3).setScrollFactor(0);
        rayG.fillStyle(0x00aaff,0.04);
        [100,250,400,550,650].forEach(x => rayG.fillRect(x,0,40,600));
    }

    _addGoalPulse() {
        this.add.text(2680, 360, '⚠ BOSS', {
            fontSize:'20px', fill:'#ff4757', fontStyle:'bold', stroke:'#000', strokeThickness:3
        }).setOrigin(0.5).setDepth(6);
        this.tweens.add({ targets: this.goal, alpha: 0.9, duration: 600, yoyo: true, repeat: -1 });
    }

    _spawnEnemies() {
        // Jellyfish float up/down
        [[500,330,'enemy_ocean'],[1000,270,'enemy_ocean'],[1600,350,'enemy_ocean'],
         [2000,290,'enemy_ocean'],[2400,330,'enemy_ocean']].forEach(([x,y,k]) => {
            const dead = this.registry.get('dead_enemies') || [];
            const id = `${k}_${x}`;
            if (dead.includes(id)) return;
            const e = this.physics.add.sprite(x, y, k).setDisplaySize(36, 36);
            e.enemyId = id; e.body.setAllowGravity(false);
            e.body.setVelocityY(-55); e.body.setBounce(0,1);
            this.enemies.add(e);
            const top=this.add.rectangle(x,y-80,32,8,0,0); this.physics.add.existing(top,true); this.physics.add.collider(e,top);
            const bot=this.add.rectangle(x,y+80,32,8,0,0); this.physics.add.existing(bot,true); this.physics.add.collider(e,bot);
            // Pulse scale for animation feel
            this.tweens.add({ targets:e, scaleY:0.85, duration:400, yoyo:true, repeat:-1 });
        });
    }

    _updateCurrents() {
        if (!this.player || this.player.isDead) return;
        // Current zone: pushes right in [1700..2100]
        if (this.player.x > 1700 && this.player.x < 2100) {
            this.player.body.velocity.x += 40;
        }
    }

    handlePlayerDeath() { LevelMixin.handlePlayerDeath(this); }
    update() {}
}
window.OceanLevel = OceanLevel;
