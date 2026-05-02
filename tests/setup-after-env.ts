afterAll(async () => {
  try {
    const { usgsQueue } = require("../queue/usgs.queue");
    if (usgsQueue?.close) {
      await usgsQueue.close();
    }
  } catch (err) {
    // Ignore errors during cleanup
  }
});
