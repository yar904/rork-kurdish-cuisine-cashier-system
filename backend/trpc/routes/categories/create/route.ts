import { z } from "zod";
import { publicProcedure } from "../../../create-context";

export const createCategoryProcedure = publicProcedure
  .input(
    z.object({
      name: z.string().min(1, "Category name is required"),
    })
  )
  .mutation(async ({ input }) => {
    return {
      success: true,
      message: "Category created successfully",
      category: { name: input.name },
    };
  });

export default createCategoryProcedure;
