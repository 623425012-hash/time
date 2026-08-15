import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db';
import { authenticateToken, AuthRequest, logActivity } from '../auth';
import { EventAttachment } from '../types';

export const fileRouter = Router();

// In-memory tracked files list (or extracted from events and announcements)
export function getAllFiles(): EventAttachment[] {
  const data = db.getData();
  const fileMap = new Map<string, EventAttachment>();

  // Add files from events
  (data.events || []).forEach((e) => {
    (e.attachments || []).forEach((att) => {
      fileMap.set(att.id, att);
    });
  });

  // Add files from announcements
  (data.announcements || []).forEach((a) => {
    if (a.file) {
      fileMap.set(a.file.id, a.file);
    }
  });

  return Array.from(fileMap.values());
}

// Get all uploaded documents/files
fileRouter.get('/', (_req, res) => {
  const files = getAllFiles();
  res.json({ files });
});

// Delete a document/file
fileRouter.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const fileId = req.params.id;
  const data = db.getData();

  // Remove from events
  (data.events || []).forEach((e) => {
    if (e.attachments) {
      e.attachments = e.attachments.filter((att) => att.id !== fileId);
    }
  });

  // Remove from announcements
  (data.announcements || []).forEach((a) => {
    if (a.file && a.file.id === fileId) {
      a.file = undefined;
    }
  });

  db.save();
  logActivity(req.user, 'DELETE_EVENT', `ลบไฟล์แนบเอกสาร (ID: ${fileId})`, req);
  res.json({ message: 'ลบไฟล์เอกสารเรียบร้อยแล้ว' });
});

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `file-${uniqueSuffix}${ext}`);
  },
});

const allowedMimeTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|docx?|xlsx?|pptx?|jpe?g|png|webp)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('รองรับเฉพาะไฟล์ PDF, DOCX, XLSX, PPTX, JPG, PNG เท่านั้น'));
    }
  },
});

// Upload single or multiple files
fileRouter.post('/upload', authenticateToken, upload.single('file'), (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'ไม่พบไฟล์ที่อัปโหลด' });
    return;
  }

  const user = req.user!;
  const attachment: EventAttachment = {
    id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    originalName: req.file.originalname,
    fileName: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    uploadedBy: user.id,
    uploadedByName: `${user.name} ${user.surname}`,
    uploadedAt: new Date().toISOString(),
    dataUrl: `/api/files/download/${req.file.filename}`,
  };

  logActivity(user, 'UPLOAD_FILE', `อัปโหลดไฟล์: ${attachment.originalName} (${(attachment.size / 1024).toFixed(1)} KB)`, req);

  res.status(201).json({
    message: 'อัปโหลดไฟล์สำเร็จ',
    attachment,
  });
});

// Download / Stream file
fileRouter.get('/download/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'ไม่พบไฟล์ที่ต้องการดาวน์โหลด' });
    return;
  }

  res.download(filePath);
});

// View / Preview file inline with appropriate content-type headers
fileRouter.get('/view/:filename', (req, res) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'ไม่พบไฟล์ที่ต้องการดู' });
    return;
  }

  // Determine content type
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="' + encodeURIComponent(filename) + '"');
  } else if (ext === '.png') {
    res.setHeader('Content-Type', 'image/png');
  } else if (ext === '.jpg' || ext === '.jpeg') {
    res.setHeader('Content-Type', 'image/jpeg');
  } else if (ext === '.webp') {
    res.setHeader('Content-Type', 'image/webp');
  } else {
    res.setHeader('Content-Disposition', 'inline; filename="' + encodeURIComponent(filename) + '"');
  }

  res.sendFile(filePath);
});
