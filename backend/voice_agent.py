import asyncio
import json
import logging
import os
from typing import Dict, Optional, List
from livekit import agents, rtc
from livekit.agents import JobContext, WorkerOptions, cli
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import deepgram, openai, silero
import aiohttp
from emergentintegrations.llm.chat import LlmChat, UserMessage
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger("crewai-voice-agent")

class CrewAIConversationContext:
    def __init__(self):
        self.conversation_history: List[Dict[str, str]] = []
        self.extracted_requirements = {
            "mission_name": "",
            "mission_objective": "",
            "mission_description": "",
            "industry": "",
            "target_audience": "",
            "goals": []
        }
        self.state = "greeting"  # greeting -> collecting -> analyzing -> generating -> reviewing
        self.generated_team = None

    def add_message(self, role: str, content: str):
        """Add a message to conversation history"""
        self.conversation_history.append({
            "role": role,
            "content": content,
            "timestamp": str(asyncio.get_event_loop().time())
        })

    def extract_requirements_from_history(self) -> Dict:
        """Extract structured requirements from conversation history"""
        # Combine user messages to analyze
        user_messages = [msg["content"] for msg in self.conversation_history if msg["role"] == "user"]
        combined_text = " ".join(user_messages).lower()
        
        # Simple keyword extraction (in production, use more sophisticated NLP)
        requirements = self.extracted_requirements.copy()
        
        # Extract mission type from keywords
        mission_keywords = {
            "marketing": "Marketing Campaign",
            "sales": "Sales Growth Initiative", 
            "website": "Website Optimization Project",
            "ecommerce": "E-commerce Growth Strategy",
            "customer": "Customer Experience Enhancement",
            "content": "Content Strategy Development"
        }
        
        for keyword, mission_type in mission_keywords.items():
            if keyword in combined_text:
                requirements["mission_name"] = mission_type
                break
        
        if not requirements["mission_name"]:
            requirements["mission_name"] = "Business Growth Project"
        
        # Use full conversation as objective
        requirements["mission_objective"] = " ".join(user_messages)
        requirements["mission_description"] = f"Project requirements extracted from conversation: {combined_text[:300]}..."
        
        return requirements

    def should_generate_team(self) -> bool:
        """Determine if we have enough information to generate AI team"""
        user_messages = [msg for msg in self.conversation_history if msg["role"] == "user"]
        
        # Need at least 2 meaningful exchanges
        if len(user_messages) < 2:
            return False
            
        # Check for business context
        combined_text = " ".join([msg["content"].lower() for msg in user_messages])
        
        has_business_goal = any(keyword in combined_text for keyword in [
            "increase", "improve", "grow", "boost", "optimize", "enhance", 
            "marketing", "sales", "business", "website", "customers"
        ])
        
        has_specific_context = any(keyword in combined_text for keyword in [
            "company", "store", "website", "product", "service", "online",
            "conversion", "traffic", "revenue", "customers"
        ])
        
        return has_business_goal and has_specific_context

class CrewAIVoiceAgent:
    def __init__(self):
        self.api_base_url = os.getenv("API_BASE_URL", "http://localhost:8001/api")
        self.context = CrewAIConversationContext()
        
    async def generate_conversational_response(self, user_input: str) -> str:
        """Generate contextual response using LLM"""
        try:
            self.context.add_message("user", user_input)
            
            # Create conversational LLM
            api_key = os.environ.get('EMERGENT_LLM_KEY')
            if not api_key:
                return "I apologize, but I'm having trouble connecting to my AI services. Please try again later."
            
            chat = LlmChat(
                api_key=api_key,
                session_id="voice-conversation",
                system_message=self._get_system_prompt()
            ).with_model("openai", "gpt-4o-mini")
            
            # Create context-aware prompt
            conversation_context = self._build_conversation_context()
            
            prompt = f"""
Context: {conversation_context}

User just said: "{user_input}"

Current conversation state: {self.context.state}

Respond naturally and conversationally. Ask ONE follow-up question to gather more information about their business needs. Keep responses to 2-3 sentences maximum.

If you have enough information to create their AI team (they've mentioned business goals and some context), end your response with "READY_TO_GENERATE" on a new line.
"""
            
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            # Check if ready to generate team
            if "READY_TO_GENERATE" in response:
                response = response.replace("READY_TO_GENERATE", "").strip()
                self.context.state = "generating"
                
                # Trigger team generation
                await self._generate_ai_team()
                
                if self.context.generated_team:
                    team_summary = self._create_team_summary()
                    response += f"\n\n{team_summary}"
                    self.context.state = "reviewing"
            
            self.context.add_message("assistant", response)
            return response
            
        except Exception as e:
            logger.error(f"Error generating response: {str(e)}")
            return "I apologize, but I encountered an issue. Could you please repeat that?"
    
    def _get_system_prompt(self) -> str:
        return """You are a friendly, expert AI assistant specialized in creating AI agent teams for business automation. 

Your role is to have natural conversations with users to understand their business needs, then help them create specialized AI teams.

Conversation style:
- Be conversational, warm, and encouraging
- Ask ONE follow-up question at a time
- Use simple, non-technical language
- Show genuine interest in their business
- Keep responses concise (2-3 sentences max)

Your goal is to understand:
1. What type of business/project they have
2. What specific challenge or goal they want to address
3. Who their target audience/customers are
4. What success looks like to them

Once you have this basic information, you can help them create their AI team."""

    def _build_conversation_context(self) -> str:
        """Build conversation context for LLM"""
        if not self.context.conversation_history:
            return "New conversation starting."
        
        recent_messages = self.context.conversation_history[-4:]  # Last 2 exchanges
        context_parts = []
        
        for msg in recent_messages:
            role = "User" if msg["role"] == "user" else "Assistant"
            content = msg["content"][:150] + ("..." if len(msg["content"]) > 150 else "")
            context_parts.append(f"{role}: {content}")
        
        return " | ".join(context_parts)
    
    async def _generate_ai_team(self):
        """Generate AI team using the intelligent team generation API"""
        try:
            requirements = self.context.extract_requirements_from_history()
            
            async with aiohttp.ClientSession() as session:
                payload = {
                    "mission_name": requirements["mission_name"],
                    "mission_objective": requirements["mission_objective"],
                    "mission_description": requirements["mission_description"],
                    "use_emergent_key": True
                }
                
                async with session.post(
                    f"{self.api_base_url}/generate-intelligent-team",
                    json=payload
                ) as response:
                    if response.status == 200:
                        self.context.generated_team = await response.json()
                        logger.info("AI team generated successfully")
                    else:
                        logger.error(f"Failed to generate team: {response.status}")
                        
        except Exception as e:
            logger.error(f"Error generating AI team: {str(e)}")
    
    def _create_team_summary(self) -> str:
        """Create a conversational summary of the generated team"""
        if not self.context.generated_team:
            return "I've prepared your team configuration. Would you like me to tell you about it?"
        
        try:
            team = self.context.generated_team
            agents = team.get("agents", [])
            tasks = team.get("tasks", [])
            tools = team.get("recommended_tools", [])
            
            summary = f"Perfect! I've created a specialized team of {len(agents)} AI agents for you:\n\n"
            
            for i, agent in enumerate(agents[:3], 1):  # Limit to first 3 agents for voice
                role = agent.get("role", f"Agent {i}")
                summary += f"{i}. {role} - who will handle the specialized work for this area\n"
            
            summary += f"\nThey'll work together using {len(tools)} specialized tools "
            summary += f"in a {team.get('workflow_type', 'sequential')} workflow. "
            summary += "Would you like me to generate your CrewAI configuration file now?"
            
            return summary
            
        except Exception as e:
            logger.error(f"Error creating team summary: {str(e)}")
            return "Your AI team is ready! Would you like me to generate the configuration file?"

# LiveKit Agent Implementation
async def entrypoint(ctx: JobContext):
    """Main entrypoint for the LiveKit voice agent"""
    
    # Initialize our CrewAI voice agent
    crewai_agent = CrewAIVoiceAgent()
    
    # Initial conversation context
    initial_ctx = agents.llm.ChatContext()
    initial_ctx.messages.append(
        agents.llm.ChatMessage(
            role="assistant",
            content="Hello! I'm your AI assistant specialized in creating AI agent teams. I'd love to help you build the perfect team for your business. What kind of project or challenge are you working on?"
        )
    )
    
    # Connect to the room
    await ctx.connect(auto_subscribe=agents.AutoSubscribe.AUDIO_ONLY)
    logger.info(f"Connected to room: {ctx.room.name}")
    
    # Create the voice assistant with our custom logic
    assistant = VoiceAssistant(
        vad=silero.VAD.load(),
        stt=deepgram.STT(model="nova-2-general"),
        llm=openai.LLM(model="gpt-4o-mini"),  # We'll override this with our custom logic
        tts=openai.TTS(voice="nova"),
        chat_ctx=initial_ctx,
    )
    
    # Override the LLM with our custom CrewAI logic
    @assistant.on("user_speech_committed")
    async def on_user_speech(user_msg: str):
        """Handle user speech input with our CrewAI logic"""
        try:
            logger.info(f"User said: {user_msg}")
            
            # Generate response using our CrewAI agent
            response = await crewai_agent.generate_conversational_response(user_msg)
            
            # Have the assistant speak the response
            await assistant.say(response)
            
        except Exception as e:
            logger.error(f"Error processing user speech: {str(e)}")
            await assistant.say("I apologize, I had trouble understanding that. Could you please try again?")
    
    # Start the assistant
    assistant.start(ctx.room)
    
    # Send initial greeting
    await asyncio.sleep(1)  # Small delay to ensure connection is stable
    await assistant.say("Hello! I'm your AI assistant specialized in creating AI agent teams. What kind of business project or challenge would you like help with today?")
    
    # Keep the agent running
    await assistant.aclose()

if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run the LiveKit agent
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))