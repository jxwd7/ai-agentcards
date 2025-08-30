import React, { useState, useEffect, useRef } from "react";
import { Room, ConnectionState } from "livekit-client";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Voice Wizard Container with LiveKit Integration
const VoiceWizardContainer = () => {
  const [connectionState, setConnectionState] = useState("disconnected");
  const [room, setRoom] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [generatedTeam, setGeneratedTeam] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Generate LiveKit token and connect
  const connectToVoiceSession = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      // Generate unique room and participant names
      const roomName = `crewai-voice-${Date.now()}`;
      const participantName = `user-${Date.now()}`;
      
      // Get LiveKit token from backend
      const response = await axios.post(`${API}/livekit-token`, {
        room_name: roomName,
        participant_name: participantName
      });
      
      const { token, url } = response.data;
      
      // Create and connect to LiveKit room
      const livekitRoom = new Room();
      
      // Set up event listeners
      livekitRoom.on('connected', () => {
        setConnectionState("connected");
        addToTranscript("system", "Connected to voice assistant! You can start speaking now.");
      });
      
      livekitRoom.on('disconnected', () => {
        setConnectionState("disconnected");
        addToTranscript("system", "Voice session ended.");
      });
      
      livekitRoom.on('trackPublished', (publication, participant) => {
        console.log('Track published:', publication.trackSid, participant.identity);
      });
      
      livekitRoom.on('trackSubscribed', (track, publication, participant) => {
        if (track.kind === 'audio' && participant.isAgent) {
          // AI agent is speaking
          addToTranscript("assistant", "AI is responding...");
        }
      });
      
      // Connect to the room
      await livekitRoom.connect(url, token);
      setRoom(livekitRoom);
      setConnectionState("connecting");
      
    } catch (error) {
      console.error("Error connecting to voice session:", error);
      setError("Failed to connect to voice assistant. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromVoiceSession = () => {
    if (room) {
      room.disconnect();
      setRoom(null);
      setConnectionState("disconnected");
    }
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [room]);

  if (connectionState === "disconnected") {
    return (
      <VoiceWizardLanding
        onStartVoice={connectToVoiceSession}
        isConnecting={isConnecting}
        error={error}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
      <VoiceInterface
        connectionState={connectionState}
        transcript={transcript}
        generatedTeam={generatedTeam}
        onDisconnect={disconnectFromVoiceSession}
        room={room}
      />
    </div>
  );
};

// Voice Wizard Landing Page
const VoiceWizardLanding = ({ onStartVoice, isConnecting, error }) => {
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
              🚀 Powered by LiveKit Real-time Voice
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Real-time Voice</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Ultra-low latency voice interaction powered by LiveKit
              </p>
            </div>
            
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
              <div className="text-3xl mb-4">🗣️</div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Natural Conversation</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                AI understands context and asks intelligent follow-up questions
              </p>
            </div>
            
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
              <div className="text-3xl mb-4">🧠</div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Instant Team Creation</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Complete AI team generation in under 2 minutes
              </p>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={onStartVoice}
            disabled={isConnecting}
            className="px-12 py-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-blue-700 transition-all duration-300 text-xl shadow-xl transform hover:scale-105"
          >
            {isConnecting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <span className="mr-3">🎤</span>
                Start Voice Conversation
              </span>
            )}
          </button>
          
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
            Make sure your microphone is enabled for the best experience
          </p>

          {/* Technology Stack */}
          <div className="mt-12 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
              🏗️ Powered By
            </h4>
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong>LiveKit Agents</strong><br />
                <span className="text-slate-600 dark:text-slate-300">Real-time voice</span>
              </div>
              <div>
                <strong>Deepgram Nova-2</strong><br />
                <span className="text-slate-600 dark:text-slate-300">Speech-to-text</span>
              </div>
              <div>
                <strong>GPT-4o-mini</strong><br />
                <span className="text-slate-600 dark:text-slate-300">Conversational AI</span>
              </div>
              <div>
                <strong>OpenAI TTS</strong><br />
                <span className="text-slate-600 dark:text-slate-300">Text-to-speech</span>
              </div>
            </div>
          </div>

          {/* Demo Instructions */}
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl text-left max-w-2xl mx-auto">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-4 text-center">
              💡 How it Works:
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <span className="font-medium text-purple-600 mr-3 min-w-[20px]">1.</span>
                <span className="text-slate-600 dark:text-slate-300">
                  Click "Start Voice Conversation" and allow microphone access
                </span>
              </div>
              <div className="flex items-start">
                <span className="font-medium text-purple-600 mr-3 min-w-[20px]">2.</span>
                <span className="text-slate-600 dark:text-slate-300">
                  Tell the AI about your business goal or project challenge
                </span>
              </div>
              <div className="flex items-start">
                <span className="font-medium text-purple-600 mr-3 min-w-[20px]">3.</span>
                <span className="text-slate-600 dark:text-slate-300">
                  Answer a few follow-up questions about your needs
                </span>
              </div>
              <div className="flex items-start">
                <span className="font-medium text-purple-600 mr-3 min-w-[20px]">4.</span>
                <span className="text-slate-600 dark:text-slate-300">
                  Receive your complete AI agent team configuration instantly
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Voice Interface with LiveKit
const VoiceInterface = ({ connectionState, transcript, generatedTeam, onDisconnect, room }) => {
  const [micEnabled, setMicEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);

  const toggleMicrophone = async () => {
    if (room && room.localParticipant) {
      const newState = !micEnabled;
      await room.localParticipant.setMicrophoneEnabled(newState);
      setMicEnabled(newState);
    }
  };

  // Monitor connection state
  useEffect(() => {
    if (connectionState === "connected") {
      setIsListening(true);
    }
  }, [connectionState]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          🎤 Voice AI Assistant
        </h1>
        <VoiceStatusIndicator 
          connectionState={connectionState}
          isListening={isListening}
          micEnabled={micEnabled}
        />
      </div>

      {/* Voice Controls */}
      <div className="mb-8 flex justify-center space-x-4">
        <button
          onClick={toggleMicrophone}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            micEnabled 
              ? "bg-green-600 text-white hover:bg-green-700" 
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          {micEnabled ? "🎤 Mic On" : "🔇 Mic Off"}
        </button>
        
        <button
          onClick={onDisconnect}
          className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          End Session
        </button>
      </div>

      {/* Voice Visualizer */}
      <div className="mb-8 flex justify-center">
        <VoiceAnimation 
          isListening={isListening && micEnabled}
          isConnected={connectionState === "connected"}
        />
      </div>

      {/* Connection Status */}
      <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            connectionState === "connected" ? "bg-green-500" : 
            connectionState === "connecting" ? "bg-yellow-500 animate-pulse" : "bg-red-500"
          }`}></div>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {connectionState === "connected" && "Connected - Speak naturally"}
            {connectionState === "connecting" && "Connecting to AI assistant..."}
            {connectionState === "disconnected" && "Disconnected"}
          </span>
        </div>
      </div>

      {/* Conversation Transcript */}
      <ConversationTranscript transcript={transcript} />
      
      {/* Generated Team Display */}
      {generatedTeam && (
        <GeneratedTeamDisplay team={generatedTeam} />
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">💡 Tips:</h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Speak clearly and naturally about your business goals</li>
          <li>• Mention your industry, target audience, or main challenges</li>
          <li>• The AI will ask follow-up questions to understand your needs</li>
          <li>• Your complete AI team will be generated automatically</li>
        </ul>
      </div>
    </div>
  );
};

// Voice Status Indicator
const VoiceStatusIndicator = ({ connectionState, isListening, micEnabled }) => {
  const getStatusText = () => {
    if (connectionState !== "connected") return "Connecting to AI assistant...";
    if (!micEnabled) return "🔇 Microphone disabled";
    if (isListening) return "🎤 Listening... Speak naturally";
    return "🔊 AI is processing or responding";
  };

  const getStatusColor = () => {
    if (connectionState !== "connected") return "text-yellow-600";
    if (!micEnabled) return "text-red-600";
    if (isListening) return "text-green-600";
    return "text-blue-600";
  };

  return <div className={`text-lg font-medium ${getStatusColor()}`}>{getStatusText()}</div>;
};

// Voice Animation
const VoiceAnimation = ({ isListening, isConnected }) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className={`w-3 rounded-full transition-all duration-300 ${
            isListening && isConnected
              ? "bg-green-500 animate-pulse" 
              : isConnected
              ? "bg-blue-500"
              : "bg-slate-300"
          }`}
          style={{
            height: isListening ? `${30 + Math.random() * 50}px` : "30px",
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );
};

// Conversation Transcript
const ConversationTranscript = ({ transcript }) => {
  const transcriptRef = useRef(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Real-time Conversation</h3>
      <div 
        ref={transcriptRef}
        className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm max-h-96 overflow-y-auto"
      >
        {transcript.length === 0 ? (
          <div className="text-center text-slate-500 dark:text-slate-400 py-8">
            Start speaking and your conversation will appear here in real-time...
          </div>
        ) : (
          <div className="space-y-4">
            {transcript.map((entry) => (
              <ConversationMessage key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Conversation Message
const ConversationMessage = ({ entry }) => {
  const isUser = entry.role === "user";
  const isSystem = entry.role === "system";
  
  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="px-4 py-2 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-sm">
          {entry.message}
        </div>
      </div>
    );
  }
  
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