import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { Product } from "../generated/prisma/index.js";
import { z } from "zod";
import { hashPassword, comparePassword, generateToken } from "../lib/auth.js";
import { prisma } from "../db/client.js";
import { uploadImage } from "../lib/cloudinary.js";
import { requireSellerAuth } from "../middleware/auth.js";
import { ensureDefaultSellerPackage } from "../lib/sellerPackages.js";
import { buildStorehouseProductWhere } from "./sellerStorehouseFilters.js";
import {
  canSellerAddStorehouseProducts,
  getRemainingSellerProductSlots,
  selectSellerProductsToAdd,
} from "./sellerProductBulkAdd.js";
import { canSellerLogin } from "./sellerLogin.js";
import {
  validateSellerTransactionPasswordChange,
  validateSellerTransactionPasswordReset,
} from "./sellerTransactionPassword.js";

const registerSellerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  transactionPassword: z
    .string()
    .min(6, "Transaction password must be at least 6 characters"),
  shopName: z.string().min(2, "Shop name must be at least 2 characters"),
  idType: z.enum(["ID_CARD", "PASSPORT", "DRIVING_LICENSE", "SOCIAL_SECURITY"]),
  idFrontImage: z.string().min(1, "ID Front image is required"),
  idBackImage: z.string().min(1, "ID Back image is required"),
});

const storehouseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  brand: z.string().trim().optional(),
});

const addSellerProductsSchema = z
  .object({
    mode: z.enum(["selected", "all"]).default("selected"),
    productIds: z.array(z.string().min(1)).optional(),
  })
  .superRefine((data, context) => {
    if (
      data.mode === "selected" &&
      (!data.productIds || data.productIds.length === 0)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["productIds"],
        message: "Select at least one product first.",
      });
    }
  });

const sellerProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  search: z.string().trim().optional(),
});

const createWalletRechargeSchema = z.object({
  paymentMethodId: z.string().min(1),
  amount: z.number().positive(),
  receiptBase64: z.string().min(1),
  remark: z.string().trim().max(500).optional(),
});

const createWalletWithdrawalSchema = z.object({
  paymentMethodId: z.string().optional().nullable(),
  payoutAddress: z.string().min(4, "Payout address is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  transactionPassword: z.string().min(1, "Transaction password is required"),
  remark: z.string().trim().max(500).optional(),
});

const updateSellerTransactionPasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(6, "Current transaction password must be at least 6 characters"),
  newPassword: z
    .string()
    .min(6, "New transaction password must be at least 6 characters"),
  confirmPassword: z
    .string()
    .min(6, "Confirm transaction password must be at least 6 characters"),
});

const resetSellerTransactionPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(6, "New transaction password must be at least 6 characters"),
  confirmPassword: z
    .string()
    .min(6, "Confirm transaction password must be at least 6 characters"),
});

export default async function sellerRoutes(fastify: FastifyInstance) {
  const paymentMethodModel = (prisma as any).paymentMethod;
  const sellerWalletRechargeModel = (prisma as any).sellerWalletRecharge;
  const sellerWalletWithdrawalModel = (prisma as any).sellerWalletWithdrawal;

  fastify.post(
    "/api/seller/register",
    {
      // Increase body size limit for base64 images if needed
      bodyLimit: 52428800, // 50MB
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = registerSellerSchema.parse(request.body);

        // Check if seller already exists with this email
        const existingSeller = await prisma.seller.findUnique({
          where: { email: data.email },
        });

        if (existingSeller) {
          return reply
            .status(400)
            .send({ error: "A seller with this email already exists." });
        }

        // Hash passwords
        const hashedPassword = await hashPassword(data.password);
        const hashedTransactionPassword = await hashPassword(
          data.transactionPassword,
        );

        // Upload images to Cloudinary
        // data.idFrontImage and idBackImage should be base64 strings
        const idFrontUrl = await uploadImage(data.idFrontImage, "seller-ids");
        const idBackUrl = await uploadImage(data.idBackImage, "seller-ids");
        const defaultPackage = await ensureDefaultSellerPackage();

        // Create seller
        const seller = await prisma.seller.create({
          data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            transactionPassword: hashedTransactionPassword,
            shopName: data.shopName,
            idType: data.idType,
            idFrontImage: idFrontUrl,
            idBackImage: idBackUrl,
            status: "PENDING",
            sellerPackageId: defaultPackage.id,
          },
        });

        return reply.send({
          success: true,
          message: "Seller registered successfully. Pending verification.",
          seller: {
            id: seller.id,
            email: seller.email,
            name: seller.name,
            shopName: seller.shopName,
            status: seller.status,
            sellerPackageId: seller.sellerPackageId,
          },
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply
            .status(400)
            .send({ error: "Invalid input", details: error.errors });
        }
        console.error("Registration error:", error);
        return reply.status(500).send({ error: "Internal server error" });
      }
    },
  );

  const loginSellerSchema = z.object({
    email: z.string().email(),
    password: z.string(),
  });

  fastify.post(
    "/api/seller/login",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { email, password } = loginSellerSchema.parse(request.body);

        const seller = await prisma.seller.findUnique({
          where: { email },
        });

        if (!seller) {
          return reply.status(401).send({ error: "Invalid credentials" });
        }

        const isValid = await comparePassword(password, seller.password);
        if (!isValid) {
          return reply.status(401).send({ error: "Invalid credentials" });
        }

        if (!canSellerLogin(seller.status)) {
          return reply.status(403).send({ error: "Unable to log in" });
        }

        const token = generateToken({
          userId: seller.id,
          email: seller.email,
          role: "SELLER",
        });

        return reply.send({
          success: true,
          token,
          seller: {
            id: seller.id,
            email: seller.email,
            name: seller.name,
            shopName: seller.shopName,
            status: seller.status,
            sellerPackageId: seller.sellerPackageId,
          },
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply
            .status(400)
            .send({ error: "Invalid input", details: error.errors });
        }
        return reply.status(500).send({ error: "Internal server error" });
      }
    },
  );

  fastify.get(
    "/api/seller/session",
    { preHandler: [requireSellerAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerPayload = (request as any).seller;
        const seller = await prisma.seller.findUnique({
          where: { id: sellerPayload.userId },
          select: {
            id: true,
            email: true,
            name: true,
            shopName: true,
            status: true,
            sellerPackage: true,
          },
        });

        if (!seller) {
          return reply.status(404).send({ error: "Seller not found" });
        }

        return reply.send({ success: true, seller });
      } catch (error) {
        return reply.status(500).send({ error: "Internal server error" });
      }
    },
  );

  fastify.get(
    "/api/seller/settings",
    { preHandler: [requireSellerAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerPayload = (request as any).seller;
        const seller = await prisma.seller.findUnique({
          where: { id: sellerPayload.userId },
          select: {
            shopName: true,
            shopLogo: true,
            shopPhone: true,
            shopAddress: true,
            metaTitle: true,
            metaDescription: true,
          },
        });

        if (!seller) {
          return reply.status(404).send({ error: "Seller not found" });
        }

        return reply.send({ success: true, settings: seller });
      } catch (error) {
        return reply.status(500).send({ error: "Internal server error" });
      }
    },
  );

  const updateSettingsSchema = z.object({
    shopName: z.string().min(2, "Shop name is required").optional(),
    shopLogo: z.string().optional(),
    shopPhone: z.string().optional(),
    shopAddress: z.string().min(5, "Shop address is required").optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  });

  fastify.get(
    "/api/seller/storehouse/products",
    { preHandler: [requireSellerAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerPayload = (request as any).seller;
        const { page, limit, search, category, brand } =
          storehouseQuerySchema.parse(request.query);
        const skip = (page - 1) * limit;
        const where = buildStorehouseProductWhere({ search, category, brand });

        const [products, total, sellerProductsCount, seller] =
          await Promise.all([
            prisma.product.findMany({
              where,
              skip,
              take: limit,
              include: { category: true },
              orderBy: { createdAt: "desc" },
            }),
            prisma.product.count({ where }),
            prisma.sellerProduct.count({
              where: { sellerId: sellerPayload.userId },
            }),
            prisma.seller.findUnique({
              where: { id: sellerPayload.userId },
              select: { sellerPackage: true },
            }),
          ]);

        const productIds = products.map((product) => product.id);
        const existingSellerProducts = productIds.length
          ? await prisma.sellerProduct.findMany({
              where: {
                sellerId: sellerPayload.userId,
                sourceProductId: { in: productIds },
              },
              select: { sourceProductId: true },
            })
          : [];
        const existingProductIds = new Set(
          existingSellerProducts.map((item) => item.sourceProductId),
        );

        return reply.send({
          data: products.map((product) => ({
            ...product,
            alreadyAdded: existingProductIds.has(product.id),
          })),
          meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            sellerProductsCount,
            packageLimit: seller?.sellerPackage?.productLimit ?? 300,
          },
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply
            .status(400)
            .send({ error: "Invalid input", details: error.errors });
        }
        console.error("Storehouse fetch error:", error);
        return reply.status(500).send({ error: "Internal server error" });
      }
    },
  );

  fastify.post(
    "/api/seller/products/bulk-add",
    { preHandler: [requireSellerAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerPayload = (request as any).seller;
        const { mode, productIds = [] } = addSellerProductsSchema.parse(
          request.body,
        );
        const uniqueProductIds = [...new Set(productIds)];

        const seller = await prisma.seller.findUnique({
          where: { id: sellerPayload.userId },
          include: { sellerPackage: true },
        });

        if (!seller)
          return reply.status(404).send({ error: "Seller not found" });

        if (!canSellerAddStorehouseProducts(seller.status)) {
          return reply.status(403).send({
            error:
              "Your shop must be verified before you can add storehouse products.",
          });
        }

        const currentCount = await prisma.sellerProduct.count({
          where: { sellerId: seller.id },
        });
        const packageLimit = seller.sellerPackage?.productLimit ?? 300;
        const remainingSlots = getRemainingSellerProductSlots(
          currentCount,
          packageLimit,
        );

        if (remainingSlots === 0) {
          return reply.status(400).send({
            error: `Package limit reached. Your package allows ${packageLimit} products and you already have ${currentCount}.`,
          });
        }

        let productsToAdd: Product[];
        let skipped = 0;

        if (mode === "all") {
          const existingSellerProducts = await prisma.sellerProduct.findMany({
            where: { sellerId: seller.id },
            select: { sourceProductId: true },
          });
          const existingProductIds = new Set(
            existingSellerProducts.map((item) => item.sourceProductId),
          );
          const allProducts = await prisma.product.findMany({
            where: {
              isActive: true,
              id: { notIn: [...existingProductIds] },
            },
            select: { id: true, categoryId: true },
          });

          const productsByCategory: Record<string, string[]> = {};
          for (const p of allProducts) {
            if (!productsByCategory[p.categoryId]) {
              productsByCategory[p.categoryId] = [];
            }
            productsByCategory[p.categoryId].push(p.id);
          }

          for (const catId in productsByCategory) {
            productsByCategory[catId].sort(() => Math.random() - 0.5);
          }

          const selectedIds = new Set<string>();
          const categoryIds = Object.keys(productsByCategory);

          while (selectedIds.size < remainingSlots && categoryIds.length > 0) {
            let addedInRound = 0;
            for (let i = 0; i < categoryIds.length; i++) {
              const catId = categoryIds[i];
              const list = productsByCategory[catId];
              if (list && list.length > 0) {
                selectedIds.add(list.pop()!);
                addedInRound++;
                if (selectedIds.size >= remainingSlots) break;
              }
            }
            if (addedInRound === 0) break;
          }

          const products = await prisma.product.findMany({
            where: {
              id: { in: Array.from(selectedIds) },
            },
          });

          productsToAdd = selectSellerProductsToAdd({
            products,
            existingProductIds,
            remainingSlots,
          });
          skipped = existingSellerProducts.length;

          if (productsToAdd.length === 0) {
            return reply
              .status(400)
              .send({ error: "No available storehouse products to add." });
          }
        } else {
          const [existingSellerProducts, products] = await Promise.all([
            prisma.sellerProduct.findMany({
              where: {
                sellerId: seller.id,
                sourceProductId: { in: uniqueProductIds },
              },
              select: { sourceProductId: true },
            }),
            prisma.product.findMany({
              where: {
                id: { in: uniqueProductIds },
                isActive: true,
              },
            }),
          ]);

          const existingProductIds = new Set(
            existingSellerProducts.map((item) => item.sourceProductId),
          );
          productsToAdd = products.filter(
            (product) => !existingProductIds.has(product.id),
          );
          skipped = uniqueProductIds.length - productsToAdd.length;

          if (productsToAdd.length === 0) {
            return reply.status(400).send({
              error: "Selected products are already in your products.",
            });
          }

          if (productsToAdd.length > remainingSlots) {
            return reply.status(400).send({
              error: `Package limit exceeded. Your package allows ${packageLimit} products and you already have ${currentCount}.`,
            });
          }
        }

        const created = await prisma.sellerProduct.createMany({
          data: productsToAdd.map((product) => ({
            sellerId: seller.id,
            sourceProductId: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            images: product.images,
            stock: product.stock,
            isActive: product.isActive,
            categoryId: product.categoryId,
            videoLink: product.videoLink,
            descriptionImages: product.descriptionImages,
          })),
          skipDuplicates: true,
        });

        return reply.status(201).send({
          success: true,
          added: created.count,
          skipped,
          packageLimit,
          sellerProductsCount: currentCount + created.count,
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply
            .status(400)
            .send({ error: "Invalid input", details: error.errors });
        }
        console.error("Bulk add seller products error:", error);
        return reply.status(500).send({ error: "Internal server error" });
      }
    },
  );

  fastify.get(
    "/api/seller/products",
    { preHandler: [requireSellerAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerPayload = (request as any).seller;
        const { page, limit, search } = sellerProductsQuerySchema.parse(
          request.query,
        );
        const skip = (page - 1) * limit;
        const where = {
          sellerId: sellerPayload.userId,
          ...(search
            ? { name: { contains: search, mode: "insensitive" as const } }
            : {}),
        };

        const [products, total, seller] = await Promise.all([
          prisma.sellerProduct.findMany({
            where,
            skip,
            take: limit,
            include: {
              category: true,
              sourceProduct: {
                select: {
                  id: true,
                  soldBy: true,
                  stock: true,
                  isActive: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          }),
          prisma.sellerProduct.count({ where }),
          prisma.seller.findUnique({
            where: { id: sellerPayload.userId },
            select: { sellerPackage: true },
          }),
        ]);

        return reply.send({
          data: products,
          meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            packageLimit: seller?.sellerPackage?.productLimit ?? 300,
          },
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply
            .status(400)
            .send({ error: "Invalid input", details: error.errors });
        }
        console.error("Seller products fetch error:", error);
        return reply.status(500).send({ error: "Internal server error" });
      }
    },
  );

  fastify.put(
    "/api/seller/settings",
    { preHandler: [requireSellerAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerPayload = (request as any).seller;
        const data = updateSettingsSchema.parse(request.body);

        // Extract base64 image and upload if shopLogo is present and is a base64 string
        let shopLogoUrl = data.shopLogo;
        if (shopLogoUrl && shopLogoUrl.startsWith("data:image")) {
          shopLogoUrl = await uploadImage(shopLogoUrl, "seller-logos");
        }

        const updatedSeller = await prisma.seller.update({
          where: { id: sellerPayload.userId },
          data: {
            shopName: data.shopName,
            shopLogo: shopLogoUrl,
            shopPhone: data.shopPhone,
            shopAddress: data.shopAddress,
            metaTitle: data.metaTitle,
            metaDescription: data.metaDescription,
          },
          select: {
            shopName: true,
            shopLogo: true,
            shopPhone: true,
            shopAddress: true,
            metaTitle: true,
            metaDescription: true,
          },
        });

        return reply.send({ success: true, settings: updatedSeller });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply
            .status(400)
            .send({ error: "Invalid input", details: error.errors });
        }
        console.error("Update settings error:", error);
        return reply.status(500).send({ error: "Internal server error" });
      }
    },
  );

  fastify.put(
    "/api/seller/transaction-password",
    { preHandler: [requireSellerAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerPayload = (request as any).seller;
        const sellerId = sellerPayload.userId;
        const body = updateSellerTransactionPasswordSchema.parse(request.body);

        const seller = await prisma.seller.findUnique({
          where: { id: sellerId },
          select: { id: true, transactionPassword: true },
        });

        if (!seller) {
          return reply.status(404).send({ error: "Seller not found" });
        }

        const validation = await validateSellerTransactionPasswordChange({
          storedTransactionPassword: seller.transactionPassword,
          currentPassword: body.currentPassword,
          newPassword: body.newPassword,
          confirmPassword: body.confirmPassword,
          comparePassword,
        });

        if (!validation.ok) {
          return reply
            .status(validation.statusCode)
            .send({ error: validation.error });
        }

        const hashedTransactionPassword = await hashPassword(body.newPassword);

        await prisma.seller.update({
          where: { id: seller.id },
          data: { transactionPassword: hashedTransactionPassword },
        });

        return reply.send({
          success: true,
          message: "Transaction password updated successfully.",
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply
            .status(400)
            .send({ error: "Invalid input", details: error.errors });
        }
        console.error("Update seller transaction password error:", error);
        return reply.status(500).send({ error: "Internal server error" });
      }
    },
  );

  fastify.post(
    "/api/seller/transaction-password/reset",
    { preHandler: [requireSellerAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerPayload = (request as any).seller;
        const sellerId = sellerPayload.userId;
        const body = resetSellerTransactionPasswordSchema.parse(request.body);

        const seller = await prisma.seller.findUnique({
          where: { id: sellerId },
          select: { id: true },
        });

        if (!seller) {
          return reply.status(404).send({ error: "Seller not found" });
        }

        const validation = await validateSellerTransactionPasswordReset({
          newPassword: body.newPassword,
          confirmPassword: body.confirmPassword,
        });

        if (!validation.ok) {
          return reply
            .status(validation.statusCode)
            .send({ error: validation.error });
        }

        const hashedTransactionPassword = await hashPassword(body.newPassword);

        await prisma.seller.update({
          where: { id: seller.id },
          data: { transactionPassword: hashedTransactionPassword },
        });

        return reply.send({
          success: true,
          message: "Transaction password reset successfully.",
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply
            .status(400)
            .send({ error: "Invalid input", details: error.errors });
        }
        console.error("Reset seller transaction password error:", error);
        return reply.status(500).send({ error: "Internal server error" });
      }
    },
  );

  fastify.get(
    "/api/seller/wallet-recharges",
    { preHandler: [requireSellerAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerPayload = (request as any).seller;
        const recharges = await sellerWalletRechargeModel.findMany({
          where: { sellerId: sellerPayload.userId },
          include: {
            paymentMethod: {
              select: {
                id: true,
                network: true,
                logo: true,
                address: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        return reply.send({ data: recharges });
      } catch (error) {
        console.error("Fetch wallet recharge history error:", error);
        return reply
          .status(500)
          .send({ error: "Failed to fetch wallet recharge history" });
      }
    },
  );

  fastify.post(
    "/api/seller/wallet-recharges",
    { preHandler: [requireSellerAuth], bodyLimit: 52428800 },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerPayload = (request as any).seller;
        const { paymentMethodId, amount, receiptBase64, remark } =
          createWalletRechargeSchema.parse(request.body);

        if (!receiptBase64.startsWith("data:image")) {
          return reply
            .status(400)
            .send({ error: "Receipt must be an image file" });
        }

        const paymentMethod = await paymentMethodModel.findUnique({
          where: { id: paymentMethodId },
        });

        if (!paymentMethod || !paymentMethod.isEnabled) {
          return reply
            .status(400)
            .send({ error: "Selected payment method is not available" });
        }

        const pendingRecharge = await sellerWalletRechargeModel.findFirst({
          where: {
            sellerId: sellerPayload.userId,
            status: "PENDING",
          },
          select: { id: true },
        });

        if (pendingRecharge) {
          return reply.status(409).send({
            error:
              "You already have a pending recharge request. Please wait for admin review before creating another one.",
          });
        }

        const receiptImage = await uploadImage(
          receiptBase64,
          "seller-wallet-receipts",
        );

        const created = await sellerWalletRechargeModel.create({
          data: {
            sellerId: sellerPayload.userId,
            paymentMethodId,
            amount,
            receiptImage,
            remark: remark || null,
          },
          include: {
            paymentMethod: {
              select: {
                id: true,
                network: true,
                logo: true,
                address: true,
              },
            },
          },
        });

        return reply.status(201).send({ data: created });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply
            .status(400)
            .send({ error: "Invalid input", details: error.errors });
        }
        console.error("Create wallet recharge request error:", error);
        return reply
          .status(500)
          .send({ error: "Failed to submit wallet recharge request" });
      }
    },
  );

  fastify.get(
    "/api/seller/wallet-withdrawals",
    { preHandler: [requireSellerAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerPayload = (request as any).seller;
        const withdrawals = await sellerWalletWithdrawalModel.findMany({
          where: { sellerId: sellerPayload.userId },
          include: {
            paymentMethod: {
              select: {
                id: true,
                network: true,
                logo: true,
                address: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        return reply.send({ data: withdrawals });
      } catch (error) {
        console.error("Fetch wallet withdrawal history error:", error);
        return reply
          .status(500)
          .send({ error: "Failed to fetch wallet withdrawal history" });
      }
    },
  );

  fastify.post(
    "/api/seller/wallet-withdrawals",
    { preHandler: [requireSellerAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerPayload = (request as any).seller;
        const { paymentMethodId, payoutAddress, amount, transactionPassword, remark } =
          createWalletWithdrawalSchema.parse(request.body);

        const seller = await prisma.seller.findUnique({
          where: { id: sellerPayload.userId },
        });

        if (!seller) {
          return reply.status(404).send({ error: "Seller account not found" });
        }

        if (!seller.allowWithdraw) {
          return reply.status(403).send({
            error: "Withdrawals are currently disabled for your account. Please contact support.",
          });
        }

        const isPasswordValid = await comparePassword(
          transactionPassword,
          seller.transactionPassword
        );

        if (!isPasswordValid) {
          return reply
            .status(400)
            .send({ error: "Invalid transaction password." });
        }

        const pendingWithdrawal = await sellerWalletWithdrawalModel.findFirst({
          where: {
            sellerId: sellerPayload.userId,
            status: "PENDING",
          },
          select: { id: true },
        });

        if (pendingWithdrawal) {
          return reply.status(409).send({
            error:
              "You already have a pending withdrawal request. Please wait for admin review before submitting another.",
          });
        }

        if (Number(seller.walletMoney) < amount) {
          return reply.status(400).send({
            error: `Insufficient wallet balance. Your current wallet balance is $${Number(seller.walletMoney).toFixed(2)}.`,
          });
        }

        const created = await prisma.$transaction(async (tx) => {
          await tx.seller.update({
            where: { id: sellerPayload.userId },
            data: {
              walletMoney: {
                decrement: amount,
              },
            },
          });

          return await (tx as any).sellerWalletWithdrawal.create({
            data: {
              sellerId: sellerPayload.userId,
              paymentMethodId: paymentMethodId || null,
              payoutAddress,
              amount,
              remark: remark || null,
            },
            include: {
              paymentMethod: {
                select: {
                  id: true,
                  network: true,
                  logo: true,
                  address: true,
                },
              },
            },
          });
        });

        return reply.status(201).send({ data: created });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply
            .status(400)
            .send({ error: "Invalid input", details: error.errors });
        }
        console.error("Create wallet withdrawal request error:", error);
        return reply
          .status(500)
          .send({ error: "Failed to submit wallet withdrawal request" });
      }
    },
  );

  // --- Seller Files ---

  fastify.get(
    "/api/seller/files",
    { preHandler: [requireSellerAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerPayload = (request as any).seller;
        const sellerId = sellerPayload.userId;

        const files = await prisma.sellerFile.findMany({
          where: { sellerId },
          orderBy: { createdAt: "desc" },
        });

        return reply.send({ success: true, files });
      } catch (error) {
        console.error("Fetch seller files error:", error);
        return reply.status(500).send({ error: "Failed to fetch files" });
      }
    },
  );

  const uploadFileSchema = z.object({
    base64: z.string(),
    name: z.string(),
    type: z.string().optional(),
    size: z.number().optional(),
  });

  fastify.post(
    "/api/seller/files",
    {
      preHandler: [requireSellerAuth],
      bodyLimit: 10485760, // 10MB limit for Fastify body
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerPayload = (request as any).seller;
        const sellerId = sellerPayload.userId;

        const { base64, name, type, size } = uploadFileSchema.parse(
          request.body,
        );

        // 5MB Limit Check
        const sizeInBytes = size || base64.length * 0.75;
        if (sizeInBytes > 5 * 1024 * 1024) {
          return reply
            .status(400)
            .send({ error: "File size exceeds 5MB limit" });
        }

        // We need `uploadFile` from cloudinary.ts. We already added it there.
        const { uploadFile } = await import("../lib/cloudinary.js");
        const uploadResult = await uploadFile(base64, "seller-files");

        const file = await prisma.sellerFile.create({
          data: {
            sellerId,
            url: uploadResult.url,
            publicId: uploadResult.publicId,
            name,
            type: type || "application/octet-stream",
            size: Math.round(sizeInBytes),
          },
        });

        return reply.status(201).send({ success: true, file });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply
            .status(400)
            .send({ error: "Invalid input", details: error.errors });
        }
        console.error("Upload seller file error:", error);
        return reply.status(500).send({ error: "Failed to upload file" });
      }
    },
  );

  fastify.delete(
    "/api/seller/files/:id",
    { preHandler: [requireSellerAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerPayload = (request as any).seller;
        const sellerId = sellerPayload.userId;
        const { id } = request.params as { id: string };

        const file = await prisma.sellerFile.findFirst({
          where: { id, sellerId },
        });

        if (!file) {
          return reply.status(404).send({ error: "File not found" });
        }

        if (file.publicId) {
          const { deleteFile } = await import("../lib/cloudinary.js");
          await deleteFile(file.publicId);
        }

        await prisma.sellerFile.delete({
          where: { id },
        });

        return reply.send({
          success: true,
          message: "File deleted successfully",
        });
      } catch (error) {
        console.error("Delete seller file error:", error);
        return reply.status(500).send({ error: "Failed to delete file" });
      }
    },
  );

  // --- Seller Profile ---

  fastify.get(
    "/api/seller/profile",
    { preHandler: [requireSellerAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerPayload = (request as any).seller;
        const sellerId = sellerPayload.userId;

        const profile = await prisma.seller.findUnique({
          where: { id: sellerId },
          select: {
            name: true,
            email: true,
            phone: true,
            avatar: true,
            cashPayment: true,
            usdtPayment: true,
            usdtLink: true,
            usdtAddress: true,
          },
        });

        if (!profile) {
          return reply.status(404).send({ error: "Profile not found" });
        }

        return reply.send({ success: true, profile });
      } catch (error) {
        console.error("Fetch seller profile error:", error);
        return reply.status(500).send({ error: "Failed to fetch profile" });
      }
    },
  );

  const updateProfileSchema = z.object({
    name: z.string().min(2, "Name is required").optional(),
    email: z.string().email("Invalid email").optional(),
    phone: z.string().optional(),
    avatar: z.string().optional(), // base64
    password: z.string().optional(),
    cashPayment: z.boolean().optional(),
    usdtPayment: z.boolean().optional(),
    usdtLink: z.string().optional(),
    usdtAddress: z.string().optional(),
  });

  fastify.put(
    "/api/seller/profile",
    { preHandler: [requireSellerAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerPayload = (request as any).seller;
        const sellerId = sellerPayload.userId;

        const data = updateProfileSchema.parse(request.body);

        // Extract base64 image and upload if avatar is present and is a base64 string
        let avatarUrl = data.avatar;
        if (avatarUrl && avatarUrl.startsWith("data:image")) {
          const { uploadImage } = await import("../lib/cloudinary.js");
          avatarUrl = await uploadImage(avatarUrl, "seller-avatars");
        }

        let passwordHash;
        if (data.password) {
          passwordHash = await hashPassword(data.password);
        }

        const updatedProfile = await prisma.seller.update({
          where: { id: sellerId },
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            ...(avatarUrl && { avatar: avatarUrl }),
            ...(passwordHash && { password: passwordHash }),
            cashPayment: data.cashPayment,
            usdtPayment: data.usdtPayment,
            usdtLink: data.usdtLink,
            usdtAddress: data.usdtAddress,
          },
          select: {
            name: true,
            email: true,
            phone: true,
            avatar: true,
            cashPayment: true,
            usdtPayment: true,
            usdtLink: true,
            usdtAddress: true,
          },
        });

        return reply.send({ success: true, profile: updatedProfile });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply
            .status(400)
            .send({ error: "Invalid input", details: error.errors });
        }
        console.error("Update profile error:", error);
        return reply.status(500).send({ error: "Internal server error" });
      }
    },
  );
}
