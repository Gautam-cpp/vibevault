import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/option";
import { getServerSession } from "next-auth";
import { prisma } from "@/src/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Zod schema for space creation validation
const spaceSchema = z.object({
    spaceName: z.string().min(3).max(50)
});

// Rate limiting configuration
const MAX_SPACES_PER_USER = 5;

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user.id) {
            return NextResponse.json({
                success: false,
                message: "Unauthorized",
            }, { status: 403 });
        }

        const user = session.user;
        const data = spaceSchema.parse(await req.json());

        // Rate limiting check
        const userSpaceCount = await prisma.space.count({
            where: { hostId: user.id }
        });

        if (userSpaceCount >= MAX_SPACES_PER_USER) {
            return NextResponse.json({
                success: false,
                message: "Space limit reached"
            }, { status: 429 });
        }

        const space = await prisma.space.create({
            data: {
                name: data.spaceName,
                hostId: user.id,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Space created successfully",
            data: space,
        }, { status: 200 });

    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                message: "Invalid space name (3-50 characters required)",
                errors: e.errors
            }, { status: 400 });
        }

        console.log(e);
        return NextResponse.json({
            success: false,
            message: "Something went wrong",
        }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
      const session = await getServerSession(authOptions);
  
      if (!session?.user.id) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 403 }
        );
      }
  
      const user = session.user;
      const spaceId = req.nextUrl.searchParams.get("spaceId");
  
      if (!spaceId) {
        return NextResponse.json(
          { success: false, message: "Space ID is required" },
          { status: 400 }
        );
      }
  
      // Step 1: Retrieve the space to verify ownership
      const space = await prisma.space.findUnique({
        where: { id: spaceId },
      });
  
      if (!space || space.hostId !== user.id) {
        return NextResponse.json(
          { success: false, message: "Space not found or access denied" },
          { status: 404 }
        );
      }
  
      // Step 2: Delete the space using its unique id
      const deletedSpace = await prisma.space.delete({
        where: { id: spaceId },
      });
  
      return NextResponse.json(
        {
          success: true,
          message: "Space deleted successfully",
          data: deletedSpace,
        },
        { status: 200 }
      );
    } catch (e) {
      console.log(e);
      return NextResponse.json(
        { success: false, message: "Something went wrong" },
        { status: 500 }
      );
    }
  }
  

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const spaceId = req.nextUrl.searchParams.get("spaceId");

        if (spaceId) {
            const space = await prisma.space.findUnique({
                where: { id: spaceId },
                select: { hostId: true },
            });

            if (!space) {
                return NextResponse.json(
                    { success: false, message: "Space not found" },
                    { status: 404 }
                );
            }

            return NextResponse.json(
                { 
                    success: true, 
                    message: "Host ID retrieved successfully", 
                    isHost: space.hostId === session.user.id 
                },
                { status: 200 }
            );
        }

        // Get paginated spaces with optimization
        const spaces = await prisma.space.findMany({
            where: { hostId: session.user.id },
            take: 10,
            // orderBy: { createAt: "desc" },
            select: {
                id: true,
                name: true,
                // createAt: true
            }
        });

        return NextResponse.json(
            { 
                success: true, 
                message: "Spaces retrieved successfully", 
                data: spaces 
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error retrieving space:", error);
        return NextResponse.json(
            { 
                success: false, 
                message: "Internal server error" 
            },
            { status: 500 }
        );
    }
}