'use server'

import { revalidatePath } from "next/cache";
import { getDbUserId } from "./user.action"
import prisma from "@/lib/prisma";

export async function createPost(content: string, imageUrl: string) {
  try {
    const userId = await getDbUserId();
    
    const post = await prisma.Post.create({
      data: {
        content: content,
        image: imageUrl,
        authorId: userId
      }
    })

    // Purge cache for the home page
    revalidatePath('/');

    return {success: true, post}

  } catch (error) {
    console.log(error)
    
    return {success: false, error: "Failed to create post"}
  }
}

export default createPost