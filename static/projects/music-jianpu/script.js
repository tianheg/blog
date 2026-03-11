// 简谱展示网 - 主JavaScript文件
document.addEventListener('DOMContentLoaded', function() {
    console.log('简谱展示网已加载');
    
    // 初始化所有功能
    initMobileMenu();
    initScores();
    initCategories();
    initSearch();
    renderExampleScore();
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
// Musje 语法说明:
//   音符: 1-7 (步进), #/b/n (升降号), '上标八度 / ,下标八度
//   时值: --- 全音符, - 二分音符, (无标记) 四分音符, _ 八分音符, = 十六分音符
//   附点: . 紧跟在时值后（无空格），如 3. 附点四分 / 3_. 附点八分
//   延音/休止: 0 休止符
//   注意: 时值标记必须紧接音高，不能有空格（5- 正确，5 - 错误）
const scoresData = [
//     {
//         id: 1,
//         title: "小星星",
//         composer: "传统儿歌",
//         category: "children",
//         difficulty: "简单",
//         source: `title: 小星星
// composer: 传统儿歌

// 4/4
// 1 1 5 5 | 6 6 5- |
// 4 4 3 3 | 2 2 1- |

// 5 5 4 4 | 3 3 2- |
// 5 5 4 4 | 3 3 2- |

// 1 1 5 5 | 6 6 5- |
// 4 4 3 3 | 2 2 1- |`
//     },
//     {
//         id: 2,
//         title: "茉莉花",
//         composer: "江苏民歌",
//         category: "folk",
//         difficulty: "中等",
//         source: `title: 茉莉花
// composer: 江苏民歌

// 4/4
// 3 3 5 6 | 1 1 6- |
// 5 5 6 1 | 6 5 5- |

// 3 3 5 6 | 1 1 6- |
// 5 5 6 1 | 6 5 5- |

// 5 5 5 3 | 5 6 1- |
// 2 2 3 5 | 3 2 2- |

// 3 2 3 5 6 | 1 6 1 2 |
// 3 2 1 6 5 | 6 1 5- |`
//     },
//     {
//         id: 3,
//         title: "月亮代表我的心",
//         composer: "翁清溪",
//         category: "pop",
//         difficulty: "中等",
//         // 修复: 7_ . 6_ → 7. 6_（附点四分+八分）; 延音 X_ - - - → X---（全音符）
//         source: `title: 月亮代表我的心
// composer: 翁清溪

// 4/4
// 5_ 3_ 2_ 1_ | 7. 6_ 7_ 1_ 2_ | 3_ 5_ 4_ 3_ 2_ | 2--- |

// 5_ 3_ 2_ 1_ | 7. 6_ 7_ 1_ 2_ | 3_ 5_ 4_ 3_ 2_ | 1--- |

// 5 5 3 2 1 | 2_ 5_ 3_ 2_ 1_ | 7_ 6_ 7_ 1_ 2_ | 3_ 2_ 1_ 2- |

// 6 6 5 3 2 | 3_ 5_ 3_ 2_ 1_ | 7_ 6_ 7_ 1_ 2_ | 1--- |`
//     },
    {
        id: 4,
        title: "欢乐颂",
        composer: "贝多芬",
        category: "classical",
        difficulty: "简单",
        // 修复: X - → X-（二分音符紧接音高）
        // 去掉 title/composer，卡片头部已显示
        source: `4/4
3 3 4 5 | 5 4 3 2 | 1 1 2 3 | 3. 2_ 2- |

3 3 4 5 | 5 4 3 2 | 1 1 2 3 | 2. 1_ 1- |

2 2 3 1 | 2_ 3_ 4 3 1 | 2_ 3_ 4 3 2 | 1 2 5- |

3 3 4 5 | 5 4 3 2 | 1 1 2 3 | 2. 1_ 1- |`
    },
//     {
//         id: 5,
//         title: "送别",
//         composer: "李叔同",
//         category: "folk",
//         difficulty: "中等",
//         // 修复: i_ → 1'_（高音1八分音符）; 5_ - → 5-（二分音符）
//         source: `title: 送别
// composer: 李叔同

// 4/4
// 5_ 3_ 5_ 1'_ | 6_ 1'_ 5- | 5_ 3_ 5_ 1'_ | 6_ 1'_ 5- |

// 5_ 3_ 5_ 7_ | 6_ 1'_ 5- | 5_ 3_ 5_ 7_ | 6_ 1'_ 5- |

// 6_ 1'_ 1 6_ | 5_ 3_ 5_ 2_ | 3_ 5_ 5_ 3_ | 2_ 1_ 2- |

// 6_ 1'_ 1 6_ | 5_ 3_ 5_ 2_ | 3_ 5_ 5_ 3_ | 2_ 1_ 1- |`
//     },
//     {
//         id: 6,
//         title: "童年",
//         composer: "罗大佑",
//         category: "pop",
//         difficulty: "中等",
//         source: `title: 童年
// composer: 罗大佑

// 4/4
// 3 3 3 3 | 3 3 3 3 | 3 5 5 5 | 5 5 5 5 |

// 5 5 5 5 | 5 5 5 5 | 5 2 2 2 | 2 2 2 2 |

// 2 2 2 2 | 2 2 2 2 | 2 5 5 5 | 5 5 5 5 |

// 5 5 5 5 | 5 5 5 5 | 5 1 1 1 | 1 1 1 1 |`
//     },
//     {
//         id: 7,
//         title: "浏阳河",
//         composer: "湖南民歌",
//         category: "folk",
//         difficulty: "中等",
//         // 修复: X - → X-
//         source: `title: 浏阳河
// composer: 湖南民歌

// 4/4
// 5 6 1 6 | 5 3 5- | 1 6 1 2 | 3 5 2- |

// 3 5 3 2 | 1 6 5- | 5 6 1 6 | 5 3 5- |

// 1 6 1 2 | 3 5 2- | 3 5 3 2 | 1 6 1- |`
//     },
//     {
//         id: 8,
//         title: "生日快乐",
//         composer: "传统歌曲",
//         category: "children",
//         difficulty: "简单",
//         // 修复: X_ - → X-（二分音符）
//         source: `title: 生日快乐
// composer: 传统歌曲

// 3/4
// 5_ 5_ 6_ 5_ | 1_ 7- |
// 5_ 5_ 6_ 5_ | 2_ 1- |
// 5_ 5_ 5_ 3_ | 1_ 7_ 6- |
// 4 4 3 1 | 2 1- |`
//     }
];

// ==================== 简谱渲染功能 ====================
function initScores() {
    const scoresContainer = document.getElementById('scores-container');
    
    // 清除加载状态
    scoresContainer.innerHTML = '';
    
    // 渲染所有简谱
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
    
    // 异步渲染简谱（等待 DOM 挂载后再渲染）
    setTimeout(() => {
        renderScore(score.id, score.source);
    }, 100);
    
    return card;
}

/**
 * 将 musje 渲染出的 SVG 元素设置为响应式
 */
function makeScoreSvgResponsive(svgEl) {
    if (!svgEl) return;
    const w = svgEl.getAttribute('width');
    const h = svgEl.getAttribute('height');
    // 设置 viewBox 保持纵横比，再用 CSS 宽度撑满容器
    if (w && h && !svgEl.getAttribute('viewBox')) {
        svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }
    svgEl.removeAttribute('width');
    svgEl.removeAttribute('height');
    svgEl.style.display = 'block';
    svgEl.style.width = '100%';
    svgEl.style.height = 'auto';
}

function renderScore(scoreId, scoreSource) {
    const container = document.getElementById(`score-${scoreId}`);
    if (!container) return;
    
    try {
        console.log(`解析简谱 ${scoreId}: "${scoreSource.split('\n')[0]}"`);
        const score = musje.parse(scoreSource);
        console.log(`简谱 ${scoreId} 解析成功`);
        
        // 清空容器
        container.innerHTML = '';
        
        // score.render() 返回 SVG DOM 元素
        const svgEl = score.render();
        
        if (svgEl) {
            makeScoreSvgResponsive(svgEl);
            container.appendChild(svgEl);
            console.log(`简谱 "${scoreId}" 渲染成功`);
        } else {
            console.warn(`简谱 "${scoreId}" render() 返回空值`);
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>简谱渲染失败: render() 返回空值</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error(`渲染简谱 "${scoreId}" 时出错:`, error);
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>简谱渲染失败: ${error.message}</p>
                <details>
                    <summary>详细信息</summary>
                    <pre>${error.stack ? error.stack.substring(0, 300) : error.message}</pre>
                </details>
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

// ==================== 示例简谱渲染（关于部分） ====================
function renderExampleScore() {
    const exampleContainer = document.getElementById('example-score');
    if (!exampleContainer) return;
    
    const exampleSource = `title: 小星星示例
4/4
1 1 5 5 | 6 6 5- |
4 4 3 3 | 2 2 1- |`;
    
    try {
        console.log('渲染示例简谱...');
        const score = musje.parse(exampleSource);
        exampleContainer.innerHTML = '';
        
        const svgEl = score.render();
        if (svgEl) {
            makeScoreSvgResponsive(svgEl);
            exampleContainer.appendChild(svgEl);
            console.log('示例简谱渲染成功');
        }
    } catch (error) {
        console.error('示例简谱渲染失败:', error);
        exampleContainer.innerHTML = `<p class="error">示例简谱渲染失败: ${error.message}</p>`;
    }
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

// ==================== 错误处理 ====================
window.addEventListener('error', function(event) {
    console.error('全局错误:', event.error);
    
    // 显示友好的错误消息
    if (event.error && event.error.message && event.error.message.includes('musje')) {
        const scoresContainer = document.getElementById('scores-container');
        if (scoresContainer && !scoresContainer.querySelector('.global-error')) {
            scoresContainer.innerHTML = `
                <div class="global-error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>简谱库加载失败</h3>
                    <p>Musje库可能未正确加载，请刷新页面或检查网络连接。</p>
                    <p>错误信息: ${event.error.message}</p>
                </div>
            `;
        }
    }
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
