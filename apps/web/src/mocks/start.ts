let isStarted = false;

export function shouldEnableMockServiceWorker() {
  return process.env.NODE_ENV === "development";
}

export async function startMockServiceWorker() {
  if (isStarted) {
    return;
  }

  if (!shouldEnableMockServiceWorker()) {
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
