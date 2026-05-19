class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setDisplaySize(36, 36);
        this.body.setSize(24, 30);
        this.body.setOffset(6, 3);

        this.setCollideWorldBounds(false);
        this.setBounce(0.05);

        this.moveSpeed = 210;
        this.jumpForce = -650;
        this.isDead = false;
        this.jumpsLeft = 2; // double jump

        const platform = scene.registry.get('platform') || 'pc';
        this.isMobile = (platform === 'mobile');

        if (!this.isMobile) {
            this.cursors = scene.input.keyboard.createCursorKeys();
            this.wasd = scene.input.keyboard.addKeys({
                up:    Phaser.Input.Keyboard.KeyCodes.W,
                left:  Phaser.Input.Keyboard.KeyCodes.A,
                down:  Phaser.Input.Keyboard.KeyCodes.S,
                right: Phaser.Input.Keyboard.KeyCodes.D,
            });
            this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            // Track jump keydown for single trigger
            this._jumpDown = false;
        }

        this.mobileCtrl = null; // set by level after construction
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        if (this.isDead) return;

        const onGround = this.body.touching.down || this.body.blocked.down;
        if (onGround) this.jumpsLeft = 2;

        let goLeft = false, goRight = false, jumpTrigger = false;

        if (this.isMobile && this.mobileCtrl) {
            goLeft  = this.mobileCtrl.left;
            goRight = this.mobileCtrl.right;
            jumpTrigger = this.mobileCtrl.consumeJump();
        } else if (this.cursors) {
            goLeft  = this.cursors.left.isDown  || this.wasd.left.isDown;
            goRight = this.cursors.right.isDown || this.wasd.right.isDown;
            const jumpDown = this.cursors.up.isDown || this.wasd.up.isDown || this.spaceKey.isDown;
            if (jumpDown && !this._jumpDown) { jumpTrigger = true; }
            this._jumpDown = jumpDown;
            // Variable jump height
            if (!jumpDown && this.body.velocity.y < -200) {
                this.setVelocityY(this.body.velocity.y * 0.88);
            }
        }

        // Horizontal
        if (goLeft)       { this.setVelocityX(-this.moveSpeed); this.setFlipX(true); }
        else if (goRight) { this.setVelocityX(this.moveSpeed);  this.setFlipX(false); }
        else              { this.setVelocityX(0); }

        // Jump
        if (jumpTrigger && this.jumpsLeft > 0) {
            const isDouble = this.jumpsLeft < 2;
            this.setVelocityY(isDouble ? this.jumpForce * 0.85 : this.jumpForce);
            this.jumpsLeft--;
            if (isDouble) {
                audioManager.playSFX('double_jump');
                this._showDoubleJumpFX();
            } else {
                audioManager.playSFX('jump');
            }
        }
    }

    _showDoubleJumpFX() {
        const sparks = this.scene.add.particles(this.x, this.y + 10, 'coin', {
            speed: { min: 60, max: 140 },
            lifespan: 300,
            scale: { start: 0.4, end: 0 },
            quantity: 8,
            tint: [0x00e5ff, 0xffffff],
        });
        this.scene.time.delayedCall(300, () => sparks.destroy());
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.setTint(0x888888);
        this.setVelocityY(-250);
        this.body.checkCollision.none = true;
        audioManager.playSFX('die');
        this.scene.time.delayedCall(1000, () => {
            if (this.scene && this.scene.handlePlayerDeath) this.scene.handlePlayerDeath();
        });
    }
}
window.Player = Player;
