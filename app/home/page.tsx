
import HomeView from "@/components/UserDashboard";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/option";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session?.user.id) {
    // Redirect unauthenticated users to the login page
    redirect('/signin');
  }

  return <HomeView />;
}
