import { NextRequest, NextResponse } from "next/server";
import { updatePlayer } from "@/interactors/update-player";
import { AppError } from "@/errors/app-error";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const player = await updatePlayer(id, body);
    return NextResponse.json(player);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
