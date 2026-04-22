// 简谱播放器 - 从 JSON 文件加载歌曲
document.addEventListener('DOMContentLoaded', async function() {
    const container = document.getElementById('score-container');

    const sn = new SN.SimpleNotation(container, {
        resize: true,
        debug: false,
        score: {
            chordType: "default",
            scoreType: "simple",
            showChordLine: true,
            chordLineHeight: 70
        }
    });

    // 从 JSON 文件加载歌曲数据
    try {
        const response = await fetch('songs/欢乐颂.json');
        const songData = await response.json();
        sn.loadData(songData);
    } catch (error) {
        console.error('加载歌曲数据失败:', error);
    }
});
