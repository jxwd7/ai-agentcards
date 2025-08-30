import React, { useState, useEffect, useRef } from "react";

// Voice Wizard Container (Demo Version - Ready for LiveKit Integration)
const VoiceWizardContainer = () => {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [conversationState, setConversationState] = useState("not_started");
  const [transcript, setTranscript] = useState([]);
  const [generatedTeam, setGeneratedTeam] = useState(null);

  // Demo: Simulate voice activation
  const startVoiceDemo = () => {
    setIsVoiceActive(true);
    setConversationState("greeting");
    
    setTimeout(() => {
      addToTranscript("assistant", "Hello! I'm your AI voice assistant. What kind of project or business goal would you like help with today?");
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

  const simulateVoiceInput = (message) => {
    addToTranscript("user", message);
    setConversationState("processing");
    
    setTimeout(() => {
      const response = getAIResponse(message);
      addToTranscript("assistant", response);
      setConversationState("listening");
      
      if (shouldGenerateTeam()) {
        generateDemoTeam();
      }
    }, 1500);
  };

  const getAIResponse = (userMessage) => {
    const lower = userMessage.toLowerCase();
    
    if (lower.includes("marketing") || lower.includes("sales")) {
      return "That sounds like a great marketing project! Can you tell me more about your target audience?";
    } else if (lower.includes("website") || lower.includes("online")) {
      return "Interesting! Are you looking to improve performance, increase traffic, or enhance user experience?";
    } else {
      return "I understand! Let me create the perfect AI team for your needs.";
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
          { id: "1", role: "Digital Marketing Strategist", goal: "Develop comprehensive marketing strategies" },
          { id: "2", role: "Conversion Expert", goal: "Optimize conversion funnels for maximum ROI" },
          { id: "3", role: "Analytics Specialist", goal: "Provide data-driven customer insights" }
        ],
        tasks: [
          { title: "Market Analysis", description: "Research target market" },
          { title: "Strategy Development", description: "Create marketing strategy" }
        ],
        recommended_tools: ["serper_search", "google_sheets"],
        workflow_type: "sequential"
      };
      
      setGeneratedTeam(demoTeam);
      setConversationState("reviewing");
      
      addToTranscript("assistant", "Perfect! I've created your AI team with 3 specialists. Would you like me to generate your CrewAI configuration file?");
    }, 3000);
  };

  if (!isVoiceActive) {
    return <VoiceWizardLanding onStartVoice={startVoiceDemo} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
      <VoiceInterface
        conversationState={conversationState}
        transcript={transcript}
        generatedTeam={generatedTeam}
        onSimulateVoice={simulateVoiceInput}
      />
    </div>
  );
};

// Voice Wizard Landing Page
const VoiceWizardLanding = ({ onStartVoice }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          
          <div className="mb-12">
            <div className="text-6xl mb-6">🎤</div>
            <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Voice Conversational AI Assistant
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
              Just talk naturally - I'll understand your needs and create a complete AI agent team for you
            </p>
            
            <div className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium mb-6">
              🚀 Interactive Demo - LiveKit Integration Ready
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Ultra Fast</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Complete in 1-2 minutes through natural conversation
              </p>
            </div>
            
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
              <div className="text-3xl mb-4">🗣️</div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Hands-Free</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                No typing required - pure voice interaction
              </p>
            </div>
            
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
              <div className="text-3xl mb-4">🧠</div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">AI Intelligence</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Understands context and asks smart follow-up questions
              </p>
            </div>
          </div>

          <button
            onClick={onStartVoice}
            className="px-12 py-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-300 text-xl shadow-xl transform hover:scale-105"
          >
            <span className="flex items-center justify-center">
              <span className="mr-3">🎤</span>
              Experience Voice Demo
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Voice Interface
const VoiceInterface = ({ conversationState, transcript, generatedTeam, onSimulateVoice }) => {
  const [isListening, setIsListening] = useState(false);

  const demoInputs = [
    "I want to increase sales for my online business",
    "I need help with digital marketing for my startup",
    "My website conversion rate is too low",
    "I want to launch a marketing campaign"
  ];

  useEffect(() => {
    setIsListening(conversationState === "listening");
  }, [conversationState]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          🎤 Voice AI Assistant
        </h1>
        <VoiceStatusIndicator state={conversationState} isListening={isListening} />
      </div>

      <div className="mb-8 flex justify-center">
        <VoiceAnimation 
          isListening={isListening}
          isProcessing={conversationState === "processing" || conversationState === "generating"}
        />
      </div>

      {conversationState === "listening" && (
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

      <ConversationTranscript transcript={transcript} conversationState={conversationState} />
      
      {generatedTeam && <GeneratedTeamDisplay team={generatedTeam} />}

      <div className="flex justify-center">
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
        >
          End Conversation
        </button>
      </div>
    </div>
  );
};

// Voice Status Indicator
const VoiceStatusIndicator = ({ state }) => {
  const getStatusText = () => {
    switch (state) {
      case "greeting": return "AI assistant is ready to help";
      case "listening": return "🎤 Listening... Speak naturally";
      case "processing": return "🧠 Processing your request...";
      case "generating": return "✨ Generating your AI team...";
      case "reviewing": return "🎉 Your team is ready for review";
      default: return "Ready to assist";
    }
  };

  const getStatusColor = () => {
    switch (state) {
      case "listening": return "text-green-600";
      case "processing": return "text-blue-600"; 
      case "generating": return "text-purple-600";
      case "reviewing": return "text-emerald-600";
      default: return "text-slate-600";
    }
  };

  return <div className={`text-lg font-medium ${getStatusColor()}`}>{getStatusText()}</div>;
};

// Voice Animation
const VoiceAnimation = ({ isListening, isProcessing }) => {
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
              : "bg-slate-300"
          }`}
          style={{
            height: isListening || isProcessing ? `${30 + Math.random() * 50}px` : "30px",
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
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Conversation</h3>
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
          <span className="text-xs opacity-75">{isUser ? "You" : "AI Assistant"}</span>
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
        <span className="mr-2">✨</span>Your AI Team is Ready!
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
              <span className="font-medium capitalize">{team.workflow_type}</span>
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

export default VoiceWizardContainer;