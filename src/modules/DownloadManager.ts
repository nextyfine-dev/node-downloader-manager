import fs from "node:fs";
import path from "node:path";
import { EventEmitter } from "node:events";
import type { DownloadManagerOptions, EmitDataType } from "../types";
import Queue from "./Queue.js";
import { emitEvents, EmitEventType, emitMessages } from "../config/const";

class DownloadManager extends EventEmitter {
  private readonly downloadQueue!: Queue; // Queue to handle multiple downloads
  private readonly method: "simple" | "queue"; // Download method
  private readonly concurrencyLimit: number;
  private readonly downloadFolder: string;
  private readonly getFileName?: (url: string) => string;
  private readonly onAfterDownload?: (
    url: string,
    fileName: string
  ) => Promise<void>;
  private readonly onBeforeDownload?: (
    url: string,
    fileName: string
  ) => Promise<void>;
  private readonly log: boolean;
  private readonly overWriteFile: boolean;
  private readonly stream: boolean;
  private readonly requestOptions: RequestInit;
  private readonly activeDownloads: Map<
    string,
    {
      stream: fs.WriteStream;
      downloaded: number;
      totalSize: number;
      paused: boolean;
    }
  >;
  private readonly currentUrl = "CURRENT_URL";
  private readonly currentDownloadableUrl: Map<string, string>;
  private readonly timeout: number;

  constructor(options: DownloadManagerOptions = {}) {
    super();
    this.activeDownloads = new Map();
    this.currentDownloadableUrl = new Map();
    const {
      method = "queue",
      concurrencyLimit = 5,
      retries = 3,
      consoleLog = false,
      downloadFolder = "./downloads",
      overWriteFile = false,
      getFileName,
      onAfterDownload,
      requestOptions = {},
      onBeforeDownload,
      stream = false,
      backOff = false,
      timeout = 30000,
    } = options;

    this.method = method;
    this.concurrencyLimit = concurrencyLimit;
    this.log = consoleLog;
    this.downloadFolder = downloadFolder;
    this.getFileName = getFileName;
    this.onAfterDownload = onAfterDownload;
    this.onBeforeDownload = onBeforeDownload;
    this.overWriteFile = overWriteFile;
    this.requestOptions = requestOptions;
    this.stream = stream;
    this.timeout = timeout;

    // Initialize queue if the method is "queue"
    if (this.method === "queue") {
      this.downloadQueue = new Queue(
        concurrencyLimit,
        retries,
        consoleLog,
        backOff
      );
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

  // Override the 'on' method to ensure it returns 'this' (for compatibility with EventEmitter)
  on(event: EmitEventType, callback: (data?: EmitDataType) => void): this {
    return super.on(event, callback); // Call EventEmitter's `on` method
  }

  // Trigger an event and invoke all the registered listeners
  emit(event: EmitEventType, data?: EmitDataType): boolean {
    return super.emit(event, data); // Call EventEmitter's `emit` method
  }

  // Pause download
  pauseDownload(
    url: string = this.currentDownloadableUrl.get(this.currentUrl)!
  ) {
    const downloadData = this.activeDownloads.get(url);
    if (downloadData && !downloadData.paused) {
      downloadData.paused = true;
      downloadData.stream.close();

      this.emit(emitEvents.paused, {
        url,
        message: emitMessages.paused,
      });

      this.logger(`Download for ${url} paused.`);
    } else {
      this.logger(`No active download found for URL: ${url}`, "warn");
    }
  }

  // Resume download
  async resumeDownload(
    url: string = this.currentDownloadableUrl.get(this.currentUrl)!
  ) {
    const downloadData = this.activeDownloads.get(url);
    if (downloadData?.paused) {
      this.emit(emitEvents.resumed, { url, message: emitMessages.resumed });

      this.logger(`Resuming download for ${url}`);
      downloadData.paused = false; // Mark as not paused
      if (this.method === "queue") {
        this.enqueueDownloadTask(
          url,
          path.basename(downloadData.stream.path as string),
          downloadData.downloaded
        );
      } else if (this.method === "simple") {
        this.downloadFile(
          url,
          path.basename(downloadData.stream.path as string),
          downloadData.downloaded
        );
      }
    } else {
      this.logger(`No paused download found for URL: ${url}`, "warn");
    }
  }

  pauseAll() {
    this.activeDownloads.forEach((_, url) => this.pauseDownload(url));
    this.emit(emitEvents.pausedAll, { message: emitMessages.pausedAll });
  }

  resumeAll() {
    this.activeDownloads.forEach((_, url) => this.resumeDownload(url));
    this.emit(emitEvents.resumedAll, { message: emitMessages.resumedAll });
  }

  async cancelDownload(
    url: string = this.currentDownloadableUrl.get(this.currentUrl)!
  ) {
    const downloadData = this.activeDownloads.get(url);
    if (downloadData) {
      downloadData.stream.close();
      fs.promises.unlink(downloadData.stream.path as string); // Delete file
      this.activeDownloads.delete(url);
      this.emit(emitEvents.cancel, {
        message: emitMessages.cancel,
        url,
      });

      this.logger(`Download canceled and file deleted for URL: ${url}`);
    }
  }

  async cancelAll() {
    const cancelPromises = Array.from(this.activeDownloads.keys()).map((url) =>
      this.cancelDownload(url)
    );

    const results = await Promise.allSettled(cancelPromises);

    results.forEach((result, index) => {
      const url = Array.from(this.activeDownloads.keys())[index];
      if (result.status === "rejected") {
        this.logger(
          `Failed to cancel download for URL: ${url}. Error: ${result.reason}`,
          "error"
        );
      }
    });

    this.logger("All cancel operations processed.");
    this.emit(emitEvents.cancel, {
      message: emitMessages.cancelAll,
    });
  }

  private normalizeHeaders(headers?: HeadersInit): Record<string, string> {
    const normalizedHeaders: Record<string, string> = {};

    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        normalizedHeaders[key] = value;
      });
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        normalizedHeaders[key] = value;
      });
    } else if (headers) {
      Object.assign(normalizedHeaders, headers);
    }

    return normalizedHeaders;
  }

  private async streamDownload(
    res: Response,
    url: string,
    file: string,
    fileName: string,
    downloadedBytes: number,
    totalSize: number
  ) {
    const writeStream = fs.createWriteStream(file, {
      flags: downloadedBytes > 0 ? "a" : "w", // Append if resuming
    });

    this.activeDownloads.set(url, {
      stream: writeStream,
      downloaded: downloadedBytes,
      totalSize,
      paused: false,
    });

    this.emit(emitEvents.progress, {
      fileName,
      progress: ((downloadedBytes / totalSize) * 100).toFixed(2),
      downloaded: downloadedBytes,
      totalSize,
      message: emitMessages.progress,
    });

    const startTime = Date.now();
    for await (const chunk of res.body!) {
      try {
        const downloadData = this.activeDownloads.get(url);
        if (!downloadData || downloadData.paused) {
          break;
        }

        writeStream.write(chunk);
        downloadData.downloaded += chunk.length;

        const progress = ((downloadData.downloaded / totalSize) * 100).toFixed(
          2
        );
        const speed = (
          downloadData.downloaded /
          ((Date.now() - startTime) / 1000)
        ).toFixed(2);

        this.emit(emitEvents.progress, {
          fileName,
          progress,
          downloaded: downloadData.downloaded,
          totalSize,
          speed,
          message: emitMessages.progress,
        });
      } catch (error) {
        writeStream.close();
        this.emit(emitEvents.error, {
          url,
          file,
          error,
          message: emitMessages.error,
        });
        this.logger(`Error during stream download: ${error}`, "error");
        break;
      }
    }

    writeStream.end();

    const downloadData = this.activeDownloads.get(url);
    if (downloadData && !downloadData.paused) {
      this.activeDownloads.delete(url); // Remove completed download
      this.emit(emitEvents.complete, {
        fileName,
        url,
        message: emitMessages.finished,
      });

      this.emit(emitEvents.finished, {
        fileName,
        url,
        message: emitMessages.finished,
      });

      this.logger(
        `Download completed for ${url}. File saved to ${this.downloadFolder}`
      );
    }
  }

  // Method to handle single URL download
  private async downloadFile(
    url: string,
    fileName: string,
    downloadedBytes = 0
  ) {
    this.emit(emitEvents.start, {
      message: emitMessages.start,
      url,
      fileName,
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeout);
    try {
      this.currentDownloadableUrl.set(this.currentUrl, url);
      const file = path.join(this.downloadFolder, fileName);

      if (this.onBeforeDownload) {
        this.logger("Running before downloaded function");
        await this.onBeforeDownload(url, file);
      }

      if (!fs.existsSync(file) || this.overWriteFile) {
        this.logger(`Download started from ${url}`);

        const headers: Record<string, string> = {
          ...this.normalizeHeaders(this.requestOptions?.headers),
        };

        if (downloadedBytes > 0) {
          headers["Range"] = `bytes=${downloadedBytes}-`; // Add range for resuming
        }

        const res = await fetch(url, {
          ...this.requestOptions,
          headers,
          redirect: "follow",
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.status !== 200 && res.status !== 206 && res.status !== 304) {
          this.logger(
            `Could not download the file from ${url}, status ${res.status}`,
            "error"
          );
          throw new Error(
            `Download failed from ${url} with status ${res.status}`
          );
        }
        await fs.promises.mkdir(this.downloadFolder, { recursive: true });

        if (!this.stream) {
          await fs.promises.writeFile(file, res.body!, { flag: "w" });
          this.logger(
            `File ${fileName} downloaded successfully. Downloaded from ${url}`
          );
        } else {
          const totalSize =
            parseInt(res.headers.get("Content-Length") ?? "0", 10) +
            downloadedBytes;
          await this.streamDownload(
            res,
            url,
            file,
            fileName,
            downloadedBytes,
            totalSize
          );
        }
      } else {
        clearTimeout(timeout);
        this.logger(
          `${fileName} already exists inside ${this.downloadFolder} folder`
        );
        this.emit(emitEvents.exists, {
          message: emitMessages.exists,
          url,
          fileName,
        });
      }

      if (this.onAfterDownload) {
        this.logger("Running after downloaded function");
        await this.onAfterDownload(url, fileName);
      }
      return true;
    } catch (error) {
      clearTimeout(timeout);
      this.emit(emitEvents.error, {
        message: emitMessages.error,
        url,
        fileName,
        error,
      });
      this.logger(
        `Error downloading ${fileName} from ${url}. Error:- ${error}`,
        "error"
      );
      throw error;
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Method to add single download task to the queue
  enqueueDownloadTask(
    url: string,
    fileName: string,
    downloadedBytes = 0,
    priority = 1
  ) {
    if (this.isValidUrl(url)) {
      this.logger(`${fileName} file downloading task added to Queue`);
      const downloadableFile = {
        id: `${Date.now()}-${fileName}`, // Unique task ID
        priority, // Default priority is 1
        retries: 0,
        action: () => this.downloadFile(url, fileName, downloadedBytes),
      };
      this.downloadQueue.enqueue(downloadableFile);
    } else {
      this.logger(`${url} is not valid`, "error");
    }
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
        const downloadChunks = (chunk: string[]) =>
          Promise.all(
            chunk.map((url) => {
              const fileName = this.createFileName(url);
              return this.downloadFile(url, fileName);
            })
          );

        for (let i = 0; i < urls.length; i += this.concurrencyLimit) {
          await downloadChunks(urls.slice(i, i + this.concurrencyLimit));
        }
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
