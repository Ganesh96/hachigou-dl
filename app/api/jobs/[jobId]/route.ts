import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;

  return NextResponse.json(
    {
      jobId,
      status: "not_implemented",
      message:
        "Job polling is not connected yet. Later this route will return download progress."
    },
    { status: 501 }
  );
}