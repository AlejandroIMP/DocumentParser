import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import textract from 'textract';
import archiver from 'archiver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
// import prisma from '../config/database';
import { FileProcessingError } from '../utils/errors';

const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');
const OUTPUT_DIR = path.join(__dirname, '../../public/outputs');

// Helper function to extract text based on file type
const extractTextFromFile = async (filePath: string, fileExt: string): Promise<string> => {
  try {
    switch (fileExt) {
      case '.docx':
        const result = await mammoth.extractRawText({ path: filePath });
        if (!result.value) {
          throw new FileProcessingError('Failed to extract text from DOCX file', 422, 'DOCX_EXTRACTION_FAILED');
        }
        return result.value;
      case '.pdf':
        try {
          const dataBuffer = await fs.promises.readFile(filePath);
          const pdfResult = await pdfParse(dataBuffer);
          return pdfResult.text;
        } catch (error) {
          throw new FileProcessingError('Failed to parse PDF file', 422, 'PDF_PARSING_FAILED');
        }
      case '.txt':
        try {
          return await fs.promises.readFile(filePath, 'utf8');
        } catch (error) {
          throw new FileProcessingError('Failed to read TXT file', 422, 'TXT_READ_FAILED');
        }
      case '.doc':
        return await new Promise<string>((resolve, reject) => {
          textract.fromFileWithPath(filePath, (error, text) => {
            if (error) reject(new FileProcessingError('Failed to extract text from DOC file', 422, 'DOC_EXTRACTION_FAILED'));
            else if (!text) reject(new FileProcessingError('No text extracted from DOC file', 422, 'DOC_EMPTY_CONTENT'));
            else resolve(text);
          });
        });
      default:
        throw new FileProcessingError(`Unsupported file format: ${fileExt}`, 415, 'UNSUPPORTED_FILE_FORMAT');
    }
  } catch (error) {
    if (error instanceof FileProcessingError) throw error;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new FileProcessingError(`Error processing file: ${errorMessage}`, 500, 'FILE_PROCESSING_ERROR');
  }
};

export const proccessFile = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw new FileProcessingError('No file was uploaded', 400, 'NO_FILE_UPLOADED');
    }

    const { filename, originalname } = req.file;
    const filePath = path.join(UPLOAD_DIR, filename);
    const fileExt = path.extname(filename).toLowerCase();

    // Verify file exists
    try {
      await fs.promises.access(filePath);
    } catch (error) {
      throw new FileProcessingError('Uploaded file not found', 404, 'FILE_NOT_FOUND');
    }

    // Process file
    const extractedText = await extractTextFromFile(filePath, fileExt);
    /*
    // Create document in database
    try {
      await prisma.document.create({
        data: {
          originalName: originalname,
          processedText: extractedText,
        },
      });
    } catch (error) {
      throw new FileProcessingError('Failed to save document to database', 500, 'DATABASE_ERROR');
    }
    */

    // Generate output files
    const doc = new Document({
      sections: [{
        properties: {},
        children: extractedText.split('\n').map(text =>
          new Paragraph({ children: [new TextRun(text)] })
        ),
      }],
    });

    const docxBuffer = await Packer.toBuffer(doc);
    const outputBaseName = filename.replace(fileExt, '');
    const outputDocxPath = path.join(OUTPUT_DIR, `${outputBaseName}.docx`);
    const outputTxtPath = path.join(OUTPUT_DIR, `${outputBaseName}.txt`);
    const zipFilePath = path.join(OUTPUT_DIR, `${outputBaseName}.zip`);

    // Create output directory if it doesn't exist
    try {
      await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });
      await Promise.all([
        fs.promises.writeFile(outputDocxPath, docxBuffer),
        fs.promises.writeFile(outputTxtPath, extractedText),
      ]);
    } catch (error) {
      throw new FileProcessingError('Failed to save output files', 500, 'FILE_WRITE_ERROR');
    }

    // Create ZIP archive with error handling
    try {
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(output);
      archive.file(outputDocxPath, { name: `${originalname.split('.')[0]}output.docx` });
      archive.file(outputTxtPath, { name: `${originalname.split('.')[0]}output.txt` });

      await new Promise<void>((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', (err) => reject(new FileProcessingError('ZIP creation failed', 500, 'ZIP_CREATE_ERROR')));
        archive.finalize();
      });
    } catch (error) {
      throw new FileProcessingError('Failed to create ZIP file', 500, 'ZIP_ERROR');
    }

    // Send response with file download
    res.download(zipFilePath, 'output.zip', async (err) => {
      if (err) {
        console.error('Error sending file:', err);
      }
      // Clean up files after sending
      try {
        const filesToDelete = [filePath, outputDocxPath, outputTxtPath, zipFilePath];
        await Promise.allSettled(
          filesToDelete.map(file => fs.promises.unlink(file))
        );
      } catch (error) {
        console.error('Error cleaning up files:', error);
      }
    });

  } catch (error) {
    if (error instanceof FileProcessingError) {
      res.status(error.status).json({
        error: {
          code: error.code,
          message: error.message
        }
      });
    } else {
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred'
        }
      });
    }
    next(error);
  }
};