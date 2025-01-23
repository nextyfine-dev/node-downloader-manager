# 🌟 node-downloader-manager

# 📥 DownloadManager

`node-downloader-manager` is a lightweight and efficient file download manager for Node.js applications. It allows you to download files either sequentially or using a queue-based approach, providing features like retry mechanisms, concurrency control, stream, and custom file naming.

## 📚 Table of Contents

- [🌟 node-downloader-manager](#-node-downloader-manager)
- [📥 DownloadManager](#-downloadmanager)
  - [📚 Table of Contents](#-table-of-contents)
  - [✨ Features](#-features)
  - [📦 Installation](#-installation)
    - [npm](#npm)
    - [yarn](#yarn)
    - [pnpm](#pnpm)
    - [bun](#bun)
  - [🚀 Usage](#-usage)
    - [Examples](#examples)
      - [More Examples](#more-examples)
      - [Queue Download](#queue-download)
      - [Stream Download](#stream-download)
      - [Simple Download](#simple-download)
      - [Pause, Resume, and Cancel Download](#pause-resume-and-cancel-download)
  - [📖 API Reference](#-api-reference)
    - [DownloadManager Options](#downloadmanager-options)
    - [Methods](#methods)
    - [Events](#events)
  - [🤔 Why Use DownloadManager?](#-why-use-downloadmanager)
  - [🤝 Contributing](#-contributing)
  - [📝 License](#-license)

## ✨ Features

- Supports both simple and queue-based download methods.
- Handles multiple concurrent downloads with customizable concurrency limits.
- Supports pausing, resuming, and canceling downloads.
- Provides detailed progress and error reporting.
- Allows custom file naming and pre/post-download hooks.
- Supports streaming downloads for large files.

## 📦 Installation

You can install `node-download-manager` using your favorite package manager:

### npm

```bash
npm install node-download-manager
```

### yarn

```bash
yarn add node-download-manager
```

### pnpm

```bash
pnpm add node-download-manager
```

### bun

```bash
bun add node-download-manager
```

## 🚀 Usage

Here's how you can use `node-download-manager` in your project:

### Examples

#### More Examples

```
https://github.com/nextyfine-dev/node-downloader-manager/tree/master/src/examples
```

#### Queue Download

```typescript
import DownloadManager from "node-download-manager";

const urls = [
  "https://i.imgur.com/StLyH09.jpeg",
  "https://i.imgur.com/vFopwVJ.png",
  "https://i.imgur.com/NaCQQ8c.jpeg",
  "https://i.imgur.com/GXeeLNx.jpeg",
  "https://i.imgur.com/ElhcT9n.jpeg",
  "https://i.imgur.com/sNNWmtU.png",
  "https://i.imgur.com/Upa7Em5.jpeg",
  "https://i.imgur.com/CTHsEaK.png",
];

// Initialize the DownloadManager with console logging enabled
const downloadManager = new DownloadManager({ consoleLog: true }); // By default method is 'queue'

// Start the download
downloadManager.download(urls);
```

#### Stream Download

```typescript
import DownloadManager from "node-download-manager";

const url =
  "https://code.visualstudio.com/sha/download?build=stable&os=linux-deb-x64";
const createFileName = () => "code.deb";

const downloadManager = new DownloadManager({
  stream: true,
  overWriteFile: true,
  getFileName: createFileName,
});

downloadManager.on("start", (data) => {
  console.log(`Download started: ${data?.url}`);
});

downloadManager.download(url);
```

#### Simple Download

```typescript
import DownloadManager from "node-download-manager";

const urls = [
  "https://i.imgur.com/StLyH09.jpeg",
  "https://i.imgur.com/vFopwVJ.png",
];

const downloadManager = new DownloadManager({
  consoleLog: true,
  overWriteFile: true,
  method: "simple",
});

downloadManager.download(urls);
```

#### Pause, Resume, and Cancel Download

```typescript
import DownloadManager from "node-download-manager";

const url =
  "https://code.visualstudio.com/sha/download?build=stable&os=linux-deb-x64";
const createFileName = () => "code.deb";

const downloadManager = new DownloadManager({
  stream: true,
  overWriteFile: true,
  getFileName: createFileName,
});

downloadManager.on("start", (data) => {
  console.log(`Download started: ${data?.url}`);
});

setTimeout(() => {
  downloadManager.pauseDownload();
}, 5000);

setTimeout(() => {
  downloadManager.resumeDownload();
}, 8000);

setTimeout(() => {
  downloadManager.cancelDownload();
}, 10000);

downloadManager.download(url);
```

## 📖 API Reference

### DownloadManager Options

- `method`: `"simple"` | `"queue"` - The download method to use.
- `concurrencyLimit`: `number` - Maximum number of concurrent downloads.
- `retries`: `number` - Maximum number of retries for failed downloads.
- `consoleLog`: `boolean` - Enable or disable console logging.
- `downloadFolder`: `string` - Folder to save downloaded files.
- `getFileName`: `(url: string) => string` - Function to generate file names.
- `onBeforeDownload`: `(url: string, fileName: string) => Promise<void>` - Hook before download starts.
- `onAfterDownload`: `(url: string, fileName: string) => Promise<void>` - Hook after download completes.
- `overWriteFile`: `boolean` - Overwrite existing files.
- `requestOptions`: `RequestInit` - Options for the fetch request.
- `stream`: `boolean` - Enable streaming downloads.
- `backOff`: `boolean` - Enable exponential backoff for retries.
- `timeout`: `number` - Timeout for download requests.

### Methods

- `download(urls: string | string[])`: Start downloading the specified URLs.
- `pauseDownload(url?: string)`: Pause the download for a specific URL or the current download.
- `resumeDownload(url?: string)`: Resume the download for a specific URL or the current download.
- `cancelDownload(url?: string)`: Cancel the download for a specific URL or the current download.
- `pauseAll()`: Pause all active downloads.
- `resumeAll()`: Resume all paused downloads.
- `cancelAll()`: Cancel all active downloads.

### Events

- `start`: Emitted when a download starts.
- `progress`: Emitted periodically with download progress.
- `complete`: Emitted when a download completes.
- `error`: Emitted when a download fails.
- `cancel`: Emitted when a download is canceled.
- `paused`: Emitted when a download is paused.
- `resumed`: Emitted when a download is resumed.
- `exists`: Emitted if the file already exists.
- `finished`: Emitted when all downloads are finished.

## 🤔 Why Use DownloadManager?

`node-download-manager` is designed to simplify the process of downloading files in Node.js applications. It provides a robust and flexible API for handling downloads, with support for advanced features like streaming, concurrency control, and event-driven progress reporting. Whether you're building a CLI tool, a server-side application, or a desktop app, `DownloadManager` can help you manage downloads efficiently and effectively.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

---

## 📝 License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for more details.

---
