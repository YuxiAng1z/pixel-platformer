const LANG_DATA = {
    'zh-CN': {
        gameName: '像素风闯关游戏', startGame: '开始游戏', settings: '⚙ 设置',
        timerMode: '计时模式', timerOn: '开启', timerOff: '关闭', language: '语言',
        attempts: '闯关次数', highScore: '最高分', lives: '生命', score: '分数',
        time: '时间', coins: '金币', levelClear: '关卡完成！',
        allClear: '🎉 恭喜全部通关！ 🎉', nextLevel: '进入下一关',
        backToMenu: '回到主菜单', newRecord: '新纪录！', completed: '已通过',
        timeBonus: '时间奖励', coinBonus: '金币奖励', levelBonus: '过关奖励',
        livesBonus: '生命奖励', totalScore: '当前总得分',
        forest: '森林关卡', desert: '沙漠关卡', ocean: '海洋关卡',
        platform_pc: '💻 电脑游玩', platform_mobile: '📱 手机游玩',
        platform_title: '选择游玩方式', platform_pc_desc: '方向键 / WASD + 空格',
        platform_mobile_desc: '虚拟摇杆 + 跳跃按钮', bossTitle: '深海章鱼',
        bossHp: 'BOSS', timeUp: '时间到！', retry: '重试',
        doubleJump: '二段跳！', loading: '加载中...', close: '关闭',
    },
    'zh-TW': {
        gameName: '像素風闖關遊戲', startGame: '開始遊戲', settings: '⚙ 設置',
        timerMode: '計時模式', timerOn: '開啟', timerOff: '關閉', language: '語言',
        attempts: '闖關次數', highScore: '最高分', lives: '生命', score: '分數',
        time: '時間', coins: '金幣', levelClear: '關卡完成！',
        allClear: '🎉 恭喜全部通關！ 🎉', nextLevel: '進入下一關',
        backToMenu: '回到主選單', newRecord: '新紀錄！', completed: '已通過',
        timeBonus: '時間獎勵', coinBonus: '金幣獎勵', levelBonus: '過關獎勵',
        livesBonus: '生命獎勵', totalScore: '當前總得分',
        forest: '森林關卡', desert: '沙漠關卡', ocean: '海洋關卡',
        platform_pc: '💻 電腦遊玩', platform_mobile: '📱 手機遊玩',
        platform_title: '選擇遊玩方式', platform_pc_desc: '方向鍵 / WASD + 空格',
        platform_mobile_desc: '虛擬搖桿 + 跳躍按鈕', bossTitle: '深海章魚',
        bossHp: 'BOSS', timeUp: '時間到！', retry: '重試',
        doubleJump: '二段跳！', loading: '載入中...', close: '關閉',
    },
    'en': {
        gameName: 'Pixel Platformer', startGame: 'Start Game', settings: '⚙ Settings',
        timerMode: 'Timer Mode', timerOn: 'ON', timerOff: 'OFF', language: 'Language',
        attempts: 'Attempts', highScore: 'High Score', lives: 'Lives', score: 'Score',
        time: 'Time', coins: 'Coins', levelClear: 'Level Clear!',
        allClear: '🎉 All Levels Complete! 🎉', nextLevel: 'Next Level',
        backToMenu: 'Back to Menu', newRecord: 'New Record!', completed: 'Completed',
        timeBonus: 'Time Bonus', coinBonus: 'Coin Bonus', levelBonus: 'Level Bonus',
        livesBonus: 'Lives Bonus', totalScore: 'Total Score',
        forest: 'Forest Stage', desert: 'Desert Stage', ocean: 'Ocean Stage',
        platform_pc: '💻 PC Play', platform_mobile: '📱 Mobile Play',
        platform_title: 'Choose Play Mode', platform_pc_desc: 'Arrow Keys / WASD + Space',
        platform_mobile_desc: 'Virtual Joystick + Jump Button', bossTitle: 'Deep Sea Octopus',
        bossHp: 'BOSS', timeUp: "Time's Up!", retry: 'Retry',
        doubleJump: 'Double Jump!', loading: 'Loading...', close: 'Close',
    },
    'ja': {
        gameName: 'ピクセルアクション', startGame: 'ゲームスタート', settings: '⚙ 設定',
        timerMode: 'タイマー', timerOn: 'ON', timerOff: 'OFF', language: '言語',
        attempts: 'プレイ回数', highScore: 'ハイスコア', lives: 'ライフ', score: 'スコア',
        time: '時間', coins: 'コイン', levelClear: 'ステージクリア！',
        allClear: '🎉 全ステージクリア！ 🎉', nextLevel: '次のステージへ',
        backToMenu: 'メニューに戻る', newRecord: '新記録！', completed: 'クリア',
        timeBonus: '時間ボーナス', coinBonus: 'コインボーナス', levelBonus: 'クリアボーナス',
        livesBonus: 'ライフボーナス', totalScore: '合計スコア',
        forest: '森ステージ', desert: '砂漠ステージ', ocean: '海洋ステージ',
        platform_pc: '💻 PC プレイ', platform_mobile: '📱 スマホプレイ',
        platform_title: 'プレイスタイルを選択', platform_pc_desc: '矢印キー / WASD + スペース',
        platform_mobile_desc: '仮想スティック + ジャンプボタン', bossTitle: '深海タコボス',
        bossHp: 'BOSS', timeUp: '時間切れ！', retry: 'リトライ',
        doubleJump: '二段ジャンプ！', loading: 'ロード中...', close: '閉じる',
    }
};

class I18n {
    constructor() {
        this.lang = localStorage.getItem('pixel_lang') || 'zh-CN';
    }
    t(key) {
        return (LANG_DATA[this.lang] && LANG_DATA[this.lang][key]) || LANG_DATA['en'][key] || key;
    }
    setLang(lang) {
        this.lang = lang;
        localStorage.setItem('pixel_lang', lang);
    }
    getLang() { return this.lang; }
}
window.i18n = new I18n();
