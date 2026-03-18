import { NextRequest } from "next/server";
import IORedis from "ioredis";
import { prisma } from "@/lib/prisma";
import { DescriptionStatus } from "@/types/player";

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

  const stream = new ReadableStream({
    async start(controller) {
      const subscriber = new IORedis(process.env.REDIS_URL!);
      const channel = `player:${id}:description`;
      let closed = false;

      function send(data: string) {
        controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
        cleanup();
      }

      function cleanup() {
        if (closed) return;
        closed = true;
        subscriber.unsubscribe(channel);
        subscriber.disconnect();
        controller.close();
      }

      await subscriber.subscribe(channel);

      subscriber.on("message", (_ch: string, message: string) => {
        send(message);
      });

      const player = await prisma.player.findUnique({ where: { id } });
      if (player?.descriptionStatus === DescriptionStatus.READY && player.description) {
        send(JSON.stringify({ status: DescriptionStatus.READY, description: player.description }));
        return;
      }
      if (player?.descriptionStatus === DescriptionStatus.FAILED) {
        send(JSON.stringify({ status: DescriptionStatus.FAILED }));
        return;
      }

      request.signal.addEventListener("abort", cleanup);

      setTimeout(cleanup, 60_000);
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
