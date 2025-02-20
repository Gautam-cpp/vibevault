import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/option";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
      }, { status: 403 });
    }

    const user = session.user;
    const streams = await prisma.stream.findMany({
        where: {
            userId: user.id,
        },
        include: {
            _count: {
                select: {
                    upvotes: true,
                },
            },
            upvotes: {
                select: {
                    userId: user.id,
                },
            },
        },
        
    });

    return NextResponse.json({
        streams: streams.map(({ _count, ...rest }) => ({
          ...rest,
          upvotes: _count.upvotes,
          haveUpvoted: rest.upvotes.length ? true : false,
        })),
      });

}