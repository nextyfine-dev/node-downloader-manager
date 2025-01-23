import { Worker } from "node:worker_threads";
import path from "node:path";
import { WorkerTask } from "../types";

class Thread {
  private readonly workerPool: Worker[] = []; // Pool of workers
  private readonly maxWorkers: number; // Maximum number of concurrent workers
  private readonly scriptPath: string; // Path to the worker script
  private readonly log?: boolean; // Optional logging
  private activeWorkers = 0; // Number of currently active workers

  constructor(
    maxWorkers: number,
    consoleLog = false,
    scriptPath: string = path.join(__dirname, "../scripts/worker-script.js")
  ) {
    this.scriptPath = scriptPath; // Path to worker thread logic
    this.maxWorkers = maxWorkers; // Maximum concurrency
    this.log = consoleLog;
  }

  private logger(message: string, type: "info" | "error" = "info") {
    if (this.log || type === "error") {
      console[type](`[${new Date().toLocaleString()}] ${message}`);
    }
  }

  private createWorker(task: WorkerTask): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(this.scriptPath, {
          workerData: task, // Pass task data to the worker
        });

        this.activeWorkers++; // Increment active worker count

        // Listen for success messages
        worker.on("message", (message) => {
          this.logger(`Task ${task.id} completed successfully.`, "info");
          this.activeWorkers--;
          resolve(message);
          this.runNext(); // Start the next task
        });

        // Handle errors in worker
        worker.on("error", (error) => {
          this.logger(`Task ${task.id} failed: ${error.message}`, "error");
          this.activeWorkers--;
          reject(error);
          this.runNext(); // Start the next task
        });

        // Handle worker exit
        worker.on("exit", (code) => {
          if (code !== 0) {
            this.logger(`Task ${task.id} exited with code ${code}`, "error");
            this.activeWorkers--;
            reject(new Error(`Worker stopped with exit code ${code}`));
          }
        });

        this.workerPool.push(worker); // Add the worker to the pool
      } catch (error: any) {
        this.logger(
          `Getting error while creating worker thread. ${error.message}`
        );
      }
    });
  }

  public async runThreadTask(task: WorkerTask): Promise<void> {
    while (this.activeWorkers >= this.maxWorkers) {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for an available worker
    }
    return this.createWorker(task); // Create a worker for the task
  }

  private runNext() {
    // If there are tasks in the queue, they will be run when the `Queue` enqueues new ones
    if (this.activeWorkers < this.maxWorkers) {
      this.logger("Worker available for the next task.", "info");
    }
  }

  public terminateAll() {
    this.workerPool.forEach((worker) => worker.terminate());
    this.workerPool.length = 0;
    this.activeWorkers = 0;
    this.logger("All workers terminated.", "info");
  }
}

export default Thread;
