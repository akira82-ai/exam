/**
 * 错题集模块 - 负责错题管理、展示和练习
 */
class Errors {
    constructor() {
        this.errorRecords = [];
        this.filteredErrors = [];
        this.currentFilters = {
            subject: '',
            topic: '',
            date: ''
        };
        this.practiceMode = false;
        this.practiceQuestions = [];
        this.currentPracticeIndex = 0;
        this.practiceAnswers = {};
    }

    /**
     * 初始化错题集模块
     */
    async init() {
        try {
            console.log('错题集模块开始初始化...');
            
            // 设置事件监听器
            this.setupEventListeners();
            
            // 加载错题记录
            await this.loadErrorRecords();
            
            // 更新统计和渲染
            this.updateStatistics();
            this.renderErrorList();
            
            console.log('错题集模块初始化完成');
            return true;
        } catch (error) {
            console.error('错题集模块初始化失败:', error);
            return false;
        }
    }

    /**
     * 手动重新加载错题（用于调试）
     */
    async reloadErrors() {
        console.log('手动重新加载错题...');
        
        // 确保result模块已初始化
        if (window.result) {
            // 重新加载错题文件
            await window.result.loadExistingErrorFiles();
            
            // 重新加载错题记录
            await this.loadErrorRecords();
            
            // 更新界面
            this.updateStatistics();
            this.renderErrorList();
            
            console.log('错题重新加载完成');
        } else {
            console.error('result模块未初始化');
        }
    }

    /**
     * 加载错题记录
     */
    async loadErrorRecords() {
        try {
            console.log('开始加载错题记录...');
            
            // 等待result模块初始化完成
            let attempts = 0;
            while ((!window.result || !window.result.getErrorRecords) && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
                console.log(`等待result模块初始化... 尝试 ${attempts}/50`);
            }
            
            if (window.result && window.result.getErrorRecords) {
                this.errorRecords = window.result.getErrorRecords();
                this.filteredErrors = [...this.errorRecords];
                
                console.log(`成功加载 ${this.errorRecords.length} 条错题记录`);
                
                // 初始化筛选选项
                this.initializeFilters();
                
                // 如果有错题记录，更新统计和渲染
                if (this.errorRecords.length > 0) {
                    this.updateStatistics();
                    this.renderErrorList();
                } else {
                    console.log('没有找到错题记录，显示空状态');
                    this.renderErrorList();
                }
            } else {
                console.error('无法获取错题记录，result模块未初始化或缺少getErrorRecords方法');
                // 显示空状态
                this.renderErrorList();
            }
        } catch (error) {
            console.error('加载错题记录失败:', error);
            // 显示错误状态
            this.renderErrorList();
        }
    }

    /**
     * 初始化筛选选项
     */
    initializeFilters() {
        // 更新科目筛选选项
        const subjectFilter = document.getElementById('subjectFilter');
        if (subjectFilter) {
            const subjects = this.getUniqueSubjects();
            subjectFilter.innerHTML = '<option value="">全部科目</option>';
            subjects.forEach(subject => {
                subjectFilter.innerHTML += `<option value="${subject}">${subject}</option>`;
            });
        }
        
        // 更新知识点筛选选项
        const topicFilter = document.getElementById('topicFilter');
        if (topicFilter) {
            const topics = this.getUniqueTopics();
            topicFilter.innerHTML = '<option value="">全部知识点</option>';
            topics.forEach(topic => {
                topicFilter.innerHTML += `<option value="${topic}">${topic}</option>`;
            });
        }
    }

    /**
     * 更新统计信息
     */
    updateStatistics() {
        // 错题总数
        const totalErrorsEl = document.getElementById('totalErrors');
        if (totalErrorsEl) {
            totalErrorsEl.textContent = this.getTotalErrorCount();
        }

        // 涉及科目
        const errorSubjectsEl = document.getElementById('errorSubjects');
        if (errorSubjectsEl) {
            errorSubjectsEl.textContent = this.getUniqueSubjects().length;
        }

        // 涉及知识点
        const errorTopicsEl = document.getElementById('errorTopics');
        if (errorTopicsEl) {
            errorTopicsEl.textContent = this.getUniqueTopics().length;
        }

        // 已掌握
        const masteredErrorsEl = document.getElementById('masteredErrors');
        if (masteredErrorsEl) {
            masteredErrorsEl.textContent = this.getMasteredCount();
        }
    }

    /**
     * 获取错题总数
     */
    getTotalErrorCount() {
        return this.filteredErrors.reduce((total, record) => {
            return total + record.wrongQuestions.length;
        }, 0);
    }

    /**
     * 获取涉及科目
     */
    getUniqueSubjects() {
        const subjects = new Set();
        this.errorRecords.forEach(record => {
            subjects.add(record.subject);
        });
        return Array.from(subjects);
    }

    /**
     * 获取涉及知识点
     */
    getUniqueTopics() {
        const topics = new Set();
        this.filteredErrors.forEach(record => {
            topics.add(record.topic);
        });
        return Array.from(topics);
    }

    /**
     * 获取已掌握数量
     */
    getMasteredCount() {
        return this.filteredErrors.filter(record => record.mastered).length;
    }

    /**
     * 渲染错题列表
     */
    renderErrorList() {
        const container = document.getElementById('errorsList');
        if (!container) return;

        if (this.filteredErrors.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fas fa-inbox fa-3x mb-3"></i>
                    <p>暂无错题记录</p>
                    <small>完成考试后，答错的题目会自动收录到这里</small>
                </div>
            `;
            return;
        }

        let html = '';
        this.filteredErrors.forEach((record, recordIndex) => {
            const date = new Date(record.date);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
            
            const firstQuestion = record.wrongQuestions[0];
            const questionPreview = firstQuestion ? firstQuestion.question.substring(0, 50) + (firstQuestion.question.length > 50 ? '...' : '') : '';
            
            html += `
                <div class="error-question-card card mb-3 ${record.mastered ? 'mastered' : ''}" data-record-id="${record.id}">
                    <div class="card-body">
                        <div class="error-question-header">
                            <div>
                                <span class="badge bg-secondary me-2">${record.subject}</span>
                                <span class="badge bg-info me-2">${record.topic}</span>
                                <span class="error-question-meta">${dateStr}</span>
                            </div>
                            <div class="error-question-actions">
                                <span class="error-status-badge ${record.mastered ? 'mastered' : 'new'}">
                                    ${record.mastered ? '已掌握' : '新错题'}
                                </span>
                                <button class="btn btn-sm btn-outline-primary" onclick="errors.reviewError('${record.id}')">
                                    <i class="fas fa-eye"></i> 查看详情
                                </button>
                                <button class="btn btn-sm ${record.mastered ? 'btn-outline-warning' : 'btn-outline-success'}" 
                                        onclick="errors.toggleMastered('${record.id}')">
                                    <i class="fas ${record.mastered ? 'fa-undo' : 'fa-check'}"></i> 
                                    ${record.mastered ? '取消掌握' : '标记掌握'}
                                </button>
                            </div>
                        </div>
                        
                        <div class="error-question-summary">
                            <strong>题目预览：</strong>${questionPreview}
                            <div class="mt-2">
                                <span class="text-muted">共 ${record.wrongQuestions.length} 道错题</span>
                            </div>
                        </div>
                        
                        <div class="error-questions-list collapsed" id="questions-${record.id}">
                            ${record.wrongQuestions.map((question, questionIndex) => 
                                this.renderErrorQuestion(question, record.id, questionIndex)
                            ).join('')}
                        </div>
                        
                        <div class="error-question-toggle" onclick="errors.toggleQuestions('${record.id}')">
                            <i class="fas fa-chevron-down"></i>
                            <span class="ms-2">展开查看详情</span>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    /**
     * 渲染单个错题
     */
    renderErrorQuestion(question, recordId, questionIndex) {
        const questionId = `${recordId}-${questionIndex}`;
        
        return `
            <div class="error-question-item mb-3 p-3 border rounded">
                <div class="error-question-text">${question.question}</div>
                <div class="error-options">
                    ${Object.entries(question.options).map(([key, value]) => `
                        <div class="error-option ${key === question.correctAnswer ? 'correct' : ''} ${key === question.userAnswer ? 'wrong user-selected' : ''}">
                            <strong>${key}.</strong> ${value}
                        </div>
                    `).join('')}
                </div>
                <div class="error-answer-feedback">
                    <span class="user-answer">你的答案: ${question.userAnswer || '未作答'}</span>
                    <span class="correct-answer ms-3">正确答案: ${question.correctAnswer}</span>
                </div>
            </div>
        `;
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 科目筛选
        const subjectFilter = document.getElementById('subjectFilter');
        if (subjectFilter) {
            subjectFilter.addEventListener('change', () => {
                this.updateTopicFilter();
            });
        }
        
        // 筛选按钮
        const applyFiltersBtn = document.querySelector('button[onclick="errors.applyFilters()"]');
        const resetFiltersBtn = document.querySelector('button[onclick="errors.resetFilters()"]');
        
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.applyFilters();
            });
        }
        
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => {
                this.resetFilters();
            });
        }
    }

    /**
     * 更新知识点筛选选项
     */
    updateTopicFilter() {
        const subjectFilter = document.getElementById('subjectFilter');
        const topicFilter = document.getElementById('topicFilter');
        
        if (!subjectFilter || !topicFilter) return;
        
        const selectedSubject = subjectFilter.value;
        const topics = selectedSubject ? 
            this.getTopicsBySubject(selectedSubject) : 
            this.getUniqueTopics();
        
        topicFilter.innerHTML = '<option value="">全部知识点</option>';
        topics.forEach(topic => {
            topicFilter.innerHTML += `<option value="${topic}">${topic}</option>`;
        });
    }

    /**
     * 更新科目筛选选项
     */
    updateSubjectFilter() {
        const subjectFilter = document.getElementById('subjectFilter');
        const masteryFilter = document.getElementById('masteryFilter');
        
        if (!subjectFilter) return;
        
        const subjects = this.getUniqueSubjects();
        subjectFilter.innerHTML = '<option value="">全部科目</option>';
        subjects.forEach(subject => {
            subjectFilter.innerHTML += `<option value="${subject}">${subject}</option>`;
        });
        
        // 如果有选择科目，更新知识点筛选
        if (subjectFilter.value) {
            this.updateTopicFilter();
        }
    }

    /**
     * 根据科目获取知识点
     */
    getTopicsBySubject(subject) {
        const topics = new Set();
        this.errorRecords
            .filter(record => record.subject === subject)
            .forEach(record => topics.add(record.topic));
        return Array.from(topics);
    }

    /**
     * 应用筛选
     */
    applyFilters() {
        const subjectFilter = document.getElementById('subjectFilter').value;
        const topicFilter = document.getElementById('topicFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        const masteryFilter = document.getElementById('masteryFilter').value;
        const difficultyFilter = document.getElementById('difficultyFilter').value;
        
        this.filteredErrors = this.errorRecords.filter(record => {
            // 科目筛选
            if (subjectFilter && record.subject !== subjectFilter) {
                return false;
            }
            
            // 知识点筛选
            if (topicFilter && record.topic !== topicFilter) {
                return false;
            }
            
            // 掌握状态筛选
            if (masteryFilter) {
                const isMastered = record.mastered || false;
                switch (masteryFilter) {
                    case 'unmastered':
                        if (isMastered) return false;
                        break;
                    case 'mastered':
                        if (!isMastered) return false;
                        break;
                    case 'reviewing':
                        // 可以根据需要实现复习中状态
                        break;
                }
            }
            
            // 错误频率筛选
            if (difficultyFilter) {
                const errorCount = record.wrongQuestions.length;
                const totalQuestions = record.wrongQuestions.length; // 可以扩展为总题目数
                
                switch (difficultyFilter) {
                    case 'high':
                        if (errorCount >= 5) return false; // 高频：5题以上
                        break;
                    case 'medium':
                        if (errorCount < 2 || errorCount > 4) return false; // 中频：2-4题
                        break;
                    case 'low':
                        if (errorCount >= 2) return false; // 低频：1题
                        break;
                }
            }
            
            // 时间筛选
            if (dateFilter) {
                const recordDate = new Date(record.date);
                const now = new Date();
                
                switch (dateFilter) {
                    case 'today':
                        if (recordDate.toDateString() !== now.toDateString()) {
                            return false;
                        }
                        break;
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        if (recordDate < weekAgo) {
                            return false;
                        }
                        break;
                    case 'month':
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        if (recordDate < monthAgo) {
                            return false;
                        }
                        break;
                    case 'recent':
                        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
                        if (recordDate < threeDaysAgo) {
                            return false;
                        }
                        break;
                }
            }
            
            return true;
        });
        
        this.updateStatistics();
        this.renderErrorList();
        
        app.showSuccess(`筛选出 ${this.getTotalErrorCount()} 道错题`);
    }

    /**
     * 重置筛选
     */
    resetFilters() {
        document.getElementById('subjectFilter').value = '';
        document.getElementById('topicFilter').value = '';
        document.getElementById('dateFilter').value = '';
        document.getElementById('masteryFilter').value = '';
        document.getElementById('difficultyFilter').value = '';
        
        this.filteredErrors = [...this.errorRecords];
        this.updateStatistics();
        this.renderErrorList();
        
        app.showSuccess('筛选条件已重置');
    }

    /**
     * 切换题目列表的展开/折叠状态
     */
    toggleQuestions(recordId) {
        const questionsList = document.getElementById(`questions-${recordId}`);
        const toggle = questionsList.nextElementSibling;
        const toggleText = toggle.querySelector('span');
        
        if (questionsList.classList.contains('collapsed')) {
            questionsList.classList.remove('collapsed');
            toggle.classList.add('expanded');
            toggleText.textContent = '收起详情';
        } else {
            questionsList.classList.add('collapsed');
            toggle.classList.remove('expanded');
            toggleText.textContent = '展开查看详情';
        }
    }

    /**
     * 查看错题详情
     */
    reviewError(recordId) {
        const record = this.errorRecords.find(r => r.id === recordId);
        if (!record) return;
        
        // 自动展开题目列表
        const questionsList = document.getElementById(`questions-${recordId}`);
        const toggle = questionsList.nextElementSibling;
        const toggleText = toggle.querySelector('span');
        
        if (questionsList.classList.contains('collapsed')) {
            questionsList.classList.remove('collapsed');
            toggle.classList.add('expanded');
            toggleText.textContent = '收起详情';
        }
        
        // 滚动到对应卡片
        const card = document.querySelector(`[data-record-id="${recordId}"]`);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        app.showSuccess(`查看 ${record.subject}-${record.topic} 的错题详情`);
    }

    /**
     * 切换掌握状态
     */
    toggleMastered(recordId) {
        const record = this.errorRecords.find(r => r.id === recordId);
        if (!record) return;
        
        record.mastered = !record.mastered;
        
        // 更新filteredErrors中的对应记录
        const filteredRecord = this.filteredErrors.find(r => r.id === recordId);
        if (filteredRecord) {
            filteredRecord.mastered = record.mastered;
        }
        
        // 保存到localStorage
        if (window.result) {
            window.result.saveToLocalStorage();
        }
        
        this.updateStatistics();
        this.renderErrorList();
        
        app.showSuccess(record.mastered ? '已标记为掌握' : '已取消掌握标记');
    }

    /**
     * 练习错题
     */
    practiceErrors() {
        const allQuestions = [];
        this.filteredErrors.forEach(record => {
            if (!record.mastered) {
                record.wrongQuestions.forEach(question => {
                    allQuestions.push({
                        ...question,
                        recordId: record.id,
                        subject: record.subject,
                        topic: record.topic
                    });
                });
            }
        });
        
        if (allQuestions.length === 0) {
            app.showError('没有可练习的错题');
            return;
        }
        
        // 随机打乱题目顺序
        this.practiceQuestions = this.shuffleArray(allQuestions);
        this.currentPracticeIndex = 0;
        this.practiceAnswers = {};
        this.practiceMode = true;
        
        // 显示练习界面
        this.showPracticeInterface();
    }

    /**
     * 显示练习界面
     */
    showPracticeInterface() {
        const container = document.getElementById('errorsList');
        if (!container) return;
        
        const question = this.practiceQuestions[this.currentPracticeIndex];
        const progress = `${this.currentPracticeIndex + 1} / ${this.practiceQuestions.length}`;
        
        container.innerHTML = `
            <div class="error-practice-mode">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h5 class="mb-0">错题练习</h5>
                    <div class="progress" style="width: 200px;">
                        <div class="progress-bar" style="width: ${(this.currentPracticeIndex + 1) / this.practiceQuestions.length * 100}%"></div>
                    </div>
                    <span class="text-muted">${this.currentPracticeIndex + 1}/${this.practiceQuestions.length}</span>
                </div>
                
                <div class="card">
                    <div class="card-body">
                        <div class="error-question-text mb-3">${question.question}</div>
                        <div class="error-options">
                            ${Object.entries(question.options).map(([key, value]) => `
                                <div class="error-option" onclick="errors.selectPracticeAnswer('${key}')">
                                    <strong>${key}.</strong> ${value}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="d-flex justify-content-between mt-3">
                    <button class="btn btn-outline-secondary" onclick="errors.exitPractice()">
                        <i class="fas fa-times"></i> 退出练习
                    </button>
                    <button class="btn btn-primary" onclick="errors.nextPracticeQuestion()" id="nextPracticeBtn" disabled>
                        下一题 <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 选择练习答案
     */
    selectPracticeAnswer(answer) {
        this.practiceAnswers[this.currentPracticeIndex] = answer;
        
        // 更新选项样式
        const options = document.querySelectorAll('.error-option');
        options.forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = Array.from(options).find(option => 
            option.textContent.startsWith(`${answer}.`)
        );
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        // 启用下一题按钮
        document.getElementById('nextPracticeBtn').disabled = false;
    }

    /**
     * 下一题
     */
    nextPracticeQuestion() {
        const question = this.practiceQuestions[this.currentPracticeIndex];
        const userAnswer = this.practiceAnswers[this.currentPracticeIndex];
        
        if (userAnswer === question.correctAnswer) {
            app.showSuccess('回答正确！');
            // 标记为已掌握
            const record = this.errorRecords.find(r => r.id === question.recordId);
            if (record) {
                const wrongQuestion = record.wrongQuestions.find(q => 
                    q.question === question.question
                );
                if (wrongQuestion) {
                    wrongQuestion.mastered = true;
                }
            }
        } else {
            app.showError(`回答错误！正确答案是 ${question.correctAnswer}`);
        }
        
        this.currentPracticeIndex++;
        
        if (this.currentPracticeIndex < this.practiceQuestions.length) {
            setTimeout(() => this.showPracticeInterface(), 1500);
        } else {
            this.finishPractice();
        }
    }

    /**
     * 完成练习
     */
    finishPractice() {
        this.practiceMode = false;
        
        // 计算正确率
        const correctCount = Object.values(this.practiceAnswers).filter((answer, index) => 
            answer === this.practiceQuestions[index].correctAnswer
        ).length;
        
        const accuracy = Math.round((correctCount / this.practiceQuestions.length) * 100);
        
        app.showSuccess(`练习完成！正确率: ${accuracy}%`);
        
        // 保存并刷新
        if (window.result) {
            window.result.saveToLocalStorage();
        }
        
        this.loadErrorRecords();
        this.updateStatistics();
        this.renderErrorList();
    }

    /**
     * 退出练习
     */
    exitPractice() {
        this.practiceMode = false;
        this.renderErrorList();
        app.showSuccess('已退出练习模式');
    }

    /**
     * 清除已掌握的错题
     */
    clearMastered() {
        const masteredCount = this.errorRecords.filter(r => r.mastered).length;
        
        if (masteredCount === 0) {
            app.showError('没有已掌握的错题');
            return;
        }
        
        if (!confirm(`确定要清除 ${masteredCount} 条已掌握的错题记录吗？`)) {
            return;
        }
        
        this.errorRecords = this.errorRecords.filter(record => !record.mastered);
        this.filteredErrors = this.filteredErrors.filter(record => !record.mastered);
        
        // 保存到localStorage
        if (window.result) {
            window.result.saveToLocalStorage();
        }
        
        this.updateStatistics();
        this.renderErrorList();
        
        app.showSuccess(`已清除 ${masteredCount} 条已掌握的错题记录`);
    }

    /**
     * 数组随机打乱
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

// 创建全局错题集实例
window.errors = new Errors();

// 添加调试函数
window.reloadErrors = () => {
    if (window.errors) {
        window.errors.reloadErrors();
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 延迟初始化，确保其他模块已加载
    setTimeout(() => {
        if (window.errors) {
            window.errors.init();
        }
    }, 100);
});