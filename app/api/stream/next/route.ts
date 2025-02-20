import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/option";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";


export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
      }, { status: 403 });
    }
    
    const user = session.user;
    const spaceId = req.nextUrl.searchParams.get("spaceId");

    if(!spaceId) {
        return NextResponse.json({
            success: false,
            message: "Space ID is required"
        }, { status: 400 });
    }

    const mostUpvotedStream = await prisma.stream.findFirst({
        where: {
          userId: user.id,
          played: false,
          spaceId:spaceId
        },
        orderBy: {
          upvotes: {
            _count: "desc",
          },
        },
    });

    await Promise.all([
        prisma.currentStream.upsert({
            where: {
                spaceId: spaceId,
            },
            update: {
                userId: user.id,
                streamId: mostUpvotedStream?.id,
                spaceId: spaceId,
            },
            create: {
                userId: user.id,
                streamId: mostUpvotedStream?.id,
                spaceId: spaceId,
            }
        })
    ]);


    prisma.stream.update({
        where: {
            id: mostUpvotedStream?.id,
        },
        data: {
            played: true,
            playedTs: new Date(),
        },
    });

    return NextResponse.json({
        success: true,
        message: "Next stream set successfully",
    }, {status:200})
}