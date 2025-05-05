import { useState, useEffect, useRef } from "react";
import { UploadCloud, Menu } from "lucide-react";
import logo from './assets/logo.png';

export default function App() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Welcome! Please upload a video for analysis.", streaming: true },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setMessages((prev) => [...prev, { sender: "user", text: file.name }]);
    setMessages((prev) => [...prev, { sender: "bot", text: "Uploading video...", streaming: true }]);
    setIsProcessing(true);
    setProgress(0);
    
    const formData = new FormData();
    formData.append("video", file);
    
    try {
      const response = await fetch("https://yogasakha.onrender.com/upload", {
        method: "POST",
        body: formData,
         mode: "no-cors"
      });
      
      if (response.ok) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        const { value } = await reader.read();
        const duration = parseInt(decoder.decode(value).trim(), 10);
        if (!isNaN(duration)) {
          smoothProgress(duration);
          streamResults(reader, decoder);
        } else {
          setMessages((prev) => [...prev, { sender: "bot", text: "Invalid response from server." }]);
          setIsProcessing(false);
        }
      } else {
        setMessages((prev) => [...prev, { sender: "bot", text: "Failed to upload video." }]);
        setIsProcessing(false);
      }
    } catch (error) {
      setMessages((prev) => [...prev, { sender: "bot", text: "Error connecting to server." }]);
      setIsProcessing(false);
    }
  };

  const smoothProgress = (duration) => {
    const interval = 100;
    const increment = 100 / (duration * (1000 / interval));
    let progressValue = 0;
  
    const progressInterval = setInterval(() => {
      progressValue += increment;
      if (progressValue >= 100) {
        clearInterval(progressInterval);
        setProgress(100);
      } else {
        setProgress(progressValue);
      }
    }, interval);
  };

  const streamResults = async (reader, decoder) => {
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
        } else {
          setMessages((prev) => [...prev, "#"]);
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    if (buffer.trim()) {
      setMessages((prev) => [...prev, { sender: "bot", text: buffer, streaming: true }]);
    }
    setIsProcessing(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="fixed top-0 left-0 w-full bg-green-200 p-4 flex items-center justify-between md:hidden">
        <img src={logo} alt="Logo" width={80}/>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white">
          <Menu className="w-6 h-6" />
        </button>
      </div>
      
      <div className={`fixed inset-y-0 left-0 w-64 bg-green-200 text-white p-4 transition-transform transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:relative md:flex`} style={{ zIndex: 50 }}>
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute top-4 right-4 text-white">✖</button>
        <div className="h-full">
        <img src={logo} alt="Logo" className="hidden md:block"   />
        </div>
        
      </div>
      
      <div className="flex flex-col flex-1 p-4 mt-30 md:mt-0">
        <div className="flex-1 overflow-y-auto p-4  bg-white shadow rounded-lg" style={{ paddingBottom: '6rem' }}>
          {messages.map((msg, index) => (
            msg.sender ? (
              <div key={index} className={`mb-2 p-2 rounded-lg ${msg.sender === "bot" ? "bg-blue-100 text-blue-900" : "bg-green-100 text-green-900"}`}>
                <strong>{msg.sender === "bot" ? "Bot: " : "You: "}</strong>
                <span className={msg.streaming ? "animate-pulse" : ""}>{msg.text}</span>
              </div>
            ) : (
              <div key={index} className="mb-8 border-b border-gray-300" />
            )
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {isProcessing && (
          <div className="w-full bg-gray-200 h-2 rounded mt-2">
            <div className="bg-blue-500 h-2 rounded transition-all" style={{ width: `${progress}%` }}></div>
          </div>
        )}
        
        {!isProcessing && (
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-400 rounded-lg cursor-pointer mt-4 bg-white hover:bg-gray-50">
            <UploadCloud className="w-6 h-6 text-gray-600" />
            <span className="text-gray-600">Click or Drag to Upload Video</span>
            <input type="file" accept="video/*" className="hidden" onChange={handleUpload} />
          </label>
        )}
      </div>
    </div>
  );
}
