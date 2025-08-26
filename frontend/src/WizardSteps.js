import React, { useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Step 3: Role & Persona Assignment
export const Step3RolePersonaAssignment = ({ 
  data, 
  tasks, 
  useEmergentKey, 
  openaiApiKey, 
  onUpdate, 
  isLoading, 
  setIsLoading 
}) => {
  const [agents, setAgents] = useState(data || []);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [role, setRole] = useState("");
  const [showApiKeyToggle, setShowApiKeyToggle] = useState(false);
  const [localUseEmergentKey, setLocalUseEmergentKey] = useState(useEmergentKey);
  const [localOpenaiKey, setLocalOpenaiKey] = useState(openaiApiKey);

  const generatePersona = async (taskIndex) => {
    if (!role.trim()) return;
    
    if (!localUseEmergentKey && !localOpenaiKey.trim()) {
      alert("Please provide your OpenAI API key or use the Emergent Universal Key");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/generate-persona`, {
        role: role,
        task_description: tasks[taskIndex].description,
        use_emergent_key: localUseEmergentKey,
        openai_api_key: localUseEmergentKey ? null : localOpenaiKey
      });

      const newAgent = {
        id: Date.now().toString(),
        task_id: tasks[taskIndex].id,
        role: role,
        goal: response.data.goal,
        backstory: response.data.backstory
      };

      const updatedAgents = [...agents];
      updatedAgents[taskIndex] = newAgent;
      setAgents(updatedAgents);
      onUpdate({ 
        agents: updatedAgents, 
        useEmergentKey: localUseEmergentKey, 
        openaiApiKey: localOpenaiKey 
      });
      
      setRole("");
      if (taskIndex < tasks.length - 1) {
        setCurrentTaskIndex(taskIndex + 1);
      }
    } catch (error) {
      console.error("Error generating persona:", error);
      alert("Error generating persona. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentTask = tasks[currentTaskIndex];
  const currentAgent = agents[currentTaskIndex];

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        Step 3: Role & Persona Assignment
      </h2>
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        Assign expert roles to each task. AI will generate detailed personas automatically.
      </p>
      
      {/* API Key Toggle */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-blue-800 dark:text-blue-200">AI Persona Generation</h3>
          <button
            onClick={() => setShowApiKeyToggle(!showApiKeyToggle)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showApiKeyToggle ? "Hide Settings" : "API Settings"}
          </button>
        </div>
        
        {showApiKeyToggle && (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="emergent-key"
                checked={localUseEmergentKey}
                onChange={() => setLocalUseEmergentKey(true)}
                className="text-blue-600"
              />
              <label htmlFor="emergent-key" className="text-sm text-slate-700 dark:text-slate-200">
                Use Emergent Universal Key (Recommended - No setup required)
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="radio"
                id="openai-key"
                checked={!localUseEmergentKey}
                onChange={() => setLocalUseEmergentKey(false)}
                className="text-blue-600"
              />
              <label htmlFor="openai-key" className="text-sm text-slate-700 dark:text-slate-200">
                Use My OpenAI API Key
              </label>
            </div>
            
            {!localUseEmergentKey && (
              <input
                type="password"
                value={localOpenaiKey}
                onChange={(e) => setLocalOpenaiKey(e.target.value)}
                placeholder="Enter your OpenAI API key (sk-...)"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
              />
            )}
          </div>
        )}
      </div>

      {/* Task Progress */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Assigning roles to tasks: {agents.length} of {tasks.length} completed
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(agents.length / tasks.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {currentTask && (
        <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-slate-800 dark:text-slate-100 mb-2">
            Task {currentTaskIndex + 1}: {currentTask.title}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            {currentTask.description}
          </p>
          
          {!currentAgent ? (
            <div className="space-y-3">
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Enter expert role (e.g., Marketing Strategist, Data Analyst)"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
              />
              <button
                onClick={() => generatePersona(currentTaskIndex)}
                disabled={!role.trim() || isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                {isLoading ? "Generating Persona..." : "Generate AI Persona"}
              </button>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                ✓ {currentAgent.role}
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                <strong>Goal:</strong> {currentAgent.goal}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                <strong>Backstory:</strong> {currentAgent.backstory}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Completed Agents Summary */}
      {agents.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium text-slate-700 dark:text-slate-200 mb-3">Agent Team Summary:</h3>
          <div className="space-y-2">
            {agents.map((agent, index) => (
              <div key={agent.id} className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">
                  ✓
                </div>
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{agent.role}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-300 ml-2">→ {tasks[index]?.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Step 4: Tool Identification
export const Step4ToolIdentification = ({ data, availableTools, onUpdate }) => {
  const [selectedTools, setSelectedTools] = useState(data || []);

  const toggleTool = (toolId) => {
    const updatedTools = selectedTools.includes(toolId)
      ? selectedTools.filter(id => id !== toolId)
      : [...selectedTools, toolId];
    
    setSelectedTools(updatedTools);
    onUpdate({ selectedTools: updatedTools });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        Step 4: Tool Identification
      </h2>
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        Select the tools your agent team will need to complete their tasks effectively.
      </p>
      
      <div className="space-y-3">
        {availableTools.map((tool) => (
          <div key={tool.id} className="flex items-start space-x-3 p-4 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <input
              type="checkbox"
              id={tool.id}
              checked={selectedTools.includes(tool.id)}
              onChange={() => toggleTool(tool.id)}
              className="mt-1 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <label htmlFor={tool.id} className="cursor-pointer">
                <h3 className="font-medium text-slate-800 dark:text-slate-100">{tool.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{tool.description}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Maps to: {tool.class_name}
                </p>
              </label>
            </div>
          </div>
        ))}
      </div>
      
      {selectedTools.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            Selected Tools ({selectedTools.length}):
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedTools.map(toolId => {
              const tool = availableTools.find(t => t.id === toolId);
              return tool ? (
                <span key={toolId} className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                  {tool.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Step 5: Workflow Orchestration
export const Step5WorkflowOrchestration = ({ data, onUpdate }) => {
  const [workflowType, setWorkflowType] = useState(data || "sequential");

  const handleWorkflowChange = (type) => {
    setWorkflowType(type);
    onUpdate({ workflowType: type });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        Step 5: Workflow Orchestration
      </h2>
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        Choose how your agents will collaborate to complete the mission.
      </p>
      
      <div className="space-y-4">
        <div 
          className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
            workflowType === "sequential" 
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
              : "border-slate-300 dark:border-slate-600 hover:border-slate-400"
          }`}
          onClick={() => handleWorkflowChange("sequential")}
        >
          <div className="flex items-start space-x-3">
            <input
              type="radio"
              name="workflow"
              checked={workflowType === "sequential"}
              onChange={() => handleWorkflowChange("sequential")}
              className="mt-1 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <h3 className="font-medium text-slate-800 dark:text-slate-100 mb-2">
                Sequential Process
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Agents work one after another in a defined order. Each agent completes their task before the next one begins. 
                Perfect for tasks that build upon each other.
              </p>
            </div>
          </div>
        </div>
        
        <div 
          className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
            workflowType === "hierarchical" 
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
              : "border-slate-300 dark:border-slate-600 hover:border-slate-400"
          }`}
          onClick={() => handleWorkflowChange("hierarchical")}
        >
          <div className="flex items-start space-x-3">
            <input
              type="radio"
              name="workflow"
              checked={workflowType === "hierarchical"}
              onChange={() => handleWorkflowChange("hierarchical")}
              className="mt-1 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <h3 className="font-medium text-slate-800 dark:text-slate-100 mb-2">
                Hierarchical Process
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                A manager agent coordinates and delegates tasks to worker agents. 
                Best for complex projects requiring oversight and coordination.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 6: Review and Generation
export const Step6ReviewGeneration = ({ 
  wizardData, 
  availableTools, 
  generatedYaml, 
  setGeneratedYaml, 
  isLoading, 
  setIsLoading 
}) => {
  const [teamId, setTeamId] = useState(null);

  const generateYaml = async () => {
    setIsLoading(true);
    try {
      // First, create the team
      const createResponse = await axios.post(`${API}/teams`, {
        mission: wizardData.mission,
        tasks: wizardData.tasks,
        agents: wizardData.agents,
        selected_tools: wizardData.selectedTools,
        workflow_type: wizardData.workflowType
      });

      const newTeamId = createResponse.data.team_id;
      setTeamId(newTeamId);

      // Then generate YAML
      const yamlResponse = await axios.post(`${API}/generate-yaml`, {
        team_id: newTeamId
      });

      setGeneratedYaml(yamlResponse.data.yaml);
    } catch (error) {
      console.error("Error generating YAML:", error);
      alert("Error generating YAML. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadYaml = () => {
    const blob = new Blob([generatedYaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wizardData.mission.name.replace(/\s+/g, '_').toLowerCase()}_crew.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectedToolNames = wizardData.selectedTools.map(toolId => {
    const tool = availableTools.find(t => t.id === toolId);
    return tool ? tool.name : toolId;
  });

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        Step 6: Review and Generation
      </h2>
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        Review your AI agent team configuration and generate the CrewAI YAML file.
      </p>
      
      {/* Configuration Summary */}
      <div className="space-y-6 mb-6">
        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
          <h3 className="font-medium text-slate-800 dark:text-slate-100 mb-2">Mission</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300"><strong>{wizardData.mission?.name}</strong></p>
          <p className="text-sm text-slate-600 dark:text-slate-300">{wizardData.mission?.objective}</p>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
          <h3 className="font-medium text-slate-800 dark:text-slate-100 mb-2">
            Tasks & Agents ({wizardData.tasks?.length || 0})
          </h3>
          <div className="space-y-2">
            {wizardData.tasks?.map((task, index) => {
              const agent = wizardData.agents?.[index];
              return (
                <div key={task.id} className="text-sm">
                  <span className="text-slate-800 dark:text-slate-100 font-medium">{task.title}</span>
                  {agent && (
                    <span className="text-slate-600 dark:text-slate-300 ml-2">→ {agent.role}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
          <h3 className="font-medium text-slate-800 dark:text-slate-100 mb-2">
            Selected Tools ({selectedToolNames.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedToolNames.map((toolName, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-sm">
                {toolName}
              </span>
            ))}
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
          <h3 className="font-medium text-slate-800 dark:text-slate-100 mb-2">Workflow Type</h3>
          <span className="px-3 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full text-sm capitalize">
            {wizardData.workflowType}
          </span>
        </div>
      </div>
      
      {/* Generate Button */}
      {!generatedYaml && (
        <button
          onClick={generateYaml}
          disabled={isLoading}
          className="w-full px-6 py-4 bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors text-lg"
        >
          {isLoading ? "Generating YAML..." : "🚀 Generate CrewAI YAML Configuration"}
        </button>
      )}
      
      {/* Generated YAML */}
      {generatedYaml && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-slate-800 dark:text-slate-100">Generated YAML Configuration</h3>
            <button
              onClick={downloadYaml}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Download YAML
            </button>
          </div>
          <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
            {generatedYaml}
          </pre>
          
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              ✅ Success! Your CrewAI configuration is ready
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              Your YAML file is 100% compatible with the CrewAI framework. 
              Download it and use it directly with your CrewAI project.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};