import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "../db/client.js";
import { requireSellerAuth } from "../middleware/auth.js";
import {
  calculateSpreadPackageExpiry,
  evaluateSpreadPackagePurchase,
} from "./sellerSpreadPackagePurchase.js";

const packageParamsSchema = z.object({
  packageId: z.string().min(1),
});

async function expirePastDuePurchases(sellerId: string, now: Date) {
  await prisma.sellerSpreadPackagePurchase.updateMany({
    where: {
      sellerId,
      status: "ACTIVE",
      expiresAt: { lte: now },
    },
    data: { status: "EXPIRED" },
  });
}

function serializePackage<T extends { price: unknown }>(spreadPackage: T) {
  return { ...spreadPackage, price: Number(spreadPackage.price) };
}

function serializePurchase<
  T extends { pricePaid: unknown; spreadPackage?: { price: unknown } },
>(purchase: T) {
  return {
    ...purchase,
    pricePaid: Number(purchase.pricePaid),
    ...(purchase.spreadPackage
      ? { spreadPackage: serializePackage(purchase.spreadPackage) }
      : {}),
  };
}

export default async function sellerSpreadPackagesRoutes(
  fastify: FastifyInstance,
) {
  fastify.get(
    "/api/seller/spread-packages",
    { preHandler: [requireSellerAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerId = (request as any).seller.userId as string;
        const now = new Date();
        await expirePastDuePurchases(sellerId, now);

        const [packages, seller, currentPurchase] = await Promise.all([
          prisma.spreadPackage.findMany({
            where: { isEnabled: true },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          }),
          prisma.seller.findUnique({
            where: { id: sellerId },
            select: { walletMoney: true },
          }),
          prisma.sellerSpreadPackagePurchase.findFirst({
            where: { sellerId, status: "ACTIVE", expiresAt: { gt: now } },
            include: { spreadPackage: true },
          }),
        ]);

        if (!seller) {
          return reply.status(404).send({ error: "Seller not found" });
        }

        return reply.send({
          data: {
            packages: packages.map(serializePackage),
            currentPurchase: currentPurchase
              ? serializePurchase(currentPurchase)
              : null,
            walletBalance: Number(seller.walletMoney),
          },
        });
      } catch (error) {
        request.log.error(error, "Fetch seller spread packages failed");
        return reply
          .status(500)
          .send({ error: "Failed to fetch spread packages" });
      }
    },
  );

  fastify.get(
    "/api/seller/spread-packages/purchases",
    { preHandler: [requireSellerAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerId = (request as any).seller.userId as string;
        await expirePastDuePurchases(sellerId, new Date());

        const purchases = await prisma.sellerSpreadPackagePurchase.findMany({
          where: { sellerId },
          include: { spreadPackage: true },
          orderBy: { purchasedAt: "desc" },
        });

        return reply.send({ data: purchases.map(serializePurchase) });
      } catch (error) {
        request.log.error(error, "Fetch spread package purchases failed");
        return reply
          .status(500)
          .send({ error: "Failed to fetch spread package purchases" });
      }
    },
  );

  fastify.post(
    "/api/seller/spread-packages/:packageId/purchase",
    { preHandler: [requireSellerAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const sellerId = (request as any).seller.userId as string;
        const { packageId } = packageParamsSchema.parse(request.params);
        const now = new Date();

        const result = await prisma.$transaction(async (tx) => {
          await tx.sellerSpreadPackagePurchase.updateMany({
            where: {
              sellerId,
              status: "ACTIVE",
              expiresAt: { lte: now },
            },
            data: { status: "EXPIRED" },
          });

          const [spreadPackage, seller, currentPurchase] = await Promise.all([
            tx.spreadPackage.findUnique({ where: { id: packageId } }),
            tx.seller.findUnique({
              where: { id: sellerId },
              select: { walletMoney: true },
            }),
            tx.sellerSpreadPackagePurchase.findFirst({
              where: { sellerId, status: "ACTIVE", expiresAt: { gt: now } },
              select: { id: true, spreadPackageId: true },
            }),
          ]);

          if (!spreadPackage || !spreadPackage.isEnabled) {
            return { ok: false as const, code: "PACKAGE_NOT_FOUND" as const };
          }
          if (!seller) {
            return { ok: false as const, code: "SELLER_NOT_FOUND" as const };
          }

          const decision = evaluateSpreadPackagePurchase({
            walletBalance: String(seller.walletMoney),
            packagePrice: String(spreadPackage.price),
            selectedPackageId: spreadPackage.id,
            currentPackageId: currentPurchase?.spreadPackageId ?? null,
          });

          if (!decision.ok) return decision;

          const walletUpdate = await tx.seller.updateMany({
            where: {
              id: sellerId,
              walletMoney: { gte: spreadPackage.price },
            },
            data: { walletMoney: { decrement: spreadPackage.price } },
          });

          if (walletUpdate.count !== 1) {
            return { ok: false as const, code: "INSUFFICIENT_FUNDS" as const };
          }

          await tx.sellerSpreadPackagePurchase.updateMany({
            where: { sellerId, status: "ACTIVE" },
            data: { status: "REPLACED", replacedAt: now },
          });

          const purchase = await tx.sellerSpreadPackagePurchase.create({
            data: {
              sellerId,
              spreadPackageId: spreadPackage.id,
              packageName: spreadPackage.name,
              pricePaid: spreadPackage.price,
              durationDays: spreadPackage.durationDays,
              promotionLimit: spreadPackage.promotionLimit,
              purchasedAt: now,
              expiresAt: calculateSpreadPackageExpiry(
                now,
                spreadPackage.durationDays,
              ),
              status: "ACTIVE",
            },
            include: { spreadPackage: true },
          });

          return {
            ok: true as const,
            purchase,
            walletBalance: decision.remainingBalance,
          };
        });

        if (!result.ok) {
          if (result.code === "PACKAGE_NOT_FOUND") {
            return reply.status(404).send({ error: "Spread package not found" });
          }
          if (result.code === "SELLER_NOT_FOUND") {
            return reply.status(404).send({ error: "Seller not found" });
          }
          if (result.code === "ALREADY_CURRENT") {
            return reply
              .status(409)
              .send({ error: "This is already your current spread package" });
          }
          return reply.status(400).send({
            error: "Your wallet balance is not enough for this package",
          });
        }

        return reply.status(201).send({
          data: {
            purchase: serializePurchase(result.purchase),
            walletBalance: result.walletBalance,
          },
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({ error: "Invalid package" });
        }

        const code = (error as { code?: string }).code;
        if (code === "P2002" || code === "P2034") {
          return reply.status(409).send({
            error: "Your package changed during purchase. Please try again.",
          });
        }

        request.log.error(error, "Purchase spread package failed");
        return reply
          .status(500)
          .send({ error: "Failed to purchase spread package" });
      }
    },
  );
}
