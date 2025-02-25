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
    
    const spaceId = req.nextUrl.searchParams.get("spaceId");
    if (!spaceId) {
        return NextResponse.json({
            success: false,
            message: "Space ID is required"
        }, { status: 400 });
    }

    try {
        // Get current active stream
        const currentStream = await prisma.currentStream.findUnique({
            where: { spaceId },
            include: { stream: true }
        });

        // Mark current stream as played if exists
        if (currentStream?.stream) {
            await prisma.stream.update({
                where: { id: currentStream.stream.id },
                data: { played: true }
            });
        }

        // Get next stream with highest upvotes
        const nextStream = await prisma.stream.findFirst({
            where: {
                spaceId,
                played: false,
            },
            orderBy: {
                upvotes: {
                    _count: "desc",
                },
            },
            include: {
                _count: {
                    select: { upvotes: true }
                }
            },
        });

        if (!nextStream) {
            // Clear current stream if queue is empty
            await prisma.currentStream.deleteMany({
                where: { spaceId }
            });
            return NextResponse.json({
                success: true,
                stream: null,
                message: "Queue is empty"
            });
        }

        // Update current stream
        const updatedCurrent = await prisma.currentStream.upsert({
            where: { spaceId },
            update: { 
                streamId: nextStream.id,
                userId: session.user.id 
            },
            create: {
                streamId: nextStream.id,
                userId: session.user.id,
                spaceId: spaceId
            },
            include: { stream: true }
        });

        return NextResponse.json({
            success: true,
            stream: {
                ...updatedCurrent.stream,
                upvotes: nextStream._count.upvotes,
                haveUpvoted: false
            },
            message: "Next stream set successfully"
        });

    } catch (error) {
        console.error("Error in next stream:", error);
        return NextResponse.json({
            success: false,
            message: "Internal server error"
        }, { status: 500 });
    }
}