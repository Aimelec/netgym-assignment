import { NextRequest, NextResponse } from "next/server";
import { getPlayers } from "@/interactors/get-players";
import { AppError } from "@/errors/app-error";

export async function GET(request: NextRequest) {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);

  try {
    const result = await getPlayers(searchParams);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
