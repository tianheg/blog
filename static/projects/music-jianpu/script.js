// 简谱展示网 - 主JavaScript文件
document.addEventListener('DOMContentLoaded', function() {
    console.log('简谱展示网已加载');

    // 初始化所有功能
    initMobileMenu();
    initScores();
    initCategories();
    initSearch();
});

// ==================== 移动端菜单 ====================
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (!menuToggle || !navLinks) return;

    menuToggle.addEventListener('click', function() {
        navLinks.classList.toggle('show');
        menuToggle.setAttribute('aria-expanded', navLinks.classList.contains('show'));
    });

    // 点击链接后关闭菜单
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                navLinks.classList.remove('show');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // 窗口大小改变时重置菜单
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navLinks.classList.remove('show');
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

// ==================== 简谱数据 ====================
// 欢乐颂 - 贝多芬 (C大调)
// 3 3 4 5 | 5 4 3 2 | 1 1 2 3 | 3. 2 2- |
const scoresData = [
    {
        id: 1,
        title: "欢乐颂",
        composer: "贝多芬",
        category: "classical",
        difficulty: "简单",
        // MIDI 音符数据 (C4=60, D=62, E=64, F=65, G=67, A=69, B=71, C5=72)
        notes: [
            // 第1-4小节 (第1行)
            // 第一小节: 3 3 4 5 (E E F G)
            { pitch: 64, start: 0, length: 1, intensity: 100 },
            { pitch: 64, start: 1, length: 1, intensity: 100 },
            { pitch: 65, start: 2, length: 1, intensity: 100 },
            { pitch: 67, start: 3, length: 1, intensity: 100 },
            // 第二小节: 5 4 3 2 (G F E D)
            { pitch: 67, start: 4, length: 1, intensity: 100 },
            { pitch: 65, start: 5, length: 1, intensity: 100 },
            { pitch: 64, start: 6, length: 1, intensity: 100 },
            { pitch: 62, start: 7, length: 1, intensity: 100 },
            // 第三小节: 1 1 2 3 (C C D E)
            { pitch: 60, start: 8, length: 1, intensity: 100 },
            { pitch: 60, start: 9, length: 1, intensity: 100 },
            { pitch: 62, start: 10, length: 1, intensity: 100 },
            { pitch: 64, start: 11, length: 1, intensity: 100 },
            // 第四小节: 3. 2 2- (E. D D-)
            { pitch: 64, start: 12, length: 1.5, intensity: 100 },
            { pitch: 62, start: 13.5, length: 0.5, intensity: 100 },
            { pitch: 62, start: 14, length: 2, intensity: 100 },

            // 第5-8小节 (第2行)
            // 第五小节: 3 3 4 5 (E E F G)
            { pitch: 64, start: 16, length: 1, intensity: 100 },
            { pitch: 64, start: 17, length: 1, intensity: 100 },
            { pitch: 65, start: 18, length: 1, intensity: 100 },
            { pitch: 67, start: 19, length: 1, intensity: 100 },
            // 第六小节: 5 4 3 2 (G F E D)
            { pitch: 67, start: 20, length: 1, intensity: 100 },
            { pitch: 65, start: 21, length: 1, intensity: 100 },
            { pitch: 64, start: 22, length: 1, intensity: 100 },
            { pitch: 62, start: 23, length: 1, intensity: 100 },
            // 第七小节: 1 1 2 3 (C C D E)
            { pitch: 60, start: 24, length: 1, intensity: 100 },
            { pitch: 60, start: 25, length: 1, intensity: 100 },
            { pitch: 62, start: 26, length: 1, intensity: 100 },
            { pitch: 64, start: 27, length: 1, intensity: 100 },
            // 第八小节: 2. 1 1- (D. C C-)
            { pitch: 62, start: 28, length: 1.5, intensity: 100 },
            { pitch: 60, start: 29.5, length: 0.5, intensity: 100 },
            { pitch: 60, start: 30, length: 2, intensity: 100 },

            // 第9-12小节 (第3行) - 从第32拍开始
            // 第九小节: 2 2 3 1 (D D E C) - 4个四分音符，第32-36拍
            { pitch: 62, start: 32, length: 1, intensity: 100 },
            { pitch: 62, start: 33, length: 1, intensity: 100 },
            { pitch: 64, start: 34, length: 1, intensity: 100 },
            { pitch: 60, start: 35, length: 1, intensity: 100 },
            // 第十小节: 2 3 4 3 1 (D E F E C) - 5个八分音符(2.5拍) + 休止(1.5拍)，第36-40拍
            { pitch: 62, start: 36, length: 0.5, intensity: 100 },
            { pitch: 64, start: 36.5, length: 0.5, intensity: 100 },
            { pitch: 65, start: 37, length: 0.5, intensity: 100 },
            { pitch: 64, start: 37.5, length: 0.5, intensity: 100 },
            { pitch: 60, start: 38, length: 0.5, intensity: 100 },
            // 第十一小节: 2 3 4 3 2 (D E F E D) - 5个八分音符(2.5拍) + 休止(1.5拍)，第40-44拍
            { pitch: 62, start: 40, length: 0.5, intensity: 100 },
            { pitch: 64, start: 40.5, length: 0.5, intensity: 100 },
            { pitch: 65, start: 41, length: 0.5, intensity: 100 },
            { pitch: 64, start: 41.5, length: 0.5, intensity: 100 },
            { pitch: 62, start: 42, length: 0.5, intensity: 100 },
            // 第十二小节: 1 2 5- (C D G-) - 四分+四分+二分=4拍，第44-48拍
            { pitch: 60, start: 44, length: 1, intensity: 100 },
            { pitch: 62, start: 45, length: 1, intensity: 100 },
            { pitch: 67, start: 46, length: 2, intensity: 100 },

            // 第13-16小节 (第4行) - 从第48拍开始
            // 第十三小节: 3 3 4 5 (E E F G) - 第48-52拍
            { pitch: 64, start: 48, length: 1, intensity: 100 },
            { pitch: 64, start: 49, length: 1, intensity: 100 },
            { pitch: 65, start: 50, length: 1, intensity: 100 },
            { pitch: 67, start: 51, length: 1, intensity: 100 },
            // 第十四小节: 5 4 3 2 (G F E D) - 第52-56拍
            { pitch: 67, start: 52, length: 1, intensity: 100 },
            { pitch: 65, start: 53, length: 1, intensity: 100 },
            { pitch: 64, start: 54, length: 1, intensity: 100 },
            { pitch: 62, start: 55, length: 1, intensity: 100 },
            // 第十五小节: 1 1 2 3 (C C D E) - 第56-60拍
            { pitch: 60, start: 56, length: 1, intensity: 100 },
            { pitch: 60, start: 57, length: 1, intensity: 100 },
            { pitch: 62, start: 58, length: 1, intensity: 100 },
            { pitch: 64, start: 59, length: 1, intensity: 100 },
            // 第十六小节: 2. 1 1- (D. C C-) - 附点四分 + 八分 + 二分，第60-64拍
            { pitch: 62, start: 60, length: 1.5, intensity: 100 },
            { pitch: 60, start: 61.5, length: 0.5, intensity: 100 },
            { pitch: 60, start: 62, length: 2, intensity: 100 },
        ],
        timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
        keySignatures: [{ start: 0, key: 0 }], // C大调
        tempos: [{ start: 0, qpm: 120 }]
    }
];

// ==================== 简谱渲染功能 ====================
function initScores() {
    const scoresContainer = document.getElementById('scores-container');
    scoresContainer.innerHTML = '';

    scoresData.forEach(score => {
        const scoreCard = createScoreCard(score);
        scoresContainer.appendChild(scoreCard);
    });
}

function createScoreCard(score) {
    const card = document.createElement('div');
    card.className = 'score-card';
    card.dataset.id = score.id;
    card.dataset.category = score.category;
    card.dataset.title = score.title.toLowerCase();
    card.dataset.composer = score.composer.toLowerCase();

    card.innerHTML = `
        <div class="score-header">
            <h3 class="score-title">${score.title}</h3>
            <div class="score-meta">
                <span class="composer">作曲: ${score.composer}</span>
                <span class="difficulty">难度: ${score.difficulty}</span>
            </div>
        </div>
        <div class="score-content">
            <div class="score-container" id="score-${score.id}"></div>
        </div>
    `;

    // 等待 DOM 挂载后渲染
    setTimeout(() => {
        renderScore(score.id, score);
    }, 100);

    return card;
}

// 每行的小节数
const MEASURES_PER_LINE = 4;
// 每小节的拍数
const BEATS_PER_MEASURE = 4;

function renderScore(scoreId, scoreData) {
    const container = document.getElementById(`score-${scoreId}`);
    if (!container) return;

    try {
        // 创建4个子容器，每行一个
        for (let line = 0; line < 4; line++) {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'jianpu-line';
            lineDiv.id = `score-${scoreId}-line-${line}`;
            container.appendChild(lineDiv);
        }

        // 配置选项
        const config = {
            noteHeight: 24,
            noteSpacingFactor: 1.5,
            noteColor: 'black',
            defaultKey: 0
        };

        // 为每行渲染对应的小节
        for (let line = 0; line < 4; line++) {
            const startBeat = line * MEASURES_PER_LINE * BEATS_PER_MEASURE;
            const endBeat = startBeat + MEASURES_PER_LINE * BEATS_PER_MEASURE;

            // 筛选当前行的音符
            const lineNotes = scoreData.notes.filter(n => {
                // 音符在当前行的范围内
                const noteStart = n.start;
                const noteEnd = n.start + n.length;
                return noteStart >= startBeat - 0.001 && noteStart < endBeat - 0.001;
            }).map(n => ({
                ...n,
                // 调整音符开始时间为相对于行的起始
                start: n.start - startBeat
            }));

            // 准备当前行的 jianpu 数据
            // 只有第一行显示调号和拍号
            const lineJianpuInfo = {
                notes: lineNotes,
                timeSignatures: line === 0 ? scoreData.timeSignatures : [],
                keySignatures: line === 0 ? scoreData.keySignatures : [],
                tempos: scoreData.tempos
            };

            const lineContainer = document.getElementById(`score-${scoreId}-line-${line}`);
            if (lineContainer && lineNotes.length > 0) {
                const renderer = new jr.JianpuSVGRender(lineJianpuInfo, config, lineContainer);
            }
        }

        console.log(`简谱 "${scoreData.title}" 渲染成功（4行）`);
    } catch (error) {
        console.error(`渲染简谱 "${scoreData.title}" 时出错:`, error);
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>简谱渲染失败: ${error.message}</p>
            </div>
        `;
    }
}

// ==================== 分类过滤功能 ====================
function initCategories() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const scoresContainer = document.getElementById('scores-container');

    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 更新活动按钮
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // 获取选择的分类
            const selectedCategory = this.dataset.category;

            // 过滤简谱
            const scoreCards = scoresContainer.querySelectorAll('.score-card');
            scoreCards.forEach(card => {
                if (selectedCategory === 'all' || card.dataset.category === selectedCategory) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });

            console.log(`显示分类: ${selectedCategory}`);
        });
    });
}

// ==================== 搜索功能 ====================
function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const scoresContainer = document.getElementById('scores-container');

    function performSearch() {
        const query = searchInput.value.trim().toLowerCase();
        const scoreCards = scoresContainer.querySelectorAll('.score-card');

        if (!query) {
            // 如果搜索框为空，显示所有简谱
            scoreCards.forEach(card => {
                card.style.display = 'block';
            });
            return;
        }

        // 搜索简谱
        let foundCount = 0;
        scoreCards.forEach(card => {
            const title = card.dataset.title;
            const composer = card.dataset.composer;

            if (title.includes(query) || composer.includes(query)) {
                card.style.display = 'block';
                foundCount++;
            } else {
                card.style.display = 'none';
            }
        });

        console.log(`搜索 "${query}" 找到 ${foundCount} 个结果`);
    }

    // 搜索按钮点击事件
    searchBtn.addEventListener('click', performSearch);

    // 输入框回车事件
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });

    // 输入框输入事件（实时搜索）
    searchInput.addEventListener('input', function() {
        // 防抖处理，避免频繁搜索
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(performSearch, 300);
    });
}


// ==================== 导航高亮功能 ====================
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');

    let currentSection = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;

        if (pageYOffset >= sectionTop - 100) {
            currentSection = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
});


// ==================== 性能优化 ====================
// 使用Intersection Observer实现懒加载（未来扩展）
if ('IntersectionObserver' in window) {
    const lazyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 未来可以实现简谱的懒加载
                console.log('元素进入视口:', entry.target.id || entry.target.className);
            }
        });
    });

    // 可以在这里添加需要观察的元素
}

console.log('简谱展示网初始化完成');
