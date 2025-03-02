import Fastify from "fastify";
import cors from "@fastify/cors";
import { vectorSearch } from "./controllers/conversation.js";

const fastify = Fastify({ logger: true });
const SERVER_PORT = process.env.SERVER_PORT || 8080;

fastify.register(cors,{
  origin: "http://localhost:5173"
})

fastify.setErrorHandler((error, request, reply) => {
  return{
    success: false,
    error
  }
})

fastify.get("/health", async function () {
  return {
    message: "I am running fine!",
  };
});

const questionSchema = {
  schema: {
    body: {
      type: "object",
      required: ["question"],
      properties: {
        question: { type: "string", minLength: 5 },
      },
    },
  },
};

fastify.post("/question", questionSchema, async function (req, res) {
  const { question } = req.body;
  const answer = await vectorSearch(question);
  return { success: true, message:"Your answer fetched successfully", data: answer};
});

fastify.listen({ port: SERVER_PORT }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  fastify.log.info(` SERVER STARTED AT PORT: ${address}`);
});
