import { useState } from "react";

export default function FileUpload() {
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const fileInput = formData.get('file') as File;
      const nombre:string = fileInput.name.split('.')[0];

      if (!fileInput) {
          setStatus('Please select a file');
          return;
      }

      try {
          setIsLoading(true);
          setStatus('Processing file...');

          const response = await fetch('http://localhost:5000/api/files/upload', {
              method: 'POST',
              body: formData
          });

          if (!response.ok) {
                console.log(response)
              throw new Error(`HTTP error! status: ${response.status}`);
          }

          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `${nombre}.zip`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(downloadUrl);
          document.body.removeChild(a);

          setStatus('File processed successfully!');
      } catch (error) {
          console.error('Error:', error);
          setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
          setIsLoading(false);
      }
  };

  return (
      <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                  <label htmlFor="file" className="block text-sm font-medium text-gray-700 border-b pb-5">
                      Select file to process
                  </label>
                  <input
                      type="file"
                      name="file"
                      id="file"
                      accept=".doc,.docx,.pdf,.txt"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
              </div>
              <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                  {isLoading ? 'Processing...' : 'Upload and Process'}
              </button>
          </form>
          {status && (
              <div className="mt-4 p-4 rounded bg-gray-100">
                  {status}
              </div>
          )}
      </div>
  );
}
