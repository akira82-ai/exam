const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// MIME 类型映射
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.woff2': 'application/font-woff2',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  // 启用 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;
  const method = req.method;

  // 处理根目录
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // 处理 API 请求
  if (pathname.startsWith('/api/')) {
    handleApiRequest(req, res, pathname, method);
    return;
  }

  // 解码 URL 编码的路径（特别是中文）
  pathname = decodeURIComponent(pathname);

  const filePath = path.join(__dirname, pathname);
  const ext = path.parse(filePath).ext;
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  // 检查是否是目录请求
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    // 生成目录列表
    try {
      const files = fs.readdirSync(filePath);
      const fileList = files.map(file => {
        const fileFullPath = path.join(filePath, file);
        const stats = fs.statSync(fileFullPath);
        const isDir = stats.isDirectory();
        
        return {
          name: file,
          isDirectory: isDir,
          size: isDir ? 0 : stats.size,
          modified: stats.mtime
        };
      });

      // 生成 HTML 目录列表
      let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>目录列表 - ${pathname}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    a { text-decoration: none; color: #0066cc; }
    a:hover { text-decoration: underline; }
    .dir { font-weight: bold; }
  </style>
</head>
<body>
  <h1>目录列表: ${pathname}</h1>
  <table>
    <tr>
      <th>名称</th>
      <th>类型</th>
      <th>大小</th>
      <th>修改时间</th>
    </tr>
`;

      // 添加上级目录链接
      if (pathname !== '/') {
        const parentPath = path.dirname(pathname);
        html += `
    <tr>
      <td><a href="${parentPath}/../">../</a></td>
      <td>目录</td>
      <td>-</td>
      <td>-</td>
    </tr>
`;
      }

      // 添加文件和目录
      fileList.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      fileList.forEach(file => {
        const fileUrl = path.join(pathname, file.name).replace(/\\/g, '/');
        const type = file.isDirectory ? '目录' : '文件';
        const size = file.isDirectory ? '-' : formatFileSize(file.size);
        const modified = file.modified.toLocaleString('zh-CN');
        const cssClass = file.isDirectory ? 'dir' : '';

        html += `
    <tr>
      <td><a href="${fileUrl}" class="${cssClass}">${file.name}</a></td>
      <td>${type}</td>
      <td>${size}</td>
      <td>${modified}</td>
    </tr>
`;
      });

      html += `
  </table>
</body>
</html>
`;

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    } catch (error) {
      console.error('读取目录失败:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('服务器内部错误');
      return;
    }
  }

  // 处理文件请求
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('文件未找到');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('服务器内部错误');
      }
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      });
      res.end(content, 'utf-8');
    }
  });
});

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 处理 API 请求
 */
function handleApiRequest(req, res, pathname, method) {
  if (method === 'POST' && pathname === '/api/save-file') {
    saveFile(req, res);
  } else if (method === 'GET' && pathname === '/api/list-error-files') {
    listErrorFiles(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
  }
}

/**
 * 保存文件到指定目录
 */
function saveFile(req, res) {
  let body = '';
  
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const { filePath, content } = data;
      
      if (!filePath || content === undefined) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing filePath or content' }));
        return;
      }
      
      // 确保路径是相对路径且在项目目录内
      const fullPath = path.join(__dirname, filePath);
      
      // 检查路径是否在允许的目录内
      if (!fullPath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Access denied' }));
        return;
      }
      
      // 创建目录（如果不存在）
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // 写入文件
      fs.writeFileSync(fullPath, content, 'utf8');
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'File saved successfully' }));
      
    } catch (error) {
      console.error('保存文件失败:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });
}

/**
 * 列出错题目录下的所有文件
 */
function listErrorFiles(req, res) {
  try {
    const errorDir = path.join(__dirname, 'error');
    const errorFiles = [];
    
    // 递归扫描目录
    function scanDirectory(dir, relativePath = '') {
      if (!fs.existsSync(dir)) {
        console.warn(`目录不存在: ${dir}`);
        return;
      }
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const itemRelativePath = path.join(relativePath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          // 递归扫描子目录
          scanDirectory(itemPath, itemRelativePath);
        } else if (stats.isFile() && item.endsWith('.txt')) {
          // 只添加 .txt 文件
          errorFiles.push(itemRelativePath);
        }
      }
    }
    
    // 开始扫描
    scanDirectory(errorDir);
    
    // 按文件名排序
    errorFiles.sort();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: true, 
      files: errorFiles,
      count: errorFiles.length
    }));
    
  } catch (error) {
    console.error('扫描错题目录失败:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }));
  }
}

server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('支持中文文件名和目录浏览');
});