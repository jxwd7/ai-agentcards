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
from livekit import api
import time

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

class IntelligentTeamRequest(BaseModel):
    mission_name: str
    mission_objective: str
    mission_description: Optional[str] = None
    use_emergent_key: bool = True
    openai_api_key: Optional[str] = None

class IntelligentTeamResponse(BaseModel):
    mission: Mission
    tasks: List[Task]
    agents: List[Agent]
    recommended_tools: List[str]
    workflow_type: Literal["sequential", "hierarchical"]
    explanation: str

class YAMLGenerateRequest(BaseModel):
    team_id: str

# Comprehensive CrewAI tools catalog
AVAILABLE_TOOLS = [
    # Search & Research
    {"id": "serper_search", "name": "Google Search", "description": "Perform web searches and retrieve search results", "class_name": "SerperDevTool", "category": "Search & Research"},
    {"id": "website_search", "name": "Website Search", "description": "Search website content, optimized for web data extraction", "class_name": "WebsiteSearchTool", "category": "Search & Research"},
    {"id": "exa_search", "name": "EXA Search", "description": "Perform exhaustive searches across various data sources", "class_name": "EXASearchTool", "category": "Search & Research"},
    {"id": "github_search", "name": "GitHub Search", "description": "Search within GitHub repositories for code and documentation", "class_name": "GithubSearchTool", "category": "Search & Research"},
    {"id": "youtube_channel_search", "name": "YouTube Channel Search", "description": "Search within YouTube channels for video content analysis", "class_name": "YoutubeChannelSearchTool", "category": "Search & Research"},
    {"id": "youtube_video_search", "name": "YouTube Video Search", "description": "Search within YouTube videos for data extraction", "class_name": "YoutubeVideoSearchTool", "category": "Search & Research"},
    
    # File & Document Management
    {"id": "file_read", "name": "File Reader", "description": "Read content from various file types, including text and markdown", "class_name": "FileReadTool", "category": "File & Document"},
    {"id": "file_write", "name": "File Writer", "description": "Write content to files, create new documents, and save processed data", "class_name": "FileWriteTool", "category": "File & Document"},
    {"id": "pdf_search", "name": "PDF Search", "description": "Search and extract text from PDF documents efficiently", "class_name": "PDFSearchTool", "category": "File & Document"},
    {"id": "docx_search", "name": "Word Document Search", "description": "Search through Microsoft Word documents and extract relevant content", "class_name": "DOCXSearchTool", "category": "File & Document"},
    {"id": "json_search", "name": "JSON Search", "description": "Parse and search through JSON files with advanced query capabilities", "class_name": "JSONSearchTool", "category": "File & Document"},
    {"id": "csv_search", "name": "CSV Search", "description": "Process and search through CSV files, extracting specific rows and columns", "class_name": "CSVSearchTool", "category": "File & Document"},
    {"id": "directory_read", "name": "Directory Reader", "description": "Read and list directory contents, file structures, and metadata", "class_name": "DirectoryReadTool", "category": "File & Document"},
    
    # Web Scraping & Browsing
    {"id": "scrape_website", "name": "Website Scraper", "description": "Facilitates scraping entire websites for comprehensive data collection", "class_name": "ScrapeWebsiteTool", "category": "Web Scraping"},
    {"id": "selenium_scraping", "name": "Selenium Scraper", "description": "Allows for precise extraction of content from web pages using CSS selectors", "class_name": "SeleniumScrapingTool", "category": "Web Scraping"},
    {"id": "firecrawl_search", "name": "Firecrawl Search", "description": "Search webpages using Firecrawl and return the results", "class_name": "FirecrawlSearchTool", "category": "Web Scraping"},
    
    # Database & Data
    {"id": "pg_search", "name": "PostgreSQL Search", "description": "Optimized for searching within PostgreSQL databases", "class_name": "PGSearchTool", "category": "Database & Data"},
    {"id": "mysql_search", "name": "MySQL Search", "description": "Interact with MySQL databases for data retrieval", "class_name": "MySQLSearchTool", "category": "Database & Data"},
    {"id": "nl2sql", "name": "Natural Language to SQL", "description": "Convert natural language queries into SQL commands", "class_name": "NL2SQLTool", "category": "Database & Data"},
    
    # AI & Machine Learning
    {"id": "dalle_tool", "name": "DALL-E Image Generator", "description": "Generate images using the DALL-E API", "class_name": "DALL-ETool", "category": "AI & ML"},
    {"id": "vision_tool", "name": "Vision Tool", "description": "Process vision tasks and analyze images", "class_name": "VisionTool", "category": "AI & ML"},
    {"id": "code_interpreter", "name": "Code Interpreter", "description": "Interpret and execute Python code", "class_name": "CodeInterpreterTool", "category": "AI & ML"},
    
    # Communication & Collaboration
    {"id": "gmail_tool", "name": "Gmail", "description": "Manage emails and drafts", "class_name": "GmailTool", "category": "Communication"},
    {"id": "slack_tool", "name": "Slack", "description": "Send workspace notifications and alerts", "class_name": "SlackTool", "category": "Communication"},
    
    # Project Management
    {"id": "jira_tool", "name": "Jira", "description": "Issue tracking and project management", "class_name": "JiraTool", "category": "Project Management"},
    {"id": "github_tool", "name": "GitHub", "description": "Repository and issue management", "class_name": "GitHubTool", "category": "Project Management"},
    {"id": "notion_tool", "name": "Notion", "description": "Page and database management", "class_name": "NotionTool", "category": "Project Management"},
    
    # Business & Finance
    {"id": "stripe_tool", "name": "Stripe", "description": "Payment processing and customer management", "class_name": "StripeTool", "category": "Business & Finance"},
    {"id": "salesforce_tool", "name": "Salesforce", "description": "CRM account and opportunity management", "class_name": "SalesforceTool", "category": "Business & Finance"},
    
    # Productivity & Storage
    {"id": "google_sheets", "name": "Google Sheets", "description": "Spreadsheet data synchronization", "class_name": "GoogleSheetsTool", "category": "Productivity"},
    {"id": "google_calendar", "name": "Google Calendar", "description": "Event and schedule management", "class_name": "GoogleCalendarTool", "category": "Productivity"},
]

# API Endpoints

@api_router.get("/")
async def root():
    return {"message": "AI Agent Team Configuration API"}

@api_router.get("/tools")
async def get_available_tools():
    """Get list of available CrewAI tools"""
    return {"tools": AVAILABLE_TOOLS}

@api_router.post("/generate-intelligent-team", response_model=IntelligentTeamResponse)
async def generate_intelligent_team(request: IntelligentTeamRequest):
    """Generate complete AI team configuration from mission statement"""
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
            session_id=f"intelligent-team-{uuid.uuid4()}",
            system_message="You are an expert at creating comprehensive AI agent teams for CrewAI framework. Analyze missions and create complete team configurations with tasks, agents, tools, and workflows."
        ).with_model("openai", "gpt-4o-mini")
        
        # Create comprehensive prompt for intelligent team generation
        tools_info = "\n".join([f"- {tool['name']}: {tool['description']} (Class: {tool['class_name']}, Category: {tool['category']})" for tool in AVAILABLE_TOOLS])
        
        prompt = f"""Analyze this mission and generate a complete AI agent team configuration:

MISSION DETAILS:
- Name: {request.mission_name}
- Objective: {request.mission_objective}
- Description: {request.mission_description or "No additional context provided"}

AVAILABLE CREWAI TOOLS:
{tools_info}

Generate a comprehensive JSON response with this EXACT structure:
{{
  "tasks": [
    {{
      "title": "Task Name",
      "description": "Detailed task description",
      "order": 1
    }}
  ],
  "agents": [
    {{
      "task_index": 0,
      "role": "Expert Role Name",
      "goal": "Specific, actionable goal statement (1-2 sentences)",
      "backstory": "Compelling professional backstory establishing expertise (2-3 sentences)"
    }}
  ],
  "recommended_tools": ["tool_id_1", "tool_id_2"],
  "workflow_type": "sequential" or "hierarchical",
  "explanation": "Brief explanation of why this team structure was chosen"
}}

REQUIREMENTS:
1. Generate 3-5 logical sequential tasks that build toward the mission objective
2. Create one specialized agent per task with relevant expertise
3. Recommend 3-8 appropriate tools from the available list based on task requirements
4. Choose workflow type: "sequential" for step-by-step tasks, "hierarchical" for complex coordination
5. Ensure tasks are specific, measurable, and achievable
6. Make agent roles specific and expert-level (e.g., "Digital Marketing Strategist" not just "Marketer")
7. Agent goals should be task-specific and actionable
8. Agent backstories should establish credibility and relevant experience

Respond with ONLY the JSON, no additional text or formatting."""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse the JSON response
        import json
        try:
            team_config = json.loads(response.strip())
            
            # Create mission object
            mission = Mission(
                name=request.mission_name,
                objective=request.mission_objective,
                description=request.mission_description
            )
            
            # Create tasks
            tasks = []
            for i, task_data in enumerate(team_config["tasks"]):
                task = Task(
                    title=task_data["title"],
                    description=task_data["description"],
                    order=task_data.get("order", i + 1)
                )
                tasks.append(task)
            
            # Create agents
            agents = []
            for agent_data in team_config["agents"]:
                task_index = agent_data.get("task_index", 0)
                if task_index < len(tasks):
                    agent = Agent(
                        task_id=tasks[task_index].id,
                        role=agent_data["role"],
                        goal=agent_data["goal"],
                        backstory=agent_data["backstory"]
                    )
                    agents.append(agent)
            
            # Validate recommended tools
            valid_tool_ids = {tool["id"] for tool in AVAILABLE_TOOLS}
            recommended_tools = [
                tool_id for tool_id in team_config["recommended_tools"] 
                if tool_id in valid_tool_ids
            ]
            
            return IntelligentTeamResponse(
                mission=mission,
                tasks=tasks,
                agents=agents,
                recommended_tools=recommended_tools,
                workflow_type=team_config["workflow_type"],
                explanation=team_config["explanation"]
            )
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {str(e)}, Response: {response}")
            raise HTTPException(status_code=500, detail="Failed to parse AI response")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating intelligent team: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate intelligent team")

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
        
        # Remove MongoDB ObjectId to avoid serialization issues
        if "_id" in team:
            del team["_id"]
        
        # Generate YAML content
        yaml_content = generate_crewai_yaml(team)
        
        return {"yaml": yaml_content, "filename": f"{team['mission']['name'].replace(' ', '_').lower()}_crew.yaml"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating YAML: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate YAML")

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