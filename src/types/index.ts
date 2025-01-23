export interface Task {
  id: string; // Unique task ID
  priority: number; // Higher priority = processed earlier
  action: () => Promise<boolean>; // Task function
  retries: number; // Number of retries attempted
  consoleLog?: boolean;
}

export type DownloadManagerOptions = {
  method?: "simple" | "queue"; // Download method
  concurrencyLimit?: number; // Number of concurrent downloads (for "queue" method)
  retries?: number; // Max retries (for "queue" method)
  consoleLog?: boolean;
  downloadFolder?: string;
  getFileName?: (url: string) => string;
  onBeforeDownload?: (url: string, fileName: string) => Promise<void>;
  onAfterDownload?: (url: string, fileName: string) => Promise<void>;
  overWriteFile?: boolean;
  requestOptions?: RequestInit;
  stream?: boolean;
  backOff?: boolean;
  timeout?: number;
};

export type EmitDataType = {
  message: string;
  url?: string;
  fileName?: string;
  file?: string;
  error?: unknown;
  progress?: string;
  totalSize?: number;
  downloaded?: number;
  speed?: string;
};
