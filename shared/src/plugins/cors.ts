import fp from "fastify-plugin";
import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";

export default fp(async function corsPlugin(fastify: FastifyInstance) {
  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (server-to-server, health checks, etc.)
      if (!origin) {
        cb(null, true);
        return;
      }

      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://aventuramallstores.com",
        "https://admin.aventuramallstores.com",
        "https://www.ttshopstores.com",
        "https://ttshopstores.com",
        "https://tiktakshopstore.com",
        "https://www.tiktakshopstore.com",
        "https://www.ttshopstores.com",
        "https://ttshopstores.com",
        "https://galleriamallstore.com",
        "https://www.galleriamallstore.com",


        process.env.FRONTEND_URL,
      ].filter(Boolean);

      if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        cb(null, true);
      } else {
        cb(new Error("Not allowed by CORS"), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  });
});
