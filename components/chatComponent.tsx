"use client";
import { useChat, Message } from "ai/react";
import { useState } from "react";

export default function ChatComponent() {
    const { input, setInput, handleInputChange, messages = [], setMessages } = useChat(); // Default to empty array
    const [csvFile, setCsvFile] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (file && file.type === "text/csv") {
            const reader = new FileReader();
            reader.onloadend = () => setCsvFile(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            alert("Please upload a valid CSV file.");
        }
    };

    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const userMessage = { role: 'user', content: input };
        setMessages((prevMessages = []) => [...prevMessages, userMessage]); // Add safe default
        setIsLoading(true);

        try {
            await submitMessage(input, csvFile);
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsLoading(false);
            setInput("");
        }
    };

    const submitMessage = async (input: string, csvFile: string | null = null) => {
        const currentMessages = [...messages, { role: 'user', content: input }];

        await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: currentMessages,
                csvFile: csvFile || '',
            }),
        }).then(response => response.json())
          .then(data => {
              setMessages((prevMessages = []) => [
                  ...prevMessages,
                  { role: 'assistant', content: data.response }
              ]); // Add safe default
          });
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            const form = event.currentTarget.closest('form');
            if (form) form.requestSubmit();
        }
    };

    return (
        <div>
            {/* Render the conversation history */}
            {messages.map((message: Message, index) => (
                <div key={`${message.id || index}`} 
                    className={`p-2 rounded-md mb-2 ${message.role === "assistant" ? "bg-gray-700" : "bg-blue-600"}`}>
                    <h3 className="text-lg font-semibold mt-2">
                        {message.role === "assistant" ? "Gemini" : "User"}
                    </h3>
                    {message.content.split("\n").map((line, i) => (
                        line === "" ? <p key={`${index}-${i}`}>&nbsp;</p> : <p key={`${index}-${i}`}>{line}</p>
                    ))}
                </div>
            ))}

            {/* Loading indicator */}
            {isLoading && <div className="text-center text-gray-500">Loading...</div>}

            <form className="mt-12" onSubmit={handleFormSubmit}>
                <textarea
                    className="mt-2 w-full bg-slate-600 p-2"
                    placeholder="Enter your prompt here"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                />
                <div className="mt-4">
                    <label className="block text-sm text-gray-500">Upload CSV file (optional)</label>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="mt-2 p-2 w-full bg-slate-600"
                    />
                </div>
                <button className="rounded-md bg-blue-600 p-2 mt-2">Send message</button>
            </form>
        </div>
    );
}
