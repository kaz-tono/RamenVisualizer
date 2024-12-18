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
  const text = await file.text();
  const lines = text.split('\n');
  
  // Find header end
  let headerEnd = 0;
  let vertexCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('element vertex')) {
      vertexCount = parseInt(lines[i].split(' ')[2]);
    }
    if (lines[i].trim() === 'end_header') {
      headerEnd = i + 1;
      break;
    }
  }

  const vertices = new Float32Array(vertexCount * 3);
  
  for (let i = 0; i < vertexCount; i++) {
    const values = lines[headerEnd + i].trim().split(' ');
    vertices[i * 3] = parseFloat(values[0]);
    vertices[i * 3 + 1] = parseFloat(values[1]);
    vertices[i * 3 + 2] = parseFloat(values[2]);
  }

  return vertices;
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
