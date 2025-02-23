import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
const sampleFilePath = "./data/SampleFile.pdf";





// Load pdf data
async function getLoadedPdfData(filePath){
    if(!filePath){
        return false;
    }
    const pdfLoader = new PDFLoader(filePath);
    const pdfData = await pdfLoader.load();
    return pdfData;
}



// Split pdf data into chunks
async function getSplittedData ({data, chunkSize=500, chunkOverlap=50}){

    if(!data){
        return false;
    }

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap
    })
    const splittedData = await textSplitter.splitDocuments(data);
    return splittedData;
}

// Create embeddings from the chunks data

async function getEmbeddedData(){

    const dataEmbeddar = new HuggingFaceInferenceEmbeddings({
        model:"sentence-transformers/all-MiniLM-L6-v2"
    })

}


(async function main() {
    const pdfData = await getLoadedPdfData(sampleFilePath);
    console.log(pdfData.length);

    const splittedPdfData = await getSplittedData({data:pdfData});
    console.log(splittedPdfData);
})();