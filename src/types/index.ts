export interface Task {
  id: string; // Unique task ID
  priority: number; // Higher priority = processed earlier
  action: () => Promise<boolean>; // Task function
  retries: number; // Number of retries attempted
}

export type DownloadManagerOptions = {
  method?: "simple" | "queue" | "thread"; // Download method
  concurrencyLimit?: number; // Number of concurrent downloads (for "queue" method)
  retries?: number; // Max retries (for "queue" method)
  consoleLog?: boolean;
  downloadFolder?: string;
  getFileName?: (url: string) => string;
  onBeforeDownload?: (
    url: string,
    file: string,
    fileName: string
  ) => Promise<void>;
  onAfterDownload?: (
    url: string,
    file: string,
    fileName: string
  ) => Promise<void>;
  overWriteFile?: boolean;
  requestOptions?: RequestInit;
  stream?: boolean;
  backOff?: boolean;
  timeout?: number;
  maxWorkers?: number;
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

export type WorkerTask = {
  id: string;
  fileName: string;
  url: string;
  options: DownloadManagerOptions;
};
