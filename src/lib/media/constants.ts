export const MEDIA_LIMITS = {
  maxImages: 10,
  maxImageInputBytes: 15 * 1024 * 1024,
  maxImageOutputBytes: 1.5 * 1024 * 1024,
  imageLongEdge: 1600,
  imageQuality: 0.82,
  maxVideos: 1,
  maxVideoInputBytes: 50 * 1024 * 1024,
  maxVideoOutputBytes: 6 * 1024 * 1024,
  maxVideoDurationSeconds: 15,
  videoWidth: 1280,
  videoHeight: 720,
  videoFps: 24,
  videoBitrate: 1_200_000,
  audioBitrate: 64_000,
} as const;

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}
