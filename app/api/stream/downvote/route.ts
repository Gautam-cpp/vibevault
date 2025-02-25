import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "../../auth/[...nextauth]/option";
import { prisma } from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";



const UpvoteSchema = z.object({
    streamId: z.string(),
  });

  export async function POST(req: NextRequest) {
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
    const user = session.user;
  
    try {
      const data = UpvoteSchema.parse(await req.json());
      await prisma.upvote.delete({
        where: {
          userId_streamId: {
            userId: user.id,
            streamId: data.streamId,
          },
        },
      });
  
      return NextResponse.json({
        success: true,
        message: "Downvoted successfully",
      }, {status:200})

    } catch (e) {
      console.log(e);
      return NextResponse.json({
        success: false,
        message: "Error downvoting",
      }, {status:500})
    }
  }