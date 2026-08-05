import requests
import sys
import json
from datetime import datetime
import time

class FluentAIAPITester:
    def __init__(self, base_url="https://ai-speech-therapy.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.chat_id = None
        self.profile_id = None
        self.plan_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)

            print(f"   Status: {response.status_code}")
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"   ✅ Passed")
                try:
                    return True, response.json() if response.text else {}
                except:
                    return True, {}
            else:
                print(f"   ❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"   ❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_register_patient(self):
        """Test user registration for patient role"""
        test_time = int(time.time())
        success, response = self.run_test(
            "Register Patient",
            "POST",
            "auth/register",
            200,
            data={
                "email": f"test_patient_{test_time}@example.com",
                "name": f"Test Patient {test_time}",
                "role": "patient",
                "password": "TestPass123!"
            }
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
        return success

    def test_register_therapist(self):
        """Test user registration for therapist role"""
        test_time = int(time.time()) + 1
        success, response = self.run_test(
            "Register Therapist",
            "POST",
            "auth/register",
            200,
            data={
                "email": f"test_therapist_{test_time}@example.com",
                "name": f"Test Therapist {test_time}",
                "role": "therapist",
                "password": "TestPass123!"
            }
        )
        return success

    def test_duplicate_registration(self):
        """Test duplicate email registration should fail"""
        success, response = self.run_test(
            "Duplicate Registration",
            "POST",
            "auth/register",
            400,
            data={
                "email": f"test_patient_{int(time.time())}@example.com",
                "name": "Test User",
                "role": "patient", 
                "password": "TestPass123!"
            }
        )
        return success

    def test_login(self):
        """Test login with valid credentials"""
        test_time = int(time.time())
        # First register a user
        register_success, reg_response = self.run_test(
            "Register for Login Test",
            "POST", 
            "auth/register",
            200,
            data={
                "email": f"login_test_{test_time}@example.com",
                "name": "Login Test User",
                "role": "patient",
                "password": "TestPass123!"
            }
        )
        
        if not register_success:
            return False
            
        # Now test login
        success, response = self.run_test(
            "Login Valid Credentials",
            "POST",
            "auth/login", 
            200,
            data={
                "email": f"login_test_{test_time}@example.com",
                "password": "TestPass123!"
            }
        )
        return success

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        success, response = self.run_test(
            "Login Invalid Credentials",
            "POST",
            "auth/login",
            401,
            data={
                "email": "nonexistent@example.com",
                "password": "WrongPassword"
            }
        )
        return success

    def test_get_user_info(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get User Info",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_triage_chat(self):
        """Test AI triage chat functionality"""
        success, response = self.run_test(
            "Triage Chat - Initial Message",
            "POST",
            "triage/chat",
            200,
            data={
                "message": "Hello, I'm having difficulty pronouncing certain words clearly, especially the 'R' sound."
            }
        )
        
        if success and 'chat_id' in response:
            self.chat_id = response['chat_id']
            print(f"   Chat ID: {self.chat_id}")
            
            # Send follow-up message
            time.sleep(2)  # Give AI time to process
            follow_up_success, follow_response = self.run_test(
                "Triage Chat - Follow-up",
                "POST", 
                "triage/chat",
                200,
                data={
                    "message": "I'm an adult and this problem started gradually over the past year. I can understand speech fine but struggle to say words clearly.",
                    "chat_id": self.chat_id
                }
            )
            return follow_up_success
        
        return success

    def test_get_triage_chats(self):
        """Test getting user's triage chats"""
        success, response = self.run_test(
            "Get Triage Chats",
            "GET",
            "triage/chats",
            200
        )
        return success

    def test_get_profiles(self):
        """Test getting speech profiles"""
        success, response = self.run_test(
            "Get Speech Profiles",
            "GET", 
            "profiles",
            200
        )
        
        if success and response and len(response) > 0:
            self.profile_id = response[0]['id']
            print(f"   Profile ID: {self.profile_id}")
        
        return success

    def test_create_therapy_plan(self):
        """Test creating therapy plan"""
        if not self.profile_id:
            print("   ⚠️  Skipping - No profile ID available")
            return True
            
        success, response = self.run_test(
            "Create Therapy Plan",
            "POST",
            "therapy/plans",
            200,
            params={"profile_id": self.profile_id}
        )
        
        if success and 'id' in response:
            self.plan_id = response['id']
            print(f"   Plan ID: {self.plan_id}")
        
        return success

    def test_get_therapy_plans(self):
        """Test getting therapy plans"""
        success, response = self.run_test(
            "Get Therapy Plans",
            "GET",
            "therapy/plans", 
            200
        )
        return success

    def test_get_exercises(self):
        """Test getting exercise library"""
        success, response = self.run_test(
            "Get All Exercises",
            "GET",
            "exercises",
            200
        )
        
        # Test filtering by category
        if success:
            filter_success, filter_response = self.run_test(
                "Get Articulation Exercises",
                "GET",
                "exercises",
                200,
                params={"category": "articulation"}
            )
            return filter_success
        
        return success

    def test_get_exercise_categories(self):
        """Test getting exercise categories"""
        success, response = self.run_test(
            "Get Exercise Categories",
            "GET",
            "exercises/categories/list",
            200
        )
        return success

    def test_get_todays_session(self):
        """Test getting today's recommended session"""
        success, response = self.run_test(
            "Get Today's Session",
            "GET",
            "sessions/today",
            200
        )
        return success

    def test_save_session_result(self):
        """Test saving session result"""
        if not self.plan_id:
            print("   ⚠️  Skipping - No plan ID available")
            return True
            
        success, response = self.run_test(
            "Save Session Result",
            "POST",
            "sessions/result",
            200,
            data={
                "plan_id": self.plan_id,
                "exercise_id": "ex_art_001",
                "accuracy": 0.85,
                "completion_rate": 1.0,
                "response_time_ms": 5000,
                "pronunciation_score": 0.80,
                "repetition_success": 8,
                "notes": "Good progress on R sounds"
            }
        )
        return success

    def test_get_progress(self):
        """Test getting user progress statistics"""
        success, response = self.run_test(
            "Get User Progress",
            "GET",
            "sessions/progress",
            200
        )
        return success

    def test_therapist_endpoints(self):
        """Test therapist-specific endpoints (should fail for patient role)"""
        success, response = self.run_test(
            "Therapist Patients (Should Fail)",
            "GET",
            "therapist/patients",
            403  # Should be forbidden for patient role
        )
        return success

def main():
    print("🚀 Starting FluentAI API Testing...")
    print("=" * 50)
    
    tester = FluentAIAPITester()
    
    # Basic API tests
    tests_to_run = [
        tester.test_root_endpoint,
        tester.test_register_patient,
        tester.test_register_therapist, 
        tester.test_login,
        tester.test_invalid_login,
        tester.test_get_user_info,
        tester.test_triage_chat,
        tester.test_get_triage_chats,
        tester.test_get_profiles,
        tester.test_create_therapy_plan,
        tester.test_get_therapy_plans,
        tester.test_get_exercises,
        tester.test_get_exercise_categories,
        tester.test_get_todays_session,
        tester.test_save_session_result,
        tester.test_get_progress,
        tester.test_therapist_endpoints,
    ]
    
    # Run all tests
    for test in tests_to_run:
        try:
            test()
        except Exception as e:
            print(f"   ❌ Test failed with exception: {str(e)}")
            tester.tests_run += 1
    
    # Print summary
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("🎉 Backend API testing PASSED!")
        return 0
    else:
        print("❌ Backend API testing FAILED!")
        return 1

if __name__ == "__main__":
    sys.exit(main())