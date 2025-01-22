import fs from "node:fs";
import path from "node:path";
import type { DownloadManagerOptions } from "../types";
import Queue from "./Queue.js";

class DownloadManager {
  private readonly downloadQueue!: Queue; // Queue to handle multiple downloads
  private readonly concurrencyLimit: number; // Maximum number of concurrent downloads
  private readonly retries: number; // Max retries for failed downloads
  private readonly method: "simple" | "queue"; // Download method
  private readonly downloadFolder: string;
  private readonly getFileName?: (url: string) => string;
  private readonly otherTaskFunction?: (
    url: string,
    fileName: string
  ) => Promise<void>;
  private readonly log: boolean;
  private readonly overWriteFile: boolean;

  constructor(options: DownloadManagerOptions = {}) {
    const {
      method = "queue",
      concurrencyLimit = 5,
      retries = 3,
      consoleLog = false,
      downloadFolder = "./downloads",
      overWriteFile = false,
      getFileName,
      otherTaskFunction,
    } = options;

    this.method = method;
    this.concurrencyLimit = concurrencyLimit;
    this.retries = retries;
    this.log = consoleLog;
    this.downloadFolder = downloadFolder;
    this.getFileName = getFileName;
    this.otherTaskFunction = otherTaskFunction;
    this.overWriteFile = overWriteFile;

    // Initialize queue if the method is "queue"
    if (this.method === "queue") {
      this.downloadQueue = new Queue(this.concurrencyLimit, retries, this.log);
    }
  }

  private logger(message: string, type: "info" | "error" | "warn" = "info") {
    if (this.log || type === "error") {
      console[type](
        `[${process.pid}] : [${new Date().toLocaleString()}] : `,
        message
      );
    }
  }

  // Method to handle single URL download
  private async downloadFile(url: string, fileName: string) {
    try {
      const file = path.join(this.downloadFolder, fileName);
      if (!fs.existsSync(file) || this.overWriteFile) {
        this.logger(`Download started from ${url}`);
        const res = await fetch(url);
        if (res.status !== 200) {
          this.logger(
            `Could not download the file from ${url}, status ${res.status}`,
            "error"
          );
          throw new Error(
            `Download failed from ${url} with status ${res.status}`
          );
        }
        await fs.promises.mkdir(this.downloadFolder, { recursive: true });
        await fs.promises.writeFile(file, res.body!, { flag: "w" });
        this.logger(
          `File ${fileName} downloaded successfully. Downloaded from ${url}`
        );
      } else {
        this.logger(
          `${fileName} already exists inside ${this.downloadFolder} folder`
        );
      }

      if (this.otherTaskFunction) {
        this.logger("Running other task function");
        await this.otherTaskFunction(url, fileName);
      }
      return true;
    } catch (error) {
      this.logger(
        `Error downloading ${fileName} from ${url}. Error:- ${error}`,
        "error"
      );
      throw error;
    }
  }

  // Method to add single download task to the queue
  enqueueDownloadTask(url: string, fileName: string, priority = 1) {
    this.logger(`${fileName} file downloading task added to Queue`);
    const downloadableFile = {
      id: `${Date.now()}-${fileName}`, // Unique task ID
      priority, // Default priority is 1
      retries: this.retries,
      action: () => this.downloadFile(url, fileName),
    };
    this.downloadQueue.enqueue(downloadableFile);
  }

  private createFileName(url: string) {
    const fileName = this.getFileName
      ? this.getFileName(url)
      : url.split("/").pop() ?? "file";
    return fileName;
  }

  // Main method to handle multiple URL downloads
  async download(urls: string | string[]) {
    // If the method is "simple", download the files sequentially
    if (this.method === "simple") {
      if (typeof urls === "string") {
        const fileName = this.createFileName(urls);
        await this.downloadFile(urls, fileName);
      } else {
        await Promise.all(
          urls.map((url) => {
            const fileName = this.createFileName(url);
            return this.downloadFile(url, fileName);
          })
        );
      }
    }

    // If the method is "queue", enqueue the download tasks
    else if (this.method === "queue") {
      if (typeof urls === "string") {
        const fileName = this.createFileName(urls);
        this.enqueueDownloadTask(urls, fileName);
      } else {
        for await (const url of urls) {
          const fileName = this.createFileName(url);
          this.enqueueDownloadTask(url, fileName);
        }
      }
    }
  }
}

export default DownloadManager;
