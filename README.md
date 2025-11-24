# 在线考试系统

一个功能完整的在线考试系统，支持多科目考试、错题管理和成绩分析。

## 功能特性

### 📝 考试功能
- 支持多科目考试（英语、数学等）
- 题目类型：选择题
- 实时计分和答题进度显示
- 考试时间控制
- 自动提交和手动提交

### 📊 成绩分析
- 动态成绩报表生成
- 成绩趋势图表展示
- 考试历史记录管理
- 多维度统计分析
- 数据导出功能（CSV格式）

### 📖 错题管理
- 错题自动收集和分类
- 错题练习模式
- 错题掌握状态标记
- 知识点错题统计
- 错题筛选和搜索

### 🔧 系统特性
- 响应式设计，支持多端访问
- 动态数据加载，无需硬编码
- 多科目自动扩展支持
- 本地数据持久化
- 中文界面支持

## 技术架构

### 前端技术
- **HTML5/CSS3**：页面结构和样式
- **JavaScript (ES6+)**：核心业务逻辑
- **Bootstrap**：响应式UI框架
- **Chart.js**：数据可视化
- **AOS**：页面动画效果

### 后端技术
- **Node.js**：服务器运行环境
- **原生HTTP模块**：Web服务器
- **文件系统API**：数据存储管理

### 数据存储
- **文件系统**：考试数据和错题记录
- **log目录**：成绩历史数据
- **error目录**：错题数据
- **localStorage**：临时缓存（v1.2.0后已清理）

## 项目结构

```
exam/
├── index.html          # 主页面
├── server.js           # 服务器入口
├── css/                # 样式文件
│   ├── main.css
│   └── components.css
├── js/                 # JavaScript模块
│   ├── app.js         # 应用主控制器
│   ├── exam.js        # 考试功能模块
│   ├── result.js      # 结果处理模块
│   ├── report.js      # 报表生成模块
│   ├── errors.js      # 错题管理模块
│   └── dataLoader.js  # 数据加载模块
├── lib/                # 第三方库
│   ├── bootstrap/
│   ├── chart.js/
│   ├── aos/
│   └── font-awesome/
├── data/               # 题库数据
├── log/                # 成绩记录
├── error/              # 错题记录
└── README.md           # 项目文档
```

## 快速开始

### 环境要求
- Node.js 14.0 或更高版本
- 现代浏览器（Chrome、Firefox、Safari、Edge）

### 安装和运行

1. **克隆项目**
   ```bash
   git clone https://github.com/akira82-ai/exam.git
   cd exam
   ```

2. **启动服务器**
   ```bash
   node server.js
   ```

3. **访问应用**
   打开浏览器访问：http://localhost:3000

### 数据目录配置

系统会自动创建以下数据目录：
- `data/`：存放题库文件
- `log/`：存放成绩记录
- `error/`：存放错题记录

## API 接口

### 考试数据接口
- `GET /api/list-log-files` - 获取所有日志文件列表
- `GET /api/list-error-files` - 获取所有错题文件列表
- `POST /api/save-file` - 保存文件到指定路径

### 数据格式

#### 成绩记录格式
```
日期§时间§科目§知识点§正确数§错误数§分数
```

#### 错题记录格式
```
题目§选项A§选项B§选项C§选项D§正确答案§用户答案
```

## 版本历史

### v1.2.0 (2025-11-24)
- 🚀 实现成绩报表动态读取功能
- ➕ 添加 `/api/list-log-files` API 端点
- 📁 支持多科目日志文件自动发现
- 🧹 清理 localStorage 中的残留考试数据
- 🐛 修复成绩数据重复过滤逻辑
- 💾 成绩数据完全从 log 目录动态加载

### v1.1.0 (2025-11-24)
- 🚀 实现错题动态扫描功能
- ➕ 添加 `/api/list-error-files` API 端点
- 📁 支持多科目错题文件自动发现
- ❌ 移除硬编码错题文件路径

### v1.0.0
- 🎉 初始版本发布
- 📝 基础考试功能
- 📖 错题集功能

## 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 作者

**akira82-ai** - 项目维护者

## 支持

如果您觉得这个项目有用，请给它一个 ⭐️！
