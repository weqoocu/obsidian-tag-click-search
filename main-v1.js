const { Plugin, ItemView, WorkspaceLeaf } = require('obsidian');

const VIEW_TYPE_TAG_SEARCH = 'tag-search-results-view';

// 自定义视图类 - 显示标签搜索结果
class TagSearchResultsView extends ItemView {
    constructor(leaf, tag, files) {
        super(leaf);
        this.tag = tag;
        this.files = files;
    }

    getViewType() {
        return VIEW_TYPE_TAG_SEARCH;
    }

    getDisplayText() {
        return `标签: #${this.tag} (${this.files.length})`;
    }

    getIcon() {
        return 'tag';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('tag-search-results-container');

        // 标题
        const header = container.createEl('div', { cls: 'tag-search-header' });
        header.createEl('h4', { 
            text: `包含标签 #${this.tag} 的笔记` 
        });
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

            // 如果 title 和文件名不同，显示文件名
            if (item.title !== item.file.basename) {
                fileContent.createEl('div', {
                    cls: 'tag-search-filename',
                    text: `(${item.file.basename})`
                });
            }

            // 点击打开文件
            fileContent.addEventListener('click', async () => {
                await this.app.workspace.getLeaf().openFile(item.file);
            });

            // 悬停显示路径
            fileContent.setAttribute('data-path', item.file.path);
            fileContent.setAttribute('title', item.file.path);
        }
    }

    async onClose() {
        // 清理
    }
}

// 主插件类
module.exports = class TagClickSearchPlugin extends Plugin {
    async onload() {
        console.log('Loading Tag Click Search plugin');

        // 注册自定义视图
        this.registerView(
            VIEW_TYPE_TAG_SEARCH,
            (leaf) => new TagSearchResultsView(leaf, '', [])
        );

        // 注册标签点击事件处理器
        this.registerTagClickHandler();

        // 添加样式
        this.addStyles();

        // 添加命令：搜索当前标签
        this.addCommand({
            id: 'search-current-tag',
            name: '搜索当前光标处的标签',
            callback: () => {
                const activeView = this.app.workspace.getActiveViewOfType(ItemView);
                if (activeView && activeView.editor) {
                    const cursor = activeView.editor.getCursor();
                    const line = activeView.editor.getLine(cursor.line);
                    const tag = this.extractTagAtPosition(line, cursor.ch);
                    if (tag) {
                        this.searchAndDisplayTag(tag);
                    }
                }
            }
        });
    }

    onunload() {
        console.log('Unloading Tag Click Search plugin');
    }

    // 注册标签点击事件处理器
    registerTagClickHandler() {
        console.log('Tag Click Search: 注册标签点击事件处理器');
        
        // 监听文档点击事件
        this.registerDomEvent(document, 'click', (event) => {
            const target = event.target;
            
            // 调试：输出点击的元素信息
            if (target.classList.contains('tag') || 
                target.classList.contains('cm-hashtag') ||
                target.matches('a[href^="#"]')) {
                console.log('Tag Click Search: 检测到标签点击', {
                    tagName: target.tagName,
                    className: target.className,
                    href: target.getAttribute('href'),
                    text: target.textContent
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
                event.preventDefault();
                event.stopPropagation();
                
                const tagText = this.extractFullTag(target);
                console.log('Tag Click Search: 提取标签文本:', tagText);
                if (tagText) {
                    this.searchAndDisplayTag(tagText);
                }
                return;
            }
        }, true); // 使用捕获阶段
    }

    // 提取完整标签（从编辑器的 .cm-hashtag 元素）
    extractFullTag(element) {
        let tagText = '';
        let current = element;

        // 找到标签的开始位置
        while (current && current.classList.contains('cm-hashtag')) {
            if (current.classList.contains('cm-hashtag-begin')) {
                break;
            }
            current = current.previousElementSibling;
        }

        // 从开始位置收集所有标签片段
        if (current && current.classList.contains('cm-hashtag-begin')) {
            while (current && current.classList.contains('cm-hashtag')) {
                tagText += current.textContent;
                current = current.nextElementSibling;
            }
        } else {
            // 如果找不到 begin，就使用当前元素的文本
            tagText = element.textContent;
        }

        // 清理标签文本（移除 # 号）
        return tagText.replace(/^#/, '').trim();
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

    // 搜索标签并显示结果
    async searchAndDisplayTag(tag) {
        console.log(`Searching for tag: #${tag}`);

        // 清理标签名称
        const cleanTag = tag.replace(/^#/, '').trim().toLowerCase();

        // 获取包含该标签的所有文件
        const filesWithTag = [];
        const allFiles = this.app.vault.getMarkdownFiles();

        for (const file of allFiles) {
            const cache = this.app.metadataCache.getFileCache(file);
            if (!cache) continue;

            // 检查内容中的标签
            const hasTags = cache.tags && cache.tags.some(t => {
                const tagName = t.tag.toLowerCase().replace(/^#/, '');
                return tagName === cleanTag;
            });

            // 检查 frontmatter 中的标签
            let hasFrontmatterTags = false;
            if (cache.frontmatter && cache.frontmatter.tags) {
                if (Array.isArray(cache.frontmatter.tags)) {
                    hasFrontmatterTags = cache.frontmatter.tags.some(t => 
                        t.toString().toLowerCase() === cleanTag
                    );
                } else {
                    hasFrontmatterTags = cache.frontmatter.tags.toString().toLowerCase() === cleanTag;
                }
            }

            if (hasTags || hasFrontmatterTags) {
                // 获取 title（优先使用 frontmatter 的 title）
                const title = cache.frontmatter?.title || file.basename;
                filesWithTag.push({
                    file: file,
                    title: title,
                    cache: cache
                });
            }
        }

        // 按 title 排序（支持中文）
        filesWithTag.sort((a, b) => {
            return a.title.localeCompare(b.title, 'zh-CN', { numeric: true });
        });

        console.log(`Found ${filesWithTag.length} files with tag #${tag}`);

        // 显示结果
        await this.openTagSearchView(cleanTag, filesWithTag);
    }

    // 打开标签搜索结果视图
    async openTagSearchView(tag, files) {
        // 查找现有的标签搜索视图
        const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_TAG_SEARCH);
        
        let leaf;
        if (existing.length > 0) {
            // 复用现有视图
            leaf = existing[0];
        } else {
            // 创建新视图（在右侧边栏）
            leaf = this.app.workspace.getRightLeaf(false);
        }

        // 设置视图
        await leaf.setViewState({
            type: VIEW_TYPE_TAG_SEARCH,
            active: true,
        });

        // 更新视图内容
        const view = leaf.view;
        if (view instanceof TagSearchResultsView) {
            view.tag = tag;
            view.files = files;
            await view.onOpen();
        }

        // 显示视图
        this.app.workspace.revealLeaf(leaf);
    }

    // 添加样式
    addStyles() {
        const style = document.createElement('style');
        style.id = 'tag-click-search-styles';
        style.textContent = `
            .tag-search-results-container {
                padding: 10px;
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
