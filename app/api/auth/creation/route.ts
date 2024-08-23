import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/app/lib/db";
import { NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";

export async function GET() {
  // Prevent caching
  noStore();

  // Get the user from the Kinde server session
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  // Handle case where user retrieval fails
  if (!user || !user.id) {
    console.error("User retrieval failed: ", user);
    throw new Error("Something went wrong, I am sorry....");
  }

  // Find the user in the database
  let dbUser = await prisma.user.findUnique({
    where: {
      id: user.id,
    },
  });

  // If the user doesn't exist, create a new one
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email: user.email ?? "",
        firstName: user.given_name ?? "",
        lastName: user.family_name ?? "",
        id: user.id,
        profileImage: user.picture ?? `https://avatar.vercel.sh/${user.given_name}`,
      },
    });
  }

  // Log user information for debugging purposes
  console.log("User retrieved: ", user);
  console.log("Database user: ", dbUser);

  // Redirect to the appropriate URL
  const redirectUrl = process.env.NEXT_PUBLIC_REDIRECT_URL || "https://localhost:3000/";
  return NextResponse.redirect(redirectUrl);
}
