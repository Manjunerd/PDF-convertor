const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'outputs');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const allowedExtensions = new Set(['.ppt', '.pptx', '.doc', '.docx']);

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.has(ext)) {
      return cb(new Error('Only .ppt, .pptx, .doc, .docx files are supported.'));
    }
    cb(null, true);
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/convert', upload.single('document'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const inputPath = req.file.path;
  const originalBase = path.parse(req.file.originalname).name.replace(/\s+/g, '_');
  const outputBase = `${Date.now()}-${originalBase}`;

  // LibreOffice converts many office formats to PDF in headless mode.
  const args = [
    '--headless',
    '--convert-to',
    'pdf',
    '--outdir',
    outputDir,
    inputPath
  ];

  execFile('libreoffice', args, { timeout: 120000 }, (error) => {
    fs.unlink(inputPath, () => {});

    if (error) {
      return res.status(500).json({
        error: 'Conversion failed. Ensure LibreOffice is installed in the environment.'
      });
    }

    const generatedPdfDefaultName = `${path.parse(req.file.filename).name}.pdf`;
    const generatedPdfPath = path.join(outputDir, generatedPdfDefaultName);
    const finalPdfPath = path.join(outputDir, `${outputBase}.pdf`);

    if (!fs.existsSync(generatedPdfPath)) {
      return res.status(500).json({ error: 'Converted PDF not found.' });
    }

    fs.renameSync(generatedPdfPath, finalPdfPath);

    res.download(finalPdfPath, `${originalBase}.pdf`, (downloadErr) => {
      if (downloadErr) {
        return;
      }
      fs.unlink(finalPdfPath, () => {});
    });
  });
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'Unexpected error' });
  }
  res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
