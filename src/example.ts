import DownloadManager from "./index.js";

const urls = [
  "https://example.com/zdcyYvX.jpeg",
  "https://i.imgur.com/StLyH09.jpeg",
  "https://i.imgur.com/vFopwVJ.png",
  "https://i.imgur.com/NaCQQ8c.jpeg",
  "https://i.imgur.com/GXeeLNx.jpeg",
  "https://i.imgur.com/ElhcT9n.jpeg",
  "https://i.imgur.com/sNNWmtU.png",
  "https://i.imgur.com/Upa7Em5.jpeg",
  "https://i.imgur.com/CTHsEaK.png",
];

const getFileName = (url: string) => {
  let fileName = url.split("/").pop();
  return `${Date.now()}-${fileName}`;
};

// queue download example 1
const downloadManager1 = new DownloadManager({});

await downloadManager1.download(urls);

// Or

// queue download example 2
const downloadManager2 = new DownloadManager({
  overWriteFile: true,
  consoleLog: true,
  getFileName,
});

for (const url of urls) {
  downloadManager2.enqueueDownloadTask(url, getFileName(url));
}

// simple download example
const downloadManager3 = new DownloadManager({
  consoleLog: true,
  method: "simple",
});

await downloadManager3.download(urls.slice(1));
