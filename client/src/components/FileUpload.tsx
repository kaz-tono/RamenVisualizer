import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from "@/components/ui/card";
import { parsePointCloudFile } from '@/lib/pointCloudLoader';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onDataLoaded: (data: Float32Array) => void;
}

export default function FileUpload({ onDataLoaded }: FileUploadProps) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const data = await parsePointCloudFile(file);
      onDataLoaded(data);
    } catch (error) {
      console.error('Error loading point cloud:', error);
      const errorMessage = error instanceof Error ? error.message : '点群ファイルの読み込み中にエラーが発生しました';
      alert(errorMessage);
    }
  }, [onDataLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.ply'],
      'text/plain': ['.xyz'],
      'application/json': ['.json']
    },
    multiple: false
  });

  return (
    <Card>
      <CardContent>
        <div
          {...getRootProps()}
          className={`
            p-6 border-2 border-dashed rounded-lg
            flex flex-col items-center justify-center
            cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
          <p className="text-sm text-center text-muted-foreground">
            {isDragActive
              ? "Drop the file here"
              : "Drag & drop a point cloud file (PLY, XYZ, JSON)"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
