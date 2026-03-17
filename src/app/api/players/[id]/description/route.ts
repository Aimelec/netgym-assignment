import { NextRequest } from "next/server";
import IORedis from "ioredis";
import { prisma } from "@/lib/prisma";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const player = await prisma.player.findUnique({ where: { id } });
  if (player?.descriptionStatus === "ready" && player.description) {
    const body = new TextEncoder().encode(
      `data: ${JSON.stringify({ status: "ready", description: player.description })}\n\n`,
    );
    return new Response(body, { headers: SSE_HEADERS });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const subscriber = new IORedis(process.env.REDIS_URL!);
      const channel = `player:${id}:description`;
      let closed = false;

      function cleanup() {
        if (closed) return;
        closed = true;
        subscriber.unsubscribe(channel);
        subscriber.disconnect();
        controller.close();
      }

      await subscriber.subscribe(channel);

      subscriber.on("message", (_ch: string, message: string) => {
        controller.enqueue(new TextEncoder().encode(`data: ${message}\n\n`));
        cleanup();
      });

      request.signal.addEventListener("abort", cleanup);

      setTimeout(cleanup, 60_000);
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
