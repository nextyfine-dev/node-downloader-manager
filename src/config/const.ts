export const emitEvents = {
  start: "start",
  finished: "finished",
  complete: "complete",
  error: "error",
  cancel: "cancel",
  cancelAll: "cancelAll",
  paused: "paused",
  pausedAll: "pausedAll",
  resumed: "resumed",
  resumedAll: "resumedAll",
  exists: "exists",
  progress: "progress",
} as const;

export const emitMessages = {
  start: "Download started",
  finished: "Download complete",
  error: "Download failed",
  cancel: "Download canceled",
  cancelAll: "All downloads canceled",
  paused: "Download paused",
  pausedAll: "All downloads paused",
  resumed: "Download resumed",
  resumedAll: "All downloads resumed",
  exists: "File already exists",
  progress: "Download is in progress",
};

export type EmitEventType = keyof typeof emitEvents;
