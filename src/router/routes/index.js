const express = require("express");
const router = express.Router();
const mkcertManager = require("../../utils/mkcert");
const path = require('path');

router.get("/", async function (req, res, next) {
  try {
    const caStatus = await mkcertManager.checkCAStatus();
    const certs = await mkcertManager.listCerts();
    res.render("pages/index", { 
      title: "Mkcert Manager",
      caStatus,
      certs
    });
  } catch (error) {
    next(error);
  }
});

router.get("/download-ca", async function (req, res, next) {
  try {
    const crtPath = await mkcertManager.getConvertedCACertPath();
    
    // 设置文件名和 MIME 类型
    const fileName = 'rootCA.crt';
    res.setHeader('Content-Type', 'application/x-x509-ca-cert');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // 发送文件并在发送完成后清理
    res.sendFile(crtPath, async (err) => {
      await mkcertManager.cleanupTempFiles();
      if (err) {
        next(err);
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/generate-cert", async function (req, res, next) {
  try {
    const { domain } = req.body;
    if (!domain) {
      throw new Error('Domain is required');
    }

    await mkcertManager.generateCert(domain);
    res.redirect('/');
  } catch (error) {
    next(error);
  }
});

router.get("/download-cert/:domain", async function (req, res, next) {
  try {
    const { domain } = req.params;
    const { certPath } = await mkcertManager.getCertificateFiles(domain);
    
    res.download(certPath, `${domain}.crt`);
  } catch (error) {
    next(error);
  }
});

router.get("/download-key/:domain", async function (req, res, next) {
  try {
    const { domain } = req.params;
    const { keyPath } = await mkcertManager.getCertificateFiles(domain);
    
    res.download(keyPath, `${domain}.key`);
  } catch (error) {
    next(error);
  }
});

module.exports = router;