export type CompressOptions = {
  maxDimension?: number;
  quality?: number;
  mimeType?: string;
};

const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_QUALITY = 0.8;

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error || new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal memuat gambar"));
    img.src = src;
  });
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  if (typeof window === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;

  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = options.quality ?? DEFAULT_QUALITY;
  const targetType = options.mimeType ?? "image/jpeg";

  try {
    const dataUrl = await readFile(file);
    const img = await loadImage(dataUrl);

    const { width, height } = img;
    const longest = Math.max(width, height);
    const scale = longest > maxDimension ? maxDimension / longest : 1;
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, targetType, quality)
    );

    if (!blob || blob.size === 0) return file;
    if (blob.size >= file.size) return file;

    const originalName = file.name.replace(/\.[^.]+$/, "");
    const ext = targetType === "image/jpeg" ? "jpg" : targetType.split("/")[1] || "jpg";
    return new File([blob], `${originalName}.${ext}`, {
      type: targetType,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
