"use client";

import { MEDIA_LIMITS, SHARE_IMAGE } from "./constants";

export type ProcessedImage = {
  file: File;
  originalBytes: number;
  processedBytes: number;
  width: number;
  height: number;
};

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Não foi possível converter a imagem."))),
      type,
      quality,
    );
  });
}

export async function processImage(file: File): Promise<ProcessedImage> {
  if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
    throw new Error("Use uma imagem JPG, PNG ou WebP.");
  }
  if (file.size > MEDIA_LIMITS.maxImageInputBytes) {
    throw new Error("A imagem original deve ter no máximo 15 MB.");
  }

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(
    1,
    MEDIA_LIMITS.imageLongEdge / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Seu navegador não conseguiu processar a imagem.");

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = MEDIA_LIMITS.imageQuality;
  let blob = await canvasToBlob(canvas, "image/webp", quality);
  while (blob.size > MEDIA_LIMITS.maxImageOutputBytes && quality > 0.55) {
    quality -= 0.07;
    blob = await canvasToBlob(canvas, "image/webp", quality);
  }

  if (blob.size > MEDIA_LIMITS.maxImageOutputBytes) {
    throw new Error("A imagem ainda ficou acima de 1,5 MB após a otimização.");
  }

  const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-");
  return {
    file: new File([blob], `${baseName || "peca"}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    }),
    originalBytes: file.size,
    processedBytes: blob.size,
    width,
    height,
  };
}

export async function processShareImage(source: Blob) {
  const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_IMAGE.width;
  canvas.height = SHARE_IMAGE.height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Seu navegador não conseguiu gerar a imagem de compartilhamento.");
  }

  context.fillStyle = "#f7f3ee";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const scale = Math.min(canvas.width / bitmap.width, canvas.height / bitmap.height);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const x = Math.round((canvas.width - width) / 2);
  const y = Math.round((canvas.height - height) / 2);
  context.drawImage(bitmap, x, y, width, height);
  bitmap.close();

  const blob = await canvasToBlob(canvas, SHARE_IMAGE.contentType, SHARE_IMAGE.quality);
  return new File([blob], SHARE_IMAGE.fileName, {
    type: SHARE_IMAGE.contentType,
    lastModified: Date.now(),
  });
}
