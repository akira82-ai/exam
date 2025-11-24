/**
 * 结果处理模块 - 负责成绩记录、错题管理和结果分析
 */
class Result {
    constructor() {
        this.results = [];
        this.errorRecords = [];
        this.logPath = 'log/';
        this.errorPath = 'error/';
    }

    /**
     * 初始化结果处理器
     */
    async init() {
        try {
            await this.loadExistingResults();
            console.log('结果处理器初始化完成');
            return true;
        } catch (error) {
            console.error('结果处理器初始化失败:', error);
            return false;
        }
    }

    /**
     * 保存考试结果 - 实现成绩记录功能
     */
    async saveExamResult(result) {
        try {
            // 格式化结果数据
            const formattedResult = this.formatResult(result);
            
            // 保存到内存
            this.results.push(formattedResult);
            
            // 保存到本地存储
            this.saveToLocalStorage();
            
            // 尝试保存到服务器/文件系统
            await this.saveToFile(formattedResult);
            
            // 保存错题记录
            if (result.wrongQuestions && result.wrongQuestions.length > 0) {
                await this.saveErrorQuestions(result);
            }
            
            console.log('考试结果保存成功:', formattedResult);
            return true;
        } catch (error) {
            console.error('保存考试结果失败:', error);
            return false;
        }
    }

    /**
     * 格式化结果数据
     */
    formatResult(result) {
        const date = new Date(result.date);
        const dateStr = date.toISOString().split('T')[0];
        
        return {
            id: this.generateId(),
            date: dateStr,
            time: date.toTimeString().split(' ')[0],
            subject: result.subject,
            topic: result.topic,
            correctCount: result.correctCount,
            wrongCount: result.wrongCount,
            score: result.score,
            totalTime: this.formatTime(result.totalTime),
            timestamp: date.getTime()
        };
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 格式化时间
     */
    formatTime(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * 保存到本地存储
     */
    saveToLocalStorage() {
        try {
            // 不再保存考试结果到localStorage，完全从log目录读取
            console.log('考试结果仅保存到文件系统，不再使用localStorage');
            // 不再保存错题数据到localStorage，错题只从文件读取
        } catch (error) {
            console.warn('本地存储操作失败:', error);
        }
    }

    /**
     * 从本地存储加载数据
     */
    loadFromLocalStorage() {
        try {
            // 清理localStorage中的考试结果数据，完全从log目录读取
            localStorage.removeItem('examResults');
            console.log('已清理localStorage中的考试历史数据');
            
            // 考试结果完全从log目录动态加载，不再使用localStorage
            this.results = [];
            
            // 错题数据不从localStorage读取，完全从文件系统加载
            this.errorRecords = [];
        } catch (error) {
            console.warn('清理本地存储失败:', error);
            this.results = [];
            this.errorRecords = [];
        }
    }

    /**
     * 保存到文件系统
     */
    async saveToFile(result) {
        try {
            // 生成文件名：日期_时间.txt
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
            const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
            const fileName = `${result.subject}/${dateStr}_${timeStr}.txt`;
            const filePath = this.logPath + fileName;
            const resultContent = this.formatResultAsText(result);
            
            // 通过API保存到服务器
            const response = await fetch('/api/save-file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filePath: filePath,
                    content: resultContent
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const saveResult = await response.json();
            console.log('考试结果保存成功:', filePath, saveResult);
            return true;
        } catch (error) {
            console.error('保存到文件失败:', error);
            return false;
        }
    }

    /**
     * 格式化结果为文本格式
     */
    formatResultAsText(result) {
        const date = new Date(result.date);
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = date.toTimeString().split(' ')[0]; // HH:MM:SS
        return `${dateStr}§${timeStr}§${result.subject}§${result.topic}§${result.correctCount}§${result.wrongCount}§${result.score}`;
    }

    /**
     * 格式化结果为CSV格式（保留原方法）
     */
    formatResultAsCSV(result) {
        return `${result.date},${result.subject},${result.topic},${result.correctCount},${result.wrongCount},${result.score}\n`;
    }

    /**
     * 保存错题记录 - 实现错题管理系统
     */
    async saveErrorQuestions(result) {
        try {
            const errorRecord = {
                id: this.generateId(),
                date: result.date,
                subject: result.subject,
                topic: result.topic,
                wrongQuestions: result.wrongQuestions.map(q => ({
                    question: q.question.text,
                    options: q.question.options,
                    userAnswer: q.userAnswer,
                    correctAnswer: q.correctAnswer
                }))
            };
            
            // 保存到内存
            this.errorRecords.push(errorRecord);
            
            // 保存到本地存储
            this.saveToLocalStorage();
            
            // 尝试保存到文件
            await this.saveErrorsToFile(errorRecord);
            
            console.log('错题记录保存成功:', errorRecord);
            return true;
        } catch (error) {
            console.error('保存错题记录失败:', error);
            return false;
        }
    }

    /**
     * 保存错题到文件
     */
    async saveErrorsToFile(errorRecord) {
        try {
            // 生成文件名：日期_时间.txt
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
            const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
            const fileName = `${errorRecord.subject}/${dateStr}_${timeStr}.txt`;
            const filePath = this.errorPath + fileName;
            const errorContent = this.formatErrorQuestions(errorRecord);
            
            // 通过API保存到服务器
            const response = await fetch('/api/save-file', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filePath: filePath,
                    content: errorContent
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('错题保存成功:', filePath, result);
            return true;
        } catch (error) {
            console.error('保存错题到文件失败:', error);
            return false;
        }
    }

    /**
     * 格式化错题为文本格式
     */
    formatErrorQuestions(errorRecord) {
        return errorRecord.wrongQuestions.map(q => 
            `${q.question}§${q.options.A}§${q.options.B}§${q.options.C}§${q.options.D}§${q.correctAnswer}§你的答案:${q.userAnswer}`
        ).join('\n');
    }

    /**
     * 加载已有结果
     */
    async loadExistingResults() {
        try {
            // 先从本地存储加载
            this.loadFromLocalStorage();
            
            // 从log目录动态加载成绩数据
            await this.loadLogFiles();
            
            // 加载已有的错题文件
            await this.loadExistingErrorFiles();
            
            // 尝试从服务器加载更多数据
            await this.loadFromServer();
            
            return true;
        } catch (error) {
            console.error('加载已有结果失败:', error);
            return false;
        }
    }

    /**
     * 从log目录加载成绩数据
     */
    async loadLogFiles() {
        try {
            console.log('开始动态扫描log目录...');
            
            // 通过API获取log文件列表
            const response = await fetch('/api/list-log-files');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || '获取log文件列表失败');
            }
            
            const logFiles = result.files;
            console.log(`发现 ${logFiles.length} 个log文件:`, logFiles);
            
            // 加载每个log文件
            for (const filePath of logFiles) {
                await this.loadLogFile(filePath);
            }
            
            console.log('log目录扫描完成');
        } catch (error) {
            console.error('扫描log目录失败:', error);
            // 如果API失败，尝试使用备用方案
            console.log('尝试备用扫描方案...');
            await this.fallbackLoadLogFiles();
        }
    }

    /**
     * 备用log扫描方案（当API不可用时使用）
     */
    async fallbackLoadLogFiles() {
        try {
            // 尝试扫描一些常见的log文件路径
            const commonLogFiles = [
                '英语/2025-11-20_18-38-10.txt',
                '英语/2025-11-21_10-49-58.txt',
                '英语/2025-11-21_12-46-39.txt',
                '英语/2025-11-21_14-18-33.txt'
            ];
            
            for (const filePath of commonLogFiles) {
                await this.loadLogFile(filePath);
            }
        } catch (error) {
            console.error('备用log扫描方案也失败:', error);
        }
    }

    /**
     * 加载单个log文件
     */
    async loadLogFile(filePath) {
        try {
            console.log(`开始读取log文件: ${filePath}`);
            
            // 读取log文件内容
            const response = await fetch(this.logPath + filePath);
            if (!response.ok) {
                console.warn(`无法加载log文件: ${filePath}, 状态码: ${response.status}`);
                return;
            }
            
            const content = await response.text();
            if (!content.trim()) {
                console.warn(`文件为空: ${filePath}`);
                return;
            }
            
            console.log(`文件 ${filePath} 读取成功，内容长度: ${content.length}`);
            
            // 解析文件路径
            const [subject, fileName] = filePath.split('/');
            
            // 从文件名提取日期和时间
            const dateMatch = fileName.match(/(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})/);
            const date = dateMatch ? 
                new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]} ${dateMatch[4]}:${dateMatch[5]}:${dateMatch[6]}`) : 
                new Date();
            
            // 解析log内容
            const lines = content.split('\n').filter(line => line.trim());
            console.log(`文件 ${filePath} 包含 ${lines.length} 行有效数据`);
            
            lines.forEach((line, index) => {
                const parts = line.split('§');
                if (parts.length >= 7) {
                    const [dateStr, timeStr, subject, topic, correctCount, wrongCount, score] = parts;
                    
                    // 创建结果对象
                    const result = {
                        id: `${subject}-${fileName}-${index}`,
                        date: dateStr,
                        time: timeStr,
                        subject: subject,
                        topic: topic || '默认知识点',
                        correctCount: parseInt(correctCount) || 0,
                        wrongCount: parseInt(wrongCount) || 0,
                        score: parseInt(score) || 0,
                        totalTime: '00:00', // log文件中没有时间信息，使用默认值
                        timestamp: date.getTime()
                    };
                    
                    // 检查是否已存在相同的结果（避免重复）
                    // 使用更精确的ID来判断重复，而不是仅靠日期、科目和知识点
                    const existingIndex = this.results.findIndex(r => r.id === result.id);
                    
                    if (existingIndex === -1) {
                        this.results.push(result);
                        console.log(`成功加载成绩记录: ${subject}-${topic}, 分数: ${score}, ID: ${result.id}`);
                    } else {
                        console.log(`跳过重复记录: ${subject}-${topic}, ID: ${result.id}`);
                    }
                }
            });
        } catch (error) {
            console.error(`加载log文件失败 ${filePath}:`, error);
        }
    }

    /**
     * 加载已有的错题文件
     */
    async loadExistingErrorFiles() {
        try {
            console.log('开始扫描错题目录...');
            
            // 清空现有错题记录
            this.errorRecords = [];
            
            // 扫描错题目录
            await this.scanErrorDirectory();
            
            console.log(`错题加载完成，总共 ${this.errorRecords.length} 条错题记录`);
            return true;
        } catch (error) {
            console.error('加载错题文件失败:', error);
            return false;
        }
    }

    /**
     * 扫描错题目录
     */
    async scanErrorDirectory() {
        try {
            console.log('开始动态扫描错题目录...');
            
            // 通过API获取错题文件列表
            const response = await fetch('/api/list-error-files');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || '获取错题文件列表失败');
            }
            
            const errorFiles = result.files;
            console.log(`发现 ${errorFiles.length} 个错题文件:`, errorFiles);
            
            // 加载每个错题文件
            for (const filePath of errorFiles) {
                await this.loadErrorFile(filePath);
            }
            
            console.log('错题目录扫描完成');
        } catch (error) {
            console.error('扫描错题目录失败:', error);
            // 如果API失败，尝试使用备用方案
            console.log('尝试备用扫描方案...');
            await this.fallbackScanErrorDirectory();
        }
    }

    /**
     * 备用扫描方案（当API不可用时使用）
     */
    async fallbackScanErrorDirectory() {
        try {
            // 尝试扫描一些常见的错题文件路径
            const commonErrorFiles = [
                '英语/2025-11-20_18-38-10.txt',
                '英语/2025-11-21_10-49-58.txt',
                '英语/2025-11-21_12-46-39.txt',
                '英语/2025-11-21_14-18-33.txt'
            ];
            
            for (const filePath of commonErrorFiles) {
                await this.loadErrorFile(filePath);
            }
        } catch (error) {
            console.error('备用扫描方案也失败:', error);
        }
    }

    

    

    /**
     * 从题目中提取知识点
     */
    extractTopicFromQuestion(question) {
        if (!question) return '默认知识点';
        
        // 根据题目内容推断知识点
        if (question.includes('发音') || question.includes('读音') || question.includes('音标')) {
            return '语音练习';
        } else if (question.includes('单词') || question.includes('vocabulary')) {
            return '词汇练习';
        } else if (question.includes('语法') || question.includes('grammar')) {
            return '语法练习';
        } else if (question.includes('画线部分') || question.includes('下划线')) {
            return '辨音练习';
        } else if (question.includes('选择') || question.includes('choose')) {
            return '选择题';
        } else {
            return '综合练习';
        }
    }

    /**
     * 加载单个错题文件
     */
    async loadErrorFile(filePath) {
        try {
            console.log(`开始读取错题文件: ${filePath}`);
            
            // 读取错题文件内容
            const response = await fetch(this.errorPath + filePath);
            if (!response.ok) {
                console.warn(`无法加载错题文件: ${filePath}, 状态码: ${response.status}`);
                return;
            }
            
            const content = await response.text();
            if (!content.trim()) {
                console.warn(`文件为空: ${filePath}`);
                return;
            }
            
            console.log(`文件 ${filePath} 读取成功，内容长度: ${content.length}`);
            
            // 解析文件路径
            const [subject, fileName] = filePath.split('/');
            
            // 从文件名提取日期
            const dateMatch = fileName.match(/(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})/);
            const date = dateMatch ? 
                new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]} ${dateMatch[4]}:${dateMatch[5]}:${dateMatch[6]}`) : 
                new Date();
            
            // 解析错题内容
            const lines = content.split('\n').filter(line => line.trim());
            console.log(`文件 ${filePath} 包含 ${lines.length} 行有效数据`);
            
            const wrongQuestions = [];
            
            lines.forEach((line, index) => {
                const parts = line.split('§');
                if (parts.length >= 6) {
                    const question = parts[0];
                    const options = {};
                    
                    // 解析选项
                    for (let i = 1; i <= 4; i++) {
                        const optionText = parts[i];
                        const match = optionText.match(/^([A-D])\.?(.+)$/);
                        if (match) {
                            options[match[1]] = match[2];
                        }
                    }
                    
                    const correctAnswer = parts[5];
                    const userAnswer = parts[6] ? parts[6].replace('你的答案:', '') : null;
                    
                    wrongQuestions.push({
                        id: `${subject}-${fileName}-${index}`,
                        question,
                        options,
                        correctAnswer,
                        userAnswer
                    });
                }
            });
            
            // 创建错题记录
            if (wrongQuestions.length > 0) {
                const errorRecord = {
                    id: `${subject}-${fileName}`,
                    subject,
                    topic: this.extractTopicFromQuestion(wrongQuestions[0].question),
                    date: date.toISOString(),
                    wrongQuestions,
                    mastered: false
                };
                
                this.errorRecords.push(errorRecord);
                console.log(`成功加载错题记录: ${subject}, 题目数: ${wrongQuestions.length}`);
            }
        } catch (error) {
            console.error(`加载错题文件失败 ${filePath}:`, error);
        }
    }

    /**
     * 从服务器加载结果（模拟）
     */
    async loadFromServer() {
        try {
            // 在实际环境中，这里会从服务器获取数据
            // 现在只使用本地存储的数据
            
            console.log('使用本地存储的结果数据');
            return true;
        } catch (error) {
            console.warn('从服务器加载结果失败:', error);
            return false;
        }
    }

    /**
     * 获取所有结果
     */
    getAllResults() {
        return [...this.results].sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * 获取指定科目的结果
     */
    getResultsBySubject(subject) {
        return this.results.filter(result => result.subject === subject);
    }

    /**
     * 获取指定知识点的结果
     */
    getResultsByTopic(subject, topic) {
        return this.results.filter(result => 
            result.subject === subject && result.topic === topic
        );
    }

    /**
     * 获取所有错题记录
     */
    getErrorRecords() {
        return [...this.errorRecords].sort((a, b) => {
            // 使用date属性排序，如果没有date属性则使用id
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
        });
    }

    /**
     * 获取指定科目的错题
     */
    getErrorsBySubject(subject) {
        return this.errorRecords.filter(record => record.subject === subject);
    }

    /**
     * 获取统计信息
     */
    getStatistics() {
        if (this.results.length === 0) {
            return {
                totalExams: 0,
                averageScore: 0,
                highestScore: 0,
                subjectCount: 0,
                subjectStats: {}
            };
        }

        const totalExams = this.results.length;
        const averageScore = Math.round(
            this.results.reduce((sum, r) => sum + r.score, 0) / totalExams
        );
        const highestScore = Math.max(...this.results.map(r => r.score));
        
        // 科目统计
        const subjectStats = {};
        const subjects = [...new Set(this.results.map(r => r.subject))];
        
        subjects.forEach(subject => {
            const subjectResults = this.getResultsBySubject(subject);
            subjectStats[subject] = {
                count: subjectResults.length,
                averageScore: Math.round(
                    subjectResults.reduce((sum, r) => sum + r.score, 0) / subjectResults.length
                ),
                highestScore: Math.max(...subjectResults.map(r => r.score))
            };
        });

        return {
            totalExams,
            averageScore,
            highestScore,
            subjectCount: subjects.length,
            subjectStats
        };
    }

    /**
     * 获取成绩趋势数据
     */
    getScoreTrend(days = 30) {
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        const startDate = now - (days * dayMs);
        
        const recentResults = this.results.filter(r => r.timestamp >= startDate);
        
        // 按日期分组
        const dailyScores = {};
        recentResults.forEach(result => {
            const date = result.date;
            if (!dailyScores[date]) {
                dailyScores[date] = [];
            }
            dailyScores[date].push(result.score);
        });
        
        // 计算每日平均分
        const trend = Object.keys(dailyScores).map(date => ({
            date,
            averageScore: Math.round(
                dailyScores[date].reduce((sum, score) => sum + score, 0) / dailyScores[date].length
            ),
            count: dailyScores[date].length
        })).sort((a, b) => a.date.localeCompare(b.date));
        
        return trend;
    }

    /**
     * 清除所有数据
     */
    clearAllData() {
        this.results = [];
        this.errorRecords = [];
        this.clearLocalStorage();
    }

    /**
     * 清理localStorage中的残留数据
     */
    clearLocalStorage() {
        try {
            // 清理所有考试相关的localStorage数据
            localStorage.removeItem('examResults');
            console.log('已清理localStorage中的所有考试相关数据');
        } catch (error) {
            console.warn('清理localStorage失败:', error);
        }
    }
}

// 创建全局结果实例
window.result = new Result();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.result.init();
});