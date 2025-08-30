import requests
import sys
import json
from datetime import datetime

class AIAgentWizardAPITester:
    def __init__(self, base_url="https://crewgen.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.team_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if endpoint else self.api_url
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error details: {error_detail}")
                except:
                    print(f"   Response text: {response.text}")

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )

    def test_get_tools(self):
        """Test getting available tools"""
        success, response = self.run_test(
            "Get Available Tools",
            "GET", 
            "tools",
            200
        )
        
        if success and 'tools' in response:
            tools = response['tools']
            print(f"   Found {len(tools)} available tools:")
            for tool in tools:
                print(f"   - {tool['name']}: {tool['description']}")
            return True, tools
        return False, []

    def test_generate_persona_emergent_key(self):
        """Test persona generation with Emergent key"""
        success, response = self.run_test(
            "Generate Persona (Emergent Key)",
            "POST",
            "generate-persona",
            200,
            data={
                "role": "Marketing Strategist",
                "task_description": "Develop a comprehensive marketing strategy for a new product launch",
                "use_emergent_key": True
            }
        )
        
        if success and 'goal' in response and 'backstory' in response:
            print(f"   Generated Goal: {response['goal'][:100]}...")
            print(f"   Generated Backstory: {response['backstory'][:100]}...")
            return True, response
        return False, {}

    def test_generate_persona_openai_key(self):
        """Test persona generation with OpenAI key (should fail without valid key)"""
        success, response = self.run_test(
            "Generate Persona (OpenAI Key - Invalid)",
            "POST",
            "generate-persona", 
            400,  # Expecting 400 because no valid OpenAI key provided
            data={
                "role": "Data Analyst",
                "task_description": "Analyze customer data to identify trends and insights",
                "use_emergent_key": False,
                "openai_api_key": ""
            }
        )
        return success, response

    def test_create_team(self):
        """Test creating a complete agent team"""
        # Sample team data
        team_data = {
            "mission": {
                "id": "mission-123",
                "name": "Content Marketing Campaign",
                "objective": "Create and execute a comprehensive content marketing strategy",
                "description": "A 30-day content marketing campaign to increase brand awareness"
            },
            "tasks": [
                {
                    "id": "task-1",
                    "title": "Market Research",
                    "description": "Research target audience and competitors",
                    "order": 1
                },
                {
                    "id": "task-2", 
                    "title": "Content Creation",
                    "description": "Create engaging content for various platforms",
                    "order": 2
                }
            ],
            "agents": [
                {
                    "id": "agent-1",
                    "task_id": "task-1",
                    "role": "Market Researcher",
                    "goal": "Conduct thorough market research to identify opportunities",
                    "backstory": "An experienced market researcher with expertise in consumer behavior"
                },
                {
                    "id": "agent-2",
                    "task_id": "task-2", 
                    "role": "Content Creator",
                    "goal": "Create compelling content that resonates with the target audience",
                    "backstory": "A creative content specialist with years of experience in digital marketing"
                }
            ],
            "selected_tools": ["google_search", "website_search"],
            "workflow_type": "sequential"
        }

        success, response = self.run_test(
            "Create Agent Team",
            "POST",
            "teams",
            200,
            data=team_data
        )
        
        if success and 'team_id' in response:
            self.team_id = response['team_id']
            print(f"   Created team with ID: {self.team_id}")
            return True, response
        return False, {}

    def test_get_team(self):
        """Test retrieving a team by ID"""
        if not self.team_id:
            print("❌ Skipping get team test - no team ID available")
            return False, {}
            
        success, response = self.run_test(
            "Get Team by ID",
            "GET",
            f"teams/{self.team_id}",
            200
        )
        
        if success and 'mission' in response:
            print(f"   Retrieved team: {response['mission']['name']}")
            return True, response
        return False, {}

    def test_generate_yaml(self):
        """Test YAML generation"""
        if not self.team_id:
            print("❌ Skipping YAML generation test - no team ID available")
            return False, {}
            
        success, response = self.run_test(
            "Generate YAML Configuration",
            "POST",
            "generate-yaml",
            200,
            data={"team_id": self.team_id}
        )
        
        if success and 'yaml' in response:
            yaml_content = response['yaml']
            print(f"   Generated YAML ({len(yaml_content)} characters)")
            print(f"   YAML preview: {yaml_content[:200]}...")
            return True, response
        return False, {}

    def test_invalid_team_operations(self):
        """Test operations with invalid team ID"""
        invalid_team_id = "invalid-team-id-123"
        
        # Test get invalid team
        success1, _ = self.run_test(
            "Get Invalid Team",
            "GET",
            f"teams/{invalid_team_id}",
            404
        )
        
        # Test generate YAML for invalid team
        success2, _ = self.run_test(
            "Generate YAML for Invalid Team",
            "POST",
            "generate-yaml",
            404,
            data={"team_id": invalid_team_id}
        )
        
        return success1 and success2

    def test_livekit_token_generation(self):
        """Test LiveKit token generation endpoint"""
        success, response = self.run_test(
            "Generate LiveKit Token",
            "POST",
            "livekit-token",
            200,
            data={
                "room_name": "test-room-voice-agent",
                "participant_name": "test-user-voice"
            }
        )
        
        if success and 'token' in response and 'url' in response:
            print(f"   Generated token (first 50 chars): {response['token'][:50]}...")
            print(f"   LiveKit URL: {response['url']}")
            print(f"   Room name: {response['room_name']}")
            return True, response
        return False, {}

    def test_intelligent_team_generation(self):
        """Test intelligent team generation endpoint"""
        success, response = self.run_test(
            "Generate Intelligent Team",
            "POST",
            "generate-intelligent-team",
            200,
            data={
                "mission_name": "E-commerce Growth Strategy",
                "mission_objective": "Increase online sales and improve customer experience for our e-commerce store",
                "mission_description": "We need to boost our online sales by 30% and improve customer satisfaction",
                "use_emergent_key": True
            }
        )
        
        if success and 'mission' in response and 'tasks' in response and 'agents' in response:
            mission = response['mission']
            tasks = response['tasks']
            agents = response['agents']
            tools = response.get('recommended_tools', [])
            
            print(f"   Generated Mission: {mission['name']}")
            print(f"   Number of Tasks: {len(tasks)}")
            print(f"   Number of Agents: {len(agents)}")
            print(f"   Recommended Tools: {len(tools)}")
            print(f"   Workflow Type: {response.get('workflow_type', 'N/A')}")
            
            return True, response
        return False, {}

def main():
    print("🚀 Starting AI Agent Team Configuration Wizard API Tests")
    print("=" * 60)
    
    tester = AIAgentWizardAPITester()
    
    # Run all tests in sequence
    test_results = []
    
    # Basic API tests
    test_results.append(tester.test_root_endpoint())
    test_results.append(tester.test_get_tools())
    
    # LiveKit voice agent tests
    test_results.append(tester.test_livekit_token_generation())
    test_results.append(tester.test_intelligent_team_generation())
    
    # Persona generation tests
    test_results.append(tester.test_generate_persona_emergent_key())
    test_results.append(tester.test_generate_persona_openai_key())
    
    # Team management tests
    test_results.append(tester.test_create_team())
    test_results.append(tester.test_get_team())
    test_results.append(tester.test_generate_yaml())
    
    # Error handling tests
    test_results.append((tester.test_invalid_team_operations(), {}))
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! API is working correctly.")
        return 0
    else:
        failed_tests = tester.tests_run - tester.tests_passed
        print(f"⚠️  {failed_tests} test(s) failed. Check the details above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())