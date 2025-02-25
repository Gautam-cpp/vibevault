import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/option";
import { getServerSession } from "next-auth";
import { prisma } from "@/src/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Zod schema for space creation validation
const spaceSchema = z.object({
    spaceName: z.string().trim().min(3).max(50)
  });


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

        const userSpaceCount = await prisma.space.count({
            where: { hostId: user.id }
        });

        if (userSpaceCount >= MAX_SPACES_PER_USER) {
            return NextResponse.json({
                success: false,
                message: "Space limit reached"
            }, { status: 429 });
        }

        const generateSharableSpaceId = () => {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let sharableSpaceId = '';
            for (let i = 0; i < 10; i++) {
              const randomIndex = Math.floor(Math.random() * characters.length);
              sharableSpaceId += characters.charAt(randomIndex);
            }
            return sharableSpaceId;
          };

        const space = await prisma.space.create({
            data: {
                name: data.spaceName,
                hostId: user.id,
                sharableId: generateSharableSpaceId()
            },
        });

        return NextResponse.json({
            success: true,
            message: "Space created successfully",
            space: space,
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
  
      const space = await prisma.space.findUnique({
        where: { id: spaceId },
      });
  
      if (!space || space.hostId !== user.id) {
        return NextResponse.json(
          { success: false, message: "Space not found or access denied" },
          { status: 404 }
        );
      }
  
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
            if (!/^[a-z0-9-]{20,}$/i.test(spaceId)) {
                return NextResponse.json(
                    { success: false, message: "Invalid space ID format" },
                    { status: 400 }
                );
            }

            try {
                const space = await prisma.space.findUniqueOrThrow({
                    where: { id: spaceId },
                    select: { 
                        hostId: true,
                        name: true,
                    },
                });

                return NextResponse.json({
                    success: true,
                    hostId: space.hostId,
                    isHost: space.hostId === session.user.id,
                    spaceName: space.name,
                }, { status: 200 });

            } catch (error) {
                if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
                    return NextResponse.json(
                        { success: false, message: "Space not found" },
                        { status: 404 }
                    );
                }
                throw error;
            }
        }

        // Handle list of all spaces for current user
        const spaces = await prisma.space.findMany({
            where: { hostId: session.user.id },
            select: {
                id: true,
                name: true,
            }
        });

        return NextResponse.json({
            success: true,
            message: "Spaces retrieved successfully",
            data: spaces
        }, { status: 200 });

    } catch (error) {
        console.error("Space API Error:", error);
        
        const errorMessage = error instanceof Error 
            ? error.message 
            : "Internal server error";

        return NextResponse.json(
            { 
                success: false, 
                message: process.env.NODE_ENV === "development" 
                    ? errorMessage 
                    : "Internal server error" 
            },
            { status: 500 }
        );
    }
}