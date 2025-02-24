import FileUpload from '../components/FileUpload';
// import DocumentList from '../components/DocumentList';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Sube un docuemnto y procesalo en texto plano o en docx</h1>
      <FileUpload />
      {/* <DocumentList /> */}
    </div>
  );
}