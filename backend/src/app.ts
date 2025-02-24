import express from 'express';
import cors from 'cors';
import path from 'path';
import fileRoutes from './routes/file.routes';

const app = express();
app.use(
  cors({
    origin: "https://document-parser-frontend.vercel.app", // Permite solo este dominio
    methods: "GET,POST", // Métodos permitidos
    allowedHeaders: "Content-Type", // Cabeceras permitidas
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/files', fileRoutes)

export default app;