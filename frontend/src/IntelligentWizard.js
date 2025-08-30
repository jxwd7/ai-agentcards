import React, { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Enhanced AI-First Wizard Component
const IntelligentWizardContainer = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [missionData, setMissionData] = useState({
    name: "",
    objective: "",
    description: ""
  });
  const [generatedTeam, setGeneratedTeam] = useState(null);
  const [availableTools, setAvailableTools] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [useEmergentKey, setUseEmergentKey] = useState(true);
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [generatedYaml, setGeneratedYaml] = useState("");

  const totalSteps = 3;
  const stepTitles = [
    "Mission Definition",
    "AI Team Generation & Review", 
    "YAML Configuration"
  ];

  useEffect(() => {
    fetchAvailableTools();
  }, []);

  const fetchAvailableTools = async () => {
    try {
      const response = await axios.get(`${API}/tools`);
      setAvailableTools(response.data.tools);
    } catch (error) {
      console.error("Error fetching tools:", error);
    }
  };

  const generateIntelligentTeam = async () => {
    if (!missionData.name || !missionData.objective) {
      alert("Please fill in mission name and objective");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await axios.post(`${API}/generate-intelligent-team`, {
        mission_name: missionData.name,
        mission_objective: missionData.objective,
        mission_description: missionData.description,
        use_emergent_key: useEmergentKey,
        openai_api_key: useEmergentKey ? null : openaiApiKey
      });

      setGeneratedTeam(response.data);
      setCurrentStep(2);
    } catch (error) {
      console.error("Error generating team:", error);
      alert("Error generating team. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateGeneratedTeam = (updates) => {
    setGeneratedTeam(prev => ({ ...prev, ...updates }));
  };

  const generateYaml = async () => {
    if (!generatedTeam) return;
    
    setIsGenerating(true);
    try {
      // First create the team
      const createResponse = await axios.post(`${API}/teams`, {
        mission: generatedTeam.mission,
        tasks: generatedTeam.tasks,
        agents: generatedTeam.agents,
        selected_tools: generatedTeam.recommended_tools,
        workflow_type: generatedTeam.workflow_type
      });

      // Then generate YAML
      const yamlResponse = await axios.post(`${API}/generate-yaml`, {
        team_id: createResponse.data.team_id
      });

      setGeneratedYaml(yamlResponse.data.yaml);
      setCurrentStep(3);
    } catch (error) {
      console.error("Error generating YAML:", error);
      alert("Error generating YAML. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadYaml = () => {
    const blob = new Blob([generatedYaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${missionData.name.replace(/\s+/g, '_').toLowerCase()}_crew.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              🤖 AI Agent Team Configuration Wizard
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              AI-powered intelligent team generation - Step {currentStep} of {totalSteps}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {stepTitles.map((title, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index + 1 <= currentStep 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-xs mt-1 text-center text-slate-600 dark:text-slate-300 max-w-32">
                    {title}
                  </span>
                </div>
              ))}
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
            {currentStep === 1 && (
              <Step1EnhancedMissionInput 
                missionData={missionData}
                setMissionData={setMissionData}
                useEmergentKey={useEmergentKey}
                setUseEmergentKey={setUseEmergentKey}
                openaiApiKey={openaiApiKey}
                setOpenaiApiKey={setOpenaiApiKey}
                onGenerate={generateIntelligentTeam}
                isGenerating={isGenerating}
              />
            )}
            {currentStep === 2 && generatedTeam && (
              <Step2TeamReviewDashboard 
                generatedTeam={generatedTeam}
                availableTools={availableTools}
                updateGeneratedTeam={updateGeneratedTeam}
                onGenerateYaml={generateYaml}
                isGenerating={isGenerating}
              />
            )}
            {currentStep === 3 && (
              <Step3YamlGeneration 
                missionData={missionData}
                generatedYaml={generatedYaml}
                onDownload={downloadYaml}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 transition-colors dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              Previous
            </button>
            
            <div className="text-slate-600 dark:text-slate-300 text-sm">
              {currentStep === 1 && "Define your mission and let AI create your team"}
              {currentStep === 2 && "Review and customize your AI-generated team"}
              {currentStep === 3 && "Your CrewAI configuration is ready!"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 1: Enhanced Mission Input with AI Settings
const Step1EnhancedMissionInput = ({ 
  missionData, 
  setMissionData, 
  useEmergentKey, 
  setUseEmergentKey, 
  openaiApiKey, 
  setOpenaiApiKey, 
  onGenerate, 
  isGenerating 
}) => {
  const [showApiSettings, setShowApiSettings] = useState(false);

  const handleInputChange = (field, value) => {
    setMissionData(prev => ({ ...prev, [field]: value }));
  };

  const canGenerate = missionData.name.trim() && missionData.objective.trim() && 
    (useEmergentKey || openaiApiKey.trim());

  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        🎯 Mission Definition
      </h2>
      <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg">
        Describe your mission, and AI will automatically generate a complete team configuration with tasks, agents, and tool recommendations.
      </p>
      
      {/* AI Settings Panel */}
      <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-blue-800 dark:text-blue-200 flex items-center">
            <span className="mr-2">🤖</span> AI Team Generation Settings
          </h3>
          <button
            onClick={() => setShowApiSettings(!showApiSettings)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showApiSettings ? "Hide Settings" : "API Settings"}
          </button>
        </div>
        
        {showApiSettings && (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="emergent-key"
                checked={useEmergentKey}
                onChange={() => setUseEmergentKey(true)}
                className="text-blue-600"
              />
              <label htmlFor="emergent-key" className="text-sm text-slate-700 dark:text-slate-200">
                <strong>Use Emergent Universal Key</strong> (Recommended - No setup required)
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="openai-key"
                checked={!useEmergentKey}
                onChange={() => setUseEmergentKey(false)}
                className="text-blue-600"
              />
              <label htmlFor="openai-key" className="text-sm text-slate-700 dark:text-slate-200">
                <strong>Use My OpenAI API Key</strong>
              </label>
            </div>
            
            {!useEmergentKey && (
              <input
                type="password"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder="Enter your OpenAI API key (sk-...)"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
              />
            )}
          </div>
        )}
      </div>
      
      {/* Mission Input Form */}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Mission Name *
          </label>
          <input
            type="text"
            value={missionData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="e.g., Social Media Marketing Campaign"
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100 text-lg"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Mission Objective *
          </label>
          <textarea
            value={missionData.objective}
            onChange={(e) => handleInputChange("objective", e.target.value)}
            placeholder="e.g., Create and execute a comprehensive social media marketing strategy to increase brand awareness and drive engagement across multiple platforms"
            rows={4}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100 text-lg"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Additional Context (Optional)
          </label>
          <textarea
            value={missionData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="e.g., Focus on B2B SaaS companies targeting tech decision makers, budget constraints, timeline requirements..."
            rows={3}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
          />
        </div>
        
        {/* Generate Button */}
        <div className="pt-4">
          <button
            onClick={onGenerate}
            disabled={!canGenerate || isGenerating}
            className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-lg shadow-lg"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating AI Team...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <span className="mr-2">✨</span>
                Generate Complete AI Team Configuration
              </span>
            )}
          </button>
        </div>
        
        {/* Feature Preview */}
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
          <h4 className="font-medium text-slate-800 dark:text-slate-100 mb-2">
            🪄 What AI Will Generate For You:
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center">
              <span className="mr-2">📋</span> Task Breakdown (3-5 sequential tasks)
            </div>
            <div className="flex items-center">
              <span className="mr-2">👥</span> Expert Agent Personas
            </div>
            <div className="flex items-center">
              <span className="mr-2">🛠️</span> Smart Tool Recommendations
            </div>
            <div className="flex items-center">
              <span className="mr-2">🔄</span> Optimal Workflow Structure
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligentWizardContainer;