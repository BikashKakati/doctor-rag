import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const SAMPLE_FILE_PATH = "./data/client-management-doc.pdf";
const VECTOR_STORE_PATH = "./vector-store/";
const HF_API_TOKEN = process.env.HF_TOKEN;
const GOOGLE_API_TOKEN = process.env.GOOGLE_TOKEN;
const EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2";
const LLM_MODEL_NAME = "gemini-1.5-flash";
const SYSTEM_TEMPLATE = `Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say that you don't know, don't try to make up an answer.
----------------
{context}`;

// Load pdf data
async function getLoadedPdfData(filePath) {
  if (!filePath) {
    return false;
  }
  const pdfLoader = new PDFLoader(filePath);
  return await pdfLoader.load();
}

// Split pdf data into chunks
async function getSplittedData({ data, chunkSize = 500, chunkOverlap = 50 }) {
  if (!data) {
    return false;
  }

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });
  return await textSplitter.splitDocuments(data);
}

function createPrompt(systemTemplate) {
  return ChatPromptTemplate.fromMessages([
    ["system", systemTemplate],
    ["human", "{question}"],
  ]);
}

function getEmbeddingModel() {
  return new HuggingFaceInferenceEmbeddings({
    model: EMBEDDING_MODEL_NAME,
    apiKey: HF_API_TOKEN,
  });
}

function getLLMModel() {
  return new ChatGoogleGenerativeAI({
    model: LLM_MODEL_NAME,
    apiKey: GOOGLE_API_TOKEN,
    maxOutputTokens: 412,
    temperature: 0.1,
    maxRetries: 2,
  });
}

function getCoversationChain({vectorStore, prompt, llmModel, outputParser}){
    const vectorStoreRetriever = vectorStore.asRetriever();
    const inputFromInvoke = new RunnablePassthrough()
    function formatDataAsString(documents) {
        return documents.map((document) => document.pageContent).join("\n\n");
    }

    return RunnableSequence.from([
        {
          context: vectorStoreRetriever.pipe(formatDataAsString),
          question: inputFromInvoke,
        },
        prompt,
        llmModel,
        outputParser,
      ]);
}



// (async function storeEmbeddingDataToVectoreStore() {
//     const pdfData = await getLoadedPdfData(SAMPLE_FILE_PATH);
//     console.log(pdfData.length);

//     const splittedPdfData = await getSplittedData({data:pdfData, chunkSize:500, chunkOverlap:50});
//     console.log(splittedPdfData.length);

//     const embeddingModel = getEmbeddingModel();

//     const vectorStore = await FaissStore.fromDocuments(splittedPdfData, embeddingModel);
//     await vectorStore.save(VECTOR_STORE_PATH);
// })();

export async function vectorSearch(question) {
  try {
    const embeddingModel = getEmbeddingModel();
    const llmModel = getLLMModel();
    const vectorStore = await FaissStore.load(
      VECTOR_STORE_PATH,
      embeddingModel
    );
    // const results = await vectorStore.similaritySearch("approval subtypes", 1);
    const prompt = createPrompt(SYSTEM_TEMPLATE);
    const outputParser = new StringOutputParser();
    const conversationChain = getCoversationChain({vectorStore, llmModel, prompt, outputParser })

    const answer = await conversationChain.invoke(question);
    return answer
  } catch (error) {
    console.log("Error:", error.message);
  }
}
