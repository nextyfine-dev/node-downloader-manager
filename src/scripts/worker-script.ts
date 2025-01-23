import { parentPort, workerData } from "node:worker_threads";
import { WorkerTask } from "../types";
import { DownloadManager } from "../index.js";

(async () => {
  const { id, url, fileName, options }: WorkerTask = workerData;
  try {
    const downloadManager = new DownloadManager({
      ...options,
      method: "simple",
    });
    await downloadManager.download(url, fileName);
    parentPort?.postMessage({ id, message: "Download complete" });
  } catch (error) {
    parentPort?.postMessage({ id, error });
  }
})();
