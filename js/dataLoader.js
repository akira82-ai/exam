/**
 * 数据加载器模块 - 负责加载和管理科目和知识点数据
 * 实现开发计划 2.1：目录扫描功能
 */
class DataLoader {
    constructor() {
        this.subjects = [];
        this.topics = {};
        this.questions = {};
        this.dataPath = 'data/';
        this.isInitialized = false;
    }

    /**
     * 初始化数据加载器
     */
    async init() {
        try {
            await this.scanDataDirectory();
            this.isInitialized = true;
            console.log('数据加载器初始化成功');
            return true;
        } catch (error) {
            console.error('数据加载器初始化失败:', error);
            return false;
        }
    }

    /**
     * 扫描data目录结构 - 实现开发计划2.1
     * 获取科目列表和知识点列表
     */
    async scanDataDirectory() {
        try {
            // 清空现有数据
            this.subjects = [];
            this.topics = {};
            this.questions = {};
            
            // 获取科目列表
            const subjectDirs = await this.getSubjectDirectories();
            
            // 扫描每个科目目录
            for (const subject of subjectDirs) {
                // 添加到科目列表
                this.subjects.push(subject);
                
                // 获取该科目下的知识点文件列表
                const topicFiles = await this.getTopicFiles(subject);
                this.topics[subject] = topicFiles;
                
                // 预加载每个知识点的题目数据
                for (const topic of topicFiles) {
                    const questions = await this.loadQuestions(subject, topic);
                    this.questions[`${subject}/${topic}`] = questions;
                }
            }
            
            console.log('目录扫描完成:', {
                subjects: this.subjects,
                topics: this.topics,
                totalQuestions: Object.values(this.questions).reduce((sum, qs) => sum + qs.length, 0)
            });
            
            return true;
        } catch (error) {
            console.error('扫描数据目录失败:', error);
            throw error;
        }
    }

    /**
     * 获取科目目录列表
     */
    async getSubjectDirectories() {
        try {
            const response = await fetch(this.dataPath);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            return this.parseFileListFromHTML(html, true); // true 表示只返回目录
        } catch (error) {
            console.error('获取科目目录失败:', error);
            throw error;
        }
    }

    /**
     * 获取指定科目下的知识点文件列表
     */
    async getTopicFiles(subject) {
        try {
            const response = await fetch(`${this.dataPath}${subject}`);  // 移除末尾斜杠
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            return this.parseFileListFromHTML(html, false); // false 表示只返回文件
        } catch (error) {
            console.error(`获取 ${subject} 的文件列表失败:`, error);
            throw error;
        }
    }

    /**
     * 从HTML响应中解析文件列表
     */
    parseFileListFromHTML(html, directoriesOnly = false) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = doc.querySelectorAll('a[href]');
        
        const items = [];
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href === './' || href === '../') return;
            
            // 跳过当前目录和上级目录的特殊链接
            if (href.startsWith('http://') || href.startsWith('https://')) return;
            
            // 检查是否是目录（通过CSS类或链接目标）
            const isDirectory = link.classList.contains('dir') || 
                               (href.includes('/') && !href.includes('.'));
            
            const filename = href.replace(/^.*\//, '').replace(/\/$/, '');
            
            if (!filename) return;
            
            if (directoriesOnly) {
                // 只要目录
                if (isDirectory) {
                    items.push(filename);
                }
            } else {
                // 只要 .txt 文件
                if (href.endsWith('.txt')) {
                    items.push(filename.replace('.txt', ''));
                }
            }
        });
        
        return items;
    }

    

    /**
     * 加载指定科目和知识点的题目
     */
    async loadQuestions(subject, topic) {
        try {
            // 从真实文件加载题目
            const questions = await this.loadQuestionsFromFile(subject, topic);
            
            if (questions.length === 0) {
                throw new Error(`题目文件为空或格式错误: ${subject}/${topic}`);
            }
            
            console.log(`从文件加载题目完成 (${subject}/${topic}): ${questions.length} 题`);
            return questions;
        } catch (error) {
            console.error(`加载题目失败 (${subject}/${topic}):`, error);
            throw error; // 抛出错误，不再使用预设数据
        }
    }

    /**
     * 从文件加载题目
     */
    async loadQuestionsFromFile(subject, topic) {
        try {
            // 正确编码中文文件名
            const encodedTopic = encodeURIComponent(topic);
            const filePath = `${this.dataPath}${subject}/${encodedTopic}.txt`;
            
            const response = await fetch(filePath);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            const lines = text.trim().split('\n').filter(line => line.trim());
            
            const questions = lines.map(line => this.parseQuestion(line)).filter(q => q !== null);
            
            return questions;
        } catch (error) {
            console.warn(`从文件加载题目失败 (${subject}/${topic}):`, error.message);
            return [];
        }
    }

    /**
     * 解析下划线标记
     * 将被-包裹的字符转换为HTML下划线格式
     */
    parseUnderline(text) {
        if (!text) return text;
        
        // 使用正则表达式匹配被-包裹的字符，如 -a- 或 -ee-
        return text.replace(/-([a-zA-Z]+)-/g, '<u>$1</u>');
    }

    /**
     * 解析题目行
     * 格式：题干§选项A§选项B§选项C§选项D§正确答案
     */
    parseQuestion(line) {
        try {
            const parts = line.split('§');
            if (parts.length !== 6) {
                console.warn('题目格式不正确，应为6个部分:', line);
                return null;
            }
            
            const question = {
                text: this.parseUnderline(parts[0].trim()),
                options: {
                    A: this.parseUnderline(parts[1].trim()),
                    B: this.parseUnderline(parts[2].trim()),
                    C: this.parseUnderline(parts[3].trim()),
                    D: this.parseUnderline(parts[4].trim())
                },
                correctAnswer: parts[5].trim().toUpperCase()
            };
            
            // 验证答案格式
            if (!['A', 'B', 'C', 'D'].includes(question.correctAnswer)) {
                console.warn('正确答案格式不正确，应为A、B、C或D:', line);
                return null;
            }
            
            return question;
        } catch (error) {
            console.error('解析题目失败:', line, error);
            return null;
        }
    }

    /**
     * 获取所有科目
     */
    getSubjects() {
        return [...this.subjects];
    }

    /**
     * 获取指定科目的知识点
     */
    getTopics(subject) {
        return this.topics[subject] ? [...this.topics[subject]] : [];
    }

    /**
     * 获取指定科目和知识点的题目
     */
    getQuestions(subject, topic) {
        const key = `${subject}/${topic}`;
        return this.questions[key] ? [...this.questions[key]] : [];
    }

    /**
     * 随机获取指定数量的题目 - 随机题目选择算法
     */
    getRandomQuestions(subject, topic, count = 10) {
        const questions = this.getQuestions(subject, topic);
        
        if (questions.length === 0) {
            console.warn(`没有找到题目 (${subject}/${topic})`);
            return [];
        }
        
        // 如果题目数量少于要求的数量，返回所有题目
        if (questions.length <= count) {
            return this.shuffleArray([...questions]);
        }
        
        // 使用Fisher-Yates洗牌算法随机选择题目
        const shuffled = this.shuffleArray([...questions]);
        return shuffled.slice(0, count);
    }

    /**
     * Fisher-Yates洗牌算法
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * 获取科目和知识点的完整信息
     */
    getSubjectInfo() {
        return this.subjects.map(subject => ({
            name: subject,
            topics: this.getTopics(subject),
            topicCount: this.getTopics(subject).length,
            totalQuestions: this.getTopics(subject).reduce((sum, topic) => 
                sum + this.getQuestions(subject, topic).length, 0)
        }));
    }

    /**
     * 检查数据是否已加载
     */
    isDataLoaded() {
        return this.isInitialized && 
               this.subjects.length > 0 && 
               Object.keys(this.topics).length > 0;
    }

    /**
     * 获取数据加载状态
     */
    getLoadingStatus() {
        return {
            initialized: this.isInitialized,
            subjectsCount: this.subjects.length,
            topicsCount: Object.values(this.topics).reduce((sum, topics) => sum + topics.length, 0),
            questionsCount: Object.values(this.questions).reduce((sum, questions) => sum + questions.length, 0)
        };
    }

    /**
     * 重新加载数据
     */
    async reload() {
        this.isInitialized = false;
        return await this.init();
    }
}

// 创建全局实例
window.dataLoader = new DataLoader();