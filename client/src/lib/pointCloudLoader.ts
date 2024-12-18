export async function parsePointCloudFile(file: File): Promise<Float32Array> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'ply':
      return parsePLY(file);
    case 'xyz':
      return parseXYZ(file);
    case 'json':
      return parseJSON(file);
    default:
      throw new Error('Unsupported file format');
  }
}

async function parsePLY(file: File): Promise<Float32Array> {
  try {
    const text = await file.text();
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) {
      throw new Error('Empty PLY file');
    }
    
    if (lines[0] !== 'ply') {
      throw new Error('Invalid PLY file format: Missing "ply" header');
    }
    
    // Find header end and vertex count
    let headerEnd = 0;
    let vertexCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('element vertex')) {
        const parts = line.split(/\s+/);
        if (parts.length >= 3) {
          vertexCount = parseInt(parts[2]);
          if (isNaN(vertexCount) || vertexCount <= 0) {
            throw new Error('Invalid vertex count in PLY file');
          }
        }
      }
      if (line === 'end_header') {
        headerEnd = i + 1;
        break;
      }
    }
    
    if (headerEnd === 0) {
      throw new Error('Invalid PLY file format: Missing end_header');
    }
    
    if (vertexCount === 0) {
      throw new Error('No vertices found in PLY file');
    }
    
    const vertices = new Float32Array(vertexCount * 3);
    const dataLines = lines.slice(headerEnd);
    
    if (dataLines.length < vertexCount) {
      throw new Error('PLY file contains fewer vertices than specified');
    }
    
    for (let i = 0; i < vertexCount; i++) {
      const values = dataLines[i].split(/\s+/);
      if (values.length < 3) {
        throw new Error(`Invalid vertex data at line ${i + headerEnd + 1}`);
      }
      
      const x = parseFloat(values[0]);
      const y = parseFloat(values[1]);
      const z = parseFloat(values[2]);
      
      if (isNaN(x) || isNaN(y) || isNaN(z)) {
        throw new Error(`Invalid coordinate values at line ${i + headerEnd + 1}`);
      }
      
      vertices[i * 3] = x;
      vertices[i * 3 + 1] = y;
      vertices[i * 3 + 2] = z;
    }
    
    return vertices;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`PLYファイルの解析エラー: ${error.message}`);
    }
    throw new Error('PLYファイルの解析中に不明なエラーが発生しました');
  }
}

async function parseXYZ(file: File): Promise<Float32Array> {
  const text = await file.text();
  const lines = text.trim().split('\n');
  const vertices = new Float32Array(lines.length * 3);

  lines.forEach((line, i) => {
    const [x, y, z] = line.trim().split(/\s+/).map(Number);
    vertices[i * 3] = x;
    vertices[i * 3 + 1] = y;
    vertices[i * 3 + 2] = z;
  });

  return vertices;
}

async function parseJSON(file: File): Promise<Float32Array> {
  const text = await file.text();
  const data = JSON.parse(text);
  
  if (Array.isArray(data.vertices)) {
    return new Float32Array(data.vertices);
  } else if (Array.isArray(data.points)) {
    const vertices = new Float32Array(data.points.length * 3);
    data.points.forEach((point: number[], i: number) => {
      vertices[i * 3] = point[0];
      vertices[i * 3 + 1] = point[1];
      vertices[i * 3 + 2] = point[2];
    });
    return vertices;
  }
  
  throw new Error('Invalid JSON format');
}
