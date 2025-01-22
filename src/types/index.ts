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
  otherTaskFunction?: (url: string, fileName: string) => Promise<void>;
  overWriteFile?: boolean;
};
