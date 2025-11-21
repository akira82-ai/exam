/**
 * 报表模块 - 负责成绩统计、图表可视化和报表展示
 */
class Report {
    constructor() {
        this.charts = {};
        this.statistics = null;
    }

    /**
     * 初始化报表模块
     */
    async init() {
        try {
            await this.loadReports();
            console.log('报表模块初始化完成');
            return true;
        } catch (error) {
            console.error('报表模块初始化失败:', error);
            return false;
        }
    }

    /**
     * 加载报表数据
     */
    async loadReports() {
        try {
            // 确保结果模块已初始化
            if (!window.result) {
                console.error('结果模块未加载');
                return;
            }

            // 获取统计数据
            this.statistics = window.result.getStatistics();
            
            // 更新统计卡片
            this.updateStatisticsCards();
            
            // 加载图表
            this.loadCharts();
            
            // 加载历史记录表格
            this.loadHistoryTable();
            
        } catch (error) {
            console.error('加载报表失败:', error);
        }
    }

    /**
     * 更新统计卡片
     */
    updateStatisticsCards() {
        if (!this.statistics) return;

        // 总考试次数
        const totalExamsEl = document.getElementById('totalExams');
        if (totalExamsEl) {
            totalExamsEl.textContent = this.statistics.totalExams;
        }

        // 平均分数
        const averageScoreEl = document.getElementById('averageScore');
        if (averageScoreEl) {
            averageScoreEl.textContent = this.statistics.averageScore;
        }

        // 最高分数
        const highestScoreEl = document.getElementById('highestScore');
        if (highestScoreEl) {
            highestScoreEl.textContent = this.statistics.highestScore;
        }

        // 学习科目
        const subjectCountEl = document.getElementById('subjectCount');
        if (subjectCountEl) {
            subjectCountEl.textContent = this.statistics.subjectCount;
        }
    }

    /**
     * 加载图表
     */
    loadCharts() {
        this.loadScoreTrendChart();
    }

    /**
     * 加载成绩趋势图表
     */
    loadScoreTrendChart() {
        const canvas = document.getElementById('scoreTrendChart');
        if (!canvas) return;

        // 销毁旧图表
        if (this.charts.scoreTrend) {
            this.charts.scoreTrend.destroy();
        }

        // 获取趋势数据
        const trendData = window.result.getScoreTrend(30);
        
        if (trendData.length === 0) {
            // 显示无数据提示
            const ctx = canvas.getContext('2d');
            ctx.font = '16px Arial';
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.fillText('暂无数据', canvas.width / 2, canvas.height / 2);
            return;
        }

        // 创建图表
        this.charts.scoreTrend = new Chart(canvas, {
            type: 'line',
            data: {
                labels: trendData.map(item => this.formatDate(item.date)),
                datasets: [{
                    label: '平均分数',
                    data: trendData.map(item => item.averageScore),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '最近30天成绩趋势'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '分数'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '日期'
                        }
                    }
                }
            }
        });
    }

    

    /**
     * 加载历史记录表格
     */
    loadHistoryTable() {
        const tbody = document.getElementById('historyTableBody');
        if (!tbody) return;

        // 获取所有结果
        const results = window.result.getAllResults();
        
        // 清空表格
        tbody.innerHTML = '';

        if (results.length === 0) {
            const row = tbody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 7;
            cell.className = 'text-center text-muted';
            cell.textContent = '暂无考试记录';
            return;
        }

        // 添加记录
        results.forEach(result => {
            const row = tbody.insertRow();
            
            // 日期
            row.insertCell().textContent = result.date;
            
            // 科目
            row.insertCell().textContent = result.subject;
            
            // 知识点
            row.insertCell().textContent = result.topic;
            
            // 正确数
            const correctCell = row.insertCell();
            correctCell.textContent = result.correctCount;
            correctCell.className = 'text-success';
            
            // 错误数
            const wrongCell = row.insertCell();
            wrongCell.textContent = result.wrongCount;
            wrongCell.className = 'text-danger';
            
            // 分数
            const scoreCell = row.insertCell();
            scoreCell.textContent = result.score;
            scoreCell.className = this.getScoreClass(result.score);
            
            // 操作
            const actionCell = row.insertCell();
            actionCell.innerHTML = `
                <button class="btn btn-sm btn-outline-primary" onclick="report.viewDetail('${result.id}')">
                    <i class="fas fa-eye"></i> 详情
                </button>
            `;
        });
    }

    /**
     * 获取分数对应的样式类
     */
    getScoreClass(score) {
        if (score >= 90) return 'text-success fw-bold';
        if (score >= 80) return 'text-primary';
        if (score >= 70) return 'text-warning';
        return 'text-danger';
    }

    /**
     * 格式化日期
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }

    /**
     * 查看详情
     */
    viewDetail(resultId) {
        const results = window.result.getAllResults();
        const result = results.find(r => r.id === resultId);
        
        if (!result) {
            app.showError('找不到该考试记录');
            return;
        }

        // 这里可以实现详情弹窗或跳转到详情页面
        console.log('查看考试详情:', result);
        app.showSuccess(`查看 ${result.subject}-${result.topic} 的考试详情`);
    }

    /**
     * 刷新报表
     */
    async refresh() {
        try {
            await this.loadReports();
            app.showSuccess('报表已刷新');
        } catch (error) {
            console.error('刷新报表失败:', error);
            app.showError('刷新报表失败');
        }
    }

    /**
     * 导出报表数据
     */
    exportData() {
        try {
            const results = window.result.getAllResults();
            
            if (results.length === 0) {
                app.showError('没有数据可以导出');
                return;
            }

            // 创建CSV内容
            const csvContent = this.createCSVContent(results);
            
            // 创建下载链接
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `考试报表_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            app.showSuccess('报表导出成功');
        } catch (error) {
            console.error('导出报表失败:', error);
            app.showError('导出报表失败');
        }
    }

    /**
     * 创建CSV内容
     */
    createCSVContent(results) {
        const headers = ['日期', '科目', '知识点', '正确数', '错误数', '分数', '用时'];
        const rows = results.map(result => [
            result.date,
            result.subject,
            result.topic,
            result.correctCount,
            result.wrongCount,
            result.score,
            result.totalTime
        ]);
        
        // 添加BOM以支持中文
        const BOM = '\uFEFF';
        return BOM + [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    /**
     * 筛选数据
     */
    filterData(subject = '', topic = '') {
        try {
            let results = window.result.getAllResults();
            
            if (subject) {
                results = results.filter(r => r.subject === subject);
            }
            
            if (topic) {
                results = results.filter(r => r.topic === topic);
            }
            
            // 更新表格
            this.updateHistoryTable(results);
            
            app.showSuccess(`筛选出 ${results.length} 条记录`);
        } catch (error) {
            console.error('筛选数据失败:', error);
            app.showError('筛选数据失败');
        }
    }

    /**
     * 更新历史记录表格
     */
    updateHistoryTable(results) {
        const tbody = document.getElementById('historyTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (results.length === 0) {
            const row = tbody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 7;
            cell.className = 'text-center text-muted';
            cell.textContent = '没有符合条件的数据';
            return;
        }

        results.forEach(result => {
            const row = tbody.insertRow();
            
            row.insertCell().textContent = result.date;
            row.insertCell().textContent = result.subject;
            row.insertCell().textContent = result.topic;
            
            const correctCell = row.insertCell();
            correctCell.textContent = result.correctCount;
            correctCell.className = 'text-success';
            
            const wrongCell = row.insertCell();
            wrongCell.textContent = result.wrongCount;
            wrongCell.className = 'text-danger';
            
            const scoreCell = row.insertCell();
            scoreCell.textContent = result.score;
            scoreCell.className = this.getScoreClass(result.score);
            
            const actionCell = row.insertCell();
            actionCell.innerHTML = `
                <button class="btn btn-sm btn-outline-primary" onclick="report.viewDetail('${result.id}')">
                    <i class="fas fa-eye"></i> 详情
                </button>
            `;
        });
    }

    /**
     * 销毁所有图表
     */
    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}

// 创建全局报表实例
window.report = new Report();

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.report.init();
});