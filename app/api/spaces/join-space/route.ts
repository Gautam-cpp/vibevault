import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/option";
import { prisma } from "@/src/lib/prisma";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
        return NextResponse.json({
            success: false,
            message: "Unauthorized",
        }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const sharableSpaceId = searchParams.get("sharableSpaceId");

    if (!sharableSpaceId) {
        return NextResponse.json({
            success: false,
            message: "Space ID is required"
        }, { status: 400 });
    }

    try {
        const space = await prisma.space.findFirst({
            where: {
                sharableId: sharableSpaceId
            }
        });

        if (!space) {
            return NextResponse.json({
                success: false,
                message: "Space not found"
            }, { status: 404 });
        }

        
        console.log("bhai idhar toh aaya tha ")
        console.log(space.id)
        return NextResponse.json({ 
            success: true,
            originalId: space.id,
            
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({
            success: false,
            message: "Internal server error"
        }, { status: 500 });
    }
}


export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
        return NextResponse.json({
            success: false,
            message: "Unauthorized",
        }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const originalId = searchParams.get("originalId");

    if (!originalId) {
        return NextResponse.json({
            success: false,
            message: "Space ID is required"
        }, { status: 400 });
    }

    try {
        const space = await prisma.space.findUnique({
            where: {
                id: originalId
            }
            
            

        });

        if (!space) {
            return NextResponse.json({
                success: false,
                message: "Space not found"
            }, { status: 404 });
        }

        

        return NextResponse.json({ 
            success: true,
            sharableId: space.sharableId,
            
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({
            success: false,
            message: "Internal server error"
        }, { status: 500 });
    }
}