import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      status: "not_implemented",
      message:
        "Download API is not connected yet. Later this route will create a yt-dlp job or stream a completed file."
    },
    { status: 501 }
  );
}