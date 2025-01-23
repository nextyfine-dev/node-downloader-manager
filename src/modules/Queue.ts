import type { Task } from "../types";

class Queue {
  private heap: Task[] = []; // A heap to store tasks. This is a max-heap (higher priority tasks are at the root).
  private activeCount = 0; // The number of active tasks currently being processed.
  private readonly concurrencyLimit: number; // The maximum number of concurrent tasks that can run at the same time.
  private readonly maxRetries: number; // The maximum number of retries allowed for failed tasks.
  private readonly log?: boolean;
  private readonly backOff: boolean; // Enable or disable backoff logic.

  constructor(
    concurrencyLimit: number,
    maxRetries: number,
    consoleLog?: boolean,
    backOff = false
  ) {
    this.concurrencyLimit = concurrencyLimit; // Set the concurrency limit for active tasks
    this.maxRetries = maxRetries; // Set the maximum retries allowed for failed tasks
    this.log = consoleLog;
    this.backOff = backOff;
  }

  private logger(
    message: string | number | Task,
    type: "info" | "error" | "warn" = "info"
  ) {
    if (this.log || type === "error") {
      console[type](
        `[${process.pid}] : [${new Date().toLocaleString()}] : `,
        message
      );
    }
  }

  // Backoff calculation: exponential delay
  private calculateBackoff(attempt: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds max
    return Math.min(baseDelay * 2 ** attempt, maxDelay);
  }

  // Helper function to ensure the heap property is maintained when inserting a task (heapify up).
  // This function moves a task up in the heap to its correct position based on priority.
  private heapifyUp(index: number) {
    const task = this.heap[index]; // Get the task at the current index

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2); // Find the parent index

      // Ensure the parent index is valid and within bounds
      if (parentIndex < 0 || parentIndex >= this.heap.length) break;

      // If the parent task's priority is higher or equal, break (as the heap property is satisfied)
      if (
        this.heap[parentIndex] &&
        this.heap[parentIndex].priority >= task.priority
      )
        break;

      // Move the parent task down to the current index
      this.heap[index] = this.heap[parentIndex];
      index = parentIndex; // Move up to the parent's index
    }
    // Place the task at its correct position in the heap
    this.heap[index] = task;
  }

  // Method to add a new task to the queue.
  enqueue(task: Task) {
    this.heap.push(task); // Add the new task to the heap
    this.heapifyUp(this.heap.length - 1); // Maintain the heap property by pushing the task up
    this.runNext(); // Try to run the next task if possible
  }

  // Helper function to maintain the heap property after removing the root (heapify down).
  private heapifyDown(index: number) {
    const length = this.heap.length;

    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let largestIndex = index;

      // Check if the left child has a higher priority.
      if (
        leftChildIndex < length &&
        this.heap[leftChildIndex].priority > this.heap[largestIndex].priority
      ) {
        largestIndex = leftChildIndex;
      }

      // Check if the right child has a higher priority than the current largest.
      if (
        rightChildIndex < length &&
        this.heap[rightChildIndex].priority > this.heap[largestIndex].priority
      ) {
        largestIndex = rightChildIndex;
      }

      // If no swap is needed, break the loop.
      if (largestIndex === index) break;

      // Swap the current task with the largest child.
      [this.heap[index], this.heap[largestIndex]] = [
        this.heap[largestIndex],
        this.heap[index],
      ];
      index = largestIndex; // Update the index to continue heapifying down.
    }
  }

  // Method to start processing the next task in the queue.
  private async runNext() {
    // If the number of active tasks has reached the concurrency limit, or if there are no tasks in the queue, stop processing
    if (this.activeCount >= this.concurrencyLimit || this.heap.length === 0) {
      return;
    }

    // Get the highest priority task (the root of the heap)
    const task = this.heap[0];
    if (!task) return;

    // Replace the root task with the last task in the heap, and remove the last task
    this.heap[0] = this.heap[this.heap.length - 1];
    this.heap.pop();

    // Restore the heap property by moving the new root down to its correct position
    this.heapifyDown(0);

    // Increment the active task counter
    this.activeCount++;
    try {
      // Attempt to run the task (asynchronously)
      await task.action();
      this.logger(`Task ${task.id} completed successfully.`);
    } catch (err) {
      // If the task fails, log the error and check if it should be retried
      this.logger(`Task ${task.id} failed: ${err}`, "error");
      if (task.retries < this.maxRetries) {
        this.logger(`Retrying task ${task.id}...`);

        if (this.backOff) {
          const backoffDelay = this.calculateBackoff(task.retries);
          this.logger(
            `Task ${task.id} - Retrying in ${backoffDelay / 1000} seconds...`
          );
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        }

        // If the task can be retried, increment the retry count and add it back to the queue
        this.enqueue({ ...task, retries: task.retries + 1 });
      } else {
        this.logger(`Task ${task.id} exceeded max retries.`, "warn");
      }
    } finally {
      // After processing, decrement the active task counter and attempt to run the next task
      this.activeCount--;
      this.runNext(); // Trigger the next task if possible
    }
  }
}

export default Queue;
