
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/option";

export const GET = async (req: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    return NextResponse.json(
      {
        message: "Unauthenticated",
      },
      {
        status: 403,
      },
    );
  }
  return NextResponse.json({
    user: session.user,
  });
};

// dont static render
export const dynamic = "force-dynamic";