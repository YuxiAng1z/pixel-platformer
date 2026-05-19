class MenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MenuScene' }); }

    create() {
        audioManager.init();
        audioManager.playBGM('menu');

        this.cameras.main.setBackgroundColor('#1a1a2e');
        this._drawBg();

        // Title
        const title = this.add.text(400, 130, i18n.t('gameName'), {
            fontSize: '52px', fill: '#ffd700', fontStyle: 'bold',
            stroke: '#000', strokeThickness: 8
        }).setOrigin(0.5);
        this.tweens.add({ targets:title, y:118, duration:1600, ease:'Sine.easeInOut', yoyo:true, repeat:-1 });

        // Stats
        const attempts  = localStorage.getItem('mario_attempts') || 0;
        const highScore = localStorage.getItem('mario_highscore') || 0;
        this.add.text(400, 215, `${i18n.t('attempts')}: ${attempts}   ${i18n.t('highScore')}: ${highScore}`, {
            fontSize:'20px', fill:'#aaaacc', stroke:'#000', strokeThickness:2
        }).setOrigin(0.5);

        // Start button
        this._makeBtn(400, 290, i18n.t('startGame'), 0x27ae60, () => this._startGame());

        // Settings button
        this._makeBtn(400, 370, i18n.t('settings'), 0x2980b9, () => this._openSettings());

        // Platform switch
        const plat = this.registry.get('platform') || 'pc';
        const platLabel = plat === 'mobile' ? i18n.t('platform_mobile') : i18n.t('platform_pc');
        this._platBtn = this._makeBtn(400, 450, platLabel, 0x8e44ad, () => this._switchPlatform());

        // Space hotkey
        this.input.keyboard.on('keydown-SPACE', () => this._startGame());

        // Settings modal (hidden)
        this._settingsPanel = null;
    }

    _drawBg() {
        for (let i = 0; i < 100; i++) {
            const s = this.add.circle(Phaser.Math.Between(0,800), Phaser.Math.Between(0,600),
                Phaser.Math.Between(1,3), 0xffffff, Phaser.Math.FloatBetween(0.2,0.9));
            this.tweens.add({ targets:s, alpha:0.05, duration:Phaser.Math.Between(600,2200), yoyo:true, repeat:-1 });
        }
        // Ground strip
        this.add.rectangle(0,530,800,70,0x16213e).setOrigin(0,0);
        // Player silhouette
        const g = this.add.graphics();
        g.fillStyle(0xff0000); g.fillRect(370,494,32,8); // hat
        g.fillStyle(0xffcc99); g.fillRect(372,502,28,14); // face
        g.fillStyle(0x0000cc); g.fillRect(368,516,36,14); // body
    }

    _makeBtn(x, y, label, color, cb) {
        const bg = this.add.rectangle(x, y, 260, 50, color).setInteractive().setOrigin(0.5);
        bg.setStrokeStyle(2, 0xffffff, 0.4);
        const txt = this.add.text(x, y, label, {
            fontSize:'22px', fill:'#fff', fontStyle:'bold', stroke:'#000', strokeThickness:3
        }).setOrigin(0.5);
        bg.on('pointerover', () => { this.tweens.add({targets:[bg,txt],scaleX:1.06,scaleY:1.06,duration:80}); bg.setAlpha(0.85); });
        bg.on('pointerout',  () => { this.tweens.add({targets:[bg,txt],scaleX:1,scaleY:1,duration:80}); bg.setAlpha(1); });
        bg.on('pointerdown', () => { bg.setAlpha(0.6); cb(); });
        return { bg, txt };
    }

    _openSettings() {
        if (this._settingsPanel) { this._settingsPanel.forEach(o=>o.destroy()); this._settingsPanel=null; return; }
        const objs = [];
        const panel = this.add.rectangle(400,300,420,310,0x0f3460,1).setDepth(10);
        panel.setStrokeStyle(2,0x00e5ff);
        objs.push(panel);

        // Close
        const closeBtn = this.add.text(595,162,'✕',{fontSize:'22px',fill:'#aaa'}).setDepth(11).setInteractive();
        closeBtn.on('pointerdown',()=>{ objs.forEach(o=>o.destroy()); this._settingsPanel=null; });
        objs.push(closeBtn);

        // Timer mode
        const timerOn = this.registry.get('timerMode') || false;
        objs.push(this.add.text(220,200,i18n.t('timerMode'),{fontSize:'22px',fill:'#fff',stroke:'#000',strokeThickness:2}).setDepth(11));
        const timerVal = this.add.text(550,200,timerOn?i18n.t('timerOn'):i18n.t('timerOff'),{
            fontSize:'22px',fill:timerOn?'#2ecc71':'#e74c3c',fontStyle:'bold'
        }).setOrigin(1,0).setDepth(11).setInteractive();
        timerVal.on('pointerdown',()=>{
            const cur = this.registry.get('timerMode') || false;
            this.registry.set('timerMode', !cur);
            timerVal.setText(!cur?i18n.t('timerOn'):i18n.t('timerOff'));
            timerVal.setFill(!cur?'#2ecc71':'#e74c3c');
        });
        objs.push(timerVal);

        // Language
        objs.push(this.add.text(220,250,i18n.t('language'),{fontSize:'22px',fill:'#fff',stroke:'#000',strokeThickness:2}).setDepth(11));
        const langs = ['zh-CN','zh-TW','en','ja'];
        const labels= ['简中','繁中','EN','日'];
        langs.forEach((l,idx)=>{
            const lx = 390+idx*44, ly=250;
            const isActive = i18n.getLang()===l;
            const lb=this.add.rectangle(lx,ly+14,38,28,isActive?0x00e5ff:0x2c3e50).setDepth(11).setInteractive();
            lb.setStrokeStyle(1,0xffffff,0.4);
            const lt=this.add.text(lx,ly+14,labels[idx],{fontSize:'13px',fill:isActive?'#000':'#fff',fontStyle:'bold'}).setOrigin(0.5).setDepth(12);
            lb.on('pointerdown',()=>{
                i18n.setLang(l);
                // Restart scene to refresh all text
                objs.forEach(o=>o.destroy()); this._settingsPanel=null;
                this.scene.restart();
            });
            objs.push(lb,lt);
        });

        // Music toggle
        objs.push(this.add.text(220,310,i18n.getLang()==='ja'?'BGM':'音乐',{fontSize:'22px',fill:'#fff',stroke:'#000',strokeThickness:2}).setDepth(11));
        const musicBtn = this.add.text(550,310,audioManager.muted?'OFF':'ON',{
            fontSize:'22px',fill:audioManager.muted?'#e74c3c':'#2ecc71',fontStyle:'bold'
        }).setOrigin(1,0).setDepth(11).setInteractive();
        musicBtn.on('pointerdown',()=>{
            const muted = audioManager.toggle();
            musicBtn.setText(muted?'OFF':'ON');
            musicBtn.setFill(muted?'#e74c3c':'#2ecc71');
            if (!muted) audioManager.playBGM('menu');
        });
        objs.push(musicBtn);

        this._settingsPanel = objs;
    }

    _switchPlatform() {
        const cur = this.registry.get('platform') || 'pc';
        const next = cur === 'pc' ? 'mobile' : 'pc';
        localStorage.setItem('pixel_platform', next);
        this.registry.set('platform', next);
        if (this._platBtn) {
            this._platBtn.txt.setText(next === 'mobile' ? i18n.t('platform_mobile') : i18n.t('platform_pc'));
        }
    }

    _startGame() {
        let attempts = parseInt(localStorage.getItem('mario_attempts')||'0');
        localStorage.setItem('mario_attempts', attempts+1);
        this.registry.set('lives', 3);
        this.registry.set('score', 0);
        this.registry.set('dead_enemies', []);
        audioManager.stopBGM();
        this.scene.start('ForestLevel');
    }
}
window.MenuScene = MenuScene;
