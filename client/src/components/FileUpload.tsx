import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from "@/components/ui/card";
import { loadGLBModel } from '@/lib/glbLoader';
import { Upload } from 'lucide-react';
import * as THREE from 'three';

interface FileUploadProps {
  onDataLoaded: (model: THREE.Group) => void;
}

export default function FileUpload({ onDataLoaded }: FileUploadProps) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const model = await loadGLBModel(file);
      onDataLoaded(model);
    } catch (error) {
      console.error('Error loading point cloud:', error);
      const errorMessage = error instanceof Error ? error.message : '点群ファイルの読み込み中にエラーが発生しました';
      alert(errorMessage);
    }
  }, [onDataLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'model/gltf-binary': ['.glb', '.gltf']
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
              : "GLBまたはGLTFファイルをドラッグ＆ドロップしてください"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
