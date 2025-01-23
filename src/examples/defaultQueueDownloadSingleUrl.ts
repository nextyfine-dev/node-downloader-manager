import DownloadManager from "../modules/DownloadManager";

const url =
  "https://code.visualstudio.com/sha/download?build=stable&os=linux-deb-x64";

// Initialize the DownloadManager with console logging enabled
const downloadManager = new DownloadManager({ consoleLog: true }); // By default method is 'queue'

// Start the download
downloadManager.download(url);
