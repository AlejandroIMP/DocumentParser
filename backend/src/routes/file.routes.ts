import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { proccessFile } from '../controllers/file.controller';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: (req, file, cb) => {
    const { originalname } = file;
    cb(null, originalname);
  }
});

const upload = multer({ storage });

router.post('/upload', upload.single('file'), proccessFile);

export default router;