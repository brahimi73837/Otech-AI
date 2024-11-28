"use client";
import { useChat, Message } from "ai/react";
import { useState } from "react";

export default function ChatComponent() {
    const { input, handleInputChange, handleSubmit, isLoading, messages, setMessages } = useChat();
    const [csvFile, setCsvFile] = useState<File | null>(null); // Track the CSV file

    // Handle file upload
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (file && file.type === "text/csv") {
            setCsvFile(file);
        } else {
            alert("Please upload a valid CSV file.");
        }
    };

    // Manually handle form submission
    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault(); // Prevent the default form submission

        let csvData = null;
        if (csvFile) {
            // Convert the CSV file to a base64 string
            const reader = new FileReader();
            reader.readAsDataURL(csvFile);
            reader.onloadend = async () => {
                csvData = reader.result as string; // This will be a base64 string
                // After CSV data is ready, submit the form with input and CSV
                await submitMessage(input, csvData);
                // Clear the input after submission
                handleInputChange({ target: { value: "" } });
            };
        } else {
            // If no CSV file, just submit the input
            await submitMessage(input);
            // Clear the input after submission
            handleInputChange({ target: { value: "" } });
        }
    };

    // Function to submit input and CSV file (via custom API call or any custom logic)
    const submitMessage = async (input: string, csvFile: string | null = null) => {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: input }],
                    csvFile: csvFile || '', // Send CSV file if available
                }),
            });

            const data = await response.json();
            console.log("Response from assistant:", data);

            // Ensure prevMessages is an array before using it
            setMessages((prevMessages = []) => [
                ...prevMessages, 
                { role: 'user', content: input },  // Add the user message
                { role: 'assistant', content: data.response }  // Add the assistant response
            ]);
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    // Handle key down to allow manual form submission
    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // Prevent new line
            const form = event.currentTarget.closest('form');
            if (form) {
                form.requestSubmit(); // Manually trigger the submit event
            }
        }
    };

    return (
        <div>
            {/* Render the conversation history */}
            {messages?.map((message: Message) => (
                <div key={message.id} 
                    className={`p-2 rounded-md mb-2 ${message.role === "assistant" ? "bg-gray-700" : "bg-blue-600"}`}>
                    <h3 className="text-lg font-semibold mt-2">
                        {message.role === "assistant" ? "Gemini" : "User"}
                    </h3>
                    {message.content.split("\n").map((currentTextBlock, index) => (
                        currentTextBlock === "" ? <p key={message.id + index}>&nbsp;</p> : <p key={message.id + index}>{currentTextBlock}</p>
                    ))}
                </div>
            ))}

            {/* Form for input */}
            <form className="mt-12" onSubmit={handleFormSubmit}>
                <p>User Message</p>
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
