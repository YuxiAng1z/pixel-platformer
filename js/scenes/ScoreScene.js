class ScoreScene extends Phaser.Scene {
    constructor() { super({ key: 'ScoreScene' }); }

    init(data) {
        this.levelCompleted = data.levelCompleted || '';
        this.nextLevel      = data.nextLevel || 'MenuScene';
        this.levelBonus     = data.levelBonus || 0;
        this.timeBonus      = data.timeBonus  || 0;
        this.coinBonus      = data.coinBonus  || 0;
        this.livesBonus     = data.livesBonus || 0;
    }

    create() {
        this.cameras.main.setBackgroundColor('#0f3460');

        const isComplete = (this.nextLevel === 'GameComplete');
        const titleStr   = isComplete ? i18n.t('allClear') : i18n.t('levelClear');
        const titleColor = isComplete ? '#ffd700' : '#2ecc71';

        // Stars
        for (let i=0;i<60;i++){
            const s=this.add.circle(Phaser.Math.Between(0,800),Phaser.Math.Between(0,600),Phaser.Math.Between(1,3),0xffffff,Phaser.Math.FloatBetween(0.3,1));
            this.tweens.add({targets:s,alpha:0.05,duration:Phaser.Math.Between(600,2000),yoyo:true,repeat:-1});
        }

        const title = this.add.text(400,100,titleStr,{
            fontSize:isComplete?'48px':'42px', fill:titleColor, fontStyle:'bold', stroke:'#000', strokeThickness:6
        }).setOrigin(0.5);
        if (isComplete) this.tweens.add({targets:title,scaleX:1.08,scaleY:1.08,duration:700,yoyo:true,repeat:-1});

        // Confetti
        if (isComplete) {
            let cg=this.add.graphics(); cg.fillStyle(0xffffff); cg.fillRect(0,0,8,8); cg.generateTexture('conf',8,8); cg.destroy();
            this.add.particles(0,-30,'conf',{
                x:{min:0,max:800}, lifespan:3500, speedY:{min:80,max:250}, speedX:{min:-80,max:80},
                gravityY:120, scale:{start:1,end:0}, tint:[0xff4757,0x2ecc71,0x3498db,0xffd700,0xff79c6], frequency:40
            });
        }

        this.add.text(400,165,`${i18n.t('completed')}: ${this.levelCompleted}`,{fontSize:'26px',fill:'#ecf0f1'}).setOrigin(0.5);

        // Score breakdown table
        const rows = [
            [i18n.t('levelBonus'), this.levelBonus],
            [i18n.t('timeBonus'),  this.timeBonus],
            [i18n.t('coinBonus'),  this.coinBonus],
            [i18n.t('livesBonus'), this.livesBonus],
        ];
        let rowY = 220;
        rows.forEach(([label, val])=>{
            if (val <= 0) return;
            this.add.text(290,rowY,label,{fontSize:'20px',fill:'#aaa'}).setOrigin(1,0);
            this.add.text(310,rowY,`+${val}`,{fontSize:'20px',fill:'#ffd700'});
            rowY+=36;
        });

        const totalScore = this.registry.get('score') || 0;
        this.add.text(400,rowY+14,`${i18n.t('totalScore')}: ${totalScore}`,{
            fontSize:'30px',fill:'#ffd700',fontStyle:'bold',stroke:'#000',strokeThickness:4
        }).setOrigin(0.5);

        // High score
        let hs = parseInt(localStorage.getItem('mario_highscore')||'0');
        if (totalScore > hs) {
            localStorage.setItem('mario_highscore', totalScore);
            const nr=this.add.text(400,rowY+54,i18n.t('newRecord'),{fontSize:'24px',fill:'#ff4757',fontStyle:'bold'}).setOrigin(0.5);
            this.tweens.add({targets:nr,alpha:0,duration:450,yoyo:true,repeat:-1});
        }

        // Button
        const btnLabel = isComplete ? i18n.t('backToMenu') : i18n.t('nextLevel');
        const btn = this.add.rectangle(400,520,260,54,isComplete?0x8e44ad:0x27ae60).setInteractive().setOrigin(0.5);
        btn.setStrokeStyle(2,0xffffff,0.4);
        this.add.text(400,520,btnLabel,{fontSize:'24px',fill:'#fff',fontStyle:'bold',stroke:'#000',strokeThickness:3}).setOrigin(0.5);
        btn.on('pointerdown',()=>{
            audioManager.stopBGM();
            if (isComplete) this.scene.start('MenuScene');
            else this.scene.start(this.nextLevel);
        });
        btn.on('pointerover',()=>btn.setAlpha(0.8));
        btn.on('pointerout', ()=>btn.setAlpha(1));
    }
}
window.ScoreScene = ScoreScene;
