# PDF-convertor

A simple web application to convert office documents to PDF.

## Supported conversions

- PPT -> PDF
- PPTX -> PDF
- DOC -> PDF
- DOCX -> PDF

## Tech stack

- Node.js + Express
- Multer (file upload)
- LibreOffice CLI for conversion
- HTML/CSS/JavaScript frontend

## Requirements

- Node.js 18+
- LibreOffice installed and available as `libreoffice` in your PATH

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start server:

```bash
npm start
```

3. Open in browser:

```text
http://localhost:3000
```

## Notes

- Uploaded files are stored temporarily in `uploads/` and removed after conversion.
- Converted PDFs are removed after download.
- Max file size is 25MB.