import { useState } from "react";

export default function App() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Welcome! Please upload a video for analysis." },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setMessages((prev) => [...prev, { sender: "user", text: file.name }]);
    setMessages((prev) => [...prev, { sender: "bot", text: "Uploading video..." }]);
    setIsProcessing(true);
    setProgress(10);
    
    const formData = new FormData();
    formData.append("video", file);
    
    try {
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        setMessages((prev) => [...prev, { sender: "bot", text: "Processing video..." }]);
        setProgress(30);
        streamResults(response);
      } else {
        setMessages((prev) => [...prev, { sender: "bot", text: "Failed to upload video." }]);
        setIsProcessing(false);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { sender: "bot", text: "Error connecting to server." }]);
      setIsProcessing(false);
    }
  };

  const streamResults = async (response) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    setProgress(50);
  
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
  
      // Split data into lines and display progressively
      const lines = buffer.split("\n");
      buffer = lines.pop(); // Keep the last incomplete line for next iteration
  
      for (const line of lines) {
        if (line.trim()) {
          setMessages((prev) => [...prev, { sender: "bot", text: line }]);
          setProgress((prev) => Math.min(prev + 10, 90)); // Increase progress gradually
          await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate streaming effect
        }
      }
    }
  
    if (buffer.trim()) {
      setMessages((prev) => [...prev, { sender: "bot", text: buffer }]);
    }
    
    setIsProcessing(false);
    setProgress(100);
  };
  

  return (
    <div className="p-4 max-w-lg mx-auto border rounded shadow-md">
      <h2 className="text-xl font-bold mb-2">Chatbot</h2>
      <div className="border p-2 h-60 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className={msg.sender === "bot" ? "text-blue-600" : "text-green-600"}>
            <strong>{msg.sender === "bot" ? "Bot: " : "You: "}</strong>{msg.text}
          </div>
        ))}
      </div>
      {isProcessing && (
        <div className="w-full bg-gray-200 h-2 rounded mt-2">
          <div className="bg-blue-500 h-2 rounded transition-all" style={{ width: `${progress}%` }}></div>
        </div>
      )}
      <input type="file" accept="video/*" className="mt-2" onChange={handleUpload} />
    </div>
  );
}