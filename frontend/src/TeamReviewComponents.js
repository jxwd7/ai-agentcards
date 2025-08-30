import React, { useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Step 2: Team Review Dashboard with Inline Editing
export const Step2TeamReviewDashboard = ({ 
  generatedTeam, 
  availableTools, 
  updateGeneratedTeam, 
  onGenerateYaml, 
  isGenerating 
}) => {
  const [editingTask, setEditingTask] = useState(null);
  const [editingAgent, setEditingAgent] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const regeneratePersona = async (agentIndex) => {
    setIsRegenerating(true);
    try {
      const agent = generatedTeam.agents[agentIndex];
      const task = generatedTeam.tasks.find(t => t.id === agent.task_id);
      
      const response = await axios.post(`${API}/generate-persona`, {
        role: agent.role,
        task_description: task.description,
        use_emergent_key: true
      });

      const updatedAgents = [...generatedTeam.agents];
      updatedAgents[agentIndex] = {
        ...updatedAgents[agentIndex],
        goal: response.data.goal,
        backstory: response.data.backstory
      };

      updateGeneratedTeam({ agents: updatedAgents });
    } catch (error) {
      console.error("Error regenerating persona:", error);
      alert("Error regenerating persona. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const updateTask = (taskIndex, updates) => {
    const updatedTasks = [...generatedTeam.tasks];
    updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], ...updates };
    updateGeneratedTeam({ tasks: updatedTasks });
  };

  const updateAgent = (agentIndex, updates) => {
    const updatedAgents = [...generatedTeam.agents];
    updatedAgents[agentIndex] = { ...updatedAgents[agentIndex], ...updates };
    updateGeneratedTeam({ agents: updatedAgents });
  };

  const toggleTool = (toolId) => {
    const currentTools = generatedTeam.recommended_tools || [];
    const updatedTools = currentTools.includes(toolId)
      ? currentTools.filter(id => id !== toolId)
      : [...currentTools, toolId];
    
    updateGeneratedTeam({ recommended_tools: updatedTools });
  };

  const moveTask = (fromIndex, toIndex) => {
    const updatedTasks = [...generatedTeam.tasks];
    const [movedTask] = updatedTasks.splice(fromIndex, 1);
    updatedTasks.splice(toIndex, 0, movedTask);
    
    // Update order
    updatedTasks.forEach((task, index) => {
      task.order = index + 1;
    });
    
    updateGeneratedTeam({ tasks: updatedTasks });
  };

  const addNewTask = () => {
    const newTask = {
      id: Date.now().toString(),
      title: "New Task",
      description: "Task description...",
      order: generatedTeam.tasks.length + 1
    };
    
    const updatedTasks = [...generatedTeam.tasks, newTask];
    updateGeneratedTeam({ tasks: updatedTasks });
    setEditingTask(generatedTeam.tasks.length);
  };

  const removeTask = (taskIndex) => {
    const updatedTasks = generatedTeam.tasks.filter((_, i) => i !== taskIndex);
    const updatedAgents = generatedTeam.agents.filter(agent => 
      agent.task_id !== generatedTeam.tasks[taskIndex].id
    );
    
    updateGeneratedTeam({ 
      tasks: updatedTasks,
      agents: updatedAgents
    });
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        ✨ Your AI-Generated Team Configuration
      </h2>
      <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg">
        Review and customize your intelligent team configuration. All elements are editable.
      </p>

      {/* AI Explanation */}
      <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <h3 className="font-medium text-green-800 dark:text-green-200 mb-2 flex items-center">
          <span className="mr-2">🧠</span> AI Analysis
        </h3>
        <p className="text-green-700 dark:text-green-300 text-sm">
          {generatedTeam.explanation}
        </p>
      </div>

      {/* Tasks Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            📋 Task Breakdown ({generatedTeam.tasks.length} tasks)
          </h3>
          <button
            onClick={addNewTask}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
          >
            + Add Task
          </button>
        </div>
        
        <div className="space-y-3">
          {generatedTeam.tasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              index={index}
              isEditing={editingTask === index}
              onEdit={() => setEditingTask(editingTask === index ? null : index)}
              onUpdate={(updates) => updateTask(index, updates)}
              onMove={moveTask}
              onRemove={() => removeTask(index)}
              totalTasks={generatedTeam.tasks.length}
            />
          ))}
        </div>
      </div>

      {/* Agents Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
          👥 Agent Team ({generatedTeam.agents.length} agents)
        </h3>
        
        <div className="grid gap-4">
          {generatedTeam.agents.map((agent, index) => {
            const correspondingTask = generatedTeam.tasks.find(t => t.id === agent.task_id);
            return (
              <AgentCard
                key={agent.id}
                agent={agent}
                task={correspondingTask}
                index={index}
                isEditing={editingAgent === index}
                onEdit={() => setEditingAgent(editingAgent === index ? null : index)}
                onUpdate={(updates) => updateAgent(index, updates)}
                onRegenerate={() => regeneratePersona(index)}
                isRegenerating={isRegenerating}
              />
            );
          })}
        </div>
      </div>

      {/* Tools Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
          🛠️ Recommended Tools ({(generatedTeam.recommended_tools || []).length} selected)
        </h3>
        
        <ToolSelectionGrid
          availableTools={availableTools}
          selectedTools={generatedTeam.recommended_tools || []}
          onToggleTool={toggleTool}
        />
      </div>

      {/* Workflow Type */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
          🔄 Workflow Configuration
        </h3>
        
        <div className="flex space-x-4">
          <WorkflowOption
            type="sequential"
            isSelected={generatedTeam.workflow_type === "sequential"}
            onClick={() => updateGeneratedTeam({ workflow_type: "sequential" })}
          />
          <WorkflowOption
            type="hierarchical"
            isSelected={generatedTeam.workflow_type === "hierarchical"}
            onClick={() => updateGeneratedTeam({ workflow_type: "hierarchical" })}
          />
        </div>
      </div>

      {/* Generate YAML Button */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={onGenerateYaml}
          disabled={isGenerating}
          className="w-full px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-700 hover:to-blue-700 transition-all duration-300 text-lg shadow-lg"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating YAML...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <span className="mr-2">🚀</span>
              Generate CrewAI YAML Configuration
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

// Task Card Component with Inline Editing
const TaskCard = ({ task, index, isEditing, onEdit, onUpdate, onMove, onRemove, totalTasks }) => {
  const [editValues, setEditValues] = useState({ title: task.title, description: task.description });

  const handleSave = () => {
    onUpdate(editValues);
    onEdit();
  };

  const handleCancel = () => {
    setEditValues({ title: task.title, description: task.description });
    onEdit();
  };

  return (
    <div className="flex items-start space-x-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
      <div className="flex flex-col items-center space-y-1">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
          {index + 1}
        </div>
        <div className="flex flex-col space-y-1">
          {index > 0 && (
            <button onClick={() => onMove(index, index - 1)} className="text-slate-400 hover:text-slate-600 text-xs">
              ↑
            </button>
          )}
          {index < totalTasks - 1 && (
            <button onClick={() => onMove(index, index + 1)} className="text-slate-400 hover:text-slate-600 text-xs">
              ↓
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1">
        {isEditing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editValues.title}
              onChange={(e) => setEditValues({...editValues, title: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-slate-600 dark:text-slate-100"
            />
            <textarea
              value={editValues.description}
              onChange={(e) => setEditValues({...editValues, description: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-slate-600 dark:text-slate-100"
            />
            <div className="flex space-x-2">
              <button onClick={handleSave} className="px-3 py-1 bg-green-600 text-white rounded text-sm">
                Save
              </button>
              <button onClick={handleCancel} className="px-3 py-1 bg-slate-600 text-white rounded text-sm">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h4 className="font-medium text-slate-800 dark:text-slate-100">{task.title}</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{task.description}</p>
          </>
        )}
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={onEdit}
          className="text-blue-500 hover:text-blue-700 text-sm"
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 text-sm"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

// Agent Card Component
const AgentCard = ({ agent, task, index, isEditing, onEdit, onUpdate, onRegenerate, isRegenerating }) => {
  const [editValues, setEditValues] = useState({
    role: agent.role,
    goal: agent.goal,
    backstory: agent.backstory
  });

  const handleSave = () => {
    onUpdate(editValues);
    onEdit();
  };

  const handleCancel = () => {
    setEditValues({
      role: agent.role,
      goal: agent.goal,
      backstory: agent.backstory
    });
    onEdit();
  };

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-medium">
            {index + 1}
          </div>
          <div>
            <h4 className="font-medium text-slate-800 dark:text-slate-100">
              {isEditing ? (
                <input
                  type="text"
                  value={editValues.role}
                  onChange={(e) => setEditValues({...editValues, role: e.target.value})}
                  className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-600 dark:text-slate-100"
                />
              ) : (
                agent.role
              )}
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              → {task?.title || "No task assigned"}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="text-blue-500 hover:text-blue-700 text-sm"
          >
            {isEditing ? "Cancel" : "Edit"}
          </button>
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="text-purple-500 hover:text-purple-700 text-sm disabled:opacity-50"
          >
            {isRegenerating ? "⏳" : "🔄"} Regenerate
          </button>
        </div>
      </div>
      
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Goal:</label>
            <textarea
              value={editValues.goal}
              onChange={(e) => setEditValues({...editValues, goal: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-slate-600 dark:text-slate-100 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Backstory:</label>
            <textarea
              value={editValues.backstory}
              onChange={(e) => setEditValues({...editValues, backstory: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-slate-600 dark:text-slate-100 text-sm"
            />
          </div>
          <div className="flex space-x-2">
            <button onClick={handleSave} className="px-3 py-1 bg-green-600 text-white rounded text-sm">
              Save
            </button>
            <button onClick={handleCancel} className="px-3 py-1 bg-slate-600 text-white rounded text-sm">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-slate-700 dark:text-slate-300">Goal:</span>
            <p className="text-slate-600 dark:text-slate-400">{agent.goal}</p>
          </div>
          <div>
            <span className="font-medium text-slate-700 dark:text-slate-300">Backstory:</span>
            <p className="text-slate-600 dark:text-slate-400">{agent.backstory}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Tool Selection Grid
const ToolSelectionGrid = ({ availableTools, selectedTools, onToggleTool }) => {
  const toolsByCategory = availableTools.reduce((acc, tool) => {
    const category = tool.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(tool);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(toolsByCategory).map(([category, tools]) => (
        <div key={category}>
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">{category}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tools.map((tool) => (
              <div
                key={tool.id}
                onClick={() => onToggleTool(tool.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedTools.includes(tool.id)
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-slate-200 dark:border-slate-600 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedTools.includes(tool.id)}
                    onChange={() => onToggleTool(tool.id)}
                    className="mt-1"
                  />
                  <div>
                    <h5 className="font-medium text-slate-800 dark:text-slate-100 text-sm">{tool.name}</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{tool.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Workflow Option Component
const WorkflowOption = ({ type, isSelected, onClick }) => {
  const config = {
    sequential: {
      title: "Sequential Process",
      description: "Agents work one after another in a defined order. Perfect for tasks that build upon each other.",
      icon: "→"
    },
    hierarchical: {
      title: "Hierarchical Process", 
      description: "A manager agent coordinates and delegates tasks to worker agents. Best for complex projects.",
      icon: "🏗️"
    }
  };

  return (
    <div
      onClick={onClick}
      className={`flex-1 p-4 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : "border-slate-200 dark:border-slate-600 hover:border-slate-300"
      }`}
    >
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-lg">{config[type].icon}</span>
        <h4 className="font-medium text-slate-800 dark:text-slate-100">{config[type].title}</h4>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">{config[type].description}</p>
    </div>
  );
};

// Step 3: YAML Generation Result
export const Step3YamlGeneration = ({ missionData, generatedYaml, onDownload }) => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6">
        🎉 Your CrewAI Configuration is Ready!
      </h2>
      <p className="text-slate-600 dark:text-slate-300 mb-8 text-lg">
        Your AI agent team configuration has been generated and is ready for use with CrewAI framework.
      </p>

      <div className="space-y-6">
        {/* Success Banner */}
        <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white text-xl">
              ✓
            </div>
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200">
                Configuration Generated Successfully!
              </h3>
              <p className="text-green-700 dark:text-green-300 text-sm">
                Your YAML file is 100% compatible with CrewAI framework and ready for immediate use.
              </p>
            </div>
          </div>
        </div>

        {/* Download Button */}
        <div className="flex justify-center">
          <button
            onClick={onDownload}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-300 text-lg shadow-lg"
          >
            <span className="flex items-center">
              <span className="mr-2">📥</span>
              Download {missionData.name.replace(/\s+/g, '_').toLowerCase()}_crew.yaml
            </span>
          </button>
        </div>

        {/* YAML Preview */}
        <div>
          <h3 className="font-medium text-slate-800 dark:text-slate-100 mb-3">YAML Configuration Preview:</h3>
          <div className="relative">
            <pre className="bg-slate-900 text-green-400 p-6 rounded-lg text-sm overflow-x-auto border">
              {generatedYaml}
            </pre>
            <button
              onClick={() => navigator.clipboard.writeText(generatedYaml)}
              className="absolute top-2 right-2 px-3 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Next Steps */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">🚀 Next Steps:</h4>
          <ol className="text-blue-700 dark:text-blue-300 text-sm space-y-2">
            <li>1. Download your YAML configuration file</li>
            <li>2. Install CrewAI in your Python environment: <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">pip install crewai</code></li>
            <li>3. Place the YAML file in your CrewAI project directory</li>
            <li>4. Run your CrewAI project with the generated configuration</li>
          </ol>
        </div>
      </div>
    </div>
  );
};