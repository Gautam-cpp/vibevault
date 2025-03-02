import { prisma } from "@/src/lib/prisma";
import { signUpSchema } from "@/src/schema/signupSchema";
import axios from "axios";
import bcrypt from "bcryptjs";

export  async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsedResult = signUpSchema.safeParse(body);
    if (!parsedResult.success) {
      const errorMessages = parsedResult.error.issues.map((issue) => issue.message).join(", ");
      return new Response(JSON.stringify({
        success: false,
        message: errorMessages
      }), { status: 400 });
    }

    const { email, name, password, provider } = parsedResult.data;

   
    const response = await axios.get(`https://api.zerobounce.net/v2/validate`, {
      params: { api_key: process.env.BOUNCER_API_KEY, email },
    });

    // console.log(response);

    if(response.data.status !== "valid"){
      return new Response(JSON.stringify({
        success: false,
        message: "Invalid Email"
      }), { status: 400 });
    }

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return new Response(JSON.stringify({
        success: false,
        message: "User already exists"
      }), { status: 409 });
    }

    let hashedPassword: string | undefined;
    if (provider === "Credentials" && password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        provider: provider === "Credentials" ? "Credentials" : "Google",
        password: hashedPassword, 
      },
    });

    return new Response(JSON.stringify({
      success: true,
      message: "User created successfully",
      user  
    }), { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return new Response(JSON.stringify({
      success: false,
      message: "Error creating user"
    }), { status: 500 });
  }
}