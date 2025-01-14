'use server'

import { auth, currentUser } from "@clerk/nextjs/server"
import prisma from '@/lib/prisma'
import { revalidatePath } from "next/cache";

export async function syncUser(){
  try {
    // Take logged user (if any) from Clerk 
    const { userId } = await auth()
    const user = await currentUser();

    if(!userId || !user)return;
    
    // Check if user exists in DB
    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId: userId
      }
    })

    if(existingUser) return existingUser

    // Save clerk user to DB if it doesn't exists
    const dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        name: `${user.firstName || ''} ${user.lastName || ''}`,
        username: user.username ?? user.emailAddresses[0].emailAddress.split("@")[0],
        email: user.emailAddresses[0].emailAddress,
        image: user.imageUrl
      }
    })

    return dbUser;

  } catch (error) { 
    console.log("Error in syncUser", error)
  }
}

export async function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: {
      clerkId,
    },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
    },
  });
}

export async function getDbUserId() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await getUserByClerkId(clerkId);

  if (!user) throw new Error("User not found");

  return user.id;
}

export async function getRandomUsersToFollow() {
  try {
    const userId = await getDbUserId()
    const randomUsers = await prisma.user.findMany({
      where: {
        AND: [
          {NOT: { id: userId }}, // exclude current user
          {NOT: { followers: { some: { followerId: userId}}}}, // exclude followers of current user
        ]
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count: {
          select: {
            followers: true
          }
        }
      },
      take: 3
    })

    return randomUsers
  } catch (error) {
    console.log("Error fetching random users", error)
    return []
  }
}

export async function toggleFollow(targetUserId: string){
  try {
    const currentUserId = await getDbUserId();
    if(currentUserId === targetUserId) throw new Error("You cannot follow yourself") 
    
    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId
        }
      }
    })

    if(existingFollow) {
      // unfollow
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId
          }
        }
      })
    } else {
      // follow
      await prisma.$transaction([
        prisma.follows.create({
          data: {
            followerId: currentUserId,
            followingId: targetUserId
          }
        }),

        prisma.notification.create({
          data: {
            type: 'FOLLOW',
            userId: targetUserId,
            creatorId: currentUserId
          }
        })
      ])
    }
    revalidatePath('/')
    return { success: true}
  } catch (error) {
    console.log("Error in toggleFollow", error)
    return { success: false, error}
  }
}