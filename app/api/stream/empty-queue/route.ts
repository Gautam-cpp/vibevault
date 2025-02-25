import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/option";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
        return NextResponse.json(
            {
                message: "Unauthenticated",
            },
            {
                status: 403,
            },
        )
    }



    const { searchParams } = new URL(req.url);
    const spaceId = searchParams.get("spaceId");

    if (!spaceId) {
        return new Response(JSON.stringify({
            success: false,
            message: "Space ID is required"
        }), { status: 400 });
    }

    await prisma.stream.deleteMany({
        where: {
            userId: session.user.id,
            spaceId: spaceId,
        },
    });
    return new Response(JSON.stringify({
        success: true,
        message: "Queue is empty"
    }), { status: 200 });
}   