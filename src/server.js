const config = require('./config');
const createApp = require('./app');

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`TravelGo đang chạy tại http://localhost:${config.port} (${config.env})`);
});

function shutdown(signal) {
  console.log(`Nhận ${signal}, đang tắt server...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
