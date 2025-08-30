import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import IntelligentWizardContainer from "./IntelligentWizard";
import VoiceWizardContainer from "./VoiceWizard";
import { 
  Step3RolePersonaAssignment, 
  Step4ToolIdentification, 
  Step5WorkflowOrchestration, 
  Step6ReviewGeneration 
} from "./WizardSteps";

const Home = () => {
  const [selectedWizard, setSelectedWizard] = useState(null);

  if (selectedWizard === "voice") {
    return <VoiceWizardContainer />;
  }

  if (selectedWizard === "intelligent") {
    return <IntelligentWizardContainer />;
  }
  
  if (selectedWizard === "classic") {
    return <WizardContainer />;
  }

  // Wizard Selection Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              🤖 AI Agent Team Configuration Wizard
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
              Choose your preferred way to create powerful AI agent teams for CrewAI framework
            </p>
          </div>

          {/* Wizard Options */}
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Intelligent Wizard */}
            <div 
              onClick={() => setSelectedWizard("intelligent")}
              className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="text-4xl mb-4">✨</div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                AI-Powered Intelligent Wizard
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Describe your mission and AI will automatically generate the complete team configuration with tasks, agents, and tools.
              </p>
              
              <div className="space-y-3 text-sm text-left">
                <div className="flex items-center text-green-600">
                  <span className="mr-2">✓</span> 2-3 minute completion time
                </div>
                <div className="flex items-center text-green-600">
                  <span className="mr-2">✓</span> AI generates everything automatically
                </div>
                <div className="flex items-center text-green-600">
                  <span className="mr-2">✓</span> Smart tool recommendations
                </div>
                <div className="flex items-center text-green-600">
                  <span className="mr-2">✓</span> Full customization options
                </div>
              </div>
              
              <button className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors">
                Start Intelligent Wizard
              </button>
            </div>

            {/* Classic Wizard */}
            <div 
              onClick={() => setSelectedWizard("classic")}
              className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-600 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <div className="text-4xl mb-4">🛠️</div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                Classic Step-by-Step Wizard
              </h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Go through the traditional 6-step guided process to manually configure your AI agent team.
              </p>
              
              <div className="space-y-3 text-sm text-left">
                <div className="flex items-center text-blue-600">
                  <span className="mr-2">✓</span> 6-step guided process
                </div>
                <div className="flex items-center text-blue-600">
                  <span className="mr-2">✓</span> Full manual control
                </div>
                <div className="flex items-center text-blue-600">
                  <span className="mr-2">✓</span> Learn multi-agent concepts
                </div>
                <div className="flex items-center text-blue-600">
                  <span className="mr-2">✓</span> Educational experience
                </div>
              </div>
              
              <button className="mt-6 px-6 py-3 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors">
                Start Classic Wizard
              </button>
            </div>
          </div>

          {/* Feature Comparison */}
          <div className="mt-12 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Both wizards generate 100% valid CrewAI YAML configurations
            </h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl mb-2">⚡</div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <strong>Under 10 minutes</strong><br />
                  Complete team setup
                </p>
              </div>
              <div>
                <div className="text-2xl mb-2">🎯</div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <strong>No coding required</strong><br />
                  Intuitive interface
                </p>
              </div>
              <div>
                <div className="text-2xl mb-2">📥</div>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <strong>Ready-to-use YAML</strong><br />
                  Download & deploy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Wizard Steps Component
const WizardContainer = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    mission: null,
    tasks: [],
    agents: [],
    selectedTools: [],
    workflowType: "sequential",
    useEmergentKey: true,
    openaiApiKey: ""
  });
  const [availableTools, setAvailableTools] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedYaml, setGeneratedYaml] = useState("");

  const totalSteps = 6;
  const stepTitles = [
    "Mission Definition",
    "Task Decomposition", 
    "Role & Persona Assignment",
    "Tool Identification",
    "Workflow Orchestration",
    "Review and Generation"
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

  const updateWizardData = (stepData) => {
    setWizardData(prev => ({ ...prev, ...stepData }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return wizardData.mission?.name && wizardData.mission?.objective;
      case 2:
        return wizardData.tasks.length > 0;
      case 3:
        return wizardData.agents.length === wizardData.tasks.length;
      case 4:
        return wizardData.selectedTools.length > 0;
      case 5:
        return wizardData.workflowType;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">
              AI Agent Team Configuration Wizard
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Create powerful AI agent teams without coding - Step {currentStep} of {totalSteps}
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
                  <span className="text-xs mt-1 text-center text-slate-600 dark:text-slate-300 max-w-20">
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
              <Step1MissionDefinition 
                data={wizardData.mission} 
                onUpdate={updateWizardData}
              />
            )}
            {currentStep === 2 && (
              <Step2TaskDecomposition 
                data={wizardData.tasks} 
                mission={wizardData.mission}
                onUpdate={updateWizardData}
              />
            )}
            {currentStep === 3 && (
              <Step3RolePersonaAssignment 
                data={wizardData.agents}
                tasks={wizardData.tasks}
                useEmergentKey={wizardData.useEmergentKey}
                openaiApiKey={wizardData.openaiApiKey}
                onUpdate={updateWizardData}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
            {currentStep === 4 && (
              <Step4ToolIdentification 
                data={wizardData.selectedTools}
                availableTools={availableTools}
                onUpdate={updateWizardData}
              />
            )}
            {currentStep === 5 && (
              <Step5WorkflowOrchestration 
                data={wizardData.workflowType}
                onUpdate={updateWizardData}
              />
            )}
            {currentStep === 6 && (
              <Step6ReviewGeneration 
                wizardData={wizardData}
                availableTools={availableTools}
                generatedYaml={generatedYaml}
                setGeneratedYaml={setGeneratedYaml}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 transition-colors dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
            >
              Previous
            </button>
            
            {currentStep < totalSteps ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                Next Step
              </button>
            ) : (
              <div className="text-slate-600 dark:text-slate-300 font-medium">
                Generate your YAML above
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 1: Mission Definition
const Step1MissionDefinition = ({ data, onUpdate }) => {
  const [mission, setMission] = useState(data || { name: "", objective: "", description: "" });

  const handleUpdate = (field, value) => {
    const updatedMission = { ...mission, [field]: value };
    setMission(updatedMission);
    onUpdate({ mission: updatedMission });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        Step 1: Mission Definition
      </h2>
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        Define the high-level mission for your AI agent team. This will guide the entire configuration process.
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Mission Name *
          </label>
          <input
            type="text"
            value={mission.name}
            onChange={(e) => handleUpdate("name", e.target.value)}
            placeholder="e.g., Content Marketing Campaign"
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Mission Objective *
          </label>
          <textarea
            value={mission.objective}
            onChange={(e) => handleUpdate("objective", e.target.value)}
            placeholder="e.g., Create a comprehensive content marketing strategy and execute a 30-day campaign to increase brand awareness"
            rows={3}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Additional Description (Optional)
          </label>
          <textarea
            value={mission.description}
            onChange={(e) => handleUpdate("description", e.target.value)}
            placeholder="Any additional context or requirements for this mission..."
            rows={2}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
          />
        </div>
      </div>
    </div>
  );
};

// Step 2: Task Decomposition  
const Step2TaskDecomposition = ({ data, mission, onUpdate }) => {
  const [tasks, setTasks] = useState(data || []);
  const [newTask, setNewTask] = useState({ title: "", description: "" });

  const addTask = () => {
    if (newTask.title && newTask.description) {
      const updatedTasks = [...tasks, { 
        id: Date.now().toString(), 
        ...newTask, 
        order: tasks.length + 1 
      }];
      setTasks(updatedTasks);
      onUpdate({ tasks: updatedTasks });
      setNewTask({ title: "", description: "" });
    }
  };

  const removeTask = (index) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);
    onUpdate({ tasks: updatedTasks });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        Step 2: Task Decomposition
      </h2>
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        Break down your mission "{mission?.name}" into sequential tasks. Each task will be assigned to a specialized agent.
      </p>
      
      {/* Current Tasks */}
      {tasks.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium text-slate-700 dark:text-slate-200 mb-3">Current Tasks:</h3>
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <div key={task.id} className="flex items-start space-x-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-800 dark:text-slate-100">{task.title}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{task.description}</p>
                </div>
                <button
                  onClick={() => removeTask(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Add New Task */}
      <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-4">
        <h3 className="font-medium text-slate-700 dark:text-slate-200 mb-4">Add New Task:</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={newTask.title}
            onChange={(e) => setNewTask({...newTask, title: e.target.value})}
            placeholder="Task title (e.g., Market Research)"
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
          />
          <textarea
            value={newTask.description}
            onChange={(e) => setNewTask({...newTask, description: e.target.value})}
            placeholder="Task description (e.g., Research target audience, competitors, and market trends)"
            rows={2}
            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
          />
          <button
            onClick={addTask}
            disabled={!newTask.title || !newTask.description}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />}>
            <Route index element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;