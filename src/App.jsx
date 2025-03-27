import { useState } from "react";

export default function App() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Welcome! Please upload a video for analysis.", streaming: true },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setMessages((prev) => [...prev, { sender: "user", text: file.name }]);
    setMessages((prev) => [...prev, { sender: "bot", text: "Uploading video...", streaming: true }]);
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
        setMessages((prev) => [...prev, { sender: "bot", text: "Processing video...", streaming: true }]);
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
      const lines = buffer.split("\n");
      buffer = lines.pop();
      
      for (const line of lines) {
        if (line.trim()) {
          setMessages((prev) => [...prev, { sender: "bot", text: line, streaming: true }]);
          setProgress((prev) => Math.min(prev + 10, 90));
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }
    if (buffer.trim()) {
      setMessages((prev) => [...prev, { sender: "bot", text: buffer, streaming: true }]);
    }
    setIsProcessing(false);
    setProgress(100);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4">ChatGPT Clone</div>
      
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 p-4">
        <div className="flex-1 overflow-y-auto p-4 bg-white shadow rounded-lg">
          {messages.map((msg, index) => (
            <div key={index} className={`mb-2 p-2 rounded-lg ${msg.sender === "bot" ? "bg-blue-100 text-blue-900" : "bg-green-100 text-green-900"}`}>
              <strong>{msg.sender === "bot" ? "Bot: " : "You: "}</strong>
              <span className={msg.streaming ? "animate-pulse" : ""}>{msg.text}</span>
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
    </div>
  );
}
