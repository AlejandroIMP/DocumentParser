export class FileProcessingError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code: string = 'FILE_PROCESSING_ERROR'
  ) {
    super(message);
    this.name = 'FileProcessingError';
  }
}