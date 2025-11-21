/**
 * 考试模块 - 负责考试流程控制和答题界面
 */
class Exam {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.startTime = null;
        this.timer = null;
        this.subject = null;
        this.topic = null;
        this.isActive = false;
    }

    /**
     * 开始考试
     */
    startExam(subject, topic) {
        try {
            this.subject = subject;
            this.topic = topic;
            this.questions = dataLoader.getRandomQuestions(subject, topic, 10);
            this.currentQuestionIndex = 0;
            this.answers = {};
            this.startTime = new Date();
            this.isActive = true;

            if (this.questions.length === 0) {
                app.showError('没有找到题目，请选择其他知识点');
                return;
            }

            // 更新面包屑
            app.updateBreadcrumb('topic', topic);

            // 显示考试界面
            app.showSection('examSection');

            // 初始化考试界面
            this.initExamUI();

            // 开始计时
            this.startTimer();

            // 显示第一题
            this.showQuestion(0);

            console.log(`考试开始: ${subject}/${topic}, 共${this.questions.length}题`);

        } catch (error) {
            console.error('开始考试失败:', error);
            app.showError('考试启动失败，请重试');
        }
    }

    /**
     * 初始化考试界面
     */
    initExamUI() {
        // 设置总题数
        document.getElementById('totalQuestions').textContent = this.questions.length;

        // 重置进度条
        this.updateProgress();

        // 绑定事件
        this.bindExamEvents();

        // 启用/禁用导航按钮
        this.updateNavigationButtons();
    }

    /**
     * 绑定考试界面事件
     */
    bindExamEvents() {
        // 下一题按钮
        const nextBtn = document.getElementById('nextQuestionBtn');
        if (nextBtn) {
            nextBtn.onclick = () => this.nextQuestion();
        }

        // 上一题按钮
        const prevBtn = document.getElementById('prevQuestionBtn');
        if (prevBtn) {
            prevBtn.onclick = () => this.previousQuestion();
        }

        // 交卷按钮
        const submitBtn = document.getElementById('submitExamBtn');
        if (submitBtn) {
            submitBtn.onclick = () => this.submitExam();
        }
    }

    /**
     * 显示指定题目
     */
    showQuestion(index) {
        if (index < 0 || index >= this.questions.length) {
            return;
        }

        this.currentQuestionIndex = index;
        const question = this.questions[index];

        // 更新题目文本
        document.getElementById('questionText').innerHTML = 
            `${index + 1}. ${question.text}`;

        // 更新当前题号
        document.getElementById('currentQuestion').textContent = index + 1;

        // 显示选项
        this.showOptions(question);

        // 恢复之前的答案
        this.restoreAnswer(index);

        // 更新进度
        this.updateProgress();

        // 更新导航按钮
        this.updateNavigationButtons();
    }

    /**
     * 显示选项
     */
    showOptions(question) {
        const container = document.getElementById('optionsContainer');
        container.innerHTML = '';

        Object.entries(question.options).forEach(([key, value]) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'form-check mb-3 option-item clickable-option';
            
            const input = document.createElement('input');
            input.className = 'form-check-input';
            input.type = 'radio';
            input.name = 'answer';
            input.id = `option${key}`;
            input.value = key;
            
            // 如果之前有答案，设置为选中状态
            if (this.answers[this.currentQuestionIndex] === key) {
                input.checked = true;
                optionDiv.classList.add('selected');
            }

            input.onchange = () => this.selectAnswer(key);

            const label = document.createElement('label');
            label.className = 'form-check-label';
            label.htmlFor = `option${key}`;
            label.innerHTML = `${key}. ${value}`;

            // 点击整个选项行选择答案
            optionDiv.onclick = () => {
                input.checked = true;
                this.selectAnswer(key);
            };

            optionDiv.appendChild(input);
            optionDiv.appendChild(label);
            container.appendChild(optionDiv);
        });
    }

    /**
     * 选择答案
     */
    selectAnswer(answer) {
        this.answers[this.currentQuestionIndex] = answer;
        
        // 添加选中效果
        const options = document.querySelectorAll('.option-item');
        options.forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.querySelector(`input[value="${answer}"]`).closest('.option-item');
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
    }

    /**
     * 恢复答案
     */
    restoreAnswer(index) {
        const answer = this.answers[index];
        if (answer) {
            const input = document.querySelector(`input[value="${answer}"]`);
            if (input) {
                input.checked = true;
                this.selectAnswer(answer);
            }
        }
    }

    /**
     * 下一题
     */
    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.showQuestion(this.currentQuestionIndex + 1);
        }
    }

    /**
     * 上一题
     */
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.showQuestion(this.currentQuestionIndex - 1);
        }
    }

    /**
     * 更新进度
     */
    updateProgress() {
        const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
        const progressBar = document.getElementById('examProgressBar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    /**
     * 更新导航按钮状态
     */
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevQuestionBtn');
        const nextBtn = document.getElementById('nextQuestionBtn');

        if (prevBtn) {
            prevBtn.disabled = this.currentQuestionIndex === 0;
        }

        if (nextBtn) {
            if (this.currentQuestionIndex === this.questions.length - 1) {
                // 最后一题时改为交卷按钮
                nextBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>交卷';
                nextBtn.className = 'btn btn-success';
                nextBtn.disabled = false;
                // 更新点击事件为交卷
                nextBtn.onclick = () => this.submitExam();
            } else {
                nextBtn.innerHTML = '下一题<i class="fas fa-chevron-right ms-2"></i>';
                nextBtn.className = 'btn btn-primary';
                nextBtn.disabled = false;
                // 恢复下一题功能
                nextBtn.onclick = () => this.nextQuestion();
            }
        }
    }

    /**
     * 开始计时
     */
    startTimer() {
        this.timer = setInterval(() => {
            const elapsed = new Date() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            const timerElement = document.getElementById('examTimer');
            if (timerElement) {
                timerElement.textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    /**
     * 停止计时
     */
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * 交卷
     */
    submitExam() {
        // 检查是否所有题目都已回答
        const unansweredCount = this.questions.length - Object.keys(this.answers).length;
        
        if (unansweredCount > 0) {
            const confirmSubmit = confirm(`还有 ${unansweredCount} 道题目未回答，确定要交卷吗？`);
            if (!confirmSubmit) {
                return;
            }
        }

        // 停止计时
        this.stopTimer();

        // 计算结果
        const result = this.calculateResult();

        // 保存结果
        this.saveResult(result);

        // 显示结果
        this.showResult(result);

        this.isActive = false;
    }

    /**
     * 计算考试结果
     */
    calculateResult() {
        let correctCount = 0;
        const wrongQuestions = [];

        this.questions.forEach((question, index) => {
            const userAnswer = this.answers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            
            if (isCorrect) {
                correctCount++;
            } else {
                wrongQuestions.push({
                    question: question,
                    userAnswer: userAnswer || '未作答',
                    correctAnswer: question.correctAnswer
                });
            }
        });

        const wrongCount = this.questions.length - correctCount;
        const score = Math.round((correctCount / this.questions.length) * 100);
        const totalTime = new Date() - this.startTime;

        return {
            subject: this.subject,
            topic: this.topic,
            totalQuestions: this.questions.length,
            correctCount,
            wrongCount,
            score,
            totalTime,
            wrongQuestions,
            date: new Date().toISOString()
        };
    }

    /**
     * 保存考试结果
     */
    async saveResult(result) {
        try {
            // 保存到结果处理器
            if (window.result) {
                await window.result.saveExamResult(result);
            }
        } catch (error) {
            console.error('保存考试结果失败:', error);
        }
    }

    /**
     * 显示考试结果
     */
    showResult(result) {
        // 更新结果界面
        document.getElementById('finalScore').textContent = result.score;
        document.getElementById('correctCount').textContent = result.correctCount;
        document.getElementById('wrongCount').textContent = result.wrongCount;
        
        const minutes = Math.floor(result.totalTime / 60000);
        const seconds = Math.floor((result.totalTime % 60000) / 1000);
        document.getElementById('totalTime').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // 绑定结果页面事件
        this.bindResultEvents(result);

        // 显示结果页面
        app.showSection('resultsSection');
    }

    /**
     * 绑定结果页面事件
     */
    bindResultEvents(result) {
        // 查看错题按钮
        const reviewErrorsBtn = document.getElementById('reviewErrorsBtn');
        if (reviewErrorsBtn) {
            reviewErrorsBtn.onclick = () => this.reviewErrors(result);
        }

        // 新考试按钮
        const newExamBtn = document.getElementById('newExamBtn');
        if (newExamBtn) {
            newExamBtn.onclick = () => {
                app.showSection('subjectSection');
            };
        }
    }

    /**
     * 查看错题
     */
    reviewErrors(result) {
        if (result.wrongQuestions.length === 0) {
            app.showSuccess('恭喜！没有错题');
            return;
        }

        // 这里可以实现错题查看功能
        // 暂时显示提示
        app.showSuccess(`共有 ${result.wrongQuestions.length} 道错题，错题记录已保存`);
    }

    /**
     * 获取考试状态
     */
    isExamActive() {
        return this.isActive;
    }

    /**
     * 获取当前进度
     */
    getProgress() {
        return {
            current: this.currentQuestionIndex + 1,
            total: this.questions.length,
            answered: Object.keys(this.answers).length
        };
    }
}

// 创建全局考试实例
window.exam = new Exam();