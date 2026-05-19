class ForestLevel extends Phaser.Scene {
    constructor() { super({ key: 'ForestLevel' }); }

    create() {
        this.cameras.main.setBackgroundColor('#87CEEB');
        this.physics.world.setBounds(0, 0, 3000, 600);
        this.cameras.main.setBounds(0, 0, 3000, 600);

        this.platforms = this.physics.add.staticGroup();
        this.spikes    = this.physics.add.staticGroup();
        this._buildGround();
        this._buildDecorations();

        this.player = new Player(this, 100, 440);
        this.cameras.main.startFollow(this.player, true, 0.07, 0.07);

        // Mobile controls
        if (this.registry.get('platform') === 'mobile') {
            this.mobileCtrl = new MobileControls(this);
            this.player.mobileCtrl = this.mobileCtrl;
        }

        // Goal door
        this.goal = this.physics.add.staticImage(2880, 460, 'coin').setDisplaySize(40, 60).setVisible(false);
        this._drawDoor(2880, 460);

        // Enemies
        this.enemies = this.physics.add.group();
        this.invisWalls = this.physics.add.staticGroup();
        this._buildInvisWalls();
        this._spawnEnemies();

        // Coins
        LevelMixin.setup(this, { levelKey:'forest', nextScene:'DesertLevel', bgm:'forest',
            timerSeconds:90, totalCoins:8, levelBonus:1000 });
        LevelMixin.spawnCoins(this, [
            [350,410],[600,360],[820,300],[1100,430],[1400,390],
            [1700,420],[2100,380],[2500,410]
        ]);

        // Colliders
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemies, this.platforms);
        this.physics.add.collider(this.enemies, this.invisWalls);
        this.physics.add.overlap(this.player, this.enemies,
            (pl, en) => LevelMixin.hitEnemy(this, pl, en, 100), null, this);
        this.physics.add.overlap(this.player, this.goal,
            () => LevelMixin.reachGoal(this, this.player), null, this);
        this.physics.add.overlap(this.player, this.spikes, () => this.player.die(), null, this);

        this.events.on('update', () => LevelMixin.checkFall(this));
    }

    _buildGround() {
        const G = 0x5a3e28, Grass = 0x3d8b37;
        const add = (x,y,w,h,c=G) => {
            const r = this.add.rectangle(x,y,w,h,c).setOrigin(0,0);
            this.platforms.add(r);
            return r;
        };
        // Ground segments with gaps
        add(0,   560, 900,  40, G); this.add.rectangle(0,  560, 900, 8, Grass).setOrigin(0,0);
        add(1000,560, 700,  40, G); this.add.rectangle(1000,560,700, 8, Grass).setOrigin(0,0);
        add(1850,560, 600,  40, G); this.add.rectangle(1850,560,600, 8, Grass).setOrigin(0,0);
        add(2600,560, 500,  40, G); this.add.rectangle(2600,560,500, 8, Grass).setOrigin(0,0);

        // Platforms
        add(300, 460, 140, 18, G);
        add(520, 380, 120, 18, G);
        add(720, 300, 120, 18, G);
        add(950, 390, 130, 18, G);
        add(1150,300, 120, 18, G);
        add(1400,430, 150, 18, G);
        add(1600,340, 120, 18, G);
        add(1800,430, 100, 18, G);
        add(2050,380, 140, 18, G);
        add(2250,300, 130, 18, G);
        add(2500,430, 150, 18, G);
        add(2700,350, 120, 18, G);

        // Spikes (danger platforms)
        this._addSpikes(900,  556, 3);
        this._addSpikes(1700, 556, 4);
        this._addSpikes(2450, 556, 3);
    }

    _addSpikes(startX, y, count) {
        for (let i = 0; i < count; i++) {
            const g = this.add.graphics();
            g.fillStyle(0xaaaaaa);
            g.fillTriangle(0,16,8,0,16,16);
            g.generateTexture(`spike_${startX}_${i}`, 16, 16);
            g.destroy();
            const s = this.add.image(startX + i*16 + 8, y, `spike_${startX}_${i}`).setOrigin(0.5,1);
            this.physics.add.existing(s, true);
            s.body.setSize(14,12).setOffset(1,4);
            this.spikes.add(s);
        }
    }

    _buildInvisWalls() {
        [[0,560],[900,560],[1000,560],[1700,560],[1850,560],[2600,560],[3000,560]].forEach(([x,y]) => {
            const w = this.add.rectangle(x,y-40,8,80,0,0).setOrigin(0,0);
            this.physics.add.existing(w, true);
            this.invisWalls.add(w);
        });
    }

    _spawnEnemies() {
        [[400,535,'enemy_forest',-60],[1100,535,'enemy_forest',-60],
         [1950,535,'enemy_forest',-70],[2650,535,'enemy_forest',-80]].forEach(([x,y,k,vx]) => {
            LevelMixin.spawnEnemy(this, x, y, k, vx, this.enemies);
        });
    }

    _buildDecorations() {
        // Trees
        [[180,500],[480,500],[820,500],[1200,500],[1650,500],[2100,500],[2750,500]].forEach(([x,y]) => {
            this.add.rectangle(x+10,y-50,18,60,0x5a3e28).setOrigin(0,0).setDepth(-1);
            this.add.circle(x+19,y-60,36,0x2d6a2d).setDepth(-1);
        });
        // Clouds
        [[120,80],[450,130],[850,90],[1300,110],[1800,80],[2400,120]].forEach(([x,y]) => {
            [0,25,50].forEach(dx => this.add.circle(x+dx,y,dx===25?38:28,0xffffff,0.85).setDepth(-2));
        });
    }

    _drawDoor(x, y) {
        const g = this.add.graphics().setDepth(5);
        g.fillStyle(0x8B4513); g.fillRect(x-20,y-50,40,60);
        g.fillStyle(0x654321); g.fillRect(x-15,y-45,30,55);
        g.fillStyle(0xffd700); g.fillCircle(x+10,y-20,5);
        // Glow pulse
        this.tweens.add({ targets: g, alpha: 0.6, duration: 800, yoyo: true, repeat: -1 });
    }

    handlePlayerDeath() { LevelMixin.handlePlayerDeath(this); }
    update() {}
}
window.ForestLevel = ForestLevel;
