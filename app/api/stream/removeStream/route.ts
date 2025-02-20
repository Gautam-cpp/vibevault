
import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "../../auth/[...nextauth]/option";
import { NextRequest, NextResponse } from "next/server";


const removeStreamSchema = z.object({
        streamId: z.string(),
        spaceId: z.string(),
});

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({
        success: false,
        message: "Unauthenticated",
      }, { status: 403 });
    }

  try {
    const {searchParams} = new URL(req.url);
    const streamId = searchParams.get("streamId");
    const spaceId = searchParams.get("spaceId");

    if (!streamId || !spaceId) {
      return new Response(JSON.stringify({
        success: false,
        message: "Stream ID and space ID are required"
      }), { status: 400 });
    }

    await prisma.stream.deleteMany({
      where: {
        id: streamId,
        userId: session.user.id,
        spaceId: spaceId,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Song removed successfully"
    }), { status: 200 });

  } catch (error) {
    console.error("Error removing stream:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Error removing stream"
    }), { status: 500 });
  }
}