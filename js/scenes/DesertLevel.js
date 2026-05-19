class DesertLevel extends Phaser.Scene {
    constructor() { super({ key: 'DesertLevel' }); }

    create() {
        this.cameras.main.setBackgroundColor('#e8a838');
        this.physics.world.setBounds(0, 0, 3200, 600);
        this.cameras.main.setBounds(0, 0, 3200, 600);

        this.platforms = this.physics.add.staticGroup();
        this.spikes    = this.physics.add.staticGroup();
        this._buildGround();
        this._buildDecorations();

        this.player = new Player(this, 100, 440);
        this.cameras.main.startFollow(this.player, true, 0.07, 0.07);

        if (this.registry.get('platform') === 'mobile') {
            this.mobileCtrl = new MobileControls(this);
            this.player.mobileCtrl = this.mobileCtrl;
        }

        this.goal = this.physics.add.staticImage(3080, 460, 'coin').setDisplaySize(40,60).setVisible(false);
        this._drawDoor(3080, 460);

        this.enemies = this.physics.add.group();
        this.invisWalls = this.physics.add.staticGroup();
        this._buildInvisWalls();
        this._spawnEnemies();

        // Moving platforms
        this._movingPlatforms = [];
        this._addMovingPlatform(1200, 400, 140, 18, 0xc8a96e, 1100, 1400);
        this._addMovingPlatform(2000, 350, 120, 18, 0xc8a96e, 1900, 2200);

        // Wind zone: pushes player left in [1600..2000]
        this._windActive = false;
        this._windZoneText = this.add.text(1800, 200, '💨 沙尘暴区域', {
            fontSize:'20px', fill:'#fff', stroke:'#000', strokeThickness:3, alpha:0.8
        }).setOrigin(0.5).setDepth(10);

        LevelMixin.setup(this, { levelKey:'desert', nextScene:'OceanLevel', bgm:'desert',
            timerSeconds:90, totalCoins:10, levelBonus:1500 });
        LevelMixin.spawnCoins(this, [
            [280,430],[550,370],[800,490],[1050,430],[1300,360],
            [1600,420],[1900,390],[2200,430],[2550,410],[2850,450]
        ]);

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.enemies, this.invisWalls);
        this.physics.add.overlap(this.player, this.enemies,
            (pl,en) => LevelMixin.hitEnemy(this, pl, en, 150), null, this);
        this.physics.add.overlap(this.player, this.goal,
            () => LevelMixin.reachGoal(this, this.player), null, this);
        this.physics.add.overlap(this.player, this.spikes, () => this.player.die(), null, this);

        this.events.on('update', () => {
            LevelMixin.checkFall(this);
            this._updateMovingPlatforms();
            this._updateWind();
        });
    }

    _buildGround() {
        const S = 0xc8a96e;
        const add = (x,y,w,h) => { const r=this.add.rectangle(x,y,w,h,S).setOrigin(0,0); this.platforms.add(r); return r; };

        add(0,   560, 1100, 40);
        add(1300,560, 800,  40);
        add(2300,560, 500,  40);
        add(2950,560, 350,  40);

        // Step platforms
        add(700, 460, 120, 18); add(900, 370, 120, 18); add(1100,280, 120, 18);
        add(1500,420, 130, 18); add(1700,340, 130, 18); add(1950,430, 110, 18);
        add(2400,430, 130, 18); add(2600,350, 120, 18); add(2800,430, 120, 18);

        // Spikes in gaps
        this._addSpikes(1100,556,4);
        this._addSpikes(2100,556,4);
        this._addSpikes(2800,556,3);
    }

    _addSpikes(startX, y, count) {
        for (let i = 0; i < count; i++) {
            const g = this.add.graphics();
            g.fillStyle(0xdddddd);
            g.fillTriangle(0,16,8,0,16,16);
            g.generateTexture(`dspike_${startX}_${i}`,16,16);
            g.destroy();
            const s = this.add.image(startX+i*16+8,y,`dspike_${startX}_${i}`).setOrigin(0.5,1);
            this.physics.add.existing(s, true);
            s.body.setSize(14,12).setOffset(1,4);
            this.spikes.add(s);
        }
    }

    _buildInvisWalls() {
        [[0,560],[1100,560],[1300,560],[2100,560],[2300,560],[2950,560],[3200,560]].forEach(([x,y]) => {
            const w = this.add.rectangle(x,y-40,8,80,0,0).setOrigin(0,0);
            this.physics.add.existing(w,true);
            this.invisWalls.add(w);
        });
    }

    _spawnEnemies() {
        [[400,535,'enemy_desert',-80],[1000,535,'enemy_desert',-80],
         [1600,535,'enemy_desert',-90],[2100,535,'enemy_desert',-90],
         [2700,535,'enemy_desert',-100]].forEach(([x,y,k,vx]) => {
            LevelMixin.spawnEnemy(this, x, y, k, vx, this.enemies);
        });
    }

    _addMovingPlatform(x, y, w, h, color, minX, maxX) {
        const r = this.add.rectangle(x, y, w, h, color).setOrigin(0.5, 0.5);
        this.physics.add.existing(r, true);
        const mp = { rect: r, minX, maxX, dir: 1, speed: 80 };
        this._movingPlatforms.push(mp);
        this.physics.add.collider(this.player, { getChildren: () => [r], ...this.physics.add.staticGroup() });
        // manual collide in update
    }

    _updateMovingPlatforms() {
        this._movingPlatforms.forEach(mp => {
            mp.rect.x += mp.dir * mp.speed * (1/60);
            mp.rect.body.reset(mp.rect.x, mp.rect.y);
            if (mp.rect.x > mp.maxX) mp.dir = -1;
            if (mp.rect.x < mp.minX) mp.dir = 1;

            // Manual player collision
            if (this.player && !this.player.isDead) {
                const pb = this.player.body, rb = mp.rect.body;
                if (Phaser.Geom.Rectangle.Overlaps(
                    new Phaser.Geom.Rectangle(pb.x,pb.y,pb.width,pb.height),
                    new Phaser.Geom.Rectangle(rb.x,rb.y,rb.width,rb.height)
                ) && this.player.body.velocity.y >= 0 && this.player.y < mp.rect.y) {
                    this.player.setY(mp.rect.y - this.player.displayHeight/2 - 1);
                    this.player.body.setVelocityY(0);
                    this.player.jumpsLeft = 2;
                    this.player.x += mp.dir * mp.speed * (1/60);
                }
            }
        });
    }

    _updateWind() {
        if (!this.player || this.player.isDead) return;
        if (this.player.x > 1600 && this.player.x < 2000) {
            this.player.body.velocity.x -= 60; // sand wind push left
            if (this._windZoneText) this._windZoneText.setAlpha(1);
        } else {
            if (this._windZoneText) this._windZoneText.setAlpha(0.3);
        }
    }

    _buildDecorations() {
        // Pyramids (bg)
        const g = this.add.graphics().setDepth(-3);
        g.fillStyle(0xd4a030,0.7);
        g.fillTriangle(500,560,700,320,900,560);
        g.fillStyle(0xb8860b,0.7);
        g.fillTriangle(1500,560,1700,280,1900,560);
        // Cacti
        [[300,560],[1100,560],[2200,560],[2900,560]].forEach(([x,y]) => {
            const cg = this.add.graphics().setDepth(-1);
            cg.fillStyle(0x2e7d32);
            cg.fillRect(x-6,y-55,12,55); // trunk
            cg.fillRect(x-18,y-42,12,18); // left arm base
            cg.fillRect(x-18,y-42,18,8);  // left arm top
            cg.fillRect(x+6, y-48,12,18); // right arm
            cg.fillRect(x-6, y-56,16,8);  // right arm top
        });
        // Sun
        this.add.circle(720,90,45,0xff6600).setScrollFactor(0).setDepth(-3);
    }

    handlePlayerDeath() { LevelMixin.handlePlayerDeath(this); }
    update() {}
}
window.DesertLevel = DesertLevel;
