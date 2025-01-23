import DownloadManager from "../modules/DownloadManager.js";

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
