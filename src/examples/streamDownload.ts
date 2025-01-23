import DownloadManager from "../modules/DownloadManager.js";

const url =
  "https://code.visualstudio.com/sha/download?build=stable&os=linux-deb-x64";

const createFileName = () => "code.deb";

// Initialize the DownloadManager with stream and over-write file enabled and creating the filename manually
const downloadManager = new DownloadManager({
  stream: true,
  overWriteFile: true,
  getFileName: createFileName,
}); // By default method is 'queue'. you can use as 'simple' method

// Register event listeners to handle download events
downloadManager.on("start", (data) => {
  console.log(`Download started: ${data?.url}`);
});

downloadManager.on("progress", (data) => {
  console.log(
    `Downloading ${data?.fileName}: ${data?.progress}% (${data?.downloaded}/${data?.totalSize} bytes). Speed ${data?.speed}`
  );
});

downloadManager.on("complete", (data) => {
  console.log(`Download complete: ${data?.fileName}`);
});

downloadManager.on("error", (data) => {
  console.error(`Error downloading ${data?.url}:`, data?.error);
});

downloadManager.on("exists", (data) => {
  console.log(`File already exists: ${data?.fileName}`);
});

downloadManager.on("finished", (data) => {
  console.log(`Download finished: ${data?.fileName}`);
});

// Start the download
downloadManager.download(url); // you can use multiple urls
