let isStarted = false;

export function shouldEnableMockServiceWorker() {
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV;

  return process.env.NODE_ENV === "development" || vercelEnv === "preview";
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
