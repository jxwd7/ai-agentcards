import React, { useState, useEffect, useRef, useCallback } from "react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Voice Wizard Container (Demo Version - Ready for LiveKit Integration)
const VoiceWizardContainer = () => {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [conversationState, setConversationState] = useState("not_started");
  const [transcript, setTranscript] = useState([]);
  const [generatedTeam, setGeneratedTeam] = useState(null);
  const [isDemo, setIsDemo] = useState(true);

  // Demo: Simulate voice activation
  const startVoiceDemo = () => {
    setIsVoiceActive(true);
    setConversationState("greeting");
    
    // Demo: Add initial greeting
    setTimeout(() => {
      addToTranscript("assistant", "Hello! I'm your AI voice assistant. I can hear you clearly. What kind of project or business goal would you like help with today?");
      setConversationState("listening");
    }, 1000);
  };

  const addToTranscript = (role, message) => {
    const newEntry = {
      id: Date.now(),
      role,
      message,
      timestamp: new Date()
    };
    setTranscript(prev => [...prev, newEntry]);
  };

  // Demo: Simulate voice input (in production, this connects to LiveKit)
  const simulateVoiceInput = (message) => {
    addToTranscript("user", message);
    setConversationState("processing");
    
    // Simulate AI processing and response
    setTimeout(() => {
      const response = getAIResponse(message);
      addToTranscript("assistant", response);
      setConversationState("listening");
      
      // Check if we should generate team
      if (shouldGenerateTeam()) {
        generateDemoTeam();
      }
    }, 1500);
  };

  const getAIResponse = (userMessage) => {
    const lower = userMessage.toLowerCase();
    
    if (lower.includes("marketing") || lower.includes("sales")) {
      return "That sounds like a great marketing project! Can you tell me more about your target audience and what specific results you're hoping to achieve?";
    } else if (lower.includes("website") || lower.includes("online")) {
      return "Interesting! Are you looking to improve your website's performance, increase traffic, or enhance the user experience?";
    } else if (lower.includes("business") || lower.includes("company")) {
      return "Perfect! What industry is your business in, and what's the main challenge you'd like to address?";
    } else {
      return "I understand! Let me create the perfect AI team for your needs. I'm generating specialists who can help you achieve those goals.";
    }
  };

  const shouldGenerateTeam = () => {
    return transcript.filter(t => t.role === "user").length >= 2;
  };

  const generateDemoTeam = () => {
    setConversationState("generating");
    
    setTimeout(() => {
      const demoTeam = {
        agents: [
          { id: "1", role: "Digital Marketing Strategist", goal: "Develop comprehensive marketing strategies that drive engagement and conversions" },
          { id: "2", role: "Conversion Optimization Expert", goal: "Analyze and optimize conversion funnels to maximize ROI" },
          { id: "3", role: "Customer Analytics Specialist", goal: "Provide data-driven insights on customer behavior and preferences" }
        ],
        tasks: [
          { title: "Market Analysis", description: "Research target market and competitors" },
          { title: "Strategy Development", description: "Create comprehensive marketing strategy" },
          { title: "Optimization Implementation", description: "Execute and optimize campaigns" }
        ],
        recommended_tools: ["serper_search", "google_sheets", "website_search"],
        workflow_type: "sequential"
      };
      
      setGeneratedTeam(demoTeam);
      setConversationState("reviewing");
      
      addToTranscript("assistant", "Perfect! I've created your AI team. You now have a Digital Marketing Strategist, Conversion Optimization Expert, and Customer Analytics Specialist working together. They'll use Google Search, data analysis tools, and website research capabilities. Would you like me to generate your CrewAI configuration file?");
    }, 3000);
  };

  if (!isVoiceActive) {
    return (
      <VoiceWizardLanding
        onStartVoice={startVoiceDemo}
        isDemo={isDemo}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
      <VoiceInterface
        conversationState={conversationState}
        setConversationState={setConversationState}
        transcript={transcript}
        setTranscript={setTranscript}
        generatedTeam={generatedTeam}
        setGeneratedTeam={setGeneratedTeam}
        onSimulateVoice={simulateVoiceInput}
        isDemo={isDemo}
      />
    </div>
  );
};

// Voice Wizard Landing Page
const VoiceWizardLanding = ({ onStartVoice, isDemo }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          
          {/* Header */}
          <div className="mb-12">
            <div className="text-6xl mb-6">🎤</div>
            <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Voice Conversational AI Assistant
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
              Just talk naturally - I'll understand your needs and create a complete AI agent team for you
            </p>
            
            {isDemo && (
              <div className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium mb-6">
                🚀 Interactive Demo - LiveKit Integration Ready
              </div>
            )}
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Ultra Fast
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Complete in 1-2 minutes through natural conversation
              </p>
            </div>
            
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
              <div className="text-3xl mb-4">🗣️</div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Hands-Free
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                No typing required - pure voice interaction
              </p>
            </div>
            
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
              <div className="text-3xl mb-4">🧠</div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                AI Intelligence
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Understands context and asks smart follow-up questions
              </p>
            </div>
          </div>

          {/* Start Button */}
          <div className="space-y-6">
            <button
              onClick={onStartVoice}
              className="px-12 py-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-300 text-xl shadow-xl transform hover:scale-105"
            >
              <span className="flex items-center justify-center">
                <span className="mr-3">🎤</span>
                {isDemo ? "Experience Voice Demo" : "Start Voice Conversation"}
              </span>
            </button>
            
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isDemo 
                ? "Interactive demo showing voice conversation flow" 
                : "Make sure your microphone is enabled for the best experience"
              }
            </p>
          </div>

          {/* Technology Stack */}
          <div className="mt-12 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
              🏗️ Technology Stack
            </h4>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong>LiveKit</strong><br />
                <span className="text-slate-600 dark:text-slate-300">Real-time voice</span>
              </div>
              <div>
                <strong>OpenAI Whisper</strong><br />
                <span className="text-slate-600 dark:text-slate-300">Speech-to-text</span>
              </div>
              <div>
                <strong>GPT-4</strong><br />
                <span className="text-slate-600 dark:text-slate-300">Conversational AI</span>
              </div>
              <div>
                <strong>Neural TTS</strong><br />
                <span className="text-slate-600 dark:text-slate-300">Text-to-speech</span>
              </div>
            </div>
          </div>

          {/* Example Conversation */}
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl text-left max-w-2xl mx-auto">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 text-center">
              Example Conversation Flow:
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex">
                <span className="font-medium text-blue-600 mr-2 min-w-[40px]">You:</span>
                <span className="text-slate-600 dark:text-slate-300">
                  "I need to boost sales for my online electronics store"
                </span>
              </div>
              <div className="flex">
                <span className="font-medium text-purple-600 mr-2 min-w-[40px]">AI:</span>
                <span className="text-slate-600 dark:text-slate-300">
                  "Great! What's your main challenge - low traffic, poor conversion rates, or customer retention?"
                </span>
              </div>
              <div className="flex">
                <span className="font-medium text-blue-600 mr-2 min-w-[40px]">You:</span>
                <span className="text-slate-600 dark:text-slate-300">
                  "My conversion rate is only 2%, and I'm targeting tech enthusiasts"
                </span>
              </div>
              <div className="flex">
                <span className="font-medium text-purple-600 mr-2 min-w-[40px]">AI:</span>
                <span className="text-slate-600 dark:text-slate-300">
                  "Perfect! I'm creating your team: a Conversion Specialist, UX Analyst, and Tech Marketing Expert..."
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Voice Interface
const VoiceInterface = ({
  conversationState,
  setConversationState,
  transcript,
  setTranscript,
  generatedTeam,
  setGeneratedTeam,
  onSimulateVoice,
  isDemo
}) => {
  const [isListening, setIsListening] = useState(false);

  // Demo voice input options
  const demoInputs = [
    "I want to increase sales for my online business",
    "I need help with digital marketing for my startup",
    "My website conversion rate is too low, can you help?",
    "I want to launch a new product marketing campaign"
  ];

  useEffect(() => {
    if (conversationState === "listening") {
      setIsListening(true);
    } else {
      setIsListening(false);
    }
  }, [conversationState]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          🎤 Voice AI Assistant
        </h1>
        <VoiceStatusIndicator 
          state={conversationState}
          isListening={isListening}
        />
      </div>

      {/* Voice Visualizer */}
      <div className="mb-8 flex justify-center">
        <VoiceAnimation 
          isListening={isListening}
          isProcessing={conversationState === "processing" || conversationState === "generating"}
          isSpeaking={conversationState === "speaking"}
        />
      </div>

      {/* Demo Voice Input Buttons */}
      {isDemo && conversationState === "listening" && (
        <div className="mb-8">
          <h3 className="text-center text-slate-600 dark:text-slate-300 mb-4">
            Try these voice commands:
          </h3>
          <div className="grid md:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {demoInputs.map((input, index) => (
              <button
                key={index}
                onClick={() => onSimulateVoice(input)}
                className="p-3 text-left bg-white dark:bg-slate-800 rounded-lg border hover:border-purple-300 transition-colors text-sm"
              >
                🎤 "{input}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation Transcript */}
      <ConversationTranscript 
        transcript={transcript}
        conversationState={conversationState}
      />

      {/* Team Display */}
      {generatedTeam && (
        <GeneratedTeamDisplay team={generatedTeam} />
      )}

      {/* Voice Controls */}
      <VoiceControls 
        conversationState={conversationState}
        onEndConversation={() => window.location.reload()}
      />
    </div>
  );
};

// Voice Status Indicator
const VoiceStatusIndicator = ({ state, isListening }) => {
  const getStatusText = () => {
    switch (state) {
      case "greeting": return "AI assistant is ready to help";
      case "listening": return "🎤 Listening... Speak naturally";
      case "processing": return "🧠 Processing your request...";
      case "generating": return "✨ Generating your AI team...";
      case "speaking": return "🔊 AI assistant is responding";
      case "reviewing": return "🎉 Your team is ready for review";
      default: return "Ready to assist";
    }
  };

  const getStatusColor = () => {
    switch (state) {
      case "listening": return "text-green-600";
      case "processing": return "text-blue-600"; 
      case "generating": return "text-purple-600";
      case "speaking": return "text-purple-600";
      case "reviewing": return "text-emerald-600";
      default: return "text-slate-600";
    }
  };

  return (
    <div className={`text-lg font-medium ${getStatusColor()}`}>
      {getStatusText()}
    </div>
  );
};

// Voice Animation Component
const VoiceAnimation = ({ isListening, isProcessing, isSpeaking }) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className={`w-3 rounded-full transition-all duration-300 ${
            isListening 
              ? "bg-green-500 animate-pulse" 
              : isProcessing 
              ? "bg-purple-500 animate-bounce"
              : isSpeaking
              ? "bg-blue-500 animate-pulse"
              : "bg-slate-300"
          }`}
          style={{
            height: isListening || isSpeaking || isProcessing 
              ? `${30 + Math.random() * 50}px` 
              : "30px",
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );
};

// Conversation Transcript
const ConversationTranscript = ({ transcript, conversationState }) => {
  const transcriptRef = useRef(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
        Conversation
      </h3>
      <div 
        ref={transcriptRef}
        className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm max-h-96 overflow-y-auto"
      >
        {transcript.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-8">
            Conversation will appear here...
          </div>
        ) : (
          <div className="space-y-4">
            {transcript.map((entry) => (
              <ConversationMessage key={entry.id} entry={entry} />
            ))}
            {(conversationState === "processing" || conversationState === "generating") && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                <span className="text-sm">
                  {conversationState === "generating" ? "Creating your AI team..." : "AI is thinking..."}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Conversation Message
const ConversationMessage = ({ entry }) => {
  const isUser = entry.role === "user";
  
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
        isUser 
          ? "bg-purple-600 text-white" 
          : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
      }`}>
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-xs opacity-75">
            {isUser ? "You" : "AI Assistant"}
          </span>
          <span className="text-xs opacity-50">
            {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-sm">{entry.message}</p>
      </div>
    </div>
  );
};

// Generated Team Display
const GeneratedTeamDisplay = ({ team }) => {
  return (
    <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200 dark:border-green-800">
      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
        <span className="mr-2">✨</span>
        Your AI Team is Ready!
      </h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">Team Members:</h4>
          <div className="space-y-3">
            {team.agents?.map((agent, index) => (
              <div key={agent.id} className="flex items-start space-x-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
                <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div>
                  <h5 className="font-medium text-slate-800 dark:text-slate-100 text-sm">{agent.role}</h5>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{agent.goal}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">Configuration:</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Tasks:</span>
              <span className="font-medium">{team.tasks?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Tools:</span>
              <span className="font-medium">{team.recommended_tools?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Workflow:</span>
              <span className="font-medium capitalize">{team.workflow_type || "Sequential"}</span>
            </div>
          </div>
          
          <button className="mt-4 w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
            Download YAML Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

// Voice Controls
const VoiceControls = ({ conversationState, onEndConversation }) => {
  return (
    <div className="flex justify-center space-x-4">
      <button 
        onClick={onEndConversation}
        className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
      >
        End Conversation
      </button>
      
      {conversationState === "reviewing" && (
        <button 
          onClick={onEndConversation}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Team
        </button>
      )}
    </div>
  );
};

export default VoiceWizardContainer;

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Voice Wizard Container
const VoiceWizardContainer = () => {
  const [token, setToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [conversationState, setConversationState] = useState("not_started");
  const [transcript, setTranscript] = useState([]);
  const [generatedTeam, setGeneratedTeam] = useState(null);

  // Generate LiveKit token for voice session
  const generateToken = async () => {
    try {
      setIsConnecting(true);
      // In production, this should come from your backend
      // For demo purposes, we'll use a mock token structure
      const mockToken = await generateMockToken();
      setToken(mockToken);
      setConversationState("connecting");
    } catch (error) {
      console.error("Error generating token:", error);
      alert("Failed to connect to voice assistant. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  // Mock token generation (replace with real LiveKit token from backend)
  const generateMockToken = async () => {
    // In production, call your backend to generate a proper LiveKit token
    // This is just for UI demonstration
    return "mock-token-for-demo";
  };

  const handleDisconnect = () => {
    setToken("");
    setConversationState("not_started");
    setTranscript([]);
    setGeneratedTeam(null);
  };

  if (!token) {
    return (
      <VoiceWizardLanding
        onStartVoice={generateToken}
        isConnecting={isConnecting}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
      <LiveKitRoom
        video={false}
        audio={true}
        token={token}
        serverUrl={process.env.REACT_APP_LIVEKIT_URL || "wss://your-livekit-server.com"}
        data-lk-theme="default"
        style={{ height: "100vh" }}
        onDisconnected={handleDisconnect}
      >
        <VoiceInterface
          conversationState={conversationState}
          setConversationState={setConversationState}
          transcript={transcript}
          setTranscript={setTranscript}
          generatedTeam={generatedTeam}
          setGeneratedTeam={setGeneratedTeam}
        />
        <RoomAudioRenderer />
        <StartAudio label="Click to enable audio" />
      </LiveKitRoom>
    </div>
  );
};

// Voice Wizard Landing Page
const VoiceWizardLanding = ({ onStartVoice, isConnecting }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          
          {/* Header */}
          <div className="mb-12">
            <div className="text-6xl mb-6">🎤</div>
            <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Voice Conversational AI Assistant
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
              Just talk naturally - I'll understand your needs and create a complete AI agent team for you
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Ultra Fast
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Complete in 1-2 minutes through natural conversation
              </p>
            </div>
            
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
              <div className="text-3xl mb-4">🗣️</div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Hands-Free
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                No typing required - pure voice interaction
              </p>
            </div>
            
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
              <div className="text-3xl mb-4">🧠</div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
                AI Intelligence
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Understands context and asks smart follow-up questions
              </p>
            </div>
          </div>

          {/* Start Button */}
          <div className="space-y-6">
            <button
              onClick={onStartVoice}
              disabled={isConnecting}
              className="px-12 py-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-blue-700 transition-all duration-300 text-xl shadow-xl transform hover:scale-105"
            >
              {isConnecting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="mr-3">🎤</span>
                  Start Voice Conversation
                </span>
              )}
            </button>
            
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Make sure your microphone is enabled for the best experience
            </p>
          </div>

          {/* Example Conversation */}
          <div className="mt-12 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-left max-w-xl mx-auto">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 text-center">
              Example Conversation:
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex">
                <span className="font-medium text-blue-600 mr-2">You:</span>
                <span className="text-slate-600 dark:text-slate-300">
                  "I want to boost sales for my online electronics store"
                </span>
              </div>
              <div className="flex">
                <span className="font-medium text-purple-600 mr-2">AI:</span>
                <span className="text-slate-600 dark:text-slate-300">
                  "Great! Tell me more about your target customers and what's your main challenge with sales?"
                </span>
              </div>
              <div className="flex">
                <span className="font-medium text-blue-600 mr-2">You:</span>
                <span className="text-slate-600 dark:text-slate-300">
                  "I sell to tech enthusiasts but my conversion rate is low"
                </span>
              </div>
              <div className="flex">
                <span className="font-medium text-purple-600 mr-2">AI:</span>
                <span className="text-slate-600 dark:text-slate-300">
                  "Perfect! I'm creating a team with a conversion specialist, marketing analyst, and customer experience expert..."
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Voice Interface
const VoiceInterface = ({
  conversationState,
  setConversationState,
  transcript,
  setTranscript,
  generatedTeam,
  setGeneratedTeam
}) => {
  const { state, audioTrack } = useVoiceAssistant();
  const [isListening, setIsListening] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");

  // Handle voice assistant state changes
  useEffect(() => {
    if (state === "listening") {
      setIsListening(true);
      setConversationState("listening");
    } else if (state === "thinking") {
      setConversationState("processing");
    } else if (state === "speaking") {
      setIsListening(false);
      setConversationState("speaking");
    }
  }, [state, setConversationState]);

  // Simulate conversation flow (in production, this connects to your voice agent)
  useEffect(() => {
    if (conversationState === "connecting") {
      setTimeout(() => {
        setConversationState("greeting");
        addToTranscript("assistant", "Hello! I'm your AI assistant. I'm here to help you create the perfect team of AI agents. What kind of project or business goal are you working on?");
      }, 2000);
    }
  }, [conversationState]);

  const addToTranscript = (role, message) => {
    const newEntry = {
      id: Date.now(),
      role,
      message,
      timestamp: new Date()
    };
    setTranscript(prev => [...prev, newEntry]);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          🎤 Voice AI Assistant
        </h1>
        <VoiceStatusIndicator 
          state={conversationState}
          isListening={isListening}
        />
      </div>

      {/* Voice Visualizer */}
      <div className="mb-8 flex justify-center">
        <div className="relative">
          {audioTrack && (
            <BarVisualizer 
              state={state}
              trackRef={audioTrack}
              barCount={5}
              options={{ minHeight: 20, maxHeight: 80 }}
            />
          )}
          <VoiceAnimation 
            isListening={isListening}
            isProcessing={conversationState === "processing"}
            isSpeaking={conversationState === "speaking"}
          />
        </div>
      </div>

      {/* Conversation Transcript */}
      <ConversationTranscript 
        transcript={transcript}
        currentMessage={currentMessage}
        conversationState={conversationState}
      />

      {/* Team Display */}
      {generatedTeam && (
        <GeneratedTeamDisplay team={generatedTeam} />
      )}

      {/* Voice Controls */}
      <VoiceControls 
        conversationState={conversationState}
        onEndConversation={() => window.location.reload()}
      />
    </div>
  );
};

// Voice Status Indicator
const VoiceStatusIndicator = ({ state, isListening }) => {
  const getStatusText = () => {
    switch (state) {
      case "connecting": return "Connecting to AI assistant...";
      case "greeting": return "AI assistant is ready to help";
      case "listening": return "🎤 Listening... Speak naturally";
      case "processing": return "🧠 Processing your request...";
      case "speaking": return "🔊 AI assistant is responding";
      case "reviewing": return "✨ Your team is ready for review";
      default: return "Ready to assist";
    }
  };

  const getStatusColor = () => {
    switch (state) {
      case "listening": return "text-green-600";
      case "processing": return "text-blue-600"; 
      case "speaking": return "text-purple-600";
      case "reviewing": return "text-emerald-600";
      default: return "text-slate-600";
    }
  };

  return (
    <div className={`text-lg font-medium ${getStatusColor()}`}>
      {getStatusText()}
    </div>
  );
};

// Voice Animation Component
const VoiceAnimation = ({ isListening, isProcessing, isSpeaking }) => {
  return (
    <div className="flex items-center justify-center space-x-1">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={`w-2 rounded-full transition-all duration-300 ${
            isListening 
              ? "bg-green-500 animate-pulse" 
              : isProcessing 
              ? "bg-blue-500 animate-bounce"
              : isSpeaking
              ? "bg-purple-500 animate-pulse"
              : "bg-slate-300"
          }`}
          style={{
            height: isListening || isSpeaking ? `${20 + Math.random() * 40}px` : "20px",
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );
};

// Conversation Transcript
const ConversationTranscript = ({ transcript, currentMessage, conversationState }) => {
  const transcriptRef = useRef(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript, currentMessage]);

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
        Conversation
      </h3>
      <div 
        ref={transcriptRef}
        className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm max-h-96 overflow-y-auto"
      >
        {transcript.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-8">
            Conversation will appear here...
          </div>
        ) : (
          <div className="space-y-4">
            {transcript.map((entry) => (
              <ConversationMessage key={entry.id} entry={entry} />
            ))}
            {conversationState === "processing" && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Conversation Message
const ConversationMessage = ({ entry }) => {
  const isUser = entry.role === "user";
  
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
        isUser 
          ? "bg-blue-600 text-white" 
          : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
      }`}>
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-xs opacity-75">
            {isUser ? "You" : "AI Assistant"}
          </span>
          <span className="text-xs opacity-50">
            {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-sm">{entry.message}</p>
      </div>
    </div>
  );
};

// Generated Team Display
const GeneratedTeamDisplay = ({ team }) => {
  return (
    <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200 dark:border-green-800">
      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
        <span className="mr-2">✨</span>
        Your AI Team is Ready!
      </h3>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Team Members:</h4>
          <div className="space-y-2">
            {team.agents?.slice(0, 3).map((agent, index) => (
              <div key={agent.id} className="flex items-center space-x-2 text-sm">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs">
                  {index + 1}
                </div>
                <span className="text-slate-700 dark:text-slate-300">{agent.role}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Configuration:</h4>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <div>Tasks: {team.tasks?.length || 0}</div>
            <div>Tools: {team.recommended_tools?.length || 0}</div>
            <div>Workflow: {team.workflow_type || "Sequential"}</div>
          </div>
        </div>
      </div>
      
      <button className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
        Download YAML Configuration
      </button>
    </div>
  );
};

// Voice Controls
const VoiceControls = ({ conversationState, onEndConversation }) => {
  return (
    <div className="flex justify-center space-x-4">
      <button 
        onClick={onEndConversation}
        className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
      >
        End Conversation
      </button>
      
      {conversationState === "reviewing" && (
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Start Over
        </button>
      )}
    </div>
  );
};

export default VoiceWizardContainer;