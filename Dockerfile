# 使用 Debian 12 (Bookworm) 作为基础镜像
FROM debian:12-slim

# 设置工作目录
WORKDIR /app

# 安装必要的系统依赖
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    libnss3-tools \
    ca-certificates \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# 安装 Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# 安装 mkcert
RUN wget -O /usr/local/bin/mkcert https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64 \
    && chmod +x /usr/local/bin/mkcert

# 设置 npm 镜像
RUN npm config set registry http://registry.npmmirror.com

# 复制项目文件
COPY package*.json ./
RUN npm install

COPY . .

# 创建 certs 目录
RUN mkdir -p certs && chmod 755 certs

# 设置环境变量
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

# 暴露端口（如果需要的话，根据你的应用配置修改）
EXPOSE 8080

# 运行时应挂载 CA 证书目录 到 /root/.local/share/mkcert
# RUN mkcert -install

# 启动命令
CMD ["npm", "run", "start:prod"]
