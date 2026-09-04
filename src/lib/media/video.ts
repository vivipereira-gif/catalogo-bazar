"use client";

import { MEDIA_LIMITS } from "./constants";

export type ProcessedVideo = {
  file: File;
  originalBytes: number;
  processedBytes: number;
  duration: number;
  width: number;
  height: number;
};

export async function processVideo(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<ProcessedVideo> {
  if (!file.type.startsWith("video/")) throw new Error("Selecione um arquivo de vídeo.");
  if (file.size > MEDIA_LIMITS.maxVideoInputBytes) {
    throw new Error("O vídeo original deve ter no máximo 50 MB.");
  }

  const {
    ALL_FORMATS,
    BlobSource,
    BufferTarget,
    Conversion,
    Input,
    Mp4OutputFormat,
    Output,
    Quality,
  } = await import("mediabunny");

  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const duration = await input.computeDuration();
  if (!Number.isFinite(duration) || duration <= 0) throw new Error("Não foi possível ler o vídeo.");
  if (duration > MEDIA_LIMITS.maxVideoDurationSeconds + 0.05) {
    throw new Error("O vídeo deve ter no máximo 15 segundos.");
  }

  let outputWidth: number = MEDIA_LIMITS.videoWidth;
  let outputHeight: number = MEDIA_LIMITS.videoHeight;
  const output = new Output({
    format: new Mp4OutputFormat(),
    target: new BufferTarget(),
  });
  const conversion = await Conversion.init({
    input,
    output,
    video: async (track) => {
      const sourceWidth = await track.getDisplayWidth();
      const sourceHeight = await track.getDisplayHeight();
      const scale = Math.min(
        1,
        MEDIA_LIMITS.videoWidth / sourceWidth,
        MEDIA_LIMITS.videoHeight / sourceHeight,
      );
      outputWidth = Math.max(2, Math.floor((sourceWidth * scale) / 2) * 2);
      outputHeight = Math.max(2, Math.floor((sourceHeight * scale) / 2) * 2);
      return {
        width: outputWidth,
        height: outputHeight,
        fit: "contain",
        frameRate: MEDIA_LIMITS.videoFps,
        codec: "avc",
        quality: new Quality({ bitrate: MEDIA_LIMITS.videoBitrate }),
        forceTranscode: true,
      };
    },
    audio: {
      codec: "aac",
      quality: new Quality({ bitrate: MEDIA_LIMITS.audioBitrate }),
      numberOfChannels: 1,
      sampleRate: 44_100,
      forceTranscode: true,
    },
    tracks: "primary",
  });

  conversion.onProgress = (progress) => onProgress?.(progress);
  await conversion.execute();
  const buffer = output.target.buffer;
  if (!buffer) throw new Error("Não foi possível gerar o vídeo comprimido.");
  if (buffer.byteLength > MEDIA_LIMITS.maxVideoOutputBytes) {
    throw new Error("O vídeo ficou acima de 6 MB. Tente gravá-lo com menos movimento ou em 10 segundos.");
  }

  const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-");
  const processed = new File([buffer], `${baseName || "peca"}.mp4`, {
    type: "video/mp4",
    lastModified: Date.now(),
  });
  return {
    file: processed,
    originalBytes: file.size,
    processedBytes: processed.size,
    duration,
    width: outputWidth,
    height: outputHeight,
  };
}
