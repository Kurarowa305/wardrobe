let isStarted = false;

export async function startMockServiceWorker() {
  if (isStarted) {
    return;
  }

  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (typeof window === "undefined") {
    return;
  }

  const { worker } = await import("./browser");
  await worker.start({
    onUnhandledRequest: "bypass",
  });

  isStarted = true;
}
