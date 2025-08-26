from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Literal
import uuid
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Data Models for the 6-step wizard

class Mission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    objective: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    order: int

class Agent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str
    role: str
    goal: str
    backstory: str

class Tool(BaseModel):
    id: str
    name: str
    description: str
    class_name: str

class AgentTeam(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mission: Mission
    tasks: List[Task]
    agents: List[Agent]
    selected_tools: List[str]  # List of tool IDs
    workflow_type: Literal["sequential", "hierarchical"]
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Request/Response Models
class MissionCreate(BaseModel):
    name: str
    objective: str
    description: Optional[str] = None

class TaskCreate(BaseModel):
    title: str
    description: str

class GeneratePersonaRequest(BaseModel):
    role: str
    task_description: str
    use_emergent_key: bool = True
    openai_api_key: Optional[str] = None

class PersonaResponse(BaseModel):
    goal: str
    backstory: str

class CreateTeamRequest(BaseModel):
    mission: Mission
    tasks: List[Task]
    agents: List[Agent]
    selected_tools: List[str]
    workflow_type: Literal["sequential", "hierarchical"]

class YAMLGenerateRequest(BaseModel):
    team_id: str

# Predefined CrewAI tools
AVAILABLE_TOOLS = [
    {"id": "google_search", "name": "Google Search", "description": "Search Google for information", "class_name": "SerperDevTool"},
    {"id": "website_search", "name": "Website Search", "description": "Search specific websites for content", "class_name": "WebsiteSearchTool"},
    {"id": "file_read", "name": "Read a File", "description": "Read and analyze file contents", "class_name": "FileReadTool"},
]

# API Endpoints

@api_router.get("/")
async def root():
    return {"message": "AI Agent Team Configuration API"}

@api_router.get("/tools")
async def get_available_tools():
    """Get list of available CrewAI tools"""
    return {"tools": AVAILABLE_TOOLS}

@api_router.post("/generate-persona", response_model=PersonaResponse)
async def generate_persona(request: GeneratePersonaRequest):
    """Generate AI persona (goal + backstory) from role and task description"""
    try:
        # Determine which API key to use
        if request.use_emergent_key:
            api_key = os.environ.get('EMERGENT_LLM_KEY')
            if not api_key:
                raise HTTPException(status_code=500, detail="Emergent LLM key not configured")
        else:
            if not request.openai_api_key or not request.openai_api_key.strip():
                raise HTTPException(status_code=400, detail="OpenAI API key required when not using Emergent key")
            api_key = request.openai_api_key
        
        # Initialize LLM chat
        chat = LlmChat(
            api_key=api_key,
            session_id=f"persona-{uuid.uuid4()}",
            system_message="You are an expert at creating detailed AI agent personas for multi-agent systems. Generate compelling, professional agent goals and backstories."
        ).with_model("openai", "gpt-4o-mini")
        
        # Create prompt for persona generation
        prompt = f"""Create a detailed persona for an AI agent with the following specifications:

Role: {request.role}
Task: {request.task_description}

Please generate EXACTLY in this JSON format:
{{
  "goal": "A clear, action-oriented goal statement for this agent (1-2 sentences)",
  "backstory": "A compelling professional backstory that explains the agent's expertise and experience (2-3 sentences)"
}}

The goal should be specific to the task and role. The backstory should establish credibility and expertise.
Respond with ONLY the JSON, no additional text."""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse the JSON response
        import json
        try:
            persona_data = json.loads(response.strip())
            return PersonaResponse(
                goal=persona_data["goal"],
                backstory=persona_data["backstory"]
            )
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            lines = response.strip().split('\n')
            goal = f"Execute {request.role.lower()} responsibilities with expertise and attention to detail."
            backstory = f"A seasoned {request.role.lower()} with extensive experience in handling complex challenges and delivering high-quality results."
            
            return PersonaResponse(goal=goal, backstory=backstory)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating persona: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate persona")

@api_router.post("/teams", response_model=dict)
async def create_team(request: CreateTeamRequest):
    """Save a complete agent team configuration"""
    try:
        team = AgentTeam(
            mission=request.mission,
            tasks=request.tasks,
            agents=request.agents,
            selected_tools=request.selected_tools,
            workflow_type=request.workflow_type
        )
        
        # Save to database
        team_dict = team.dict()
        result = await db.agent_teams.insert_one(team_dict)
        
        return {"success": True, "team_id": team.id}
        
    except Exception as e:
        logger.error(f"Error creating team: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create team: {str(e)}")

@api_router.get("/teams/{team_id}")
async def get_team(team_id: str):
    """Get a specific team by ID"""
    try:
        team = await db.agent_teams.find_one({"id": team_id})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Remove MongoDB ObjectId to avoid serialization issues
        if "_id" in team:
            del team["_id"]
        
        return team
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving team: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve team")

@api_router.post("/generate-yaml")
async def generate_yaml(request: YAMLGenerateRequest):
    """Generate CrewAI-compatible YAML configuration"""
    try:
        # Get team data
        team = await db.agent_teams.find_one({"id": request.team_id})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Generate YAML content
        yaml_content = generate_crewai_yaml(team)
        
        return {"yaml": yaml_content, "filename": f"{team['mission']['name'].replace(' ', '_').lower()}_crew.yaml"}
        
    except Exception as e:
        logger.error(f"Error generating YAML: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate YAML: {str(e)}")

def generate_crewai_yaml(team_data: dict) -> str:
    """Generate CrewAI-compatible YAML configuration"""
    
    # Map selected tool IDs to class names
    tool_mapping = {tool["id"]: tool["class_name"] for tool in AVAILABLE_TOOLS}
    selected_tool_classes = [tool_mapping.get(tool_id, tool_id) for tool_id in team_data["selected_tools"]]
    
    yaml_content = f"""# {team_data['mission']['name']} - AI Agent Team Configuration
# Generated by AI Agent Team Configuration Wizard

agents:"""
    
    # Add agents
    for agent in team_data["agents"]:
        yaml_content += f"""
  - role: {agent['role']}
    goal: {agent['goal']}
    backstory: {agent['backstory']}"""
    
    yaml_content += f"""

tasks:"""
    
    # Add tasks
    for i, task in enumerate(team_data["tasks"]):
        corresponding_agent = team_data["agents"][i] if i < len(team_data["agents"]) else team_data["agents"][0]
        yaml_content += f"""
  - description: {task['description']}
    agent: {corresponding_agent['role']}
    expected_output: Complete and accurate results for the task"""
    
    yaml_content += f"""

tools:"""
    
    # Add tools
    for tool_class in selected_tool_classes:
        yaml_content += f"""
  - {tool_class}"""
    
    yaml_content += f"""

process: {team_data['workflow_type']}

# Mission: {team_data['mission']['objective']}
# Description: {team_data['mission'].get('description', 'No description provided')}
"""
    
    return yaml_content

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()