// 玩家类，继承自 Phaser.Physics.Arcade.Sprite
// 由于使用纯 JS 无模块系统，我们把它放在全局作用域
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        // 先调用父类构造函数，这里我们暂时不使用图片，而是用一个空的 texture，然后马上给自己画个矩形
        super(scene, x, y, null);

        // 添加到场景和物理世界
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 设置玩家尺寸和外观 (缩小碰撞框防止穿模，精准计算偏移量)
        this.body.setSize(24, 30);
        this.body.setOffset(4, 2); // 调整物理碰撞框偏移，确保 body bottom 完美对齐视觉底部
        
        // 使用 Graphics 绘制玩家细节
        this.graphics = scene.add.graphics();
        // 帽子
        this.graphics.fillStyle(0xff0000, 1);
        this.graphics.fillRect(-14, -16, 28, 8);
        // 脸部
        this.graphics.fillStyle(0xffcc99, 1);
        this.graphics.fillRect(-12, -8, 24, 12);
        // 眼睛
        this.graphics.fillStyle(0x000000, 1);
        this.graphics.fillRect(-6, -4, 4, 4);
        this.graphics.fillRect(6, -4, 4, 4);
        // 衣服
        this.graphics.fillStyle(0x0000ff, 1);
        this.graphics.fillRect(-14, 4, 28, 12);
        // 手
        this.graphics.fillStyle(0xffffff, 1);
        this.graphics.fillRect(-16, 4, 6, 6);
        this.graphics.fillRect(10, 4, 6, 6);
        
        // 物理属性
        this.setCollideWorldBounds(false); // 允许掉出屏幕边界
        this.setBounce(0.1);
        
        // 基础移动速度和跳跃力量（由于全局重力增加，需相应提高）
        this.moveSpeed = 200;
        this.jumpForce = -650;

        // 获取键盘输入
        this.cursors = scene.input.keyboard.createCursorKeys();
        
        // 状态
        this.isDead = false;
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        
        if (this.isDead) return;

        // 让图形跟随物理身体
        this.graphics.x = this.x;
        this.graphics.y = this.y;

        // 水平移动
        if (this.cursors.left.isDown) {
            this.setVelocityX(-this.moveSpeed);
        } else if (this.cursors.right.isDown) {
            this.setVelocityX(this.moveSpeed);
        } else {
            this.setVelocityX(0);
        }

        // 跳跃 (加入郊游控制，按得越久跳得越高，松开按键后如果还在上升则削减速度)
        if (this.cursors.up.isDown && this.body.touching.down) {
            this.setVelocityY(this.jumpForce);
        } else if (!this.cursors.up.isDown && this.body.velocity.y < -200) {
            this.setVelocityY(-200);
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.setTint(0x555555); // 变灰
        this.graphics.fillStyle(0x555555, 1);
        this.graphics.fillRect(-16, -16, 32, 32);
        
        this.setVelocityY(-200); // 死亡弹跳
        this.body.checkCollision.none = true; // 取消碰撞
        
        // 通知场景玩家死亡
        this.scene.time.delayedCall(1000, () => {
            this.scene.handlePlayerDeath();
        });
    }
}
window.Player = Player;
