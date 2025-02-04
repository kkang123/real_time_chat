import http from "http";

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("서버 실행 성공!");
});

server.listen(PORT, () => {
  console.log(`✅ 서버가 ${PORT} 포트에서 실행 중...`);
});
