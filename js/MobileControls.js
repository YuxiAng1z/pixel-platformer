class MobileControls {
    constructor(scene) {
        this.scene = scene;
        this.left = false;
        this.right = false;
        this.jumpPressed = false;
        this._setupJoystick();
        this._setupJumpBtn();
    }

    _setupJoystick() {
        const s = this.scene;
        const baseR = 55, thumbR = 28;
        const bx = 100, by = 520;

        this.joyBase  = s.add.circle(bx, by, baseR, 0xffffff, 0.18).setScrollFactor(0).setDepth(100);
        this.joyThumb = s.add.circle(bx, by, thumbR, 0x00e5ff, 0.65).setScrollFactor(0).setDepth(101);
        s.add.circle(bx, by, baseR, 0x000000, 0).setScrollFactor(0).setDepth(102).setInteractive({ useHandCursor: true });

        this.joyBase.setStrokeStyle(2, 0x00e5ff, 0.5);

        let dragging = false;
        const zone = s.add.zone(bx, by, baseR*2+20, baseR*2+20).setScrollFactor(0).setDepth(102).setInteractive();

        zone.on('pointerdown', p => { dragging = true; this._updateJoy(p, bx, by, baseR); });
        s.input.on('pointermove', p => { if (dragging) this._updateJoy(p, bx, by, baseR); });
        s.input.on('pointerup',   () => {
            dragging = false; this.left = false; this.right = false;
            s.tweens.add({ targets: this.joyThumb, x: bx, y: by, duration: 80 });
        });
    }

    _updateJoy(p, bx, by, baseR) {
        const dx = p.x - bx, dy = p.y - by;
        const dist = Math.min(Math.sqrt(dx*dx+dy*dy), baseR);
        const angle = Math.atan2(dy, dx);
        this.joyThumb.x = bx + Math.cos(angle)*dist;
        this.joyThumb.y = by + Math.sin(angle)*dist;
        this.left  = dx < -12;
        this.right = dx > 12;
    }

    _setupJumpBtn() {
        const s = this.scene;
        const bx = 710, by = 510;
        const btn = s.add.circle(bx, by, 45, 0xff6b35, 0.75).setScrollFactor(0).setDepth(100).setInteractive();
        btn.setStrokeStyle(3, 0xffffff, 0.6);
        s.add.text(bx, by, '跳', { fontSize: '22px', fill: '#fff', fontStyle: 'bold' })
            .setOrigin(0.5).setScrollFactor(0).setDepth(101);

        btn.on('pointerdown', () => { this.jumpPressed = true;  btn.setAlpha(1); });
        btn.on('pointerup',   () => { this.jumpPressed = false; btn.setAlpha(0.75); });
        btn.on('pointerout',  () => { this.jumpPressed = false; btn.setAlpha(0.75); });
    }

    consumeJump() {
        if (this.jumpPressed) { this.jumpPressed = false; return true; }
        return false;
    }

    destroy() {
        this.joyBase?.destroy();
        this.joyThumb?.destroy();
    }
}
window.MobileControls = MobileControls;
