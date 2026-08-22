import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "../db/client.js";
import { requireSellerAuth } from "../middleware/auth.js";
import { evaluateSellerPackagePurchase } from "./sellerPackagePurchase.js";

const packageParamsSchema = z.object({ packageId: z.string().min(1) });

function serializeSellerPackage<
  T extends { price: unknown; profitPercent: unknown },
>(sellerPackage: T) {
  return {
    ...sellerPackage,
    price: Number(sellerPackage.price),
    profitPercent: Number(sellerPackage.profitPercent),
  };
}

function serializePurchase<
  T extends {
    pricePaid: unknown;
    profitPercent: unknown;
    sellerPackage?: { price: unknown; profitPercent: unknown };
  },
>(purchase: T) {
  return {
    ...purchase,
    pricePaid: Number(purchase.pricePaid),
    profitPercent: Number(purchase.profitPercent),
    ...(purchase.sellerPackage
      ? { sellerPackage: serializeSellerPackage(purchase.sellerPackage) }
      : {}),
  };
}

export default async function sellerPackagesRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/api/seller/packages",
    { preHandler: [requireSellerAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerId = (request as any).seller.userId as string;
        const [packages, seller] = await Promise.all([
          prisma.sellerPackage.findMany({ orderBy: { sortOrder: "asc" } }),
          prisma.seller.findUnique({
            where: { id: sellerId },
            select: { walletMoney: true, sellerPackage: true },
          }),
        ]);

        if (!seller) return reply.status(404).send({ error: "Seller not found" });

        return reply.send({
          data: {
            packages: packages.map(serializeSellerPackage),
            currentPackage: seller.sellerPackage
              ? serializeSellerPackage(seller.sellerPackage)
              : null,
            walletBalance: Number(seller.walletMoney),
          },
        });
      } catch (error) {
        request.log.error(error, "Fetch seller packages failed");
        return reply.status(500).send({ error: "Failed to fetch seller packages" });
      }
    },
  );

  fastify.get(
    "/api/seller/packages/purchases",
    { preHandler: [requireSellerAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerId = (request as any).seller.userId as string;
        const purchases = await prisma.sellerPackagePurchase.findMany({
          where: { sellerId },
          include: { sellerPackage: true },
          orderBy: { purchasedAt: "desc" },
        });

        return reply.send({ data: purchases.map(serializePurchase) });
      } catch (error) {
        request.log.error(error, "Fetch seller package purchases failed");
        return reply.status(500).send({ error: "Failed to fetch package purchases" });
      }
    },
  );

  fastify.post(
    "/api/seller/packages/:packageId/purchase",
    { preHandler: [requireSellerAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerId = (request as any).seller.userId as string;
        const { packageId } = packageParamsSchema.parse(request.params);

        const result = await prisma.$transaction(async (tx) => {
          const [selectedPackage, seller] = await Promise.all([
            tx.sellerPackage.findUnique({ where: { id: packageId } }),
            tx.seller.findUnique({
              where: { id: sellerId },
              select: { walletMoney: true, sellerPackageId: true, sellerPackage: true },
            }),
          ]);

          if (!selectedPackage) return { ok: false as const, code: "PACKAGE_NOT_FOUND" as const };
          if (!seller) return { ok: false as const, code: "SELLER_NOT_FOUND" as const };

          const decision = evaluateSellerPackagePurchase({
            walletBalance: String(seller.walletMoney),
            packagePrice: String(selectedPackage.price),
            currentRank: seller.sellerPackage?.sortOrder ?? 0,
            selectedRank: selectedPackage.sortOrder,
          });
          if (!decision.ok) return decision;

          const update = await tx.seller.updateMany({
            where: {
              id: sellerId,
              sellerPackageId: seller.sellerPackageId,
              walletMoney: { gte: selectedPackage.price },
            },
            data: {
              walletMoney: { decrement: selectedPackage.price },
              sellerPackageId: selectedPackage.id,
            },
          });

          if (update.count !== 1) return { ok: false as const, code: "CONFLICT" as const };

          const purchase = await tx.sellerPackagePurchase.create({
            data: {
              sellerId,
              sellerPackageId: selectedPackage.id,
              packageName: selectedPackage.name,
              pricePaid: selectedPackage.price,
              productLimit: selectedPackage.productLimit,
              profitPercent: selectedPackage.profitPercent,
              paymentType: "WALLET",
            },
            include: { sellerPackage: true },
          });

          return { ok: true as const, purchase, walletBalance: decision.remainingBalance };
        });

        if (!result.ok) {
          if (result.code === "PACKAGE_NOT_FOUND") return reply.status(404).send({ error: "Seller package not found" });
          if (result.code === "SELLER_NOT_FOUND") return reply.status(404).send({ error: "Seller not found" });
          if (result.code === "INSUFFICIENT_FUNDS") return reply.status(400).send({ error: "Your wallet balance is not enough for this package" });
          if (result.code === "ALREADY_CURRENT") return reply.status(409).send({ error: "This is already your current package" });
          if (result.code === "LOWER_TIER") return reply.status(409).send({ error: "You cannot downgrade to a lower package" });
          if (result.code === "FREE_TIER") return reply.status(409).send({ error: "The Silver package is assigned for free" });
          return reply.status(409).send({ error: "Your package or wallet changed. Please refresh and try again." });
        }

        return reply.status(201).send({
          data: {
            purchase: serializePurchase(result.purchase),
            currentPackage: serializeSellerPackage(result.purchase.sellerPackage),
            walletBalance: result.walletBalance,
          },
        });
      } catch (error) {
        if (error instanceof z.ZodError) return reply.status(400).send({ error: "Invalid package" });
        request.log.error(error, "Purchase seller package failed");
        return reply.status(500).send({ error: "Failed to purchase seller package" });
      }
    },
  );
}
