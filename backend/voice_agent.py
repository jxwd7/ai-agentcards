import asyncio
import json
import logging
import os
from typing import Dict, Optional
from livekit import rtc, api
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import deepgram, openai, silero
import aiohttp
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger("voice-agent")

class CrewAIVoiceAgent:
    def __init__(self):
        self.api_base_url = "http://localhost:8001/api"
        self.conversation_context = []
        self.generated_team = None
        self.current_state = "greeting"  # greeting, collecting_info, generating, reviewing, complete
        
    async def create_conversational_llm_chat(self, api_key: str) -> LlmChat:
        """Create LLM chat configured for conversational voice interaction"""
        return LlmChat(
            api_key=api_key,
            session_id="voice-agent-conversation",
            system_message=self._get_conversational_system_prompt()
        ).with_model("openai", "gpt-4o-mini")
    
    def _get_conversational_system_prompt(self) -> str:
        return """You are a friendly, helpful AI assistant specialized in creating AI agent teams for the CrewAI framework. 

Your goal is to have a natural conversation with users to understand their needs and automatically generate complete AI agent team configurations.

CONVERSATION FLOW:
1. GREETING: Welcome them warmly and ask about their project/business goal
2. INFORMATION GATHERING: Ask clarifying questions about:
   - Business/project type and industry
   - Specific goals and objectives  
   - Target audience or market
   - Timeline and constraints
   - Any specific requirements
3. CONFIRMATION: Summarize their needs and confirm understanding
4. GENERATION: Explain that you're creating their team (this happens automatically)
5. REVIEW: Present the generated team and ask for feedback

CONVERSATION STYLE:
- Be conversational, friendly, and encouraging
- Ask one question at a time to avoid overwhelming
- Use natural language, not technical jargon
- Show enthusiasm about their project
- Keep responses concise but warm (2-3 sentences max)
- Don't mention technical terms like "YAML" or "CrewAI" unless they ask

CURRENT STATE: {state}
CONVERSATION CONTEXT: {context}

Based on the conversation so far, respond naturally to continue gathering information or provide appropriate guidance."""

    async def process_voice_input(self, text: str, api_key: str) -> str:
        """Process voice input and generate appropriate response"""
        try:
            # Add to conversation context
            self.conversation_context.append({"role": "user", "content": text})
            
            # Create conversational LLM
            chat = await self.create_conversational_llm_chat(api_key)
            
            # Generate contextual system prompt
            context_summary = self._summarize_context()
            system_prompt = self._get_conversational_system_prompt().format(
                state=self.current_state,
                context=context_summary
            )
            
            # Update system message
            chat.system_message = system_prompt
            
            # Get AI response
            user_message = UserMessage(text=text)
            response = await chat.send_message(user_message)
            
            # Add to conversation context
            self.conversation_context.append({"role": "assistant", "content": response})
            
            # Check if we have enough information to generate team
            if self._should_generate_team():
                await self._generate_team_from_conversation(api_key)
                self.current_state = "reviewing"
                return f"{response}\n\nGreat! I've created your AI agent team. Let me tell you about the specialists I've assembled for you..."
            
            return response
            
        except Exception as e:
            logger.error(f"Error processing voice input: {str(e)}")
            return "I apologize, but I encountered an issue. Could you please repeat that?"
    
    def _summarize_context(self) -> str:
        """Create a summary of the conversation context"""
        if not self.conversation_context:
            return "No conversation history yet."
        
        # Get last few exchanges for context
        recent_context = self.conversation_context[-6:]  # Last 3 exchanges
        summary = []
        for entry in recent_context:
            role = "User" if entry["role"] == "user" else "Assistant"
            summary.append(f"{role}: {entry['content'][:100]}...")
        
        return " | ".join(summary)
    
    def _should_generate_team(self) -> bool:
        """Determine if we have enough information to generate a team"""
        if self.generated_team:
            return False
            
        # Look for key information in conversation
        context_text = " ".join([entry["content"].lower() for entry in self.conversation_context if entry["role"] == "user"])
        
        # Check if we have business goal and some context
        has_goal = any(keyword in context_text for keyword in [
            "want", "need", "goal", "increase", "improve", "create", "build", 
            "launch", "grow", "develop", "marketing", "sales", "business"
        ])
        
        has_context = any(keyword in context_text for keyword in [
            "company", "business", "customers", "product", "service", "website",
            "online", "store", "sell", "market", "campaign", "strategy"
        ])
        
        # Require at least 2 user inputs with meaningful content
        meaningful_inputs = len([entry for entry in self.conversation_context 
                               if entry["role"] == "user" and len(entry["content"]) > 20])
        
        return has_goal and has_context and meaningful_inputs >= 2
    
    async def _generate_team_from_conversation(self, api_key: str):
        """Generate AI team from conversation context"""
        try:
            # Extract mission information from conversation
            mission_data = self._extract_mission_from_context()
            
            # Call intelligent team generation API
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.api_base_url}/generate-intelligent-team",
                    json={
                        "mission_name": mission_data["name"],
                        "mission_objective": mission_data["objective"],
                        "mission_description": mission_data["description"],
                        "use_emergent_key": True
                    }
                ) as response:
                    if response.status == 200:
                        self.generated_team = await response.json()
                        self.current_state = "reviewing"
                    
        except Exception as e:
            logger.error(f"Error generating team: {str(e)}")
    
    def _extract_mission_from_context(self) -> Dict[str, str]:
        """Extract mission information from conversation context"""
        # Combine user inputs
        user_inputs = [entry["content"] for entry in self.conversation_context if entry["role"] == "user"]
        combined_text = " ".join(user_inputs)
        
        # Simple extraction (in production, use more sophisticated NLP)
        mission_name = self._extract_mission_name(combined_text)
        mission_objective = combined_text[:500]  # Use full context as objective
        mission_description = f"Extracted from conversation: {combined_text}"
        
        return {
            "name": mission_name,
            "objective": mission_objective,
            "description": mission_description
        }
    
    def _extract_mission_name(self, text: str) -> str:
        """Extract or generate a mission name from text"""
        # Look for business/project keywords
        keywords = ["marketing", "sales", "campaign", "strategy", "business", "project", "website", "store"]
        found_keywords = [kw for kw in keywords if kw in text.lower()]
        
        if found_keywords:
            return f"{found_keywords[0].title()} Project"
        else:
            return "Business Growth Project"
    
    def get_team_summary(self) -> Optional[str]:
        """Get a conversational summary of the generated team"""
        if not self.generated_team:
            return None
        
        try:
            tasks = self.generated_team.get("tasks", [])
            agents = self.generated_team.get("agents", [])
            
            summary = f"I've created a team of {len(agents)} specialists for you:\n\n"
            
            for i, agent in enumerate(agents, 1):
                task_title = "a specialized task"
                if i <= len(tasks):
                    task_title = tasks[i-1].get("title", "a specialized task")
                
                summary += f"{i}. **{agent['role']}** - {agent['goal'][:100]}...\n"
            
            summary += f"\nI've also selected {len(self.generated_team.get('recommended_tools', []))} perfect tools "
            summary += f"and set up a {self.generated_team.get('workflow_type', 'sequential')} workflow. "
            summary += "Would you like me to generate your configuration file?"
            
            return summary
            
        except Exception as e:
            logger.error(f"Error creating team summary: {str(e)}")
            return "I've created your team configuration. Would you like me to tell you about it?"


async def entrypoint(ctx: JobContext):
    """Main entrypoint for the voice agent"""
    initial_ctx = llm.ChatContext().append(
        role="system",
        text=(
            "You are a voice assistant helping users create AI agent teams. "
            "Have natural conversations to understand their needs, then guide them "
            "through team creation. Be friendly, helpful, and conversational."
        ),
    )
    
    # Initialize voice agent
    voice_agent = CrewAIVoiceAgent()
    
    # Connect to room
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    
    # Create voice assistant with proper configuration
    assistant = VoiceAssistant(
        vad=silero.VAD.load(),  # Voice Activity Detection
        stt=deepgram.STT(),     # Speech to Text
        llm=openai.LLM(),       # Language Model
        tts=openai.TTS(),       # Text to Speech
        chat_ctx=initial_ctx,
    )
    
    # Custom message handler for our CrewAI logic
    @assistant.on("user_speech_committed")
    async def on_user_speech(user_msg: str):
        """Handle user speech input"""
        try:
            # Get Emergent LLM key
            api_key = os.environ.get('EMERGENT_LLM_KEY')
            
            # Process through our CrewAI voice agent
            response = await voice_agent.process_voice_input(user_msg, api_key)
            
            # If team is generated, add team summary
            if voice_agent.current_state == "reviewing":
                team_summary = voice_agent.get_team_summary()
                if team_summary:
                    response = f"{response}\n\n{team_summary}"
            
            # Send response back through voice assistant
            assistant.say(response)
            
        except Exception as e:
            logger.error(f"Error in voice processing: {str(e)}")
            assistant.say("I apologize, there was a technical issue. Could you please try again?")
    
    # Start the voice assistant
    assistant.start(ctx.room)
    
    # Keep the agent running
    await assistant.aclose()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))