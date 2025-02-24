import { useEffect, useState } from "react";

interface Document {
  id: string;
  originalName: string;
  createdAt: string;
}

export default function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/files")
      .then((res) => res.json())
      .then((data) => setDocuments(data))
      .catch((err) => console.error("Error cargando documentos:", err));
  }, []);

  return (
    <div className="mt-6 bg-white p-6 rounded-lg shadow-md w-full max-w-lg">
      <h2 className="text-xl font-bold mb-4">Documentos procesados</h2>
      <ul>
        {documents.map((doc) => (
          <li key={doc.id} className="border-b py-2">
            {doc.originalName} - <span className="text-gray-500">{new Date(doc.createdAt).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
