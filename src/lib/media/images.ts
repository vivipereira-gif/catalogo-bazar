"use client";

import { MEDIA_LIMITS } from "./constants";

export type ProcessedImage = {
  file: File;
  originalBytes: number;
  processedBytes: number;
  width: number;
  height: number;
};

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Não foi possível converter a imagem."))),
      "image/webp",
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
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > MEDIA_LIMITS.maxImageOutputBytes && quality > 0.55) {
    quality -= 0.07;
    blob = await canvasToBlob(canvas, quality);
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
