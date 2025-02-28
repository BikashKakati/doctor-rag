import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

const SAMPLE_FILE_PATH = "./data/example.pdf";
const VECTOR_STORE_PATH = "./vector-store/";
const MODEL_API_TOKEN = process.env.HF_TOKEN;




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
        chunkOverlap
    })
    return await textSplitter.splitDocuments(data);
}



function getEmbeddingModel() {
    return new HuggingFaceInferenceEmbeddings({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        apiKey: MODEL_API_TOKEN
    })

}


(async function main() {
    // const pdfData = await getLoadedPdfData(SAMPLE_FILE_PATH);
    // console.log(pdfData.length);

    // const splittedPdfData = await getSplittedData({data:pdfData, chunkSize:500, chunkOverlap:50});
    // console.log(splittedPdfData.length);

    const embeddingModel = getEmbeddingModel();

    // const vectorStore = await FaissStore.fromDocuments(splittedPdfData, embeddingModel);
    // await vectorStore.save(VECTOR_STORE_PATH);

    const vectorStore = await FaissStore.load(VECTOR_STORE_PATH, embeddingModel);
    const results = await vectorStore.similaritySearch("html", 2);
    console.log(results);
})();