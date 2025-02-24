import express from 'express';
import cors from 'cors';
import path from 'path';
import fileRoutes from './routes/file.routes';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/files', fileRoutes)

export default app;