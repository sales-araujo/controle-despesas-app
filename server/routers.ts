import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getUserCategories,
  createCategory,
  deleteCategory,
  getMonthlyIncome,
  upsertMonthlyIncome,
  getExpenses,
  getExpensesByCategory,
  getExpensesByGroupId,
  createExpense,
  updateExpense,
  deleteExpense,
  getUserReports,
  getReport,
  createReport,
  deleteReport,
  getMonthlySummary,
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,

  // ============ CATEGORIES ============
  categories: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserCategories(ctx.user.id);
    }),
    

    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        icon: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createCategory({
          userId: ctx.user.id,
          name: input.name,
          icon: input.icon ?? "receipt",
          color: input.color ?? "#6366f1",
        });
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteCategory(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ============ INCOME ============
  income: router({
    get: protectedProcedure
      .input(z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      }))
      .query(async ({ ctx, input }) => {
        return getMonthlyIncome(ctx.user.id, input.year, input.month);
      }),
    
    upsert: protectedProcedure
      .input(z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
        amount: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return upsertMonthlyIncome({
          userId: ctx.user.id,
          year: input.year,
          month: input.month,
          amount: input.amount,
          description: input.description ?? null,
        });
      }),
  }),

  // ============ EXPENSES ============
  expenses: router({
    list: protectedProcedure
      .input(z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
        categoryId: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (input.categoryId) {
          return getExpensesByCategory(ctx.user.id, input.year, input.month, input.categoryId);
        }
        return getExpenses(ctx.user.id, input.year, input.month);
      }),
    
    byGroup: protectedProcedure
      .input(z.object({ groupId: z.string().min(1) }))
      .query(async ({ ctx, input }) => {
        return getExpensesByGroupId(ctx.user.id, input.groupId);
      }),

    create: protectedProcedure
      .input(z.object({
        categoryId: z.number().optional(),
        categoryName: z.string().optional(),
        groupId: z.string().optional(),
        paid: z.boolean().optional(),
        year: z.number(),
        month: z.number().min(1).max(12),
        type: z.enum(["fixed", "variable"]),
        description: z.string().max(255).optional(),
        amount: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        let categoryId = input.categoryId;
        
        if (!categoryId && input.categoryName) {
          const newCat = await createCategory({
            userId: ctx.user.id,
            name: input.categoryName,
            icon: "receipt",
            color: "#6366f1",
          });
          categoryId = newCat.id;
        }
        
        if (!categoryId) {
          throw new Error("Category ID or name is required");
        }
        
        return createExpense({
          userId: ctx.user.id,
          categoryId,
          groupId: input.groupId,
          paid: input.paid,
          year: input.year,
          month: input.month,
          type: input.type,
          description: input.description ?? "",
          amount: input.amount,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        categoryId: z.number().optional(),
        groupId: z.string().optional(),
        paid: z.boolean().optional(),
        type: z.enum(["fixed", "variable"]).optional(),
        description: z.string().max(255).optional(),
        amount: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const updateData: Record<string, unknown> = {};
        
        if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
        if (data.groupId !== undefined) updateData.groupId = data.groupId;
        if (data.paid !== undefined) updateData.paid = data.paid;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.amount !== undefined) updateData.amount = data.amount;
        
        await updateExpense(id, ctx.user.id, updateData);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteExpense(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ============ SUMMARY ============
  summary: router({
    get: protectedProcedure
      .input(z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      }))
      .query(async ({ ctx, input }) => {
        return getMonthlySummary(ctx.user.id, input.year, input.month);
      }),
  }),

  dashboard: router({
    get: protectedProcedure
      .input(z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      }))
      .query(async ({ ctx, input }) => {
        const [summary, expenses, categories] = await Promise.all([
          getMonthlySummary(ctx.user.id, input.year, input.month),
          getExpenses(ctx.user.id, input.year, input.month),
          getUserCategories(ctx.user.id),
        ]);

        return { summary, expenses, categories };
      }),
  }),

  // ============ REPORTS ============
  reports: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserReports(ctx.user.id);
    }),
    
    get: protectedProcedure
      .input(z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      }))
      .query(async ({ ctx, input }) => {
        return getReport(ctx.user.id, input.year, input.month);
      }),
    
    generateMae: protectedProcedure
      .input(z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
        pdfContent: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const fileKey = `reports/${ctx.user.id}/mae-${input.year}-${String(input.month).padStart(2, '0')}-${nanoid(8)}.pdf`;
        const pdfBuffer = Buffer.from(input.pdfContent, 'base64');
        
        const { url } = await storagePut(fileKey, pdfBuffer, 'application/pdf');
        
        return createReport({
          userId: ctx.user.id,
          year: input.year,
          month: input.month,
          fileUrl: url,
          fileKey: fileKey,
        });
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteReport(input.id, ctx.user.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
