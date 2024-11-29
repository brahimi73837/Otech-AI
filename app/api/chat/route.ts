import { GoogleGenerativeAI } from '@google/generative-ai';
import Papa from 'papaparse';

export const runtime = 'edge';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'default_api_key');

// Utility to parse CSV file from the request
const parseCSV = (fileBuffer: Buffer) => {
    return new Promise<any[]>((resolve, reject) => {
        Papa.parse(fileBuffer.toString(), {
            complete: (result) => resolve(result.data),
            error: (error: Error) => reject(error),
            header: true,
        });
    });
};

// Define the Message interface
interface Message {
    role: 'user' | 'assistant'; // Adjust roles as necessary
    content: string;
}

export async function POST(request: Request) {
    const { messages, csvFile } = await request.json(); // Extract messages and csvFile

    let csvData = '';
    if (csvFile) {
        try {
            const csvBuffer = Buffer.from(csvFile.split(',')[1], 'base64'); // Decode base64
            const parsedData = await parseCSV(csvBuffer);
            csvData = JSON.stringify(parsedData); // Convert CSV to JSON
        } catch (error) {
            return new Response("Error parsing CSV", { status: 400 });
        }
    }

    // Format the messages for the Gemini prompt
    const prompt = (messages: Message[]) => messages.map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join("\n");

    // If CSV data exists, include it in the prompt; otherwise, avoid asking for it
    let finalPrompt = `${prompt(messages)}\n\n`;
    if (csvData) {
        finalPrompt += `Here is the data from the CSV file:\n${csvData}\n`;
    } else {
        finalPrompt += `Please continue the conversation. No CSV data was provided.\n`;
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(finalPrompt);

        // Extract response text from the API result
        const responseText = result?.response?.candidates?.[0]?.content?.parts[0]?.text || "No response generated.";

        // Return the response as a regular JSON object
        return new Response(JSON.stringify({ response: responseText }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response("Error generating response", { status: 500 });
    }
}
