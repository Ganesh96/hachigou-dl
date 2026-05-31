import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      status: "not_implemented",
      message:
        "Analyze API is not connected yet. Frontend currently uses mocked metadata."
    },
    { status: 501 }
  );
}