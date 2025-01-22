# 🌟 node-downloader-manager

`node-downloader-manager` is a lightweight and efficient file download manager for Node.js applications. It allows you to download files either sequentially or using a queue-based approach, providing features like retry mechanisms, concurrency control, and custom file naming.

## 📚 Table of Contents

- [🌟 node-downloader-manager](#-node-downloader-manager)
  - [📚 Table of Contents](#-table-of-contents)
  - [✨ Features](#-features)
  - [📦 Installation](#-installation)
    - [Using npm:](#using-npm)
    - [Using yarn:](#using-yarn)
    - [Using bun:](#using-bun)
  - [🚀 Usage](#-usage)
    - [Queue Download Example](#queue-download-example)
    - [Simple Download Example](#simple-download-example)
    - [Custom File Name Logic Example](#custom-file-name-logic-example)
  - [🛠️ API Documentation](#️-api-documentation)
    - [DownloadManager Class](#downloadmanager-class)
      - [Constructor Options](#constructor-options)
      - [Methods](#methods)
    - [Queue Class](#queue-class)
      - [Constructor Options](#constructor-options-1)
      - [Methods](#methods-1)
  - [📝 License](#-license)

---

## ✨ Features

- **Queue-based downloads**: Manage multiple file downloads with concurrency control.
- **Simple sequential downloads**: Download files one by one without queuing.
- **Retry mechanism**: Automatically retry failed downloads.
- **Custom file naming**: Define your own logic for naming downloaded files.
- **Logging**: Monitor download progress and errors with optional logging.
- **File overwrite control**: Specify whether to overwrite existing files or skip them.

---

## 📦 Installation

You can install `node-downloader-manager` using npm, yarn, or bun:

### Using npm:

```bash
npm install node-downloader-manager
```

### Using yarn:

```bash
yarn add node-downloader-manager
```

### Using bun:

```bash
bun add node-downloader-manager
```

---

## 🚀 Usage

Here are some examples of how to use `node-downloader-manager` in your project.

### Queue Download Example

The **queue method** allows you to manage multiple file downloads with concurrency control and retry mechanisms.

```ts
import DownloadManager from "node-downloader-manager";

const urls = [
  "https://example.com/file1.jpeg",
  "https://example.com/file2.jpeg",
  "https://example.com/file3.jpeg",
];

const downloadManager = new DownloadManager({
  consoleLog: true, // Enable logging
  method: "queue", // Use queue-based download
});

await downloadManager.download(urls);
```

### Simple Download Example

The **simple method** downloads files sequentially, without managing a queue.

```ts
import DownloadManager from "node-downloader-manager";

const urls = [
  "https://example.com/file1.jpeg",
  "https://example.com/file2.jpeg",
];

const downloadManager = new DownloadManager({
  consoleLog: true,
  method: "simple", // Use simple sequential download
});

await downloadManager.download(urls);
```

### Custom File Name Logic Example

You can define a custom logic for naming downloaded files.

```ts
import DownloadManager from "node-downloader-manager";

const urls = [
  "https://example.com/file1.jpeg",
  "https://example.com/file2.jpeg",
];

const getFileName = (url: string) => {
  return `custom-${Date.now()}-${url.split("/").pop()}`;
};

const downloadManager = new DownloadManager({
  consoleLog: true,
  getFileName, // Use custom file name logic
});

await downloadManager.download(urls);
```

---

## 🛠️ API Documentation

### DownloadManager Class

The `DownloadManager` class provides the primary interface for managing downloads.

#### Constructor Options

| Option              | Type                               | Default         | Description                                                          |
| ------------------- | ---------------------------------- | --------------- | -------------------------------------------------------------------- |
| `method`            | `"simple"` \| `"queue"`            | `"queue"`       | Choose between simple sequential downloads or queue-based downloads. |
| `concurrencyLimit`  | `number`                           | `5`             | Maximum number of concurrent downloads (for queue method).           |
| `retries`           | `number`                           | `3`             | Maximum number of retries for failed downloads.                      |
| `consoleLog`        | `boolean`                          | `false`         | Enable or disable console logging.                                   |
| `downloadFolder`    | `string`                           | `"./downloads"` | Folder to save the downloaded files.                                 |
| `getFileName`       | `(url: string) => string`          | `undefined`     | Custom function to generate file names.                              |
| `overWriteFile`     | `boolean`                          | `false`         | Overwrite files if they already exist.                               |
| `otherTaskFunction` | `(url, fileName) => Promise<void>` | `undefined`     | Run additional tasks after each file is downloaded.                  |

#### Methods

- **`download(urls: string | string[])`**: Downloads one or more files based on the configured `method`.
- **`enqueueDownloadTask(url: string, fileName?: string, priority?: number)`**: Adds a download task to the queue manually.

### Queue Class

Manages tasks in the queue with concurrency control.

#### Constructor Options

| Option             | Type      | Default | Description                          |
| ------------------ | --------- | ------- | ------------------------------------ |
| `concurrencyLimit` | `number`  | `5`     | Maximum number of concurrent tasks.  |
| `maxRetries`       | `number`  | `3`     | Maximum retries for failed tasks.    |
| `consoleLog`       | `boolean` | `false` | Enable logging for queue operations. |

#### Methods

- **`enqueue(task: Task)`**: Adds a new task to the queue.
- **`runNext()`**: Processes the next task in the queue.

---

## 📝 License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for more details.

---
