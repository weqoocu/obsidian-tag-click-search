const { Plugin, ItemView, WorkspaceLeaf, Notice, Setting, PluginSettingTab, Menu } = require('obsidian');

const VIEW_TYPE_TAG_SEARCH = 'tag-search-results-view';

// 自定义视图类 - 显示标签搜索结果
class TagSearchResultsView extends ItemView {
    constructor(leaf, tag, files, plugin, searchType = 'tag') {
        super(leaf);
        this.tag = tag;
        this.files = files;
        this.plugin = plugin;
        this.searchType = searchType; // 'tag' 或 'title'
        this.selectedFiles = new Set(); // 存储选中的文件
        this.dateFilter = null; // 日期过滤器 { startDate, endDate }
        this.allFiles = []; // 存储未过滤的所有文件
        this.metadataChangeHandler = null; // 元数据变化处理器
        this.fileDeleteHandler = null; // 文件删除处理器
        this.fileCreateHandler = null; // 文件创建处理器
    }

    getViewType() {
        return VIEW_TYPE_TAG_SEARCH;
    }

    getDisplayText() {
        if (this.searchType === 'title') {
            return `标题: ${this.tag} (${this.files.length})`;
        } else if (this.searchType === 'combined') {
            return `组合搜索: ${this.tag} (${this.files.length})`;
        } else if (this.searchType === 'complex') {
            return `复杂搜索: ${this.tag} (${this.files.length})`;
        }
        return `标签: #${this.tag} (${this.files.length})`;
    }

    getIcon() {
        if (this.searchType === 'title') {
            return 'file-text';
        } else if (this.searchType === 'combined') {
            return 'search';
        } else if (this.searchType === 'complex') {
            return 'filter';
        }
        return 'tag';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.addClass('tag-search-results-container');
        
        // 保存 container 引用供监听器使用
        this.container = container;

        // 保存所有文件（未过滤）
        this.allFiles = [...this.files];

        // 搜索输入框区域
        const searchBox = container.createEl('div', { cls: 'tag-search-input-container' });
        
        const inputWrapper = searchBox.createEl('div', { cls: 'tag-search-input-wrapper' });
        
        const input = inputWrapper.createEl('input', {
            type: 'text',
            placeholder: '#标签搜索 | 标题搜索 | #标签1 #标签2 | #标签1 -#标签2',
            cls: 'tag-search-input'
        });
        
        // 设置初始值
        if (this.tag) {
            // 根据搜索类型决定是否添加 #
            input.value = this.searchType === 'tag' ? `#${this.tag}` : this.tag;
        }

        // 日期选择按钮（移到搜索按钮前面）
        const dateButton = inputWrapper.createEl('button', {
            text: '📅',
            cls: 'tag-search-date-button',
            attr: { 'aria-label': '选择日期范围', 'title': '选择日期范围' }
        });

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
            // 找到最后一个 # 的位置
            const lastHashIndex = query.lastIndexOf('#');
            
            // 如果没有 # 或者 # 后面有空格，不显示建议
            if (lastHashIndex === -1) {
                suggestionsContainer.empty();
                suggestionsContainer.style.display = 'none';
                return;
            }
            
            // 获取最后一个 # 后面的内容
            const afterHash = query.substring(lastHashIndex + 1);
            
            // 如果 # 后面有空格，说明标签已输入完成，不显示建议
            if (afterHash.includes(' ')) {
                suggestionsContainer.empty();
                suggestionsContainer.style.display = 'none';
                return;
            }

            const cleanQuery = afterHash.toLowerCase().trim();
            
            // 如果 # 后面没有内容，显示所有标签
            const allTags = getAllTags();
            const matchedTags = cleanQuery 
                ? allTags.filter(tag => tag.toLowerCase().includes(cleanQuery)).slice(0, 10)
                : allTags.slice(0, 10);

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
                    // 替换最后一个 # 及其后面的内容为选中的标签
                    const beforeHash = query.substring(0, lastHashIndex);
                    input.value = `${beforeHash}#${tag}`;
                    suggestionsContainer.style.display = 'none';
                    this.plugin.searchAndDisplay(input.value);
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
                    // 传递当前的日期过滤条件
                    const filter = (rangeStart && rangeEnd) ? { startDate: rangeStart, endDate: rangeEnd } : null;
                    this.plugin.searchAndDisplay(inputValue, filter);
                }
            }
        });

        // 日期选择器弹窗容器
        const datePickerModal = container.createEl('div', { cls: 'date-picker-modal' });
        datePickerModal.style.display = 'none';
        
        // 模态框背景（点击关闭）
        const modalOverlay = datePickerModal.createEl('div', { cls: 'date-picker-overlay' });
        
        // 弹窗内容
        const modalContent = datePickerModal.createEl('div', { cls: 'date-picker-content' });
        
        // 弹窗标题和关闭按钮
        const modalHeader = modalContent.createEl('div', { cls: 'date-picker-header' });
        const modalTitle = modalHeader.createEl('div', { cls: 'date-picker-title', text: '选择日期范围' });
        const closeModalBtn = modalHeader.createEl('button', { cls: 'date-picker-close', text: '×' });
        
        // 当前选择状态
        let rangeStart = this.dateFilter?.startDate || null;
        let rangeEnd = this.dateFilter?.endDate || null;
        let currentDisplayMonth = new Date();
        
        // 日期范围显示和快捷操作
        const dateRangeHeader = modalContent.createEl('div', { cls: 'date-range-header' });
        
        const dateRangeDisplay = dateRangeHeader.createEl('div', { cls: 'date-range-display' });
        dateRangeDisplay.textContent = '点击日历选择日期范围';
        
        const quickActions = dateRangeHeader.createEl('div', { cls: 'date-quick-actions' });
        
        const thisWeekBtn = quickActions.createEl('button', { 
            text: '本周', 
            cls: 'date-quick-btn' 
        });
        
        const lastWeekBtn = quickActions.createEl('button', { 
            text: '上周', 
            cls: 'date-quick-btn' 
        });
        
        const clearDateBtn = quickActions.createEl('button', {
            text: '清除',
            cls: 'date-quick-btn date-clear-btn'
        });
        
        // 双日历容器
        const calendarWrapper = modalContent.createEl('div', { cls: 'date-calendar-wrapper' });
        
        // 导航栏
        const navBar = calendarWrapper.createEl('div', { cls: 'date-calendar-nav' });
        
        const prevBtn = navBar.createEl('button', { text: '‹', cls: 'date-nav-arrow' });
        const monthDisplay = navBar.createEl('div', { cls: 'date-month-display' });
        const todayBtn = navBar.createEl('button', { text: '今天', cls: 'date-today-btn' });
        const nextBtn = navBar.createEl('button', { text: '›', cls: 'date-nav-arrow' });
        
        // 日历容器
        const calendarContainer = calendarWrapper.createEl('div', { cls: 'date-calendar-container' });
        
        // 底部按钮
        const modalFooter = modalContent.createEl('div', { cls: 'date-picker-footer' });
        const confirmBtn = modalFooter.createEl('button', { 
            text: '确定', 
            cls: 'date-confirm-btn' 
        });
        const cancelBtn = modalFooter.createEl('button', { 
            text: '取消', 
            cls: 'date-cancel-btn' 
        });
        
        // 更新月份显示
        const updateMonthDisplay = () => {
            const year = currentDisplayMonth.getFullYear();
            const month = currentDisplayMonth.getMonth() + 1;
            const nextMonth = month === 12 ? 1 : month + 1;
            const nextYear = month === 12 ? year + 1 : year;
            monthDisplay.textContent = `${year}年${month}月 - ${nextYear}年${nextMonth}月`;
        };
        
        // 渲染双月日历
        const renderCalendars = () => {
            calendarContainer.empty();
            
            const leftMonth = new Date(currentDisplayMonth);
            const rightMonth = new Date(currentDisplayMonth.getFullYear(), currentDisplayMonth.getMonth() + 1, 1);
            
            this.renderMonthCalendar(leftMonth, calendarContainer, rangeStart, rangeEnd, (date) => handleDateClick(date));
            this.renderMonthCalendar(rightMonth, calendarContainer, rangeStart, rangeEnd, (date) => handleDateClick(date));
            
            updateMonthDisplay();
        };
        
        // 处理日期点击
        const handleDateClick = (date) => {
            if (!rangeStart || (rangeStart && rangeEnd)) {
                // 开始新的选择
                rangeStart = new Date(date);
                rangeStart.setHours(0, 0, 0, 0);
                rangeEnd = null;
            } else {
                // 完成范围选择
                rangeEnd = new Date(date);
                rangeEnd.setHours(23, 59, 59, 999);
                
                // 确保开始日期小于结束日期
                if (rangeEnd < rangeStart) {
                    [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
                    rangeStart.setHours(0, 0, 0, 0);
                    rangeEnd.setHours(23, 59, 59, 999);
                }
            }
            
            updateRangeDisplay();
            renderCalendars();
        };
        
        // 更新日期范围显示
        const updateRangeDisplay = () => {
            if (rangeStart && rangeEnd) {
                const startStr = this.formatDate(rangeStart);
                const endStr = this.formatDate(rangeEnd);
                dateRangeDisplay.textContent = `${startStr} ~ ${endStr}`;
            } else if (rangeStart) {
                dateRangeDisplay.textContent = `${this.formatDate(rangeStart)} ~ 选择结束日期`;
            } else {
                dateRangeDisplay.textContent = '点击日历选择日期范围';
            }
        };
        
        // 打开弹窗
        const openModal = () => {
            datePickerModal.style.display = 'flex';
            
            // 如果已有选择的日期，恢复显示该月份
            if (rangeStart) {
                currentDisplayMonth = new Date(rangeStart);
            } else {
                currentDisplayMonth = new Date();
            }
            
            updateRangeDisplay();
            renderCalendars();
        };
        
        // 关闭弹窗
        const closeModal = () => {
            datePickerModal.style.display = 'none';
        };
        
        // 更新日期按钮显示
        const updateDateButton = () => {
            if (rangeStart && rangeEnd) {
                dateButton.textContent = '📅';
                dateButton.addClass('tag-search-date-button-active');
                const startStr = this.formatDate(rangeStart);
                const endStr = this.formatDate(rangeEnd);
                dateButton.setAttribute('title', `${startStr} ~ ${endStr}`);
            } else {
                dateButton.textContent = '📅';
                dateButton.removeClass('tag-search-date-button-active');
                dateButton.setAttribute('title', '选择日期范围');
            }
        };

        // 应用日期过滤
        const applyDateFilter = () => {
            if (rangeStart && rangeEnd) {
                this.applyDateFilter(rangeStart, rangeEnd);
                this.refreshFileList(container);
                updateDateButton();
                closeModal();
            }
        };
        
        // 清除日期过滤
        const clearDateFilter = () => {
            rangeStart = null;
            rangeEnd = null;
            
            this.clearDateFilter();
            this.refreshFileList(container);
            updateRangeDisplay();
            updateDateButton();
            closeModal();
        };
        
        // 事件绑定
        dateButton.addEventListener('click', openModal);
        clearDateBtn.addEventListener('click', clearDateFilter);
        closeModalBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', closeModal);
        confirmBtn.addEventListener('click', applyDateFilter);
        cancelBtn.addEventListener('click', closeModal);
        
        // 导航事件
        prevBtn.addEventListener('click', () => {
            currentDisplayMonth.setMonth(currentDisplayMonth.getMonth() - 1);
            renderCalendars();
        });
        
        todayBtn.addEventListener('click', () => {
            currentDisplayMonth = new Date();
            renderCalendars();
        });
        
        nextBtn.addEventListener('click', () => {
            currentDisplayMonth.setMonth(currentDisplayMonth.getMonth() + 1);
            renderCalendars();
        });
        
        // 快捷按钮事件
        thisWeekBtn.addEventListener('click', () => {
            const range = this.parseWeekValue('thisWeek');
            rangeStart = range.start;
            rangeEnd = range.end;
            updateRangeDisplay();
            renderCalendars();
            applyDateFilter(); // 自动应用过滤
        });
        
        lastWeekBtn.addEventListener('click', () => {
            const range = this.parseWeekValue('lastWeek');
            rangeStart = range.start;
            rangeEnd = range.end;
            updateRangeDisplay();
            renderCalendars();
            applyDateFilter(); // 自动应用过滤
        });

        // 如果有初始日期过滤，应用它（但不关闭弹窗，因为此时弹窗还没打开）
        if (rangeStart && rangeEnd) {
            this.applyDateFilter(rangeStart, rangeEnd);
            updateDateButton();
        }

        // 渲染头部和列表
        this.renderHeaderAndList(container);

        // 注册元数据变化监听器，实时更新标题和标签
        console.log(`📌 Registering metadata change handler...`);
        this.metadataChangeHandler = this.plugin.app.metadataCache.on('changed', (file) => {
            console.log(`🔔 Metadata changed for: ${file.path}`);
            const cache = this.plugin.app.metadataCache.getFileCache(file);
            if (!cache) {
                console.log(`⚠️ No cache available for: ${file.path}`);
                return;
            }

            let needsRefresh = false;

            // 辅助函数：获取文件的所有标签
            const getFileTags = (cache) => {
                const tags = new Set();
                
                // 从内容中收集标签
                if (cache.tags) {
                    cache.tags.forEach(t => {
                        const tagName = t.tag.toLowerCase().replace(/^#/, '').replace(/\s+/g, '');
                        tags.add(tagName);
                    });
                }
                
                // 从 frontmatter 中收集标签
                if (cache.frontmatter && cache.frontmatter.tags) {
                    const fmTags = Array.isArray(cache.frontmatter.tags) 
                        ? cache.frontmatter.tags 
                        : [cache.frontmatter.tags];
                    
                    fmTags.forEach(t => {
                        if (t != null) {
                            const tagName = t.toString().toLowerCase().replace(/\s+/g, '');
                            tags.add(tagName);
                        }
                    });
                }
                
                return Array.from(tags);
            };

            // 1. 处理标签变化（仅在标签搜索模式下）- 先处理标签，因为可能会影响文件是否在结果中
            if (this.searchType === 'tag') {
                const fileInResults = this.files.find(item => item.file.path === file.path);
                const fileTags = getFileTags(cache);
                const normalizedSearchTag = this.tag.toLowerCase().replace(/\s+/g, '');
                const hasTag = fileTags.includes(normalizedSearchTag);

                if (fileInResults && !hasTag) {
                    // 文件之前在结果中，但现在不再有该标签 - 从结果中移除
                    console.log(`🏷️ Tag removed: ${file.path}`);
                    this.files = this.files.filter(item => item.file.path !== file.path);
                    this.allFiles = this.allFiles.filter(item => item.file.path !== file.path);
                    needsRefresh = true;
                    // 标签已移除，不需要再处理标题更新
                    if (needsRefresh) {
                        this.refreshFileList(this.container);
                    }
                    return;
                } else if (!fileInResults && hasTag) {
                    // 文件之前不在结果中，但现在有该标签 - 添加到结果
                    console.log(`🏷️ Tag added: ${file.path}`);
                    let newTitle = cache.frontmatter?.title || file.basename;
                    if (newTitle != null && typeof newTitle !== 'string') {
                        newTitle = String(newTitle);
                    }
                    const newFileItem = { file, title: newTitle, cache };
                    
                    // 添加到 allFiles
                    this.allFiles.push(newFileItem);
                    
                    // 检查是否通过日期过滤
                    if (!this.dateFilter || this.isWithinDateRange(file, this.dateFilter.startDate, this.dateFilter.endDate)) {
                        this.files.push(newFileItem);
                    }
                    needsRefresh = true;
                }
            }

            // 2. 处理标题变化（对所有搜索类型）
            const fileInResults = this.files.find(item => item.file.path === file.path);
            if (fileInResults) {
                let newTitle = cache.frontmatter?.title || file.basename;
                if (newTitle != null && typeof newTitle !== 'string') {
                    newTitle = String(newTitle);
                }
                
                console.log(`🔍 Checking title: current="${fileInResults.title}", new="${newTitle}"`);
                
                if (fileInResults.title !== newTitle) {
                    console.log(`📝 Title changed: ${fileInResults.title} -> ${newTitle}`);
                    fileInResults.title = newTitle;
                    fileInResults.cache = cache;
                    
                    const fileInAll = this.allFiles.find(item => item.file.path === file.path);
                    if (fileInAll) {
                        fileInAll.title = newTitle;
                        fileInAll.cache = cache;
                    }
                    needsRefresh = true;
                } else {
                    console.log(`✓ Title unchanged for: ${file.path}`);
                }
            } else {
                console.log(`ℹ️ File not in current results: ${file.path}`);
            }

            // 3. 刷新显示
            if (needsRefresh) {
                console.log(`🔄 Refreshing file list...`);
                this.refreshFileList(this.container);
            } else {
                console.log(`⏭️ No refresh needed`);
            }
        });
        console.log(`✅ Metadata change handler registered`);

        // 注册文件删除监听器
        console.log(`📌 Registering file delete handler...`);
        this.fileDeleteHandler = this.plugin.app.vault.on('delete', (file) => {
            console.log(`🗑️ File deleted: ${file.path}`);
            
            // 检查删除的文件是否在当前搜索结果中
            const fileInResults = this.files.find(item => item.file.path === file.path);
            const fileInAll = this.allFiles.find(item => item.file.path === file.path);
            
            if (fileInResults || fileInAll) {
                console.log(`📝 Removing deleted file from search results`);
                
                // 从结果中移除
                this.files = this.files.filter(item => item.file.path !== file.path);
                this.allFiles = this.allFiles.filter(item => item.file.path !== file.path);
                
                // 如果文件被选中，从选中列表中移除
                if (this.selectedFiles.has(file.path)) {
                    this.selectedFiles.delete(file.path);
                }
                
                // 刷新显示
                this.refreshFileList(this.container);
            }
        });
        console.log(`✅ File delete handler registered`);

        // 注册文件创建监听器（延迟检查以等待元数据缓存更新）
        console.log(`📌 Registering file create handler...`);
        this.fileCreateHandler = this.plugin.app.vault.on('create', (file) => {
            // 只处理 markdown 文件
            if (!(file.extension === 'md')) return;
            
            console.log(`📄 File created: ${file.path}`);
            
            // 延迟检查，等待元数据缓存更新
            setTimeout(() => {
                const cache = this.plugin.app.metadataCache.getFileCache(file);
                if (!cache) {
                    console.log(`⚠️ No cache available yet for new file: ${file.path}`);
                    return;
                }
                
                let shouldAdd = false;
                
                // 根据搜索类型判断是否应该添加
                if (this.searchType === 'tag') {
                    // 标签搜索：检查是否包含该标签
                    const getFileTags = (cache) => {
                        const tags = new Set();
                        if (cache.tags) {
                            cache.tags.forEach(t => {
                                const tagName = t.tag.toLowerCase().replace(/^#/, '').replace(/\s+/g, '');
                                tags.add(tagName);
                            });
                        }
                        if (cache.frontmatter && cache.frontmatter.tags) {
                            const fmTags = Array.isArray(cache.frontmatter.tags) 
                                ? cache.frontmatter.tags 
                                : [cache.frontmatter.tags];
                            fmTags.forEach(t => {
                                if (t != null) {
                                    const tagName = t.toString().toLowerCase().replace(/\s+/g, '');
                                    tags.add(tagName);
                                }
                            });
                        }
                        return Array.from(tags);
                    };
                    
                    const fileTags = getFileTags(cache);
                    const normalizedSearchTag = this.tag.toLowerCase().replace(/\s+/g, '');
                    shouldAdd = fileTags.includes(normalizedSearchTag);
                } else if (this.searchType === 'title') {
                    // 标题搜索：检查标题是否包含关键词
                    let title = cache.frontmatter?.title || file.basename;
                    if (title != null && typeof title !== 'string') {
                        title = String(title);
                    }
                    shouldAdd = title.toLowerCase().includes(this.tag.toLowerCase());
                }
                
                if (shouldAdd) {
                    console.log(`✅ New file matches search criteria, adding to results`);
                    
                    // 检查是否已存在（防止重复添加）
                    const alreadyExists = this.allFiles.some(item => item.file.path === file.path);
                    if (alreadyExists) {
                        console.log(`ℹ️ File already exists in results, skipping: ${file.path}`);
                        return;
                    }
                    
                    let title = cache.frontmatter?.title || file.basename;
                    if (title != null && typeof title !== 'string') {
                        title = String(title);
                    }
                    const newFileItem = { file, title, cache };
                    
                    // 添加到 allFiles
                    this.allFiles.push(newFileItem);
                    
                    // 检查是否通过日期过滤
                    if (!this.dateFilter || this.isWithinDateRange(file, this.dateFilter.startDate, this.dateFilter.endDate)) {
                        this.files.push(newFileItem);
                    }
                    
                    // 刷新显示
                    this.refreshFileList(this.container);
                } else {
                    console.log(`ℹ️ New file doesn't match search criteria`);
                }
            }, 500); // 延迟 500ms 等待缓存更新
        });
        console.log(`✅ File create handler registered`);
    }

    // 渲染头部和列表（提取为方法以便复用）
    renderHeaderAndList(container) {
        // 标题
        const header = container.createEl('div', { cls: 'tag-search-header' });
        
        // 标题行容器（包含标题和日期）
        const headerTitleRow = header.createEl('div', { cls: 'tag-search-header-title-row' });
        
        let headerText = '搜索结果';
        if (this.tag) {
            if (this.searchType === 'title') {
                headerText = `标题包含 "${this.tag}" 的笔记`;
            } else if (this.searchType === 'combined') {
                headerText = `组合搜索: ${this.tag}`;
            } else if (this.searchType === 'complex') {
                headerText = `复杂搜索: ${this.tag}`;
            } else {
                headerText = `包含标签 #${this.tag} 的笔记`;
            }
        }
        
        const headerTitle = headerTitleRow.createEl('h4', { text: headerText });
        
        // 显示日期过滤范围（如果有）
        if (this.dateFilter && this.dateFilter.startDate && this.dateFilter.endDate) {
            const startStr = this.formatDate(this.dateFilter.startDate);
            const endStr = this.formatDate(this.dateFilter.endDate);
            const dateRangeInfo = headerTitleRow.createEl('div', { 
                cls: 'tag-search-date-range-info',
                text: `📅 ${startStr} ~ ${endStr}`
            });
        }
        
        const headerActions = header.createEl('div', { cls: 'tag-search-header-actions' });
        
        const countEl = headerActions.createEl('div', { 
            cls: 'tag-search-count',
            text: `共 ${this.files.length} 个文件`
        });

        // 批量操作按钮区域
        const bulkActions = headerActions.createEl('div', { cls: 'tag-search-bulk-actions' });
        
        // 全选/取消全选按钮
        const selectAllBtn = bulkActions.createEl('button', {
            text: '全选',
            cls: 'tag-search-action-button'
        });
        
        // 复制选中内容按钮
        const copyBtn = bulkActions.createEl('button', {
            text: '复制选中 (0)',
            cls: 'tag-search-action-button tag-search-copy-button'
        });
        copyBtn.disabled = true;

        // 导出文件按钮
        const exportBtn = bulkActions.createEl('button', {
            text: '导出文件 (0)',
            cls: 'tag-search-action-button tag-search-export-button'
        });
        exportBtn.disabled = true;

        // 文件列表
        const list = container.createEl('div', { 
            cls: 'tag-search-list nav-files-container'
        });

        // 底部当前笔记操作按钮区域
        const bottomActions = container.createEl('div', { cls: 'tag-search-bottom-actions' });
        
        // 复制当前笔记路径按钮
        const copyPathBtn = bottomActions.createEl('button', {
            text: '📋 复制当前笔记路径',
            cls: 'tag-search-action-button tag-search-copy-path-button',
            attr: { 'aria-label': '复制当前笔记的绝对路径', 'title': '复制当前笔记的绝对路径' }
        });
        
        copyPathBtn.addEventListener('click', async () => {
            const activeFile = this.plugin.app.workspace.getActiveFile();
            if (!activeFile) {
                new Notice('没有打开的笔记');
                return;
            }
            const absolutePath = this.plugin.getAbsolutePath(activeFile.path);
            await navigator.clipboard.writeText(absolutePath);
            new Notice(`已复制路径: ${absolutePath}`);
        });

        // 导出当前笔记按钮
        const exportCurrentBtn = bottomActions.createEl('button', {
            text: '📤 导出当前笔记',
            cls: 'tag-search-action-button tag-search-export-current-button',
            attr: { 'aria-label': '根据当前笔记标签导出', 'title': '根据当前笔记标签导出' }
        });
        
        exportCurrentBtn.addEventListener('click', async () => {
            await this.plugin.exportCurrentNoteByTags();
        });

        if (this.files.length === 0) {
            list.createEl('div', {
                cls: 'tag-search-empty',
                text: '没有找到包含此标签的笔记'
            });
            return;
        }

        // 更新复制按钮状态和文本
        const updateCopyButton = () => {
            const count = this.selectedFiles.size;
            copyBtn.textContent = count > 0 ? `复制选中 (${count})` : '复制选中 (0)';
            copyBtn.disabled = count === 0;
            
            // 更新导出按钮
            exportBtn.textContent = count > 0 ? `导出文件 (${count})` : '导出文件 (0)';
            exportBtn.disabled = count === 0;
            
            // 更新全选按钮文本
            selectAllBtn.textContent = count === this.files.length ? '取消全选' : '全选';
        };

        // 全选/取消全选功能
        selectAllBtn.addEventListener('click', () => {
            const shouldSelectAll = this.selectedFiles.size !== this.files.length;
            
            if (shouldSelectAll) {
                // 全选
                this.files.forEach(item => this.selectedFiles.add(item.file.path));
            } else {
                // 取消全选
                this.selectedFiles.clear();
            }
            
            // 更新所有复选框状态
            const checkboxes = list.querySelectorAll('.tag-search-checkbox');
            checkboxes.forEach((checkbox, index) => {
                checkbox.checked = shouldSelectAll;
                const fileItem = checkbox.closest('.tag-search-item');
                if (shouldSelectAll) {
                    fileItem?.addClass('tag-search-item-selected');
                } else {
                    fileItem?.removeClass('tag-search-item-selected');
                }
            });
            
            updateCopyButton();
        });

        // 复制选中内容功能
        copyBtn.addEventListener('click', async () => {
            if (this.selectedFiles.size === 0) {
                new Notice('请先选择要复制的笔记');
                return;
            }

            try {
                const contents = [];
                
                for (const filePath of this.selectedFiles) {
                    const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
                    if (file && file.extension === 'md') {
                        const content = await this.plugin.app.vault.read(file);
                        // 去除 YAML frontmatter
                        const contentWithoutYaml = this.removeYamlFrontmatter(content);
                        // 清理特殊内容（图片、iframe、mactagmap、base引用等）
                        const cleanedContent = this.cleanContent(contentWithoutYaml);
                        
                        // 从文件列表中找到对应的 item，获取其 title
                        const fileItem = this.files.find(item => item.file.path === filePath);
                        const title = fileItem ? fileItem.title : file.basename;
                        
                        // 只添加有实际内容的笔记
                        if (cleanedContent.trim()) {
                            contents.push(`# ${title}\n\n${cleanedContent}`);
                        }
                    }
                }

                if (contents.length > 0) {
                    const finalContent = contents.join('\n\n---\n\n');
                    await navigator.clipboard.writeText(finalContent);
                    new Notice(`已复制 ${contents.length} 个笔记到剪贴板`);
                } else {
                    new Notice('没有可复制的内容');
                }
            } catch (error) {
                console.error('复制失败:', error);
                new Notice('复制失败: ' + error.message);
            }
        });

        // 文件导出功能
        exportBtn.addEventListener('click', async () => {
            if (this.selectedFiles.size === 0) {
                new Notice('请先选择要导出的笔记');
                return;
            }

            try {
                const fs = require('fs');
                const path = require('path');
                
                // 导出目录路径 - 优先使用标签特定路径，否则使用默认路径
                let exportPath = '';
                const tagExportPaths = this.plugin.settings?.tagExportPaths || {};
                
                // 从搜索条件中提取所有标签，支持多标签搜索
                // 搜索条件可能是: "#标签1 #标签2" 或 "tag:标签1 tag:标签2" 等格式
                if (this.tag) {
                    // 提取所有标签（支持 #标签 和 tag:标签 格式）
                    const searchTags = [];
                    
                    // 匹配 #标签 格式
                    const hashTagMatches = this.tag.match(/#[\w\u4e00-\u9fa5\/\-]+/g);
                    if (hashTagMatches) {
                        hashTagMatches.forEach(t => searchTags.push(t.replace(/^#/, '')));
                    }
                    
                    // 匹配 tag:标签 格式
                    const tagColonMatches = this.tag.match(/tag:[\w\u4e00-\u9fa5\/\-]+/gi);
                    if (tagColonMatches) {
                        tagColonMatches.forEach(t => searchTags.push(t.replace(/^tag:/i, '')));
                    }
                    
                    // 如果没有匹配到特定格式，将整个搜索词作为标签（兼容单标签搜索）
                    if (searchTags.length === 0 && this.searchType === 'tag') {
                        searchTags.push(this.tag.replace(/^#/, ''));
                    }
                    
                    console.log('📌 搜索中的标签:', searchTags);
                    
                    // 遍历搜索中的每个标签，查找匹配的导出路径
                    for (const searchTag of searchTags) {
                        const normalizedSearchTag = searchTag.toLowerCase();
                        
                        for (const [configTag, configPath] of Object.entries(tagExportPaths)) {
                            const normalizedConfigTag = configTag.toLowerCase().replace(/^#/, '');
                            
                            // 精确匹配或层级匹配
                            if (normalizedSearchTag === normalizedConfigTag || 
                                normalizedSearchTag.startsWith(normalizedConfigTag + '/')) {
                                exportPath = configPath;
                                console.log(`📁 标签 "${searchTag}" 匹配到导出路径: ${exportPath}`);
                                break;
                            }
                        }
                        
                        // 找到匹配的路径就停止搜索
                        if (exportPath) break;
                    }
                }
                
                // 如果没有匹配到标签特定路径，使用默认路径
                if (!exportPath) {
                    exportPath = this.plugin.settings?.exportPath || 
                        path.join(path.dirname(this.plugin.app.vault.adapter.basePath), 'docs', 'docs');
                }
                
                console.log('Export path:', exportPath);
                
                // 确保目录存在
                if (!fs.existsSync(exportPath)) {
                    fs.mkdirSync(exportPath, { recursive: true });
                }
                
                let successCount = 0;
                let errorCount = 0;
                
                for (const filePath of this.selectedFiles) {
                    const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
                    if (file && file.extension === 'md') {
                        try {
                            const content = await this.plugin.app.vault.read(file);
                            
                            // 从文件列表中找到对应的 item，获取其 title
                            const fileItem = this.files.find(item => item.file.path === filePath);
                            const title = fileItem ? fileItem.title : file.basename;
                            
                            // 处理内容：转换 Obsidian 特有语法为标准 Markdown
                            const processedContent = this.processForExport(content, title);
                            
                            // 使用原始文件名（保留 Obsidian 的文件名）
                            const originalFileName = file.basename + '.md';
                            const targetPath = path.join(exportPath, originalFileName);
                            
                            // 写入文件
                            fs.writeFileSync(targetPath, processedContent, 'utf8');
                            console.log(`✅ Exported: ${originalFileName} (${title})`);
                            successCount++;
                        } catch (err) {
                            console.error(`❌ Failed to export ${filePath}:`, err);
                            errorCount++;
                        }
                    }
                }
                
                if (successCount > 0) {
                    new Notice(`✅ 已导出 ${successCount} 个笔记到 ${exportPath}${errorCount > 0 ? `，${errorCount} 个失败` : ''}`);
                } else {
                    new Notice('❌ 导出失败，请检查控制台日志');
                }
            } catch (error) {
                console.error('文件导出失败:', error);
                new Notice('导出失败: ' + error.message);
            }
        });

        for (const item of this.files) {
            const fileItem = list.createEl('div', { 
                cls: 'tree-item nav-file tag-search-item'
            });

            const fileContent = fileItem.createEl('div', {
                cls: 'tree-item-self is-clickable nav-file-title'
            });

            // 复选框
            const checkbox = fileContent.createEl('input', {
                type: 'checkbox',
                cls: 'tag-search-checkbox'
            });
            
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                
                if (checkbox.checked) {
                    this.selectedFiles.add(item.file.path);
                    fileItem.addClass('tag-search-item-selected');
                } else {
                    this.selectedFiles.delete(item.file.path);
                    fileItem.removeClass('tag-search-item-selected');
                }
                
                updateCopyButton();
            });
            
            checkbox.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // 文件名/标题
            const titleEl = fileContent.createEl('div', {
                cls: 'tree-item-inner nav-file-title-content',
                text: item.title
            });

            // 点击打开文件（点击非复选框区域）
            fileContent.addEventListener('click', async (e) => {
                if (e.target !== checkbox) {
                    await this.app.workspace.getLeaf().openFile(item.file);
                }
            });

            // 悬停显示路径
            fileContent.setAttribute('data-path', item.file.path);
            fileContent.setAttribute('title', item.file.path);
        }

        // 移动端底部添加返回按钮（放在最后确保在底部）
        if (this.plugin.app.isMobile) {
            const footerBar = container.createEl('div', { cls: 'tag-search-mobile-footer' });
            
            const closeButton = footerBar.createEl('button', {
                cls: 'tag-search-close-button',
                attr: { 'aria-label': '关闭搜索' }
            });
            closeButton.innerHTML = '← 返回';
            
            closeButton.addEventListener('click', () => {
                // 收起右侧面板而不是 detach，保持视图在下拉菜单中
                const rightSplit = this.plugin.app.workspace.rightSplit;
                if (rightSplit) {
                    rightSplit.collapse();
                }
            });
        }
    }

    async onClose() {
        // 取消元数据变化监听器
        if (this.metadataChangeHandler) {
            this.plugin.app.metadataCache.off('changed', this.metadataChangeHandler);
            this.metadataChangeHandler = null;
        }
        
        // 取消文件删除监听器
        if (this.fileDeleteHandler) {
            this.plugin.app.vault.off('delete', this.fileDeleteHandler);
            this.fileDeleteHandler = null;
        }
        
        // 取消文件创建监听器
        if (this.fileCreateHandler) {
            this.plugin.app.vault.off('create', this.fileCreateHandler);
            this.fileCreateHandler = null;
        }
    }

    // 生成周选项（最近12周）
    generateWeekOptions() {
        const weeks = [];
        const today = new Date();
        
        for (let i = 2; i < 14; i++) {
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay() - (i * 7)); // 周日为一周开始
            weekStart.setHours(0, 0, 0, 0);
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            
            const weekNumber = this.getWeekNumber(weekStart);
            const year = weekStart.getFullYear();
            
            weeks.push({
                value: `${weekStart.getTime()}-${weekEnd.getTime()}`,
                label: `${year}年第${weekNumber}周 (${this.formatDateShort(weekStart)} ~ ${this.formatDateShort(weekEnd)})`
            });
        }
        
        return weeks;
    }

    // 获取周数
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    // 格式化日期（短格式）
    formatDateShort(date) {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day}`;
    }

    // 格式化日期（用于input）
    formatDateForInput(date) {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 格式化日期（显示用）
    formatDate(date) {
        if (!date) return '';
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}/${month}/${day}`;
    }

    // 渲染单月日历（带周数）
    renderMonthCalendar(monthDate, container, rangeStart, rangeEnd, onDateClick) {
        const calendarBox = container.createEl('div', { cls: 'date-month-calendar' });
        
        // 月份标题
        const monthHeader = calendarBox.createEl('div', { cls: 'date-month-header' });
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth() + 1;
        monthHeader.textContent = `${year}年 ${month}月`;
        
        // 星期标题行
        const weekdayRow = calendarBox.createEl('div', { cls: 'date-weekday-row' });
        weekdayRow.createEl('div', { cls: 'date-week-number-header', text: '周' });
        ['一', '二', '三', '四', '五', '六', '日'].forEach(day => {
            weekdayRow.createEl('div', { cls: 'date-weekday', text: day });
        });
        
        // 日期网格
        const datesGrid = calendarBox.createEl('div', { cls: 'date-dates-grid' });
        
        // 计算月份的第一天和最后一天
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        
        // 计算第一天是周几（周一为0）
        let firstDayOfWeek = firstDay.getDay() - 1;
        if (firstDayOfWeek < 0) firstDayOfWeek = 6;
        
        // 计算需要显示的前一个月的天数
        const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
        const prevMonthDays = firstDayOfWeek;
        
        // 当前日期
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // 生成日历
        let currentWeekRow = null;
        let dayCount = 0;
        
        // 计算起始周数
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDayOfWeek);
        
        for (let week = 0; week < 6; week++) {
            const weekRow = datesGrid.createEl('div', { cls: 'date-week-row' });
            
            // 周数
            const weekNumberCell = weekRow.createEl('div', { cls: 'date-week-number' });
            const weekDate = new Date(startDate);
            weekDate.setDate(weekDate.getDate() + week * 7);
            const weekNum = this.getWeekNumber(weekDate);
            weekNumberCell.textContent = weekNum;
            
            // 周数点击事件 - 选择整周（周一到周日）
            weekNumberCell.addEventListener('click', () => {
                const weekStart = new Date(weekDate);
                // 找到该周的周一
                const dayOfWeek = weekStart.getDay();
                const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                weekStart.setDate(weekStart.getDate() + diff);
                weekStart.setHours(0, 0, 0, 0);
                
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6); // 到周日
                weekEnd.setHours(23, 59, 59, 999);
                
                // 直接设置范围，触发回调
                if (onDateClick) {
                    // 模拟两次点击完成范围选择
                    onDateClick(weekStart);
                    onDateClick(weekEnd);
                }
            });
            
            for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
                const dayCell = weekRow.createEl('div', { cls: 'date-day-cell' });
                
                let dayNumber;
                let cellDate;
                let isCurrentMonth = true;
                
                if (dayCount < prevMonthDays) {
                    // 前一个月的日期
                    dayNumber = prevMonthLastDay - prevMonthDays + dayCount + 1;
                    cellDate = new Date(year, month - 2, dayNumber);
                    isCurrentMonth = false;
                    dayCell.addClass('date-other-month');
                } else if (dayCount < prevMonthDays + lastDay.getDate()) {
                    // 当前月的日期
                    dayNumber = dayCount - prevMonthDays + 1;
                    cellDate = new Date(year, month - 1, dayNumber);
                } else {
                    // 下一个月的日期
                    dayNumber = dayCount - prevMonthDays - lastDay.getDate() + 1;
                    cellDate = new Date(year, month, dayNumber);
                    isCurrentMonth = false;
                    dayCell.addClass('date-other-month');
                }
                
                dayCell.textContent = dayNumber;
                dayCell.setAttribute('data-date', cellDate.toISOString());
                
                // 今天高亮
                if (cellDate.getTime() === today.getTime()) {
                    dayCell.addClass('date-today');
                }
                
                // 范围高亮
                if (rangeStart && rangeEnd) {
                    const cellTime = cellDate.getTime();
                    const startTime = rangeStart.getTime();
                    const endTime = rangeEnd.getTime();
                    
                    if (cellTime >= startTime && cellTime <= endTime) {
                        dayCell.addClass('date-in-range');
                    }
                    if (cellTime === startTime || cellTime === endTime) {
                        dayCell.addClass('date-range-boundary');
                    }
                } else if (rangeStart) {
                    if (cellDate.getTime() === rangeStart.getTime()) {
                        dayCell.addClass('date-range-boundary');
                    }
                }
                
                // 点击事件
                dayCell.addEventListener('click', () => {
                    onDateClick(cellDate);
                });
                
                dayCount++;
            }
            
            // 如果这一周已经超出了当月范围且全是下个月的日期，停止渲染
            if (dayCount >= prevMonthDays + lastDay.getDate() + 7) {
                break;
            }
        }
        
        return calendarBox;
    }

    // 解析周选择器的值（周一到周日）
    parseWeekValue(value) {
        const now = new Date();
        
        if (value === 'thisWeek') {
            const start = new Date(now);
            // 获取本周一（周一为一周开始）
            const dayOfWeek = start.getDay();
            const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 周日特殊处理
            start.setDate(start.getDate() + diff);
            start.setHours(0, 0, 0, 0);
            
            const end = new Date(start);
            end.setDate(start.getDate() + 6); // 到周日
            end.setHours(23, 59, 59, 999);
            
            return { start, end };
        }
        
        if (value === 'lastWeek') {
            const start = new Date(now);
            // 获取上周一
            const dayOfWeek = start.getDay();
            const diff = dayOfWeek === 0 ? -13 : -6 - dayOfWeek;
            start.setDate(start.getDate() + diff);
            start.setHours(0, 0, 0, 0);
            
            const end = new Date(start);
            end.setDate(start.getDate() + 6); // 到周日
            end.setHours(23, 59, 59, 999);
            
            return { start, end };
        }
        
        if (value === 'last7days') {
            const end = new Date(now);
            end.setHours(23, 59, 59, 999);
            
            const start = new Date(now);
            start.setDate(now.getDate() - 6);
            start.setHours(0, 0, 0, 0);
            
            return { start, end };
        }
        
        if (value === 'last30days') {
            const end = new Date(now);
            end.setHours(23, 59, 59, 999);
            
            const start = new Date(now);
            start.setDate(now.getDate() - 29);
            start.setHours(0, 0, 0, 0);
            
            return { start, end };
        }
        
        // 解析自定义周范围
        if (value.includes('-')) {
            const [startTime, endTime] = value.split('-');
            return {
                start: new Date(parseInt(startTime)),
                end: new Date(parseInt(endTime))
            };
        }
        
        return null;
    }

    // 应用日期过滤
    applyDateFilter(startDate, endDate) {
        this.dateFilter = { startDate, endDate };
        
        // 过滤文件
        this.files = this.allFiles.filter(item => {
            const createdTime = item.file.stat.ctime;
            const fileDate = new Date(createdTime);
            
            if (startDate && fileDate < startDate) return false;
            if (endDate && fileDate > endDate) return false;
            
            return true;
        });
        
        console.log(`Date filter applied: ${this.files.length} files (from ${this.allFiles.length})`);
    }

    // 清除日期过滤
    clearDateFilter() {
        this.dateFilter = null;
        this.files = [...this.allFiles];
    }

    // 刷新文件列表显示
    refreshFileList(container) {
        // 保存当前滚动位置
        const oldList = container.querySelector('.tag-search-list');
        const scrollTop = oldList ? oldList.scrollTop : 0;
        
        // 重新排序文件列表（按 title）
        this.files.sort((a, b) => {
            const titleA = String(a.title || '');
            const titleB = String(b.title || '');
            return titleA.localeCompare(titleB, 'zh-CN', { numeric: true });
        });
        
        // 同时排序 allFiles
        this.allFiles.sort((a, b) => {
            const titleA = String(a.title || '');
            const titleB = String(b.title || '');
            return titleA.localeCompare(titleB, 'zh-CN', { numeric: true });
        });
        
        // 找到并删除旧元素
        const oldHeader = container.querySelector('.tag-search-header');
        const oldBottomActions = container.querySelector('.tag-search-bottom-actions');
        const oldMobileFooter = container.querySelector('.tag-search-mobile-footer');
        
        if (oldList) oldList.remove();
        if (oldHeader) oldHeader.remove();
        if (oldBottomActions) oldBottomActions.remove();
        if (oldMobileFooter) oldMobileFooter.remove();
        
        // 重新渲染头部和列表
        this.renderHeaderAndList(container);
        
        // 恢复滚动位置
        const newList = container.querySelector('.tag-search-list');
        if (newList && scrollTop > 0) {
            newList.scrollTop = scrollTop;
        }
    }

    // 去除 YAML frontmatter
    removeYamlFrontmatter(content) {
        // 匹配 YAML frontmatter (以 --- 开始和结束)
        const yamlRegex = /^---\s*\n[\s\S]*?\n---\s*\n/;
        return content.replace(yamlRegex, '').trim();
    }

    // 清理内容，移除特殊元素（图片、iframe、mactagmap、base引用等）
    cleanContent(content) {
        let cleaned = content;

        // 1. 移除 iframe 标签
        cleaned = cleaned.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');

        // 2. 移除 mactagmap 短代码
        cleaned = cleaned.replace(/\[mctagmap[^\]]*\]/gi, '');

        // 3. 移除 Obsidian base 引用（![[xxx.base#xxx]]）
        cleaned = cleaned.replace(/!\[\[.*?\.base#.*?\]\]/gi, '');

        // 4. 移除图片
        // Markdown 图片: ![alt](url) 或 ![|width](url)
        cleaned = cleaned.replace(/!\[.*?\]\([^)]+\)/g, '');
        
        // Obsidian 图片嵌入: ![[image.png]] 或 ![[image.png|width]]
        cleaned = cleaned.replace(/!\[\[(?!.*\.base#)[^\]]*\.(png|jpg|jpeg|gif|bmp|svg|webp)(?:\|[^\]]*)?\]\]/gi, '');

        // 5. 移除多余的空行（连续的空行压缩为单个空行）
        cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

        // 6. 移除行首行尾空白
        cleaned = cleaned.trim();

        return cleaned;
    }

    // 处理内容以适配标准 Markdown 导出
    processForExport(content, title) {
        let processed = content;
        
        // 1. 提取或创建 frontmatter
        const yamlMatch = processed.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
        let frontmatter = {};
        let bodyContent = processed;
        
        if (yamlMatch) {
            // 解析现有 frontmatter
            const yamlContent = yamlMatch[1];
            bodyContent = processed.replace(yamlMatch[0], '');
            
            // 简单解析 YAML
            yamlContent.split('\n').forEach(line => {
                const match = line.match(/^(\w+):\s*(.*)$/);
                if (match) {
                    let value = match[2].trim();
                    // 处理数组格式 [item1, item2]
                    if (value.startsWith('[') && value.endsWith(']')) {
                        value = value.slice(1, -1).split(',').map(s => s.trim());
                    }
                    frontmatter[match[1]] = value;
                }
            });
        }
        
        // 确保有 title
        if (!frontmatter.title) {
            frontmatter.title = title;
        }
        
        // 2. 转换 Obsidian wiki links [[link]] 为标准 Markdown [link](link)
        bodyContent = bodyContent.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, link, alias) => {
            const displayText = alias || link;
            // 转换为相对链接
            const safeName = link.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_]/g, '-').toLowerCase();
            return `[${displayText}](./${safeName})`;
        });
        
        // 3. 转换 Obsidian 图片嵌入 ![[image.png]] 为标准 Markdown
        bodyContent = bodyContent.replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, imagePath, size) => {
            // 保留图片，但转换格式
            return `![${imagePath}](./images/${imagePath})`;
        });
        
        // 4. 移除 Obsidian 特有的标签格式中的空格问题
        // 保留标签但确保格式正确
        
        // 5. 移除一些 Obsidian 特有的语法
        // 移除 base 引用
        bodyContent = bodyContent.replace(/!\[\[.*?\.base#.*?\]\]/gi, '');
        // 移除 mactagmap
        bodyContent = bodyContent.replace(/\[mctagmap[^\]]*\]/gi, '');
        
        // 6. 清理多余空行
        bodyContent = bodyContent.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
        
        // 7. 构建新的 frontmatter
        let newFrontmatter = '---\n';
        newFrontmatter += `title: "${frontmatter.title}"\n`;
        if (frontmatter.tags) {
            const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [frontmatter.tags];
            newFrontmatter += `tags:\n${tags.map(t => `  - ${t}`).join('\n')}\n`;
        }
        newFrontmatter += `lastUpdated: true\n`;
        newFrontmatter += '---\n\n';
        
        return newFrontmatter + bodyContent;
    }

    // 生成安全的文件名
    sanitizeFileName(name) {
        return name
            .replace(/[<>:"/\\|?*]/g, '-')  // 替换非法字符
            .replace(/\s+/g, '-')            // 空格替换为连字符
            .replace(/-+/g, '-')             // 多个连字符合并
            .replace(/^-|-$/g, '')           // 移除首尾连字符
            .substring(0, 100);              // 限制长度
    }
}

// 系统搜索 DOM 包装器 - 用于替换搜索结果中的标题
class SearchDomWrapper {
    constructor(plugin, dom, resolver) {
        this.plugin = plugin;
        this.dom = dom;
        this.resolver = resolver;
        this.enabled = true;
        this.originalAddResult = null;
        this.observer = null;
        
        this.wrap();
        this.setupObserver();
    }
    
    wrap() {
        if (!this.dom || !this.dom.addResult) {
            console.log('❌ SearchDomWrapper: dom.addResult 不存在');
            return;
        }
        
        this.originalAddResult = this.dom.addResult.bind(this.dom);
        const self = this;
        
        this.dom.addResult = function(...args) {
            const result = self.originalAddResult(...args);
            const file = args[0];
            // 延迟处理，确保 DOM 已渲染
            setTimeout(() => self.processResult(file, result), 10);
            return result;
        };
        
        // 处理已有的搜索结果
        this.processExistingResults();
        console.log('✅ SearchDomWrapper: 已包装 addResult 方法');
    }
    
    setupObserver() {
        // 监听搜索结果容器的变化
        const searchLeaf = this.plugin.app.workspace.getLeavesOfType('search')[0];
        if (!searchLeaf?.view?.containerEl) return;
        
        const resultsContainer = searchLeaf.view.containerEl.querySelector('.search-results-container');
        if (!resultsContainer) return;
        
        this.observer = new MutationObserver((mutations) => {
            // 延迟处理，避免频繁刷新
            setTimeout(() => this.processExistingResults(), 50);
        });
        
        this.observer.observe(resultsContainer, { childList: true, subtree: true });
    }
    
    processExistingResults() {
        if (!this.dom.resultDomLookup) {
            console.log('❌ SearchDomWrapper: resultDomLookup 不存在');
            return;
        }
        
        let count = 0;
        for (const [file, item] of this.dom.resultDomLookup) {
            if (this.processResult(file, item)) {
                count++;
            }
        }
        if (count > 0) {
            console.log(`✅ SearchDomWrapper: 已处理 ${count} 个搜索结果的标题`);
        }
    }
    
    processResult(file, item) {
        if (!this.enabled || !file || file.extension !== 'md') return false;
        
        try {
            const title = this.resolver(file.path);
            if (!title || title === file.basename) return false;
            
            // 尝试多种选择器找到标题元素
            let node = null;
            
            // 方式1: item.el 下的 .tree-item-inner
            if (item?.el) {
                node = item.el.querySelector('.tree-item-inner');
            }
            
            // 方式2: item.containerEl 下的 .tree-item-inner
            if (!node && item?.containerEl) {
                node = item.containerEl.querySelector('.tree-item-inner');
            }
            
            // 方式3: 直接查找匹配文件名的元素
            if (!node) {
                const searchLeaf = this.plugin.app.workspace.getLeavesOfType('search')[0];
                if (searchLeaf?.view?.containerEl) {
                    const allItems = searchLeaf.view.containerEl.querySelectorAll('.tree-item-inner');
                    for (const el of allItems) {
                        if (el.textContent === file.basename || el.textContent === file.path) {
                            node = el;
                            break;
                        }
                    }
                }
            }
            
            if (node && node.textContent !== title) {
                node.textContent = title;
                return true;
            }
        } catch (e) {
            console.error('SearchDomWrapper: Error processing result', e);
        }
        return false;
    }
    
    disable() {
        this.enabled = false;
        if (this.originalAddResult && this.dom) {
            this.dom.addResult = this.originalAddResult;
        }
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
    
    refresh() {
        this.processExistingResults();
    }
}

// 系统搜索排序增强器 - 添加 Title 排序按钮
class SearchSortEnhancer {
    constructor(plugin) {
        this.plugin = plugin;
        this.enabled = false;
        this.currentSortMode = null; // null, 'title-asc', 'title-desc'
        this.sortButton = null;
        this.layoutHandler = null;
        this.resortDebounceTimer = null;
        this.isSorting = false; // 防止循环
    }
    
    enable() {
        this.enabled = true;
        
        // 恢复之前保存的排序状态
        this.currentSortMode = this.plugin.settings.searchSortMode || null;
        
        this.injectSortButton();
        this.watchFileChanges();
        this.watchScroll();
        
        // 监听布局变化，确保按钮存在
        this.layoutHandler = this.plugin.app.workspace.on('layout-change', () => {
            setTimeout(() => {
                this.injectSortButton();
                this.watchScroll();
                // 如果有排序模式，延迟应用排序
                if (this.currentSortMode && !this.isSorting) {
                    this.waitAndApplySort();
                }
            }, 100);
        });
        
        // 如果有保存的排序模式，等待搜索结果加载后应用
        if (this.currentSortMode) {
            this.waitAndApplySort();
        }
        
        console.log('✅ 搜索排序增强已启用，排序模式:', this.currentSortMode);
    }
    
    // 监听搜索结果 DOM 变化（虚拟滚动会动态添加/移除元素）
    watchScroll() {
        const searchLeaf = this.plugin.app.workspace.getLeavesOfType('search')[0];
        if (!searchLeaf?.view?.containerEl) return;
        
        const resultsContainer = searchLeaf.view.containerEl.querySelector('.search-results-children');
        if (!resultsContainer) return;
        
        // 避免重复绑定
        if (this._domObserver) return;
        
        this._domObserver = new MutationObserver((mutations) => {
            if (!this.currentSortMode || this.isSorting) return;
            
            // 检查是否有子节点变化（虚拟滚动添加/移除元素）
            const hasChildChanges = mutations.some(m => m.type === 'childList' && m.addedNodes.length > 0);
            if (!hasChildChanges) return;
            
            if (this.scrollDebounceTimer) {
                clearTimeout(this.scrollDebounceTimer);
            }
            this.scrollDebounceTimer = setTimeout(() => {
                console.log('🔄 DOM 变化，重新应用 Title 排序');
                this.applySort();
            }, 150);
        });
        
        this._domObserver.observe(resultsContainer, {
            childList: true,
            subtree: false
        });
        
        console.log('✅ 已开始监听搜索结果 DOM 变化');
    }
    
    unwatchScroll() {
        if (this._domObserver) {
            this._domObserver.disconnect();
            this._domObserver = null;
        }
        if (this.scrollDebounceTimer) {
            clearTimeout(this.scrollDebounceTimer);
            this.scrollDebounceTimer = null;
        }
    }
    
    // 等待搜索结果稳定后应用排序
    waitAndApplySort(retries = 15, lastCount = -1) {
        if (this.isSorting) return; // 防止重复调用
        
        const searchLeaf = this.plugin.app.workspace.getLeavesOfType('search')[0];
        if (!searchLeaf?.view?.dom?.resultDomLookup) {
            if (retries > 0) {
                setTimeout(() => this.waitAndApplySort(retries - 1, lastCount), 300);
            }
            return;
        }
        
        const resultCount = searchLeaf.view.dom.resultDomLookup.size;
        
        // 如果结果数量还在变化，或者还没有结果，继续等待
        if (resultCount !== lastCount && retries > 0) {
            setTimeout(() => this.waitAndApplySort(retries - 1, resultCount), 300);
            return;
        }
        
        // 结果已稳定，应用排序
        if (resultCount > 0) {
            console.log(`📊 搜索结果已稳定 (${resultCount} 项)，应用 Title 排序`);
            // 额外延迟确保 DOM 渲染完成
            setTimeout(() => this.applySort(), 200);
        }
    }
    
    disable() {
        this.enabled = false;
        this.currentSortMode = null;
        this.removeSortButton();
        this.unwatchFileChanges();
        this.unwatchScroll();
        
        if (this.layoutHandler) {
            this.plugin.app.workspace.offref(this.layoutHandler);
            this.layoutHandler = null;
        }
        
        if (this.resortDebounceTimer) {
            clearTimeout(this.resortDebounceTimer);
            this.resortDebounceTimer = null;
        }
        if (this.modifyDebounceTimer) {
            clearTimeout(this.modifyDebounceTimer);
            this.modifyDebounceTimer = null;
        }
        if (this.scrollDebounceTimer) {
            clearTimeout(this.scrollDebounceTimer);
            this.scrollDebounceTimer = null;
        }
    }
    
    // 监听文件变化事件，自动重新排序
    watchFileChanges() {
        if (this.fileDeleteHandler) return;
        
        const scheduleResort = (reason, delay = 1000) => {
            // 只在有排序模式且不在排序中时才重新排序
            if (!this.currentSortMode || this.isSorting) return;
            
            // 使用防抖，避免频繁排序
            if (this.resortDebounceTimer) {
                clearTimeout(this.resortDebounceTimer);
            }
            this.resortDebounceTimer = setTimeout(() => {
                console.log(`🔄 检测到${reason}，重新应用 Title 排序`);
                this.applySort();
            }, delay);
        };
        
        // 监听文件修改（使用较长的防抖时间，停止编辑3秒后才排序）
        this.fileModifyHandler = this.plugin.app.vault.on('modify', () => {
            if (!this.currentSortMode || this.isSorting) return;
            
            if (this.modifyDebounceTimer) {
                clearTimeout(this.modifyDebounceTimer);
            }
            this.modifyDebounceTimer = setTimeout(() => {
                console.log('🔄 检测到文件修改，重新应用 Title 排序');
                this.applySort();
            }, 3000); // 3秒防抖，用户停止编辑后才排序
        });
        
        // 监听文件删除
        this.fileDeleteHandler = this.plugin.app.vault.on('delete', () => {
            scheduleResort('文件删除');
        });
        
        // 监听文件创建
        this.fileCreateHandler = this.plugin.app.vault.on('create', () => {
            scheduleResort('文件创建');
        });
        
        // 监听文件重命名
        this.fileRenameHandler = this.plugin.app.vault.on('rename', () => {
            scheduleResort('文件重命名');
        });
        
        console.log('✅ 已开始监听文件变化');
    }
    
    unwatchFileChanges() {
        if (this.fileModifyHandler) {
            this.plugin.app.vault.offref(this.fileModifyHandler);
            this.fileModifyHandler = null;
        }
        if (this.fileDeleteHandler) {
            this.plugin.app.vault.offref(this.fileDeleteHandler);
            this.fileDeleteHandler = null;
        }
        if (this.fileCreateHandler) {
            this.plugin.app.vault.offref(this.fileCreateHandler);
            this.fileCreateHandler = null;
        }
        if (this.fileRenameHandler) {
            this.plugin.app.vault.offref(this.fileRenameHandler);
            this.fileRenameHandler = null;
        }
    }
    
    injectSortButton() {
        if (!this.enabled) return;
        
        const searchLeaf = this.plugin.app.workspace.getLeavesOfType('search')[0];
        if (!searchLeaf?.view?.containerEl) return;
        
        const containerEl = searchLeaf.view.containerEl;
        
        // 检查是否已经添加过按钮
        if (containerEl.querySelector('.title-sort-btn') || containerEl.querySelector('.search-copy-btn')) return;
        
        // 尝试多种选择器查找合适的插入位置
        let targetEl = null;
        let insertMode = 'append'; // append, after, before
        
        // 方案1: 查找搜索结果信息栏 (X 项结果)
        targetEl = containerEl.querySelector('.search-results-info');
        
        // 方案2: 查找排序下拉菜单按钮 (文件名 Z-A)
        if (!targetEl) {
            targetEl = containerEl.querySelector('.search-result-container .dropdown');
            insertMode = 'before';
        }
        
        // 方案3: 查找 nav-header 区域
        if (!targetEl) {
            targetEl = containerEl.querySelector('.nav-header');
            insertMode = 'append';
        }
        
        // 方案4: 查找搜索结果容器头部
        if (!targetEl) {
            targetEl = containerEl.querySelector('.search-result-container');
            insertMode = 'prepend';
        }
        
        if (!targetEl) {
            console.log('❌ 未找到合适的插入位置，可用元素:', containerEl.innerHTML.substring(0, 500));
            return;
        }
        
        // 创建排序按钮（点击显示菜单）
        this.sortButton = document.createElement('div');
        this.sortButton.className = 'clickable-icon title-sort-btn';
        this.sortButton.setAttribute('aria-label', '按 Title 排序');
        this.sortButton.style.cssText = 'margin-left: 4px; display: inline-flex; align-items: center; cursor: pointer; padding: 4px;';
        this.sortButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><text x="3" y="10" font-size="10" font-weight="bold" fill="currentColor" stroke="none">T</text><path d="M3 17l3 3 3-3"></path><path d="M6 18V14"></path></svg>`;
        
        this.sortButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showSortMenu(e);
        });
        
        // 创建复制按钮
        this.copyButton = document.createElement('div');
        this.copyButton.className = 'clickable-icon search-copy-btn';
        this.copyButton.setAttribute('aria-label', '复制/导出搜索结果');
        this.copyButton.style.cssText = 'margin-left: 4px; display: inline-flex; align-items: center; cursor: pointer; padding: 4px;';
        this.copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
        
        this.copyButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showCopyMenu(e);
        });
        
        // 根据模式插入按钮
        if (insertMode === 'append') {
            targetEl.appendChild(this.sortButton);
            targetEl.appendChild(this.copyButton);
        } else if (insertMode === 'before') {
            targetEl.parentNode.insertBefore(this.sortButton, targetEl);
            targetEl.parentNode.insertBefore(this.copyButton, targetEl);
        } else if (insertMode === 'prepend') {
            targetEl.insertBefore(this.copyButton, targetEl.firstChild);
            targetEl.insertBefore(this.sortButton, targetEl.firstChild);
        }
        
        this.updateButtonState();
        
        console.log('✅ Title 排序按钮和复制按钮已添加，插入模式:', insertMode);
    }
    
    // 显示复制/导出菜单
    async showCopyMenu(e) {
        const searchLeaf = this.plugin.app.workspace.getLeavesOfType('search')[0];
        const resultDomLookup = searchLeaf?.view?.dom?.resultDomLookup;
        
        // 直接从 resultDomLookup 获取准确的文件数量
        const totalFiles = resultDomLookup ? resultDomLookup.size : 0;
        
        // 获取内容并计算字数
        const result = totalFiles > 0 ? await this.getSearchResultsContent() : null;
        const charCount = result ? result.content.length : 0;
        
        const menu = new Menu();
        
        if (totalFiles === 0) {
            menu.addItem((item) => {
                item.setTitle('📊 没有搜索结果')
                    .setDisabled(true);
            });
        } else {
            menu.addItem((item) => {
                item.setTitle(`📊 ${totalFiles} 篇笔记，共 ${charCount.toLocaleString()} 字`)
                    .setDisabled(true);
            });
        }
        
        menu.addSeparator();
        
        menu.addItem((item) => {
            item.setTitle('复制到剪贴板')
                .setIcon('copy')
                .setDisabled(!result)
                .onClick(() => {
                    this.copySearchResultsWithData(result);
                });
        });
        
        menu.addItem((item) => {
            item.setTitle('导出为文件')
                .setIcon('download')
                .setDisabled(!result)
                .onClick(() => {
                    this.exportSearchResultsWithData(result);
                });
        });
        
        menu.showAtMouseEvent(e);
    }
    
    // 获取搜索结果内容（去除 YAML）
    async getSearchResultsContent() {
        const searchLeaf = this.plugin.app.workspace.getLeavesOfType('search')[0];
        if (!searchLeaf?.view?.dom?.resultDomLookup) {
            return null;
        }
        
        const resultDomLookup = searchLeaf.view.dom.resultDomLookup;
        if (resultDomLookup.size === 0) {
            return null;
        }
        
        // 直接从 resultDomLookup 获取所有文件（不依赖 DOM，避免虚拟滚动问题）
        const allFiles = [];
        for (const [file] of resultDomLookup) {
            allFiles.push(file);
        }
        
        // 如果有 Title 排序模式，按照排序模式排序
        if (this.currentSortMode) {
            const vault = this.plugin.app.vault;
            const metadataCache = this.plugin.app.metadataCache;
            
            allFiles.sort((a, b) => {
                const cacheA = metadataCache.getFileCache(a);
                const cacheB = metadataCache.getFileCache(b);
                const titleA = cacheA?.frontmatter?.title || a.basename;
                const titleB = cacheB?.frontmatter?.title || b.basename;
                
                if (this.currentSortMode === 'title-asc') {
                    return titleA.localeCompare(titleB, 'zh-CN');
                } else {
                    return titleB.localeCompare(titleA, 'zh-CN');
                }
            });
        }
        
        const contents = [];
        const vault = this.plugin.app.vault;
        const metadataCache = this.plugin.app.metadataCache;
        
        for (const file of allFiles) {
            try {
                let content = await vault.read(file);
                
                // 去除 YAML frontmatter
                content = this.removeYamlFrontmatter(content);
                
                // 使用 title 属性作为标题，如果没有则使用文件名
                const cache = metadataCache.getFileCache(file);
                const title = cache?.frontmatter?.title || file.basename;
                
                contents.push(`# ${title}\n\n${content.trim()}`);
            } catch (err) {
                console.error(`读取文件失败: ${file.path}`, err);
            }
        }
        
        if (contents.length === 0) {
            return null;
        }
        
        return {
            content: contents.join('\n\n---\n\n'),
            count: contents.length
        };
    }
    
    // 复制搜索结果内容（使用已获取的数据）
    async copySearchResultsWithData(result) {
        if (!result) {
            new Notice('没有搜索结果');
            return;
        }
        
        await navigator.clipboard.writeText(result.content);
        new Notice(`已复制 ${result.count} 篇笔记，共 ${result.content.length.toLocaleString()} 字`);
    }
    
    // 复制搜索结果内容（去除 YAML）
    async copySearchResults() {
        const result = await this.getSearchResultsContent();
        await this.copySearchResultsWithData(result);
    }
    
    // 导出搜索结果到文件（使用已获取的数据）
    async exportSearchResultsWithData(result) {
        if (!result) {
            new Notice('没有搜索结果');
            return;
        }
        
        const fs = require('fs');
        const path = require('path');
        
        // 生成文件名
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fileName = `搜索结果导出_${timestamp}.md`;
        
        // 获取系统搜索导出路径
        let exportPath = this.plugin.settings.searchExportPath || '';
        
        // 判断是否为绝对路径
        const isAbsolutePath = exportPath.startsWith('/') || /^[A-Za-z]:/.test(exportPath);
        
        if (isAbsolutePath) {
            // 绝对路径：使用 fs 模块写入
            try {
                // 确保目录存在
                if (!fs.existsSync(exportPath)) {
                    fs.mkdirSync(exportPath, { recursive: true });
                }
                
                const filePath = path.join(exportPath, fileName);
                fs.writeFileSync(filePath, result.content, 'utf8');
                new Notice(`已导出 ${result.count} 篇笔记到 ${filePath}`);
            } catch (err) {
                console.error('导出失败:', err);
                new Notice('导出失败: ' + err.message);
            }
        } else {
            // 相对路径：使用 Vault API 写入
            if (exportPath) {
                const folderExists = this.plugin.app.vault.getAbstractFileByPath(exportPath);
                if (!folderExists) {
                    try {
                        await this.plugin.app.vault.createFolder(exportPath);
                    } catch (e) {
                        // 目录可能已存在，忽略错误
                    }
                }
                if (!exportPath.endsWith('/')) {
                    exportPath += '/';
                }
            }
            
            const filePath = exportPath + fileName;
            
            try {
                await this.plugin.app.vault.create(filePath, result.content);
                new Notice(`已导出 ${result.count} 篇笔记，共 ${result.content.length.toLocaleString()} 字`);
                
                // 打开导出的文件
                const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
                if (file) {
                    await this.plugin.app.workspace.getLeaf().openFile(file);
                }
            } catch (err) {
                console.error('导出失败:', err);
                new Notice('导出失败: ' + err.message);
            }
        }
    }
    
    // 导出搜索结果到文件
    async exportSearchResults() {
        const result = await this.getSearchResultsContent();
        await this.exportSearchResultsWithData(result);
    }
    
    // 去除 YAML frontmatter
    removeYamlFrontmatter(content) {
        // 匹配开头的 YAML 区域 (--- 开始，--- 结束)
        const yamlRegex = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;
        return content.replace(yamlRegex, '').trim();
    }
    
    // 显示排序选项菜单
    showSortMenu(e) {
        const menu = new Menu();
        
        menu.addItem((item) => {
            item.setTitle('Title 升序 (A-Z)')
                .setIcon(this.currentSortMode === 'title-asc' ? 'checkmark' : '')
                .onClick(() => {
                    this.setSortMode('title-asc');
                });
        });
        
        menu.addItem((item) => {
            item.setTitle('Title 降序 (Z-A)')
                .setIcon(this.currentSortMode === 'title-desc' ? 'checkmark' : '')
                .onClick(() => {
                    this.setSortMode('title-desc');
                });
        });
        
        menu.addSeparator();
        
        menu.addItem((item) => {
            item.setTitle('关闭 Title 排序')
                .setIcon(this.currentSortMode === null ? 'checkmark' : '')
                .onClick(() => {
                    this.setSortMode(null);
                });
        });
        
        menu.showAtMouseEvent(e);
    }
    
    // 设置排序模式
    setSortMode(mode) {
        this.currentSortMode = mode;
        
        // 保存排序状态
        this.plugin.settings.searchSortMode = this.currentSortMode;
        this.plugin.saveSettings();
        
        this.updateButtonState();
        
        if (this.currentSortMode) {
            new Notice(`按 Title ${mode === 'title-asc' ? '升序' : '降序'}排序`);
            this.applySort();
        } else {
            new Notice('已关闭 Title 排序');
        }
    }
    
    removeSortButton() {
        if (this.sortButton) {
            this.sortButton.remove();
            this.sortButton = null;
        }
        if (this.copyButton) {
            this.copyButton.remove();
            this.copyButton = null;
        }
        // 也清理可能残留的按钮
        document.querySelectorAll('.title-sort-btn').forEach(btn => btn.remove());
        document.querySelectorAll('.search-copy-btn').forEach(btn => btn.remove());
    }
    
    toggleSort() {
        if (this.currentSortMode === null) {
            this.currentSortMode = 'title-asc';
            new Notice('按 Title 升序排序 (A-Z)');
        } else if (this.currentSortMode === 'title-asc') {
            this.currentSortMode = 'title-desc';
            new Notice('按 Title 降序排序 (Z-A)');
        } else {
            this.currentSortMode = null;
            new Notice('已取消 Title 排序');
        }
        
        // 保存排序状态
        this.plugin.settings.searchSortMode = this.currentSortMode;
        this.plugin.saveSettings();
        
        this.updateButtonState();
        
        if (this.currentSortMode) {
            this.applySort();
        }
    }
    
    updateButtonState() {
        if (!this.sortButton) return;
        
        if (this.currentSortMode) {
            this.sortButton.style.color = 'var(--interactive-accent)';
            const label = this.currentSortMode === 'title-asc' ? 'Title (A-Z)' : 'Title (Z-A)';
            this.sortButton.setAttribute('aria-label', `按 ${label} 排序中，点击切换`);
        } else {
            this.sortButton.style.color = '';
            this.sortButton.setAttribute('aria-label', '按 Title 排序');
        }
    }
    
    applySort() {
        if (!this.currentSortMode || this.isSorting) return;
        
        this.isSorting = true; // 设置标记防止循环
        
        const searchLeaf = this.plugin.app.workspace.getLeavesOfType('search')[0];
        if (!searchLeaf) {
            this.isSorting = false;
            return;
        }
        
        const searchView = searchLeaf.view;
        if (!searchView || !searchView.dom) {
            this.isSorting = false;
            return;
        }
        
        const dom = searchView.dom;
        if (!dom.resultDomLookup || dom.resultDomLookup.size === 0) {
            console.log('❌ 没有搜索结果可排序');
            this.isSorting = false;
            return;
        }
        
        // 获取所有结果并排序
        const results = Array.from(dom.resultDomLookup.entries());
        console.log(`📊 正在对 ${results.length} 个结果按 Title 排序，模式: ${this.currentSortMode}`);
        
        // 按 title 排序
        results.sort((a, b) => {
            const titleA = this.getFileTitle(a[0]);
            const titleB = this.getFileTitle(b[0]);
            const compare = titleA.localeCompare(titleB, 'zh-CN', { numeric: true });
            return this.currentSortMode === 'title-asc' ? compare : -compare;
        });
        
        // 重新排列 DOM 元素
        let container = dom.childrenEl;
        if (!container) {
            container = dom.el?.querySelector('.search-results-children');
        }
        if (!container) {
            container = searchView.containerEl.querySelector('.search-results-children');
        }
        
        if (!container) {
            console.log('❌ 未找到搜索结果容器');
            this.isSorting = false;
            return;
        }
        
        results.forEach(([file, item]) => {
            if (item.el && container.contains(item.el)) {
                container.appendChild(item.el);
            } else if (item.containerEl && container.contains(item.containerEl)) {
                container.appendChild(item.containerEl);
            }
        });
        
        console.log('✅ Title 排序完成');
        
        // 延迟重置标记，防止立即触发的事件再次排序
        setTimeout(() => {
            this.isSorting = false;
        }, 500);
    }
    
    getFileTitle(file) {
        const cache = this.plugin.app.metadataCache.getFileCache(file);
        let title = cache?.frontmatter?.title || file.basename;
        if (title != null && typeof title !== 'string') {
            title = String(title);
        }
        return title;
    }
}

// 主插件类
const DEFAULT_SETTINGS = {
    exportPath: '',  // 标签搜索导出目录路径（绝对路径，用于点击标签搜索结果导出）
    searchExportPath: '',  // 系统搜索导出路径（相对路径，用于原生搜索结果导出）
    enableSearchTitleReplace: true,  // 是否在系统搜索中显示 title 属性
    enableSearchTitleSort: true,  // 是否启用按 title 排序功能
    searchSortMode: null,  // 搜索排序模式: null, 'title-asc', 'title-desc'
    tagExportPaths: {}  // 标签-导出路径映射，格式: { "标签名": "导出路径", ... }
};

module.exports = class TagClickSearchPlugin extends Plugin {
    async onload() {
        console.log('✅ Tag Click Search: 插件开始加载');

        // 加载设置
        await this.loadSettings();

        try {
            // 注册自定义视图
            this.registerView(
                VIEW_TYPE_TAG_SEARCH,
                (leaf) => new TagSearchResultsView(leaf, '', [], this, 'tag')
            );
            console.log('✅ Tag Click Search: 视图已注册');

            // 当工作区准备好后，激活右侧面板视图
            if (this.app.workspace.layoutReady) {
                this.initLeaf();
            } else {
                this.app.workspace.onLayoutReady(() => this.initLeaf());
            }

            // 注册标签点击事件处理器
            this.registerTagClickHandler();
            console.log('✅ Tag Click Search: 事件处理器已注册');

            // 添加样式
            this.addStyles();
            console.log('✅ Tag Click Search: 样式已添加');

            // 添加侧边栏图标（Ribbon Icon）
            // 使用 hash 图标代表标签搜索，保存引用以便清理
            this.ribbonIconEl = this.addRibbonIcon('hash', 'Tag Click Search - 标签搜索', async () => {
                await this.focusSearchPanel();
            });
            // 添加额外的类名以便识别
            this.ribbonIconEl.addClass('tag-click-search-ribbon-icon');
            console.log('✅ Tag Click Search: 侧边栏图标已添加');

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

            // 添加命令：搜索选中文本（使用系统搜索）
            this.addCommand({
                id: 'search-selected-text',
                name: '搜索选中文本',
                editorCallback: async (editor, view) => {
                    const selectedText = editor.getSelection().trim();
                    if (!selectedText) {
                        new Notice('请先选中要搜索的文本');
                        return;
                    }
                    console.log('🔍 Tag Click Search: 搜索选中文本:', selectedText);
                    
                    // 使用系统搜索
                    const searchLeaf = this.app.workspace.getLeavesOfType('search')[0];
                    if (searchLeaf) {
                        this.app.workspace.revealLeaf(searchLeaf);
                        const searchView = searchLeaf.view;
                        if (searchView && searchView.setQuery) {
                            searchView.setQuery(selectedText);
                        }
                    } else {
                        // 如果搜索面板不存在，通过命令打开
                        await this.app.commands.executeCommandById('global-search:open');
                        setTimeout(() => {
                            const newSearchLeaf = this.app.workspace.getLeavesOfType('search')[0];
                            if (newSearchLeaf?.view?.setQuery) {
                                newSearchLeaf.view.setQuery(selectedText);
                            }
                        }, 100);
                    }
                }
            });

            // 添加命令：切换到搜索面板并聚焦搜索框
            this.addCommand({
                id: 'focus-search-panel',
                name: '切换到搜索面板',
                callback: async () => {
                    console.log('🔍 Tag Click Search: 切换到搜索面板');
                    await this.focusSearchPanel();
                }
            });

            // 添加命令：复制当前笔记内容（排除 YAML）
            this.addCommand({
                id: 'copy-current-note-content',
                name: '复制当前笔记内容(排除YAML)',
                editorCallback: async (editor, view) => {
                    console.log('📋 Tag Click Search: 执行复制命令');
                    try {
                        const content = editor.getValue();
                        // 去除 YAML frontmatter
                        const contentWithoutYaml = this.removeYamlFrontmatter(content);
                        // 清理特殊内容
                        const cleanedContent = this.cleanContent(contentWithoutYaml);
                        
                        if (cleanedContent.trim()) {
                            await navigator.clipboard.writeText(cleanedContent);
                            new Notice('已复制笔记内容到剪贴板 (已排除 YAML)');
                        } else {
                            new Notice('笔记内容为空或仅包含 YAML');
                        }
                    } catch (error) {
                        console.error('复制失败:', error);
                        new Notice('复制失败: ' + error.message);
                    }
                }
            });

            // 添加命令：复制当前笔记的绝对路径
            this.addCommand({
                id: 'copy-current-note-path',
                name: '复制当前笔记的绝对路径',
                callback: async () => {
                    const activeFile = this.app.workspace.getActiveFile();
                    if (!activeFile) {
                        new Notice('没有打开的笔记');
                        return;
                    }
                    const absolutePath = this.getAbsolutePath(activeFile.path);
                    await navigator.clipboard.writeText(absolutePath);
                    new Notice(`已复制路径: ${absolutePath}`);
                }
            });

            // 添加命令：根据当前笔记标签导出
            this.addCommand({
                id: 'export-by-current-note-tags',
                name: '根据当前笔记标签导出',
                callback: async () => {
                    await this.exportCurrentNoteByTags();
                }
            });

            console.log('✅ Tag Click Search: 命令已添加');

            // 注册右键菜单
            this.registerFileMenu();

            // 注册设置面板
            this.addSettingTab(new TagClickSearchSettingTab(this.app, this));
            console.log('✅ Tag Click Search: 设置面板已注册');

            // 初始化系统搜索增强功能
            this.initSearchEnhancements();
            console.log('✅ Tag Click Search: 系统搜索增强功能已初始化');

            console.log('✅✅✅ Tag Click Search: 插件加载完成！');
            
            // 显示提示
            new Notice('Tag Click Search 插件已加载！点击标签可以搜索。');
            
        } catch (error) {
            console.error('❌ Tag Click Search: 加载失败', error);
            new Notice('Tag Click Search 加载失败，请查看控制台');
        }
    }

    // 获取文件的绝对路径
    getAbsolutePath(relativePath) {
        const adapter = this.app.vault.adapter;
        if (adapter && adapter.basePath) {
            const path = require('path');
            return path.join(adapter.basePath, relativePath);
        }
        return relativePath;
    }

    // 注册右键菜单
    registerFileMenu() {
        // 文件菜单（文件列表右键）
        this.registerEvent(
            this.app.workspace.on('file-menu', (menu, file) => {
                if (file.extension !== 'md') return;

                menu.addSeparator();

                // 复制绝对路径
                menu.addItem((item) => {
                    item.setTitle('复制绝对路径')
                        .setIcon('copy')
                        .onClick(async () => {
                            const absolutePath = this.getAbsolutePath(file.path);
                            await navigator.clipboard.writeText(absolutePath);
                            new Notice(`已复制路径: ${absolutePath}`);
                        });
                });

                // 根据标签导出
                menu.addItem((item) => {
                    item.setTitle('根据标签导出')
                        .setIcon('download')
                        .onClick(async () => {
                            await this.exportFileByTags(file);
                        });
                });
            })
        );

        // 编辑器菜单（编辑区右键）
        this.registerEvent(
            this.app.workspace.on('editor-menu', (menu, editor, view) => {
                const file = view.file;
                if (!file || file.extension !== 'md') return;

                menu.addSeparator();

                // 复制绝对路径
                menu.addItem((item) => {
                    item.setTitle('复制绝对路径')
                        .setIcon('copy')
                        .onClick(async () => {
                            const absolutePath = this.getAbsolutePath(file.path);
                            await navigator.clipboard.writeText(absolutePath);
                            new Notice(`已复制路径: ${absolutePath}`);
                        });
                });

                // 根据标签导出
                menu.addItem((item) => {
                    item.setTitle('根据标签导出')
                        .setIcon('download')
                        .onClick(async () => {
                            await this.exportFileByTags(file);
                        });
                });
            })
        );
    }

    // 根据当前笔记标签导出（命令调用）
    async exportCurrentNoteByTags() {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice('没有打开的笔记');
            return;
        }
        await this.exportFileByTags(activeFile);
    }

    // 根据文件标签导出
    async exportFileByTags(file) {
        try {
            const cache = this.app.metadataCache.getFileCache(file);
            if (!cache) {
                new Notice('无法读取文件缓存');
                return;
            }

            // 收集文件的所有标签
            const fileTags = new Set();
            
            if (cache.tags) {
                cache.tags.forEach(t => {
                    const tagName = t.tag.replace(/^#/, '');
                    fileTags.add(tagName);
                });
            }

            if (cache.frontmatter && cache.frontmatter.tags) {
                const fmTags = Array.isArray(cache.frontmatter.tags) 
                    ? cache.frontmatter.tags 
                    : [cache.frontmatter.tags];
                
                fmTags.forEach(t => {
                    if (t != null) {
                        fileTags.add(t.toString());
                    }
                });
            }

            if (fileTags.size === 0) {
                new Notice('当前笔记没有标签');
                return;
            }

            // 查找匹配的导出路径
            const tagExportPaths = this.settings?.tagExportPaths || {};
            let exportPath = '';
            let matchedTag = '';

            for (const fileTag of fileTags) {
                const normalizedFileTag = fileTag.toLowerCase();
                
                for (const [configTag, configPath] of Object.entries(tagExportPaths)) {
                    const normalizedConfigTag = configTag.toLowerCase().replace(/^#/, '');
                    
                    if (normalizedFileTag === normalizedConfigTag) {
                        exportPath = configPath;
                        matchedTag = fileTag;
                        break;
                    }
                }
                
                if (exportPath) break;
            }

            // 如果没有匹配的标签路径，使用默认导出路径
            if (!exportPath) {
                exportPath = this.settings?.exportPath || '';
            }

            if (!exportPath) {
                new Notice('未配置导出路径，请在设置中配置标签导出路径映射或默认导出目录');
                return;
            }

            // 执行导出
            const fs = require('fs');
            const path = require('path');

            // 确保目录存在
            if (!fs.existsSync(exportPath)) {
                fs.mkdirSync(exportPath, { recursive: true });
            }

            // 读取文件内容
            const content = await this.app.vault.read(file);
            
            // 获取标题
            let title = cache.frontmatter?.title || file.basename;
            if (title != null && typeof title !== 'string') {
                title = String(title);
            }

            // 清理文件名中的非法字符
            const safeFileName = title.replace(/[\\/:*?"<>|]/g, '_') + '.md';
            const targetPath = path.join(exportPath, safeFileName);

            // 写入文件
            fs.writeFileSync(targetPath, content, 'utf8');

            const tagInfo = matchedTag ? ` (标签: #${matchedTag})` : '';
            new Notice(`✅ 已导出到: ${targetPath}${tagInfo}`);
            console.log(`📁 导出成功: ${targetPath}`);

        } catch (error) {
            console.error('导出失败:', error);
            new Notice('导出失败: ' + error.message);
        }
    }

    onunload() {
        console.log('Tag Click Search: 插件卸载');
        
        // 清理视图
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_TAG_SEARCH);
        
        // 清理系统搜索增强功能
        this.cleanupSearchEnhancements();
    }

    // 初始化系统搜索增强功能
    initSearchEnhancements() {
        this.searchDomWrapper = null;
        this.searchSortEnhancer = null;
        this.searchLayoutHandler = null;
        this.metadataCacheHandler = null;
        
        // 创建标题解析器
        const titleResolver = (filePath) => {
            const file = this.app.vault.getAbstractFileByPath(filePath);
            if (!file || file.extension !== 'md') return null;
            
            const cache = this.app.metadataCache.getFileCache(file);
            let title = cache?.frontmatter?.title;
            if (title != null && typeof title !== 'string') {
                title = String(title);
            }
            return title || file.basename;
        };
        
        // 启用系统搜索标题替换
        const enableSearchTitleReplace = () => {
            if (!this.settings.enableSearchTitleReplace) return;
            
            const searchLeaves = this.app.workspace.getLeavesOfType('search');
            if (searchLeaves.length === 0) return;
            
            const searchView = searchLeaves[0].view;
            if (!searchView || !searchView.dom) return;
            
            // 如果已经有包装器，先刷新
            if (this.searchDomWrapper) {
                this.searchDomWrapper.refresh();
                return;
            }
            
            this.searchDomWrapper = new SearchDomWrapper(this, searchView.dom, titleResolver);
            console.log('✅ 系统搜索标题替换已启用');
        };
        
        // 启用系统搜索排序功能
        const enableSearchSort = () => {
            if (!this.settings.enableSearchTitleSort) return;
            
            if (!this.searchSortEnhancer) {
                this.searchSortEnhancer = new SearchSortEnhancer(this);
            }
            this.searchSortEnhancer.enable();
            console.log('✅ 系统搜索排序功能已启用');
        };
        
        // 监听布局变化，在搜索视图激活时启用功能
        this.searchLayoutHandler = this.app.workspace.on('layout-change', () => {
            const searchLeaves = this.app.workspace.getLeavesOfType('search');
            if (searchLeaves.length > 0 && searchLeaves[0].view) {
                enableSearchTitleReplace();
                enableSearchSort();
            }
        });
        
        // 监听元数据变化，刷新搜索结果标题
        this.metadataCacheHandler = this.app.metadataCache.on('changed', (file) => {
            if (this.searchDomWrapper && this.settings.enableSearchTitleReplace) {
                // 延迟刷新，确保元数据已更新
                setTimeout(() => {
                    this.searchDomWrapper.refresh();
                }, 100);
            }
        });
        
        // 如果搜索视图已经打开，立即启用
        setTimeout(() => {
            enableSearchTitleReplace();
            enableSearchSort();
        }, 1000);
    }
    
    // 清理系统搜索增强功能
    cleanupSearchEnhancements() {
        if (this.searchDomWrapper) {
            this.searchDomWrapper.disable();
            this.searchDomWrapper = null;
        }
        
        if (this.searchSortEnhancer) {
            this.searchSortEnhancer.disable();
            this.searchSortEnhancer = null;
        }
        
        if (this.searchLayoutHandler) {
            this.app.workspace.offref(this.searchLayoutHandler);
            this.searchLayoutHandler = null;
        }
        
        if (this.metadataCacheHandler) {
            this.app.metadataCache.offref(this.metadataCacheHandler);
            this.metadataCacheHandler = null;
        }
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

    // 搜索并显示结果（支持标签搜索、标题搜索、组合搜索、多标签搜索、排除标签）
    async searchAndDisplay(query, dateFilter = null) {
        try {
            const trimmedQuery = query.trim();
            
            // 检查是否包含多个标签、排除标签、或排除关键词的复杂搜索
            // 匹配模式：#标签1 #标签2 或 #标签1 -#标签2 或 #标签1 关键词 -排除词
            const hasMultipleTags = (trimmedQuery.match(/#/g) || []).length > 1;
            // 检查是否有排除关键词（空格后跟 - 开头的词，但不是 -#）
            const hasExcludeKeyword = /\s+-(?!#)\S+/.test(trimmedQuery);
            
            if (hasMultipleTags || hasExcludeKeyword) {
                // 复杂标签搜索（支持排除关键词）
                await this.searchByComplexTags(trimmedQuery, dateFilter);
                return;
            }
            
            // 检查是否是组合搜索：#标签 关键词
            const combinedSearchRegex = /^#([\w\u4e00-\u9fa5\-\/]+)\s+(.+)$/;
            const combinedMatch = trimmedQuery.match(combinedSearchRegex);
            
            if (combinedMatch) {
                // 组合搜索：在指定标签下搜索标题
                const tag = combinedMatch[1].toLowerCase();
                const titleKeyword = combinedMatch[2].trim();
                console.log(`🔍 Combined search: tag=#${tag}, title keyword="${titleKeyword}"`);
                await this.searchByTagAndTitle(tag, titleKeyword, dateFilter);
            } else if (trimmedQuery.startsWith('#')) {
                // 纯标签搜索
                const tag = trimmedQuery.substring(1).trim().toLowerCase();
                if (!tag) {
                    console.warn('Tag Click Search: 标签名称为空');
                    return;
                }
                await this.searchByTag(tag, dateFilter);
            } else {
                // 纯标题搜索
                if (!trimmedQuery) {
                    console.warn('Tag Click Search: 搜索关键词为空');
                    return;
                }
                await this.searchByTitle(trimmedQuery, dateFilter);
            }
        } catch (error) {
            console.error('Tag Click Search: 搜索时出错', error);
            new Notice(`搜索时出错: ${error.message}`);
        }
    }

    // 复杂标签搜索（支持多标签AND、排除标签、组合标题搜索、排除标题关键词）
    async searchByComplexTags(query, dateFilter = null) {
        console.log(`🔍 Complex tag search: ${query}`);

        // 解析查询：提取包含标签、排除标签、标题关键词、排除标题关键词
        const parts = query.split(/\s+/);
        const includeTags = [];
        const excludeTags = [];
        const includeKeywords = [];  // 标题必须包含的关键词
        const excludeKeywords = [];  // 标题必须排除的关键词

        for (const part of parts) {
            if (part.startsWith('-#')) {
                // 排除标签
                const tag = part.substring(2).toLowerCase().replace(/\s+/g, '');
                if (tag) excludeTags.push(tag);
            } else if (part.startsWith('#')) {
                // 包含标签
                const tag = part.substring(1).toLowerCase().replace(/\s+/g, '');
                if (tag) includeTags.push(tag);
            } else if (part.startsWith('-') && part.length > 1) {
                // 排除标题关键词（以 - 开头但不是 -#）
                const keyword = part.substring(1).trim();
                if (keyword) excludeKeywords.push(keyword);
            } else if (part.trim()) {
                // 包含标题关键词
                includeKeywords.push(part.trim());
            }
        }

        console.log(`📝 Include tags: [${includeTags.join(', ')}]`);
        console.log(`📝 Exclude tags: [${excludeTags.join(', ')}]`);
        console.log(`📝 Include keywords: [${includeKeywords.join(', ')}]`);
        console.log(`📝 Exclude keywords: [${excludeKeywords.join(', ')}]`);

        if (includeTags.length === 0) {
            new Notice('请至少指定一个要搜索的标签');
            return;
        }

        const matchedFiles = [];
        const allFiles = this.app.vault.getMarkdownFiles();

        for (const file of allFiles) {
            const cache = this.app.metadataCache.getFileCache(file);
            if (!cache) continue;

            // 收集文件的所有标签
            const fileTags = new Set();
            
            // 从内容中收集标签
            if (cache.tags) {
                cache.tags.forEach(t => {
                    const tagName = t.tag.toLowerCase().replace(/^#/, '').replace(/\s+/g, '');
                    fileTags.add(tagName);
                });
            }

            // 从 frontmatter 中收集标签
            if (cache.frontmatter && cache.frontmatter.tags) {
                const fmTags = Array.isArray(cache.frontmatter.tags) 
                    ? cache.frontmatter.tags 
                    : [cache.frontmatter.tags];
                
                fmTags.forEach(t => {
                    if (t != null) {
                        const tagName = t.toString().toLowerCase().replace(/\s+/g, '');
                        fileTags.add(tagName);
                    }
                });
            }

            // 检查是否包含所有必需标签
            const hasAllIncludeTags = includeTags.every(tag => fileTags.has(tag));
            if (!hasAllIncludeTags) continue;

            // 检查是否包含任何排除标签
            const hasAnyExcludeTag = excludeTags.some(tag => fileTags.has(tag));
            if (hasAnyExcludeTag) continue;

            // 获取标题
            let title = cache.frontmatter?.title || file.basename;
            if (title != null && typeof title !== 'string') {
                title = String(title);
            }
            
            if (!title) continue;
            
            const titleLower = title.toLowerCase();

            // 检查标题必须包含的关键词
            if (includeKeywords.length > 0) {
                const allIncludeMatch = includeKeywords.every(kw => 
                    titleLower.includes(kw.toLowerCase())
                );
                if (!allIncludeMatch) continue;
            }

            // 检查标题必须排除的关键词
            if (excludeKeywords.length > 0) {
                const hasAnyExcludeKeyword = excludeKeywords.some(kw => 
                    titleLower.includes(kw.toLowerCase())
                );
                if (hasAnyExcludeKeyword) continue;
            }

            // 通过所有条件，添加到结果
            matchedFiles.push({
                file: file,
                title: title || file.basename,
                cache: cache
            });
        }

        // 按 title 排序（支持中文）
        matchedFiles.sort((a, b) => {
            const titleA = String(a.title || '');
            const titleB = String(b.title || '');
            return titleA.localeCompare(titleB, 'zh-CN', { numeric: true });
        });

        console.log(`Found ${matchedFiles.length} files matching complex search`);

        // 显示结果
        let searchType = 'complex';
        await this.openSearchView(query, matchedFiles, searchType, dateFilter);
    }

    // 按标签和标题组合搜索
    async searchByTagAndTitle(tag, titleKeyword, dateFilter = null) {
        console.log(`🔍 Combined search: tag=#${tag}, title="${titleKeyword}"`);

        // 规范化搜索标签（去除所有空格，转小写）
        const normalizedSearchTag = tag.replace(/\s+/g, '').toLowerCase();
        
        // 将标题关键词按空格分词
        const keywords = titleKeyword.trim().split(/\s+/).filter(k => k.length > 0);
        
        // 获取包含该标签且标题匹配的所有文件
        const matchedFiles = [];
        const allFiles = this.app.vault.getMarkdownFiles();

        for (const file of allFiles) {
            const cache = this.app.metadataCache.getFileCache(file);
            if (!cache) continue;

            // 首先检查是否包含指定标签
            const hasTags = cache.tags && cache.tags.some(t => {
                const tagName = t.tag.toLowerCase().replace(/^#/, '').replace(/\s+/g, '');
                return tagName === normalizedSearchTag;
            });

            let hasFrontmatterTags = false;
            if (cache.frontmatter && cache.frontmatter.tags) {
                if (Array.isArray(cache.frontmatter.tags)) {
                    hasFrontmatterTags = cache.frontmatter.tags.some(t => {
                        if (t == null) return false;
                        const tagName = t.toString().toLowerCase().replace(/\s+/g, '');
                        return tagName === normalizedSearchTag;
                    });
                } else if (cache.frontmatter.tags != null) {
                    const tagName = cache.frontmatter.tags.toString().toLowerCase().replace(/\s+/g, '');
                    hasFrontmatterTags = tagName === normalizedSearchTag;
                }
            }

            // 如果包含标签，再检查标题
            if (hasTags || hasFrontmatterTags) {
                // 获取 title（优先使用 frontmatter 的 title）
                let title = cache.frontmatter?.title || file.basename;
                
                // 确保 title 是字符串类型
                if (title != null && typeof title !== 'string') {
                    title = String(title);
                }
                
                if (!title) continue;
                
                const titleLower = title.toLowerCase();
                
                // 检查是否所有关键词都在标题中
                const allKeywordsMatch = keywords.every(kw => 
                    titleLower.includes(kw.toLowerCase())
                );
                
                if (allKeywordsMatch) {
                    matchedFiles.push({
                        file: file,
                        title: title,
                        cache: cache
                    });
                }
            }
        }

        // 按 title 排序（支持中文）
        matchedFiles.sort((a, b) => {
            const titleA = String(a.title || '');
            const titleB = String(b.title || '');
            return titleA.localeCompare(titleB, 'zh-CN', { numeric: true });
        });

        console.log(`Found ${matchedFiles.length} files with tag #${tag} and title containing: ${keywords.join(', ')}`);

        // 显示结果，使用组合搜索类型
        await this.openSearchView(`#${tag} ${titleKeyword}`, matchedFiles, 'combined', dateFilter);
    }

    // 按标签搜索
    async searchByTag(tag, dateFilter = null) {
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
        await this.openSearchView(tag, filesWithTag, 'tag', dateFilter);
    }

    // 按标题搜索（支持空格分词的模糊搜索）
    async searchByTitle(keyword, dateFilter = null) {
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
        await this.openSearchView(keyword, filesWithTitle, 'title', dateFilter);
    }

    // 搜索标签并显示结果（保留向后兼容）
    async searchAndDisplayTag(tag) {
        await this.searchByTag(tag);
    }

    // 初始化右侧面板视图（用于在面板下拉菜单中显示）
    initLeaf() {
        // 检查是否已存在视图
        if (this.app.workspace.getLeavesOfType(VIEW_TYPE_TAG_SEARCH).length) {
            return;
        }
        // 在右侧面板创建视图（移动端和桌面端都需要）
        this.app.workspace.getRightLeaf(false).setViewState({
            type: VIEW_TYPE_TAG_SEARCH,
            active: true,
        });
    }

    // 切换到搜索面板并聚焦搜索框
    async focusSearchPanel() {
        // 查找现有的搜索视图
        const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_TAG_SEARCH);
        
        let leaf;
        if (existing.length > 0) {
            // 使用现有视图
            leaf = existing[0];
        } else {
            // 创建新视图（空搜索结果）- 统一使用右侧面板
            leaf = this.app.workspace.getRightLeaf(false);

            // 设置视图
            await leaf.setViewState({
                type: VIEW_TYPE_TAG_SEARCH,
                active: true,
            });

            // 初始化视图
            const view = leaf.view;
            if (view instanceof TagSearchResultsView) {
                view.tag = '';
                view.files = [];
                view.plugin = this;
                view.searchType = 'tag';
                await view.onOpen();
            }
        }

        // 显示视图
        this.app.workspace.revealLeaf(leaf);

        // 聚焦搜索框
        setTimeout(() => {
            const view = leaf.view;
            if (view && view.containerEl) {
                const searchInput = view.containerEl.querySelector('.tag-search-input');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select(); // 选中现有文本（如果有）
                    console.log('✅ Tag Click Search: 搜索框已聚焦');
                } else {
                    console.warn('⚠️ Tag Click Search: 未找到搜索框元素');
                }
            }
        }, 100);
    }

    // 打开搜索结果视图
    async openSearchView(query, files, searchType, dateFilter = null) {
        console.log(`📱 Opening search view, platform: ${this.app.isMobile ? 'mobile' : 'desktop'}`);
        
        // 查找现有的搜索视图
        const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_TAG_SEARCH);
        
        let leaf;
        if (existing.length > 0) {
            // 复用现有视图
            console.log('♻️ Reusing existing view');
            leaf = existing[0];
        } else {
            // 创建新视图 - 统一使用右侧面板（移动端和桌面端）
            console.log('📱 Creating right leaf');
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
            view.tag = query;
            view.files = files;
            view.plugin = this;
            view.searchType = searchType;
            view.dateFilter = dateFilter; // 设置日期过滤
            view.selectedFiles.clear(); // 清空之前的选中状态
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

    // 去除 YAML frontmatter
    removeYamlFrontmatter(content) {
        // 匹配 YAML frontmatter (以 --- 开始和结束)
        const yamlRegex = /^---\s*\n[\s\S]*?\n---\s*\n/;
        return content.replace(yamlRegex, '').trim();
    }

    // 清理内容，移除特殊元素（图片、iframe、mactagmap、base引用等）
    cleanContent(content) {
        let cleaned = content;

        // 1. 移除 iframe 标签
        cleaned = cleaned.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');

        // 2. 移除 mactagmap 短代码
        cleaned = cleaned.replace(/\[mctagmap[^\]]*\]/gi, '');

        // 3. 移除 Obsidian base 引用（![[xxx.base#xxx]]）
        cleaned = cleaned.replace(/!\[\[.*?\.base#.*?\]\]/gi, '');

        // 4. 移除图片
        // Markdown 图片: ![alt](url) 或 ![|width](url)
        cleaned = cleaned.replace(/!\[.*?\]\([^)]+\)/g, '');
        
        // Obsidian 图片嵌入: ![[image.png]] 或 ![[image.png|width]]
        cleaned = cleaned.replace(/!\[\[(?!.*\.base#)[^\]]*\.(png|jpg|jpeg|gif|bmp|svg|webp)(?:\|[^\]]*)?\]\]/gi, '');

        // 5. 移除多余的空行（连续的空行压缩为单个空行）
        cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

        // 6. 移除行首行尾空白
        cleaned = cleaned.trim();

        return cleaned;
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

            .tag-search-date-button {
                width: 36px;
                height: 36px;
                padding: 0;
                background-color: var(--interactive-normal);
                color: var(--text-normal);
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                cursor: pointer;
                font-size: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                flex-shrink: 0;
            }

            .tag-search-date-button:hover {
                background-color: var(--interactive-hover);
                border-color: var(--interactive-accent);
            }

            .tag-search-date-button-active {
                background-color: var(--interactive-accent);
                color: var(--text-on-accent);
                border-color: var(--interactive-accent);
            }

            .tag-search-date-button-active:hover {
                background-color: var(--interactive-accent-hover);
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
                flex-shrink: 0;
            }

            .tag-search-button:hover {
                background-color: var(--interactive-accent-hover);
            }

            .tag-search-button:active {
                transform: translateY(1px);
            }

            /* 日期选择器模态框 */
            .date-picker-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .date-picker-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(2px);
            }

            .date-picker-content {
                position: relative;
                background-color: var(--background-primary);
                border-radius: 8px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                max-width: 90vw;
                max-height: 90vh;
                overflow: auto;
                z-index: 1;
            }

            .date-picker-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid var(--background-modifier-border);
                background-color: var(--background-secondary);
            }

            .date-picker-title {
                font-size: 16px;
                font-weight: 600;
                color: var(--text-normal);
            }

            .date-picker-close {
                width: 32px;
                height: 32px;
                border: none;
                background-color: var(--background-modifier-hover);
                color: var(--text-normal);
                border-radius: 4px;
                cursor: pointer;
                font-size: 24px;
                line-height: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s;
            }

            .date-picker-close:hover {
                background-color: var(--background-modifier-error);
                color: var(--text-error);
            }

            .date-picker-footer {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                padding: 16px 20px;
                border-top: 1px solid var(--background-modifier-border);
                background-color: var(--background-secondary);
            }

            .date-confirm-btn,
            .date-cancel-btn {
                padding: 8px 24px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
            }

            .date-confirm-btn {
                background-color: var(--interactive-accent);
                color: var(--text-on-accent);
            }

            .date-confirm-btn:hover {
                background-color: var(--interactive-accent-hover);
            }

            .date-cancel-btn {
                background-color: var(--interactive-normal);
                color: var(--text-normal);
            }

            .date-cancel-btn:hover {
                background-color: var(--interactive-hover);
            }

            /* 日期过滤器样式 */
            .tag-search-date-filter {
                padding: 16px 20px;
            }

            .date-range-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
                flex-wrap: wrap;
                gap: 10px;
            }

            .date-range-display {
                font-size: 14px;
                font-weight: 500;
                color: var(--text-accent);
                flex: 1;
                min-width: 200px;
            }

            .date-quick-actions {
                display: flex;
                gap: 6px;
            }

            .date-quick-btn {
                padding: 5px 12px;
                background-color: var(--interactive-normal);
                color: var(--text-normal);
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s;
            }

            .date-quick-btn:hover {
                background-color: var(--interactive-hover);
            }

            .date-clear-btn {
                background-color: var(--background-primary);
            }

            .date-calendar-wrapper {
                background-color: var(--background-primary);
                border-radius: 6px;
                overflow: hidden;
            }

            .date-calendar-nav {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px;
                background-color: var(--background-modifier-hover);
                border-bottom: 1px solid var(--background-modifier-border);
            }

            .date-nav-arrow {
                width: 32px;
                height: 32px;
                border: none;
                background-color: var(--interactive-normal);
                color: var(--text-normal);
                border-radius: 4px;
                cursor: pointer;
                font-size: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s;
            }

            .date-nav-arrow:hover {
                background-color: var(--interactive-hover);
            }

            .date-month-display {
                font-size: 14px;
                font-weight: 600;
                color: var(--text-normal);
            }

            .date-today-btn {
                padding: 6px 12px;
                background-color: var(--interactive-accent);
                color: var(--text-on-accent);
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: background-color 0.2s;
            }

            .date-today-btn:hover {
                background-color: var(--interactive-accent-hover);
            }

            .date-calendar-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                padding: 10px;
            }

            .date-month-calendar {
                display: flex;
                flex-direction: column;
            }

            .date-month-header {
                text-align: center;
                font-size: 13px;
                font-weight: 600;
                color: var(--text-normal);
                padding: 8px;
                margin-bottom: 8px;
            }

            .date-weekday-row {
                display: grid;
                grid-template-columns: 30px repeat(7, 1fr);
                gap: 2px;
                margin-bottom: 4px;
            }

            .date-week-number-header {
                font-size: 11px;
                color: var(--text-muted);
                text-align: center;
                padding: 4px;
                font-weight: 600;
            }

            .date-weekday {
                font-size: 11px;
                color: var(--text-muted);
                text-align: center;
                padding: 4px;
                font-weight: 500;
            }

            .date-dates-grid {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .date-week-row {
                display: grid;
                grid-template-columns: 30px repeat(7, 1fr);
                gap: 2px;
            }

            .date-week-number {
                font-size: 11px;
                color: var(--text-accent);
                text-align: center;
                padding: 6px 2px;
                cursor: pointer;
                border-radius: 3px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                background-color: var(--background-secondary);
                transition: background-color 0.2s;
            }

            .date-week-number:hover {
                background-color: var(--interactive-accent);
                color: var(--text-on-accent);
            }

            .date-day-cell {
                aspect-ratio: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                color: var(--text-normal);
                border-radius: 3px;
                cursor: pointer;
                transition: all 0.2s;
                background-color: var(--background-primary);
            }

            .date-day-cell:hover {
                background-color: var(--interactive-hover);
            }

            .date-day-cell.date-other-month {
                color: var(--text-faint);
            }

            .date-day-cell.date-today {
                font-weight: 700;
                color: var(--interactive-accent);
                border: 2px solid var(--interactive-accent);
            }

            .date-day-cell.date-in-range {
                background-color: var(--interactive-accent-hover);
                color: var(--text-on-accent);
            }

            .date-day-cell.date-range-boundary {
                background-color: var(--interactive-accent);
                color: var(--text-on-accent);
                font-weight: 600;
            }

            /* 移动端适配 */
            @media (max-width: 768px) {
                .date-calendar-container {
                    grid-template-columns: 1fr;
                }
                
                .date-range-header {
                    flex-direction: column;
                    align-items: flex-start;
                }
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

            .tag-search-header-title-row {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 10px;
                flex-wrap: wrap;
            }

            .tag-search-header h4 {
                margin: 0;
                color: var(--text-normal);
                flex-shrink: 0;
            }

            .tag-search-date-range-info {
                font-size: 13px;
                color: var(--text-accent);
                background-color: var(--background-secondary);
                padding: 4px 10px;
                border-radius: 4px;
                display: inline-block;
                border: 1px solid var(--background-modifier-border);
                flex-shrink: 0;
                line-height: 1.4;
            }

            .tag-search-header-actions {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
            }

            .tag-search-count {
                font-size: 0.9em;
                color: var(--text-muted);
            }

            .tag-search-bottom-actions {
                display: flex;
                gap: 8px;
                align-items: center;
                padding: 10px 12px;
                border-top: 1px solid var(--background-modifier-border);
                background-color: var(--background-secondary);
                position: sticky;
                bottom: 0;
            }

            .tag-search-copy-path-button,
            .tag-search-export-current-button {
                flex: 1;
                background-color: var(--interactive-normal);
                color: var(--text-normal);
                font-size: 13px;
                padding: 8px 12px;
            }

            .tag-search-copy-path-button:hover,
            .tag-search-export-current-button:hover {
                background-color: var(--interactive-hover);
                border-color: var(--interactive-accent);
            }

            .tag-search-bulk-actions {
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .tag-search-action-button {
                padding: 6px 12px;
                background-color: var(--interactive-normal);
                color: var(--text-normal);
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.2s;
            }

            .tag-search-action-button:hover:not(:disabled) {
                background-color: var(--interactive-hover);
                border-color: var(--interactive-accent);
            }

            .tag-search-action-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .tag-search-copy-button:not(:disabled) {
                background-color: var(--interactive-accent);
                color: var(--text-on-accent);
                border-color: var(--interactive-accent);
            }

            .tag-search-copy-button:not(:disabled):hover {
                background-color: var(--interactive-accent-hover);
            }

            .tag-search-list {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .tag-search-item {
                border-radius: 4px;
                transition: background-color 0.2s;
            }

            .tag-search-item:hover {
                background-color: var(--background-modifier-hover);
            }

            .tag-search-item-selected {
                background-color: var(--background-modifier-hover);
                border-left: 3px solid var(--interactive-accent);
            }

            .tag-search-item .tree-item-self {
                padding: 4px 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .tag-search-checkbox {
                flex-shrink: 0;
                width: 16px;
                height: 16px;
                cursor: pointer;
                margin: 0;
            }

            .tag-search-item .tree-item-inner {
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
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

            /* 导出按钮样式 */
            .tag-search-export-button:not(:disabled) {
                background-color: #3b82f6;
                color: white;
                border-color: #3b82f6;
            }

            .tag-search-export-button:not(:disabled):hover {
                background-color: #2563eb;
            }

            /* 系统搜索排序按钮样式 */
            .title-sort-button {
                margin-left: 4px;
            }

            .title-sort-button.is-active {
                color: var(--interactive-accent);
            }

            .title-sort-button.is-active svg {
                stroke: var(--interactive-accent);
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

    // 加载设置
    async loadSettings() {
        const savedData = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, savedData);
        
        // 迁移旧配置：将 vitepressPath 迁移到 exportPath
        if (savedData?.vitepressPath && !savedData?.exportPath) {
            this.settings.exportPath = savedData.vitepressPath;
            delete this.settings.vitepressPath;
            await this.saveSettings();
            console.log('✅ 已将 vitepressPath 迁移到 exportPath');
        }
    }

    // 保存设置
    async saveSettings() {
        await this.saveData(this.settings);
    }
};

// 设置面板类
class TagClickSearchSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Tag Click Search 设置' });

        // 系统搜索增强设置
        containerEl.createEl('h3', { text: '🔍 系统搜索增强' });

        new Setting(containerEl)
            .setName('在系统搜索中显示 Title 属性')
            .setDesc('启用后，Obsidian 系统搜索结果将显示笔记的 frontmatter title 属性，而非文件名')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableSearchTitleReplace)
                .onChange(async (value) => {
                    this.plugin.settings.enableSearchTitleReplace = value;
                    await this.plugin.saveSettings();
                    // 重新初始化搜索增强功能
                    this.plugin.cleanupSearchEnhancements();
                    this.plugin.initSearchEnhancements();
                    new Notice(value ? '系统搜索标题替换已启用' : '系统搜索标题替换已禁用');
                }));

        new Setting(containerEl)
            .setName('启用按 Title 排序')
            .setDesc('在系统搜索结果中添加按 Title 属性排序的按钮')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableSearchTitleSort)
                .onChange(async (value) => {
                    this.plugin.settings.enableSearchTitleSort = value;
                    await this.plugin.saveSettings();
                    // 重新初始化搜索增强功能
                    this.plugin.cleanupSearchEnhancements();
                    this.plugin.initSearchEnhancements();
                    new Notice(value ? '系统搜索排序功能已启用' : '系统搜索排序功能已禁用');
                }));

        // 文件导出设置
        containerEl.createEl('h3', { text: '📤 文件导出' });

        new Setting(containerEl)
            .setName('标签搜索导出目录')
            .setDesc('点击标签搜索结果的导出目录（绝对路径，如 /Users/xxx/docs）')
            .addText(text => text
                .setPlaceholder('/path/to/export/folder')
                .setValue(this.plugin.settings.exportPath)
                .onChange(async (value) => {
                    this.plugin.settings.exportPath = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('系统搜索导出目录')
            .setDesc('原生搜索结果的导出目录（相对于 Vault 的路径，如 exports 或留空表示 Vault 根目录）')
            .addText(text => text
                .setPlaceholder('exports')
                .setValue(this.plugin.settings.searchExportPath)
                .onChange(async (value) => {
                    this.plugin.settings.searchExportPath = value;
                    await this.plugin.saveSettings();
                }));

        // 标签-导出路径映射设置
        containerEl.createEl('h3', { text: '🏷️ 标签导出路径映射' });
        
        const tagExportDesc = containerEl.createEl('p', { 
            cls: 'setting-item-description',
            text: '为不同的标签配置专用的导出目录。搜索特定标签时，导出将使用对应的目录。'
        });

        // 显示现有的标签-路径映射
        const tagExportPaths = this.plugin.settings.tagExportPaths || {};
        const tagMappingContainer = containerEl.createEl('div', { cls: 'tag-export-mapping-container' });
        
        // 渲染标签映射列表的函数
        const renderTagMappings = () => {
            tagMappingContainer.empty();
            
            const entries = Object.entries(this.plugin.settings.tagExportPaths || {});
            
            if (entries.length === 0) {
                tagMappingContainer.createEl('p', { 
                    text: '暂无标签映射配置，点击下方按钮添加。',
                    cls: 'setting-item-description'
                });
            } else {
                for (const [tag, path] of entries) {
                    const mappingItem = tagMappingContainer.createEl('div', { 
                        cls: 'tag-export-mapping-item setting-item'
                    });
                    mappingItem.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid var(--background-modifier-border);';
                    
                    // 标签名显示
                    const tagSpan = mappingItem.createEl('span', { 
                        text: `#${tag}`,
                        cls: 'tag-export-tag-name'
                    });
                    tagSpan.style.cssText = 'min-width: 120px; font-weight: 500; color: var(--text-accent);';
                    
                    // 箭头
                    mappingItem.createEl('span', { text: '→' });
                    
                    // 路径显示
                    const pathSpan = mappingItem.createEl('span', { 
                        text: path,
                        cls: 'tag-export-path'
                    });
                    pathSpan.style.cssText = 'flex: 1; color: var(--text-muted); font-size: 0.9em; overflow: hidden; text-overflow: ellipsis;';
                    
                    // 删除按钮
                    const deleteBtn = mappingItem.createEl('button', { 
                        text: '删除',
                        cls: 'mod-warning'
                    });
                    deleteBtn.style.cssText = 'padding: 4px 8px; font-size: 0.85em;';
                    deleteBtn.addEventListener('click', async () => {
                        delete this.plugin.settings.tagExportPaths[tag];
                        await this.plugin.saveSettings();
                        renderTagMappings();
                        new Notice(`已删除标签 #${tag} 的导出路径映射`);
                    });
                }
            }
        };
        
        renderTagMappings();

        // 添加新映射的表单
        const addMappingDiv = containerEl.createEl('div', { cls: 'tag-export-add-mapping' });
        addMappingDiv.style.cssText = 'margin-top: 12px; padding: 12px; background: var(--background-secondary); border-radius: 8px;';
        
        addMappingDiv.createEl('h4', { text: '添加新的标签映射', cls: 'setting-item-name' });
        
        const inputRow = addMappingDiv.createEl('div');
        inputRow.style.cssText = 'display: flex; gap: 8px; align-items: center; margin-top: 8px;';
        
        const tagInput = inputRow.createEl('input', {
            type: 'text',
            placeholder: '标签名（如：庆余年）'
        });
        tagInput.style.cssText = 'width: 150px; padding: 6px 10px;';
        
        const pathInput = inputRow.createEl('input', {
            type: 'text',
            placeholder: '导出路径（绝对路径）'
        });
        pathInput.style.cssText = 'flex: 1; padding: 6px 10px;';
        
        const addBtn = inputRow.createEl('button', { text: '添加' });
        addBtn.style.cssText = 'padding: 6px 16px;';
        
        addBtn.addEventListener('click', async () => {
            const tag = tagInput.value.trim().replace(/^#/, '');
            const path = pathInput.value.trim();
            
            if (!tag) {
                new Notice('请输入标签名');
                return;
            }
            if (!path) {
                new Notice('请输入导出路径');
                return;
            }
            
            if (!this.plugin.settings.tagExportPaths) {
                this.plugin.settings.tagExportPaths = {};
            }
            
            this.plugin.settings.tagExportPaths[tag] = path;
            await this.plugin.saveSettings();
            
            tagInput.value = '';
            pathInput.value = '';
            renderTagMappings();
            new Notice(`已添加标签 #${tag} 的导出路径映射`);
        });

        // 使用说明
        containerEl.createEl('h3', { text: '📖 使用说明' });
        
        const searchHelpDiv = containerEl.createEl('div', { cls: 'setting-item-description' });
        searchHelpDiv.innerHTML = `
            <h4>系统搜索增强功能</h4>
            <p>1. <strong>显示 Title 属性</strong>：在 Obsidian 系统搜索（Ctrl/Cmd + Shift + F）结果中，显示笔记的 frontmatter title 属性，而不是文件名</p>
            <p>2. <strong>按 Title 排序</strong>：在搜索结果头部添加排序按钮，支持按 Title 属性升序/降序排列</p>
            <p>3. 如果笔记没有 title 属性，则显示文件名</p>
            <br>
            <h4>文件导出功能</h4>
            <p>1. 在搜索结果中选择要导出的笔记</p>
            <p>2. 点击"导出文件"按钮</p>
            <p>3. 笔记会自动转换为标准 Markdown 并导出到指定目录</p>
            <p>4. 如果文件已存在会自动覆盖</p>
            <br>
            <p><strong>默认路径：</strong>如果未设置，将使用 PKM 同级目录下的 docs/docs 文件夹</p>
        `;
    }
}
