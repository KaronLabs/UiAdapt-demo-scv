import net from "node:net";

const server = net.createServer();
server.listen(5173, "127.0.0.1", () => {
  process.stdout.write("DUMMY_5173=LISTENING\n");
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
