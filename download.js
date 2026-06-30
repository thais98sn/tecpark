const fs = require('fs');
const https = require('https');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(resolve); });
    }).on('error', (err) => { 
        fs.unlink(dest, () => {}); 
        reject(err); 
    });
  });
}

async function run() {
  console.log("Downloading files...");
  await download("https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzEwNWM1ZjZhMDE2YzRmNGJiNDJiYzI3ZGZiMzU2MDE5EgsSBxCVq4-YxxEYAZIBJAoKcHJvamVjdF9pZBIWQhQxMzIzOTQxMTI3MDA1NzYxMzkwMg&filename=&opi=89354086", "configuracao.html");
  await download("https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzliNDcxMDE2ZGYxMzQwNzU4MDQ4ZTI3MmE4ZmQ3YjFiEgsSBxCVq4-YxxEYAZIBJAoKcHJvamVjdF9pZBIWQhQxMzIzOTQxMTI3MDA1NzYxMzkwMg&filename=&opi=89354086", "registro.html");
  await download("https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2I4OWE2NDZjZmY1NDQ5MzI5MjA4ZjJkNTY2MzExNzFjEgsSBxCVq4-YxxEYAZIBJAoKcHJvamVjdF9pZBIWQhQxMzIzOTQxMTI3MDA1NzYxMzkwMg&filename=&opi=89354086", "relatorios.html");
  await download("https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzIxZmQ3ZTRmYmM1NzQ2OGJiOTAxODBmNjQyNjM5YWUzEgsSBxCVq4-YxxEYAZIBJAoKcHJvamVjdF9pZBIWQhQxMzIzOTQxMTI3MDA1NzYxMzkwMg&filename=&opi=89354086", "index.html");
  console.log("Downloads complete!");
}
run();
