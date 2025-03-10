import { prisma } from "@/src/lib/prisma";
import { NextRequest } from "next/server";

export default async function GET(req: NextRequest){
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if(!email){
        return new Response(JSON.stringify({
            success: false,
            message: "Email is required"
        }), { status: 400 });
    }

    const otp = await prisma.user.findUnique({
        where: {
            email
        },
        select: {
            otp: true
        }
    })

    return new Response(JSON.stringify({
        success: true,
        otp
    }), { status: 200 });
}