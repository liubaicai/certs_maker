const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const execAsync = promisify(exec);

class MkcertManager {
    constructor() {
        this.caRoot = process.platform === 'darwin' 
            ? path.join(os.homedir(), 'Library/Application Support/mkcert')
            : process.platform === 'win32'
                ? path.join(os.homedir(), 'AppData/Local/mkcert')
                : path.join(os.homedir(), '.local/share/mkcert');
        
        // 添加临时目录用于存储转换后的证书
        this.tempDir = path.join(os.tmpdir(), 'mkcert-manager');
        
        // 添加证书存储目录
        this.certsDir = path.join(process.cwd(), 'certs');
    }

    async checkMkcertExists() {
        return new Promise((resolve) => {
            const command = process.platform === 'win32' ? 'where mkcert' : 'which mkcert';
            
            exec(command, (error, stdout, stderr) => {
                if (error || !stdout.trim()) {
                    console.error('mkcert is not installed in the system');
                    resolve(false);
                    return;
                }
                console.log('mkcert found in system:', stdout.trim());
                resolve(true);
            });
        });
    }

    async checkCAStatus() {
        try {
            await fs.access(this.caRoot);
            const files = await fs.readdir(this.caRoot);
            const hasCAFiles = files.some(file => file.includes('rootCA'));
            
            return {
                initialized: hasCAFiles,
                caPath: this.caRoot
            };
        } catch (error) {
            return {
                initialized: false,
                caPath: this.caRoot
            };
        }
    }

    async convertPemToCrt() {
        try {
            const pemPath = path.join(this.caRoot, 'rootCA.pem');
            
            // 确保临时目录存在
            await fs.mkdir(this.tempDir, { recursive: true });
            
            const crtPath = path.join(this.tempDir, 'rootCA.crt');

            // 检查 openssl 是否可用
            await execAsync('openssl version');

            // 使用 openssl 转换格式
            await execAsync(`openssl x509 -inform PEM -in "${pemPath}" -out "${crtPath}" -outform DER`);

            return crtPath;
        } catch (error) {
            if (error.message.includes('openssl')) {
                throw new Error('OpenSSL is not installed or not available in PATH');
            }
            throw error;
        }
    }

    async getConvertedCACertPath() {
        const caStatus = await this.checkCAStatus();
        if (!caStatus.initialized) {
            throw new Error('CA is not initialized');
        }

        try {
            const crtPath = await this.convertPemToCrt();
            return crtPath;
        } catch (error) {
            throw new Error(`Failed to convert certificate: ${error.message}`);
        }
    }

    // 添加清理方法
    async cleanupTempFiles() {
        try {
            await fs.rm(this.tempDir, { recursive: true, force: true });
        } catch (error) {
            console.warn('Failed to cleanup temp files:', error);
        }
    }

    async generateCert(domain) {
        try {
            // 创建域名对应的目录
            const certDir = path.join(this.certsDir, domain);
            await fs.mkdir(certDir, { recursive: true });

            // 生成证书
            const certPath = path.join(certDir, 'cert.pem');
            const keyPath = path.join(certDir, 'key.pem');
            
            await execAsync(`mkcert -cert-file "${certPath}" -key-file "${keyPath}" "${domain}"`);

            return {
                domain,
                certPath,
                keyPath
            };
        } catch (error) {
            console.error(`Failed to generate certificate for ${domain}:`, error);
            throw error;
        }
    }

    async listCerts() {
        try {
            // 确保证书目录存在
            await fs.mkdir(this.certsDir, { recursive: true });
            
            // 读取所有证书目录
            const dirs = await fs.readdir(this.certsDir);
            
            // 获取每个目录的证书信息和创建时间
            const certs = await Promise.all(
                dirs.map(async (dir) => {
                    const certPath = path.join(this.certsDir, dir, 'cert.pem');
                    const keyPath = path.join(this.certsDir, dir, 'key.pem');
                    
                    try {
                        // 检查证书文件是否存在
                        await Promise.all([
                            fs.access(certPath),
                            fs.access(keyPath)
                        ]);
                        
                        // 获取证书文件的创建时间
                        const stat = await fs.stat(certPath);
                        
                        return {
                            domain: dir,
                            exists: true,
                            createdAt: stat.birthtime
                        };
                    } catch (error) {
                        return {
                            domain: dir,
                            exists: false,
                            createdAt: new Date(0)
                        };
                    }
                })
            );
            
            // 过滤有效证书并按创建时间倒序排序
            return certs
                .filter(cert => cert.exists)
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } catch (error) {
            console.error('Failed to list certificates:', error);
            return [];
        }
    }

    async getCertificateFiles(domain) {
        const certDir = path.join(this.certsDir, domain);
        const certPath = path.join(certDir, 'cert.pem');
        const keyPath = path.join(certDir, 'key.pem');

        try {
            await Promise.all([
                fs.access(certPath),
                fs.access(keyPath)
            ]);

            return {
                certPath,
                keyPath
            };
        } catch (error) {
            throw new Error(`Certificate files for ${domain} not found`);
        }
    }

    async deleteCert(domain) {
        try {
            const certDir = path.join(this.certsDir, domain);
            await fs.rm(certDir, { recursive: true, force: true });
            return true;
        } catch (error) {
            console.error(`Failed to delete certificate for ${domain}:`, error);
            throw error;
        }
    }
}

module.exports = new MkcertManager();