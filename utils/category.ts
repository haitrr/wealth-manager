import prisma from "@/lib/prisma"
import { Category } from "@prisma/client"

let categories: Category[] | undefined = undefined

export const getAllCategories = async (fresh=true) => {
    if(categories !== undefined && !fresh) {
        return categories
    }
    await refreshCategories()
    return categories!
}

const refreshCategories = async () => {
    categories = await prisma.category.findMany({
        include: {
            children: true
        }
    })
}
