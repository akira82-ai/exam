/**
 * 主应用模块 - 应用程序入口和主要控制逻辑
 */
class App {
    constructor() {
        this.currentSection = 'homeSection';
        this.selectedSubject = null;
        this.selectedTopic = null;
        this.isInitialized = false;
    }

    /**
     * 应用初始化
     */
    async init() {
        try {
            // 初始化AOS动画
            AOS.init({
                duration: 800,
                once: true
            });

            // 初始化数据加载器
            const dataLoaded = await dataLoader.init();
            if (!dataLoaded) {
                this.showError('数据加载失败，请刷新页面重试');
                return;
            }

            // 初始化结果处理器
            if (window.result) {
                await window.result.init();
            }

            // 绑定事件监听器
            this.bindEventListeners();

            // 显示首页
            this.showSection('homeSection');

            // 标记为已初始化
            this.isInitialized = true;
            console.log('应用初始化完成');

        } catch (error) {
            console.error('应用初始化失败:', error);
            this.showError('应用初始化失败，请刷新页面重试');
        }
    }

    /**
     * 绑定事件监听器
     */
    bindEventListeners() {
        // 导航链接
        document.getElementById('homeLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('homeSection');
        });

        document.getElementById('examLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.startExamFlow();
        });

        document.getElementById('resultsLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('reportsSection');
            if (window.report) {
                window.report.loadReports();
            }
        });

        document.getElementById('errorsLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSection('errorsSection');
        });

        // 首页按钮
        document.getElementById('startExamBtn').addEventListener('click', () => {
            this.startExamFlow();
        });

        document.getElementById('viewResultsBtn').addEventListener('click', () => {
            this.showSection('reportsSection');
            if (window.report) {
                window.report.loadReports();
            }
        });

        // 面包屑导航
        this.bindBreadcrumbEvents();
    }

    /**
     * 绑定面包屑事件
     */
    bindBreadcrumbEvents() {
        // 科目选择面包屑
        const breadcrumbItems = document.querySelectorAll('.breadcrumb-item');
        breadcrumbItems.forEach(item => {
            if (!item.classList.contains('active')) {
                item.addEventListener('click', (e) => {
                    const text = e.target.textContent;
                    if (text === '首页') {
                        this.showSection('homeSection');
                    } else if (text === '科目') {
                        this.showSection('subjectSection');
                    }
                });
            }
        });
    }

    /**
     * 开始考试流程
     */
    startExamFlow() {
        if (!dataLoader.isDataLoaded()) {
            this.showError('数据尚未加载完成，请稍后再试');
            return;
        }
        this.showSection('subjectSection');
        this.loadSubjects();
    }

    /**
     * 显示指定页面区域
     */
    showSection(sectionId) {
        // 隐藏所有区域
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // 显示目标区域
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;

            // 更新导航状态
            this.updateNavigation(sectionId);

            // 如果是错题集页面，初始化错题集模块
            if (sectionId === 'errorsSection' && window.errors) {
                window.errors.init();
            }

            // 重新初始化AOS动画
            AOS.refresh();
        }
    }

    /**
     * 更新导航状态
     */
    updateNavigation(activeSectionId) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // 设置当前活动的导航链接
        let activeLinkId = 'homeLink';
        switch (activeSectionId) {
            case 'homeSection':
                activeLinkId = 'homeLink';
                break;
            case 'subjectSection':
            case 'topicSection':
            case 'examSection':
                activeLinkId = 'examLink';
                break;
            case 'reportsSection':
                activeLinkId = 'resultsLink';
                break;
            case 'resultsSection':
                activeLinkId = 'examLink';
                break;
            case 'errorsSection':
                activeLinkId = 'errorsLink';
                break;
        }

        const activeLink = document.getElementById(activeLinkId);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    /**
     * 加载科目列表
     */
    loadSubjects() {
        const subjects = dataLoader.getSubjects();
        const container = document.getElementById('subjectCards');
        
        if (!container) {
            console.error('找不到科目卡片容器');
            return;
        }

        container.innerHTML = '';

        subjects.forEach((subject, index) => {
            const subjectInfo = dataLoader.getSubjectInfo().find(info => info.name === subject);
            const card = this.createSubjectCard(subject, subjectInfo, index);
            container.appendChild(card);
        });
    }

    /**
     * 创建科目卡片
     */
    createSubjectCard(subject, subjectInfo, index) {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-4';
        
        const card = document.createElement('div');
        card.className = 'card h-100 subject-card';
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-delay', (index * 100).toString());
        
        const iconMap = {
            '化学': 'fa-flask',
            '数学': 'fa-calculator',
            '物理': 'fa-atom'
        };
        
        const colorMap = {
            '化学': 'text-success',
            '数学': 'text-primary',
            '物理': 'text-warning'
        };

        card.innerHTML = `
            <div class="card-body text-center">
                <div class="subject-icon mb-3">
                    <i class="fas ${iconMap[subject] || 'fa-book'} fa-3x ${colorMap[subject] || 'text-info'}"></i>
                </div>
                <h5 class="card-title">${subject}</h5>
                <p class="card-text">
                    <span class="badge bg-secondary">${subjectInfo.topicCount} 个知识点</span>
                    <span class="badge bg-info ms-1">${subjectInfo.totalQuestions} 道题目</span>
                </p>
                <button class="btn btn-primary" onclick="app.selectSubject('${subject}')">
                    <i class="fas fa-arrow-right me-2"></i>选择科目
                </button>
            </div>
        `;

        col.appendChild(card);
        return col;
    }

    /**
     * 选择科目
     */
    selectSubject(subject) {
        this.selectedSubject = subject;
        this.showSection('topicSection');
        this.loadTopics(subject);
        this.updateBreadcrumb('subject', subject);
    }

    /**
     * 加载知识点列表
     */
    loadTopics(subject) {
        const topics = dataLoader.getTopics(subject);
        const container = document.getElementById('topicCards');
        
        if (!container) {
            console.error('找不到知识点卡片容器');
            return;
        }

        container.innerHTML = '';

        // 更新面包屑
        document.getElementById('breadcrumbSubject').textContent = subject;

        topics.forEach((topic, index) => {
            const questions = dataLoader.getQuestions(subject, topic);
            const card = this.createTopicCard(subject, topic, questions.length, index);
            container.appendChild(card);
        });
    }

    /**
     * 创建知识点卡片
     */
    createTopicCard(subject, topic, questionCount, index) {
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-4';
        
        const card = document.createElement('div');
        card.className = 'card h-100 topic-card';
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-delay', (index * 100).toString());
        
        card.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">
                    <i class="fas fa-bookmark text-primary me-2"></i>${topic}
                </h5>
                <p class="card-text">
                    <span class="badge bg-info">${questionCount} 道题目</span>
                </p>
                <button class="btn btn-success" onclick="app.startExam('${subject}', '${topic}')">
                    <i class="fas fa-play me-2"></i>开始答题
                </button>
            </div>
        `;

        col.appendChild(card);
        return col;
    }

    /**
     * 开始考试
     */
    startExam(subject, topic) {
        this.selectedSubject = subject;
        this.selectedTopic = topic;
        
        if (window.exam) {
            window.exam.startExam(subject, topic);
        } else {
            console.error('考试模块未加载');
            this.showError('考试模块未加载，请刷新页面重试');
        }
    }

    /**
     * 更新面包屑
     */
    updateBreadcrumb(level, value) {
        switch (level) {
            case 'subject':
                document.getElementById('breadcrumbSubject').textContent = value;
                break;
            case 'topic':
                document.getElementById('examBreadcrumbSubject').textContent = this.selectedSubject;
                document.getElementById('examBreadcrumbTopic').textContent = value;
                break;
        }
    }

    /**
     * 显示错误信息
     */
    showError(message) {
        // 创建错误提示
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        alert.style.cssText = 'top: 80px; right: 20px; z-index: 9999; min-width: 300px;';
        alert.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alert);
        
        // 自动移除
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
    }

    /**
     * 显示成功信息
     */
    showSuccess(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show position-fixed';
        alert.style.cssText = 'top: 80px; right: 20px; z-index: 9999; min-width: 300px;';
        alert.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 3000);
    }

    /**
     * 获取当前选中的科目
     */
    getSelectedSubject() {
        return this.selectedSubject;
    }

    /**
     * 获取当前选中的知识点
     */
    getSelectedTopic() {
        return this.selectedTopic;
    }
}

// 创建全局应用实例
window.app = new App();

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app.init();
});