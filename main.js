const { Plugin, ItemView, WorkspaceLeaf, Notice } = require('obsidian');

const VIEW_TYPE_TAG_SEARCH = 'tag-search-results-view';

// 自定义视图类 - 显示标签搜索结果
class TagSearchResultsView extends ItemView {
    constructor(leaf, tag, files, plugin, searchType = 'tag') {
        super(leaf);
        this.tag = tag;
        this.files = files;
        this.plugin = plugin;
        this.searchType = searchType; // 'tag' 或 'title'
    }

    getViewType() {
        return VIEW_TYPE_TAG_SEARCH;
    }

    getDisplayText() {
        if (this.searchType === 'title') {
            return `标题: ${this.tag} (${this.files.length})`;
        }
        return `标签: #${this.tag} (${this.files.length})`;
    }

    getIcon() {
        return this.searchType === 'title' ? 'file-text' : 'tag';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('tag-search-results-container');

        // 搜索输入框区域
        const searchBox = container.createEl('div', { cls: 'tag-search-input-container' });
        
        const inputWrapper = searchBox.createEl('div', { cls: 'tag-search-input-wrapper' });
        
        const input = inputWrapper.createEl('input', {
            type: 'text',
            placeholder: '带#搜索标签，不带#搜索标题',
            cls: 'tag-search-input'
        });
        
        // 设置初始值
        if (this.tag) {
            // 根据搜索类型决定是否添加 #
            input.value = this.searchType === 'tag' ? `#${this.tag}` : this.tag;
        }

        const searchButton = inputWrapper.createEl('button', {
            text: '搜索',
            cls: 'tag-search-button'
        });

        // 创建标签建议下拉列表
        const suggestionsContainer = searchBox.createEl('div', { 
            cls: 'tag-suggestions-container' 
        });
        suggestionsContainer.style.display = 'none';

        // 获取所有可用标签
        const getAllTags = () => {
            const tags = new Set();
            const allFiles = this.plugin.app.vault.getMarkdownFiles();
            
            for (const file of allFiles) {
                const cache = this.plugin.app.metadataCache.getFileCache(file);
                if (!cache) continue;

                // 从内容标签收集
                if (cache.tags) {
                    cache.tags.forEach(t => {
                        const tagName = t.tag.replace(/^#/, '');
                        tags.add(tagName);
                    });
                }

                // 从 frontmatter 标签收集
                if (cache.frontmatter && cache.frontmatter.tags) {
                    const fmTags = Array.isArray(cache.frontmatter.tags) 
                        ? cache.frontmatter.tags 
                        : [cache.frontmatter.tags];
                    
                    fmTags.forEach(t => {
                        if (t != null) {
                            tags.add(t.toString());
                        }
                    });
                }
            }

            return Array.from(tags).sort((a, b) => 
                a.localeCompare(b, 'zh-CN', { numeric: true })
            );
        };

        // 显示标签建议
        const showSuggestions = (query) => {
            // 只有输入包含 # 号时才显示标签建议
            if (!query.includes('#')) {
                suggestionsContainer.empty();
                suggestionsContainer.style.display = 'none';
                return;
            }

            const cleanQuery = query.replace(/^#+/, '').toLowerCase().trim();
            
            if (!cleanQuery) {
                suggestionsContainer.empty();
                suggestionsContainer.style.display = 'none';
                return;
            }

            const allTags = getAllTags();
            const matchedTags = allTags.filter(tag => 
                tag.toLowerCase().includes(cleanQuery)
            ).slice(0, 10); // 最多显示10个建议

            if (matchedTags.length === 0) {
                suggestionsContainer.empty();
                suggestionsContainer.style.display = 'none';
                return;
            }

            suggestionsContainer.empty();
            suggestionsContainer.style.display = 'block';

            matchedTags.forEach(tag => {
                const item = suggestionsContainer.createEl('div', {
                    cls: 'tag-suggestion-item'
                });

                const tagIcon = item.createEl('span', {
                    cls: 'tag-suggestion-icon',
                    text: '#'
                });

                const tagText = item.createEl('span', {
                    cls: 'tag-suggestion-text',
                    text: tag
                });

                item.addEventListener('click', () => {
                    input.value = `#${tag}`;
                    suggestionsContainer.style.display = 'none';
                    this.plugin.searchAndDisplay(`#${tag}`);
                });

                item.addEventListener('mouseenter', () => {
                    item.addClass('tag-suggestion-item-active');
                });

                item.addEventListener('mouseleave', () => {
                    item.removeClass('tag-suggestion-item-active');
                });
            });
        };

        // 输入事件监听
        input.addEventListener('input', (e) => {
            showSuggestions(e.target.value);
        });

        // 点击外部关闭建议列表
        document.addEventListener('click', (e) => {
            if (!searchBox.contains(e.target)) {
                suggestionsContainer.style.display = 'none';
            }
        });

        // 键盘导航支持
        let selectedIndex = -1;
        input.addEventListener('keydown', (e) => {
            const items = suggestionsContainer.querySelectorAll('.tag-suggestion-item');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                updateSelection(items, selectedIndex);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                updateSelection(items, selectedIndex);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex >= 0 && items[selectedIndex]) {
                    items[selectedIndex].click();
                } else {
                    searchButton.click();
                }
                selectedIndex = -1;
            } else if (e.key === 'Escape') {
                suggestionsContainer.style.display = 'none';
                selectedIndex = -1;
            }
        });

        const updateSelection = (items, index) => {
            items.forEach((item, i) => {
                if (i === index) {
                    item.addClass('tag-suggestion-item-active');
                    item.scrollIntoView({ block: 'nearest' });
                } else {
                    item.removeClass('tag-suggestion-item-active');
                }
            });
        };

        // 搜索按钮点击事件
        searchButton.addEventListener('click', () => {
            const inputValue = input.value.trim();
            if (inputValue) {
                suggestionsContainer.style.display = 'none';
                // 调用插件的搜索方法
                if (this.plugin) {
                    this.plugin.searchAndDisplay(inputValue);
                }
            }
        });

        // 标题
        const header = container.createEl('div', { cls: 'tag-search-header' });
        let headerText = '搜索结果';
        if (this.tag) {
            headerText = this.searchType === 'title' 
                ? `标题包含 "${this.tag}" 的笔记`
                : `包含标签 #${this.tag} 的笔记`;
        }
        header.createEl('h4', { text: headerText });
        header.createEl('div', { 
            cls: 'tag-search-count',
            text: `共 ${this.files.length} 个文件`
        });

        // 文件列表
        const list = container.createEl('div', { 
            cls: 'tag-search-list nav-files-container'
        });

        if (this.files.length === 0) {
            list.createEl('div', {
                cls: 'tag-search-empty',
                text: '没有找到包含此标签的笔记'
            });
            return;
        }

        for (const item of this.files) {
            const fileItem = list.createEl('div', { 
                cls: 'tree-item nav-file tag-search-item'
            });

            const fileContent = fileItem.createEl('div', {
                cls: 'tree-item-self is-clickable nav-file-title'
            });

            // 文件名/标题
            const titleEl = fileContent.createEl('div', {
                cls: 'tree-item-inner nav-file-title-content',
                text: item.title
            });

            // 点击打开文件
            fileContent.addEventListener('click', async () => {
                await this.app.workspace.getLeaf().openFile(item.file);
            });

            // 悬停显示路径
            fileContent.setAttribute('data-path', item.file.path);
            fileContent.setAttribute('title', item.file.path);
        }

        // 移动端底部添加返回按钮
        if (this.plugin.app.isMobile) {
            const footerBar = container.createEl('div', { cls: 'tag-search-mobile-footer' });
            
            const closeButton = footerBar.createEl('button', {
                cls: 'tag-search-close-button',
                attr: { 'aria-label': '关闭搜索' }
            });
            closeButton.innerHTML = '← 返回';
            
            closeButton.addEventListener('click', () => {
                // 关闭当前视图
                this.leaf.detach();
            });
        }
    }

    async onClose() {
        // 清理
    }
}

// 主插件类
module.exports = class TagClickSearchPlugin extends Plugin {
    async onload() {
        console.log('✅ Tag Click Search: 插件开始加载');

        try {
            // 注册自定义视图
            this.registerView(
                VIEW_TYPE_TAG_SEARCH,
                (leaf) => new TagSearchResultsView(leaf, '', [], this, 'tag')
            );
            console.log('✅ Tag Click Search: 视图已注册');

            // 注册标签点击事件处理器
            this.registerTagClickHandler();
            console.log('✅ Tag Click Search: 事件处理器已注册');

            // 添加样式
            this.addStyles();
            console.log('✅ Tag Click Search: 样式已添加');

            // 添加命令：搜索当前标签
            this.addCommand({
                id: 'search-current-tag',
                name: '搜索当前光标处的标签',
                callback: () => {
                    console.log('🔍 Tag Click Search: 执行搜索命令');
                    const activeView = this.app.workspace.getActiveViewOfType(ItemView);
                    if (activeView && activeView.editor) {
                        const cursor = activeView.editor.getCursor();
                        const line = activeView.editor.getLine(cursor.line);
                        const tag = this.extractTagAtPosition(line, cursor.ch);
                        if (tag) {
                            this.searchAndDisplayTag(tag);
                        } else {
                            console.warn('⚠️ Tag Click Search: 未找到标签');
                        }
                    } else {
                        console.warn('⚠️ Tag Click Search: 未找到活动编辑器');
                    }
                }
            });
            console.log('✅ Tag Click Search: 命令已添加');

            console.log('✅✅✅ Tag Click Search: 插件加载完成！');
            
            // 显示提示
            new Notice('Tag Click Search 插件已加载！点击标签可以搜索。');
            
        } catch (error) {
            console.error('❌ Tag Click Search: 加载失败', error);
            new Notice('Tag Click Search 加载失败，请查看控制台');
        }
    }

    onunload() {
        console.log('Tag Click Search: 插件卸载');
    }

    // 注册标签点击事件处理器
    registerTagClickHandler() {
        console.log('Tag Click Search: 注册标签点击事件处理器');
        
        // 同时监听 click 和 touchend 事件（移动端支持）
        const handleTagClick = (event) => {
            const target = event.target;
            
            // 调试：输出点击的元素信息
            if (target.classList.contains('tag') || 
                target.classList.contains('cm-hashtag') ||
                target.matches('a[href^="#"]')) {
                console.log('Tag Click Search: 检测到标签点击', {
                    tagName: target.tagName,
                    className: target.className,
                    href: target.getAttribute('href'),
                    text: target.textContent,
                    platform: this.app.isMobile ? 'mobile' : 'desktop'
                });
            }

            // 方案 1: 点击阅读模式下的标签链接 a.tag[href^="#"]
            if (target.matches('a.tag[href^="#"]')) {
                console.log('Tag Click Search: 匹配到 a.tag');
                event.preventDefault();
                event.stopPropagation();
                
                const tagName = target.getAttribute('href').substring(1);
                console.log('Tag Click Search: 提取标签名:', tagName);
                this.searchAndDisplayTag(tagName);
                return;
            }

            // 方案 2: 点击编辑器中的标签 .cm-hashtag
            if (target.classList.contains('cm-hashtag') ||
                target.classList.contains('cm-hashtag-begin') ||
                target.classList.contains('cm-hashtag-end')) {
                
                console.log('Tag Click Search: 匹配到 cm-hashtag');
                console.log('Tag Click Search: 点击元素信息', {
                    text: target.textContent,
                    classes: Array.from(target.classList).join(' ')
                });
                
                event.preventDefault();
                event.stopPropagation();
                
                const tagText = this.extractFullTag(target);
                console.log('Tag Click Search: 提取标签文本:', tagText);
                if (tagText) {
                    this.searchAndDisplayTag(tagText);
                }
                return;
            }
        };
        
        // 桌面端使用 click 事件
        this.registerDomEvent(document, 'click', handleTagClick, true);
        
        // 移动端额外监听 touchend 事件
        if (this.app.isMobile) {
            console.log('Tag Click Search: 移动端模式，注册 touchend 事件');
            this.registerDomEvent(document, 'touchend', handleTagClick, true);
        }
    }

    // 提取完整标签（从编辑器的 .cm-hashtag 元素）
    extractFullTag(element) {
        console.log('🔍 开始提取标签，点击元素:', element.textContent, '类名:', Array.from(element.classList).join(' '));
        
        let tagText = '';
        let current = element;

        // 找到标签的开始位置
        while (current && current.classList.contains('cm-hashtag')) {
            if (current.classList.contains('cm-hashtag-begin')) {
                console.log('  ✓ 找到标签开始:', current.textContent);
                break;
            }
            current = current.previousElementSibling;
        }

        // 从开始位置收集所有标签片段，直到遇到 cm-hashtag-end 或不再是 cm-hashtag
        if (current && current.classList.contains('cm-hashtag-begin')) {
            while (current && current.classList.contains('cm-hashtag')) {
                console.log('  → 收集片段:', current.textContent, '类名:', Array.from(current.classList).join(' '));
                tagText += current.textContent;
                
                // 如果是结束标记，停止收集
                if (current.classList.contains('cm-hashtag-end')) {
                    console.log('  ✓ 遇到标签结束，停止收集');
                    break;
                }
                
                current = current.nextElementSibling;
                
                // 如果下一个元素是新的标签开始（cm-hashtag-begin），也要停止
                if (current && current.classList.contains('cm-hashtag-begin')) {
                    console.log('  ✓ 遇到新标签开始，停止收集');
                    break;
                }
            }
        } else {
            // 如果找不到 begin，就使用当前元素的文本
            console.log('  ⚠ 未找到 begin 标记，使用当前元素文本');
            tagText = element.textContent;
        }

        // 清理标签文本（移除 # 号）
        const cleanedTag = tagText.replace(/^#/, '').trim();
        console.log('🎯 最终提取的标签:', cleanedTag);
        return cleanedTag;
    }

    // 从文本和位置提取标签
    extractTagAtPosition(line, position) {
        // 简单实现：查找光标位置的标签
        const tagRegex = /#[\w\u4e00-\u9fa5\-\/]+/g;
        let match;
        while ((match = tagRegex.exec(line)) !== null) {
            if (position >= match.index && position <= match.index + match[0].length) {
                return match[0].substring(1); // 移除 #
            }
        }
        return null;
    }

    // 搜索并显示结果（支持标签和标题搜索）
    async searchAndDisplay(query) {
        try {
            const trimmedQuery = query.trim();
            
            // 判断是标签搜索还是标题搜索
            if (trimmedQuery.startsWith('#')) {
                // 带 # 号，按标签搜索
                const tag = trimmedQuery.substring(1).trim().toLowerCase();
                if (!tag) {
                    console.warn('Tag Click Search: 标签名称为空');
                    return;
                }
                await this.searchByTag(tag);
            } else {
                // 不带 # 号，按标题搜索
                if (!trimmedQuery) {
                    console.warn('Tag Click Search: 搜索关键词为空');
                    return;
                }
                await this.searchByTitle(trimmedQuery);
            }
        } catch (error) {
            console.error('Tag Click Search: 搜索时出错', error);
            new Notice(`搜索时出错: ${error.message}`);
        }
    }

    // 按标签搜索
    async searchByTag(tag) {
        console.log(`🔍 Searching for tag: #${tag}`);

        // 规范化搜索标签（去除所有空格，转小写）
        const normalizedSearchTag = tag.replace(/\s+/g, '').toLowerCase();
        console.log(`📝 Normalized search tag: "${normalizedSearchTag}"`);

        // 获取包含该标签的所有文件
        const filesWithTag = [];
        const allFiles = this.app.vault.getMarkdownFiles();

        for (const file of allFiles) {
            const cache = this.app.metadataCache.getFileCache(file);
            if (!cache) continue;

            // 检查内容中的标签
            const hasTags = cache.tags && cache.tags.some(t => {
                const tagName = t.tag.toLowerCase().replace(/^#/, '').replace(/\s+/g, '');
                const match = tagName === normalizedSearchTag;
                if (match) {
                    console.log(`✅ Found match in content tags: ${t.tag} -> ${tagName}`);
                }
                return match;
            });

            // 检查 frontmatter 中的标签
            let hasFrontmatterTags = false;
            if (cache.frontmatter && cache.frontmatter.tags) {
                if (Array.isArray(cache.frontmatter.tags)) {
                    hasFrontmatterTags = cache.frontmatter.tags.some(t => {
                        if (t == null) return false;
                        const tagName = t.toString().toLowerCase().replace(/\s+/g, '');
                        const match = tagName === normalizedSearchTag;
                        if (match) {
                            console.log(`✅ Found match in frontmatter tags (array): ${t} -> ${tagName}`);
                        }
                        return match;
                    });
                } else if (cache.frontmatter.tags != null) {
                    const tagName = cache.frontmatter.tags.toString().toLowerCase().replace(/\s+/g, '');
                    hasFrontmatterTags = tagName === normalizedSearchTag;
                    if (hasFrontmatterTags) {
                        console.log(`✅ Found match in frontmatter tags (single): ${cache.frontmatter.tags} -> ${tagName}`);
                    }
                }
            }

            if (hasTags || hasFrontmatterTags) {
                // 获取 title（优先使用 frontmatter 的 title）
                let title = cache.frontmatter?.title || file.basename;
                
                // 确保 title 是字符串类型
                if (title != null && typeof title !== 'string') {
                    title = String(title);
                }
                
                filesWithTag.push({
                    file: file,
                    title: title || file.basename,
                    cache: cache
                });
            }
        }

        // 按 title 排序（支持中文）
        filesWithTag.sort((a, b) => {
            const titleA = String(a.title || '');
            const titleB = String(b.title || '');
            return titleA.localeCompare(titleB, 'zh-CN', { numeric: true });
        });

        console.log(`Found ${filesWithTag.length} files with tag #${tag}`);

        // 显示结果
        await this.openSearchView(tag, filesWithTag, 'tag');
    }

    // 按标题搜索（支持空格分词的模糊搜索）
    async searchByTitle(keyword) {
        console.log(`Searching for title: ${keyword}`);

        // 将搜索关键词按空格分词
        const keywords = keyword.trim().split(/\s+/).filter(k => k.length > 0);
        const filesWithTitle = [];
        const allFiles = this.app.vault.getMarkdownFiles();

        for (const file of allFiles) {
            const cache = this.app.metadataCache.getFileCache(file);
            
            // 获取 title（优先使用 frontmatter 的 title）
            let title = cache?.frontmatter?.title || file.basename;
            
            // 确保 title 是字符串类型
            if (title != null && typeof title !== 'string') {
                title = String(title);
            }
            
            if (!title) continue;
            
            const titleLower = title.toLowerCase();
            
            // 检查是否所有关键词都在标题中（不考虑顺序）
            const allKeywordsMatch = keywords.every(kw => 
                titleLower.includes(kw.toLowerCase())
            );
            
            if (allKeywordsMatch) {
                filesWithTitle.push({
                    file: file,
                    title: title,
                    cache: cache
                });
            }
        }

        // 按 title 排序（支持中文）
        filesWithTitle.sort((a, b) => {
            const titleA = String(a.title || '');
            const titleB = String(b.title || '');
            return titleA.localeCompare(titleB, 'zh-CN', { numeric: true });
        });

        console.log(`Found ${filesWithTitle.length} files with title containing all keywords: ${keywords.join(', ')}`);

        // 显示结果
        await this.openSearchView(keyword, filesWithTitle, 'title');
    }

    // 搜索标签并显示结果（保留向后兼容）
    async searchAndDisplayTag(tag) {
        await this.searchByTag(tag);
    }

    // 打开搜索结果视图
    async openSearchView(query, files, searchType) {
        console.log(`📱 Opening search view, platform: ${this.app.isMobile ? 'mobile' : 'desktop'}`);
        
        // 查找现有的搜索视图
        const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_TAG_SEARCH);
        
        let leaf;
        if (existing.length > 0) {
            // 复用现有视图
            console.log('♻️ Reusing existing view');
            leaf = existing[0];
        } else {
            // 创建新视图
            if (this.app.isMobile) {
                // 移动端：使用 window 模式（弹出式窗口）
                console.log('📱 Mobile: Creating window leaf');
                // 尝试使用 popover 或 window 类型的 leaf
                const existingLeaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_TAG_SEARCH);
                if (existingLeaves.length === 0) {
                    // 在移动端，使用 split 但设置为 horizontal（水平分割）
                    // 这样可以让搜索结果占据下半部分，手势向下可以关闭
                    leaf = this.app.workspace.getLeaf('split', 'horizontal');
                } else {
                    leaf = existingLeaves[0];
                }
            } else {
                // 桌面端：在右侧边栏打开
                console.log('🖥️ Desktop: Opening in right sidebar');
                leaf = this.app.workspace.getRightLeaf(false);
            }
        }

        // 设置视图
        await leaf.setViewState({
            type: VIEW_TYPE_TAG_SEARCH,
            active: true,
        });

        // 更新视图内容
        const view = leaf.view;
        if (view instanceof TagSearchResultsView) {
            view.tag = query;
            view.files = files;
            view.plugin = this;
            view.searchType = searchType;
            await view.onOpen();
        }

        // 显示视图
        this.app.workspace.revealLeaf(leaf);
        
        console.log('✅ Search view opened successfully');
    }

    // 打开标签搜索结果视图（保留向后兼容）
    async openTagSearchView(tag, files) {
        await this.openSearchView(tag, files, 'tag');
    }

    // 添加样式
    addStyles() {
        const style = document.createElement('style');
        style.id = 'tag-click-search-styles';
        style.textContent = `
            .tag-search-results-container {
                padding: 10px;
                display: flex;
                flex-direction: column;
                height: 100%;
            }

            /* 移动端底部关闭按钮 */
            .tag-search-mobile-footer {
                position: sticky;
                bottom: 0;
                z-index: 10;
                background-color: var(--background-primary);
                padding: 10px;
                margin: 10px -10px -10px -10px;
                border-top: 1px solid var(--background-modifier-border);
            }

            .tag-search-close-button {
                width: 100%;
                padding: 14px;
                background-color: var(--interactive-accent);
                color: var(--text-on-accent);
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                transition: all 0.2s;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .tag-search-close-button:active {
                background-color: var(--interactive-accent-hover);
                transform: scale(0.98);
            }

            .tag-search-input-container {
                margin-bottom: 15px;
                padding: 10px;
                background-color: var(--background-secondary);
                border-radius: 6px;
                position: relative;
            }

            .tag-search-input-wrapper {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .tag-search-input {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                background-color: var(--background-primary);
                color: var(--text-normal);
                font-size: 14px;
                outline: none;
                transition: border-color 0.2s;
            }

            .tag-search-input:focus {
                border-color: var(--interactive-accent);
                box-shadow: 0 0 0 2px var(--interactive-accent-hover);
            }

            .tag-search-input::placeholder {
                color: var(--text-muted);
            }

            .tag-search-button {
                padding: 8px 16px;
                background-color: var(--interactive-accent);
                color: var(--text-on-accent);
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: background-color 0.2s;
            }

            .tag-search-button:hover {
                background-color: var(--interactive-accent-hover);
            }

            .tag-search-button:active {
                transform: translateY(1px);
            }

            /* 标签建议样式 */
            .tag-suggestions-container {
                position: absolute;
                top: calc(100% - 5px);
                left: 10px;
                right: 10px;
                background-color: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                max-height: 300px;
                overflow-y: auto;
                z-index: 1000;
            }

            .tag-suggestion-item {
                padding: 8px 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: background-color 0.15s;
                border-bottom: 1px solid var(--background-modifier-border);
            }

            .tag-suggestion-item:last-child {
                border-bottom: none;
            }

            .tag-suggestion-item:hover,
            .tag-suggestion-item-active {
                background-color: var(--background-modifier-hover);
            }

            .tag-suggestion-icon {
                color: var(--text-accent);
                font-weight: 600;
                font-size: 14px;
                flex-shrink: 0;
            }

            .tag-suggestion-text {
                color: var(--text-normal);
                font-size: 14px;
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .tag-suggestions-container::-webkit-scrollbar {
                width: 8px;
            }

            .tag-suggestions-container::-webkit-scrollbar-track {
                background: var(--background-secondary);
                border-radius: 4px;
            }

            .tag-suggestions-container::-webkit-scrollbar-thumb {
                background: var(--background-modifier-border);
                border-radius: 4px;
            }

            .tag-suggestions-container::-webkit-scrollbar-thumb:hover {
                background: var(--text-muted);
            }

            .tag-search-header {
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 1px solid var(--background-modifier-border);
            }

            .tag-search-header h4 {
                margin: 0 0 5px 0;
                color: var(--text-normal);
            }

            .tag-search-count {
                font-size: 0.9em;
                color: var(--text-muted);
            }

            .tag-search-list {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .tag-search-item {
                border-radius: 4px;
            }

            .tag-search-item:hover {
                background-color: var(--background-modifier-hover);
            }

            .tag-search-item .tree-item-self {
                padding: 4px 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .tag-search-filename {
                font-size: 0.85em;
                color: var(--text-muted);
            }

            .tag-search-empty {
                padding: 20px;
                text-align: center;
                color: var(--text-muted);
            }

            /* 标签点击时的视觉反馈 */
            a.tag[href^="#"]:hover,
            .cm-hashtag:hover {
                cursor: pointer;
                opacity: 0.8;
            }
        `;
        document.head.appendChild(style);

        // 卸载时移除样式
        this.register(() => {
            const styleEl = document.getElementById('tag-click-search-styles');
            if (styleEl) {
                styleEl.remove();
            }
        });
    }
};
