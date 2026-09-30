from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
import secrets
import resend
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from openai import AsyncOpenAI

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'fluentai_secure_jwt_secret_key_2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# LLM Configuration
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="FluentAI - Speech Therapy Platform")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============= MODELS =============

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str  # 'patient', 'therapist', 'parent'

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class SpeechProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    primary_difficulty: Optional[str] = None
    secondary_difficulty: Optional[str] = None
    severity: Optional[str] = None
    confidence: Optional[float] = None
    recommended_therapy_path: Optional[str] = None
    patient_type: Optional[str] = None  # 'child' or 'adult'
    onset_type: Optional[str] = None  # 'sudden' or 'gradual'
    raw_answers: Optional[Dict[str, Any]] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TherapyPlan(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    profile_id: str
    name: str
    goals: List[str]
    exercise_categories: List[str]
    starting_difficulty: int = 1
    current_difficulty: int = 1
    session_duration_minutes: int = 20
    exercises_per_session: int = 5
    days_per_week: int = 5
    progression_rules: Dict[str, Any] = {}
    status: str = "active"  # 'active', 'completed', 'paused'
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Exercise(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    category: str  # 'oro_motor', 'articulation', 'automatic_speech', 'speech_language', 'cognitive', 'fluency', 'voice', 'neurological'
    target_domain: str
    difficulty_level: int  # 1-5
    instructions: str
    audio_guidance: Optional[str] = None
    video_guidance: Optional[str] = None
    image_url: Optional[str] = None
    prompts: List[str] = []
    success_metrics: Dict[str, Any] = {}
    duration_seconds: int = 60

class SessionResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    plan_id: str
    exercise_id: str
    accuracy: float = 0.0
    completion_rate: float = 0.0
    response_time_ms: int = 0
    pronunciation_score: Optional[float] = None
    repetition_success: int = 0
    notes: Optional[str] = None
    completed_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TriageChat(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    messages: List[Dict[str, str]] = []
    status: str = "in_progress"  # 'in_progress', 'completed'
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ChatRequest(BaseModel):
    message: str
    chat_id: Optional[str] = None

class PatientInfo(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    patient_name: str
    patient_age: int
    patient_type: str  # 'child' or 'adult'
    relationship: str  # 'self', 'parent', 'caregiver'
    therapist_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TherapistPatientCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    patient_age: int
    patient_type: str  # 'child' or 'adult'
    relationship: str  # 'self', 'parent', 'caregiver'

# ============= AUTH HELPERS =============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============= AUTH ROUTES =============


@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    user = await db.users.find_one({"email": data.email})

    if not user:
        raise HTTPException(
            status_code=404,
            detail="No account found with this email"
        )

    reset_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)

    await db.password_resets.delete_many({"user_id": user["id"]})

    await db.password_resets.insert_one({
        "token": reset_token,
        "user_id": user["id"],
        "expires_at": expires_at.isoformat()
    })

    resend.api_key = os.getenv("RESEND_API_KEY")

    reset_link = f"http://localhost:3000/reset-password?token={reset_token}"

    resend.Emails.send({
        "from": "onboarding@resend.dev",
        "to": [data.email],
        "subject": "Reset Your Password",
        "html": f"""
            <h2>Password Reset</h2>
            <p>Hello {user.get("name", "User")},</p>
            <p>We received a request to reset your password.</p>
            <p>Click the button below to create a new password:</p>

            <p>
                <a href="{reset_link}"
                   style="background:#2D4A3E;color:white;padding:12px 20px;
                          text-decoration:none;border-radius:6px;">
                    Reset Password
                </a>
            </p>

            <p>This link will expire in 30 minutes.</p>
            <p>If you did not request this, you can ignore this email.</p>
        """
    })

    return {
        "message": "Password reset email sent",
        "reset_token": reset_token
    }

    return {
        "message": "Password reset token created",
        "reset_token": reset_token
    }
@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPasswordRequest):
    reset_data = await db.password_resets.find_one({
        "token": data.token
    })

    if not reset_data:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token"
        )

    expires_at = datetime.fromisoformat(reset_data["expires_at"])

    if datetime.now(timezone.utc) > expires_at:
        await db.password_resets.delete_one({"token": data.token})
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token"
        )

    if len(data.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters"
        )

    await db.users.update_one(
        {"id": reset_data["user_id"]},
        {"$set": {"password_hash": hash_password(data.new_password)}}
    )

    await db.password_resets.delete_one({"token": data.token})

    return {
        "message": "Password reset successfully"
    }
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "role": user_data.role,
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.email, user_data.role)
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            email=user_data.email,
            name=user_data.name,
            role=user_data.role,
            created_at=user_doc["created_at"]
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"], user["email"], user["role"])
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
        created_at=current_user["created_at"]
    )

# ============= TRIAGE ROUTES =============

TRIAGE_SYSTEM_PROMPT = """You are an AI Speech Therapy Assistant for FluentAI. Your role is to conduct a friendly intake conversation to understand a patient's speech difficulties.

IMPORTANT DISCLAIMER: You do NOT diagnose medical conditions. You help identify speech difficulty patterns to recommend appropriate therapy exercises.

Ask questions one at a time in a conversational manner. Key areas to explore:
1. Is the patient a child or adult?
2. Did the problem begin suddenly or gradually?
3. Does the patient understand speech but struggle to respond?
4. Are specific sounds difficult to pronounce?
5. Is speech slurred or unclear?
6. Are there word-finding difficulties?
7. Is there stuttering or blocking?
8. Did the difficulty start after stroke, injury, or surgery?

After gathering enough information (typically 5-8 questions), provide a structured analysis in this EXACT JSON format:
```json
{
  "analysis_complete": true,
  "speech_profile": {
    "primary_difficulty": "type of difficulty",
    "secondary_difficulty": "if applicable or null",
    "severity": "mild/moderate/severe",
    "confidence": 0.0 to 1.0,
    "recommended_therapy_path": "specific therapy recommendation",
    "patient_type": "child/adult",
    "onset_type": "sudden/gradual"
  }
}
```

Be empathetic, supportive, and encouraging. Use simple language. If the user seems confused, explain concepts clearly."""

@api_router.post("/triage/chat")
async def triage_chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    
    # Get or create chat session
    if request.chat_id:
        chat = await db.triage_chats.find_one({"id": request.chat_id, "user_id": user_id}, {"_id": 0})
        if not chat:
            raise HTTPException(status_code=404, detail="Chat session not found")
    else:
        chat = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "messages": [],
            "status": "in_progress",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.triage_chats.insert_one(chat)
    
    # Add user message
    chat["messages"].append({
        "role": "user",
        "content": request.message,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    # Call Groq
    try:
        client = AsyncOpenAI(
            api_key=GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1"
        )

        conversation = []

        for msg in chat["messages"]:
            role = "user" if msg["role"] == "user" else "assistant"

            conversation.append({
                "role": role,
                "content": msg["content"]
            })

        response_obj = await client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "system",
                    "content":
TRIAGE_SYSTEM_PROMPT
            },
            *conversation
        ]
    )

        response = response_obj.choices[0].message.content
        # Add assistant response
        chat["messages"].append({
            "role": "assistant",
            "content": response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        # Check if analysis is complete
        speech_profile = None
        if '"analysis_complete": true' in response or '"analysis_complete":true' in response:
            chat["status"] = "completed"
            # Extract and save speech profile
            try:
                import json
                import re
                json_match = re.search(r'\{[^{}]*"speech_profile"[^{}]*\{[^{}]*\}[^{}]*\}', response, re.DOTALL)
                if json_match:
                    profile_data = json.loads(json_match.group())
                    profile = profile_data.get("speech_profile", {})
                    speech_profile = {
                        "id": str(uuid.uuid4()),
                        "user_id": user_id,
                        "chat_id": chat["id"],
                        **profile,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                    await db.speech_profiles.insert_one(speech_profile)
            except:
                pass
        
        # Update chat in DB
        await db.triage_chats.update_one(
            {"id": chat["id"]},
            {"$set": {"messages": chat["messages"], "status": chat["status"]}}
        )
        
        return {
            "chat_id": chat["id"],
            "response": response,
            "status": chat["status"],
            "speech_profile": speech_profile
        }
        
    except Exception as e:
        logging.error(f"LLM Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@api_router.get("/triage/chat/{chat_id}")
async def get_triage_chat(chat_id: str, current_user: dict = Depends(get_current_user)):
    chat = await db.triage_chats.find_one(
        {"id": chat_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat

@api_router.get("/triage/chats")
async def get_user_chats(current_user: dict = Depends(get_current_user)):
    chats = await db.triage_chats.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return chats

# ============= SPEECH PROFILE ROUTES =============

@api_router.get("/profiles")
async def get_profiles(current_user: dict = Depends(get_current_user)):
    profiles = await db.speech_profiles.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return profiles

@api_router.get("/profiles/{profile_id}")
async def get_profile(profile_id: str, current_user: dict = Depends(get_current_user)):
    profile = await db.speech_profiles.find_one(
        {"id": profile_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

# ============= THERAPY PLAN ROUTES =============

THERAPY_PATHS = {
    "aphasia": {
        "name": "Post-Stroke Language Training",
        "goals": ["improve naming", "improve word retrieval", "improve sentence construction"],
        "exercise_categories": ["speech_language", "cognitive", "neurological"],
        "exercises_per_session": 5,
        "session_duration_minutes": 20
    },
    "apraxia": {
        "name": "Motor Speech Planning",
        "goals": ["improve sound sequencing", "improve syllable production", "improve speech clarity"],
        "exercise_categories": ["articulation", "oro_motor", "neurological"],
        "exercises_per_session": 6,
        "session_duration_minutes": 25
    },
    "dysarthria": {
        "name": "Speech Muscle Strengthening",
        "goals": ["improve speech clarity", "improve breath support", "strengthen oral muscles"],
        "exercise_categories": ["oro_motor", "voice", "articulation"],
        "exercises_per_session": 5,
        "session_duration_minutes": 20
    },
    "fluency": {
        "name": "Fluency Enhancement",
        "goals": ["reduce stuttering", "improve speech flow", "build confidence"],
        "exercise_categories": ["fluency", "voice", "automatic_speech"],
        "exercises_per_session": 4,
        "session_duration_minutes": 15
    },
    "articulation": {
        "name": "Sound Production Training",
        "goals": ["improve sound accuracy", "master difficult phonemes", "enhance clarity"],
        "exercise_categories": ["articulation", "oro_motor"],
        "exercises_per_session": 6,
        "session_duration_minutes": 20
    },
    "voice": {
        "name": "Voice Therapy Program",
        "goals": ["improve vocal quality", "optimize pitch", "strengthen voice"],
        "exercise_categories": ["voice", "oro_motor"],
        "exercises_per_session": 5,
        "session_duration_minutes": 20
    },
    "language": {
        "name": "Language Development",
        "goals": ["expand vocabulary", "improve sentence structure", "enhance comprehension"],
        "exercise_categories": ["speech_language", "cognitive"],
        "exercises_per_session": 5,
        "session_duration_minutes": 25
    }
}

@api_router.post("/therapy/plans")
async def create_therapy_plan(profile_id: str, current_user: dict = Depends(get_current_user)):
    profile = await db.speech_profiles.find_one(
        {"id": profile_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Determine therapy path based on primary difficulty
    primary = profile.get("primary_difficulty", "").lower()
    path_key = "language"  # default
    for key in THERAPY_PATHS.keys():
        if key in primary:
            path_key = key
            break
    
    path = THERAPY_PATHS[path_key]
    
    plan = TherapyPlan(
        user_id=current_user["id"],
        profile_id=profile_id,
        name=path["name"],
        goals=path["goals"],
        exercise_categories=path["exercise_categories"],
        starting_difficulty=1 if profile.get("severity") == "severe" else (2 if profile.get("severity") == "moderate" else 3),
        current_difficulty=1 if profile.get("severity") == "severe" else (2 if profile.get("severity") == "moderate" else 3),
        exercises_per_session=path["exercises_per_session"],
        session_duration_minutes=path["session_duration_minutes"],
        progression_rules={
            "increase_threshold": 0.85,
            "maintain_range": [0.60, 0.85],
            "decrease_threshold": 0.60,
            "sessions_to_evaluate": 3
        }
    )
    
    await db.therapy_plans.insert_one(plan.model_dump())
    return plan

@api_router.get("/therapy/plans")
async def get_therapy_plans(current_user: dict = Depends(get_current_user)):
    plans = await db.therapy_plans.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return plans

@api_router.get("/therapy/plans/{plan_id}")
async def get_therapy_plan(plan_id: str, current_user: dict = Depends(get_current_user)):
    plan = await db.therapy_plans.find_one(
        {"id": plan_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan

@api_router.put("/therapy/plans/{plan_id}")
async def update_therapy_plan(plan_id: str, updates: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    plan = await db.therapy_plans.find_one({"id": plan_id, "user_id": current_user["id"]})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    allowed_updates = {"status", "current_difficulty", "exercises_per_session", "session_duration_minutes", "days_per_week"}
    filtered_updates = {k: v for k, v in updates.items() if k in allowed_updates}
    
    if filtered_updates:
        await db.therapy_plans.update_one({"id": plan_id}, {"$set": filtered_updates})
    
    updated = await db.therapy_plans.find_one({"id": plan_id}, {"_id": 0})
    return updated

# ============= EXERCISE LIBRARY =============

EXERCISE_LIBRARY = [
    # Oro-motor exercises
    {"id": "ex_oro_001", "title": "Lip Strengthening", "category": "oro_motor", "target_domain": "lip_muscles", "difficulty_level": 1, "instructions": "Pucker your lips tightly like you're going to kiss. Hold for 5 seconds, then relax. Repeat 10 times.", "prompts": ["Pucker lips", "Hold tight", "Relax"], "duration_seconds": 60},
    {"id": "ex_oro_002", "title": "Tongue Movement", "category": "oro_motor", "target_domain": "tongue_mobility", "difficulty_level": 1, "instructions": "Stick out your tongue and move it left and right, touching each corner of your mouth. Do this slowly 10 times.", "prompts": ["Stick out tongue", "Touch left corner", "Touch right corner"], "duration_seconds": 60},
    {"id": "ex_oro_003", "title": "Facial Muscle Exercises", "category": "oro_motor", "target_domain": "facial_muscles", "difficulty_level": 2, "instructions": "Smile as wide as you can, hold for 3 seconds. Then make an 'O' shape with your mouth. Alternate 10 times.", "prompts": ["Big smile", "O shape", "Repeat"], "duration_seconds": 90},
    
    # Articulation therapy
    {"id": "ex_art_001", "title": "Sound Repetition - S", "category": "articulation", "target_domain": "s_sound", "difficulty_level": 1, "instructions": "Practice the 'S' sound by saying these words slowly and clearly.", "prompts": ["Sun", "Soap", "Sing", "Sock", "Sit"], "duration_seconds": 120},
    {"id": "ex_art_002", "title": "Sound Repetition - R", "category": "articulation", "target_domain": "r_sound", "difficulty_level": 2, "instructions": "Practice the 'R' sound by saying these words slowly and clearly.", "prompts": ["Run", "Red", "Rain", "Ring", "Rock"], "duration_seconds": 120},
    {"id": "ex_art_003", "title": "Syllable Drills", "category": "articulation", "target_domain": "syllables", "difficulty_level": 2, "instructions": "Repeat each syllable combination 5 times, focusing on clear pronunciation.", "prompts": ["Ba-Ba-Ba", "Da-Da-Da", "Ka-Ka-Ka", "Pa-Pa-Pa", "Ta-Ta-Ta"], "duration_seconds": 150},
    {"id": "ex_art_004", "title": "Minimal Pair Practice", "category": "articulation", "target_domain": "sound_distinction", "difficulty_level": 3, "instructions": "Practice distinguishing between similar sounds by saying each pair clearly.", "prompts": ["Pin - Bin", "Ten - Den", "Cap - Gap", "Sue - Zoo", "Fan - Van"], "duration_seconds": 180},
    
    # Automatic speech
    {"id": "ex_auto_001", "title": "Counting Practice", "category": "automatic_speech", "target_domain": "numbers", "difficulty_level": 1, "instructions": "Count from 1 to 20 slowly and clearly. Focus on smooth transitions between numbers.", "prompts": ["1, 2, 3, 4, 5", "6, 7, 8, 9, 10", "11, 12, 13, 14, 15", "16, 17, 18, 19, 20"], "duration_seconds": 60},
    {"id": "ex_auto_002", "title": "Days of the Week", "category": "automatic_speech", "target_domain": "sequences", "difficulty_level": 1, "instructions": "Say all the days of the week in order, clearly and at a comfortable pace.", "prompts": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], "duration_seconds": 45},
    {"id": "ex_auto_003", "title": "Months of the Year", "category": "automatic_speech", "target_domain": "sequences", "difficulty_level": 2, "instructions": "Say all the months of the year in order, clearly and at a comfortable pace.", "prompts": ["January, February, March", "April, May, June", "July, August, September", "October, November, December"], "duration_seconds": 60},
    
    # Speech and language exercises
    {"id": "ex_lang_001", "title": "Object Naming", "category": "speech_language", "target_domain": "naming", "difficulty_level": 1, "instructions": "Look at each image and say the name of the object clearly.", "prompts": ["Apple", "Chair", "Book", "Phone", "Clock"], "image_url": "naming_objects", "duration_seconds": 120},
    {"id": "ex_lang_002", "title": "Sentence Building", "category": "speech_language", "target_domain": "syntax", "difficulty_level": 2, "instructions": "Complete each sentence with an appropriate word.", "prompts": ["The dog is ___", "I like to ___", "The sun is ___", "She went to the ___"], "duration_seconds": 180},
    {"id": "ex_lang_003", "title": "Reading Practice", "category": "speech_language", "target_domain": "reading", "difficulty_level": 2, "instructions": "Read each sentence aloud clearly and at a comfortable pace.", "prompts": ["The cat sat on the mat.", "I like to eat apples.", "The sun is very bright today.", "She reads books every day."], "duration_seconds": 120},
    {"id": "ex_lang_004", "title": "Story Completion", "category": "speech_language", "target_domain": "narrative", "difficulty_level": 3, "instructions": "Listen to the story beginning and complete it with your own ending.", "prompts": ["Once upon a time, there was a...", "The next day, something surprising happened...", "In the end, everyone learned that..."], "duration_seconds": 300},
    
    # Cognitive-linguistic tasks
    {"id": "ex_cog_001", "title": "Memory Recall", "category": "cognitive", "target_domain": "memory", "difficulty_level": 2, "instructions": "Listen to the list of words, then try to repeat them back.", "prompts": ["Cat, Dog, Bird", "Red, Blue, Green, Yellow", "Apple, Banana, Orange, Grape, Mango"], "duration_seconds": 180},
    {"id": "ex_cog_002", "title": "Sequencing", "category": "cognitive", "target_domain": "sequencing", "difficulty_level": 2, "instructions": "Put these steps in the correct order and say them aloud.", "prompts": ["Making tea: Boil water → Add tea bag → Pour water → Add sugar → Stir", "Getting dressed: Underwear → Pants → Shirt → Socks → Shoes"], "duration_seconds": 180},
    {"id": "ex_cog_003", "title": "Categorization", "category": "cognitive", "target_domain": "categorization", "difficulty_level": 2, "instructions": "Name 5 items that belong to each category.", "prompts": ["Fruits", "Animals", "Vehicles", "Furniture"], "duration_seconds": 240},
    {"id": "ex_cog_004", "title": "Reasoning", "category": "cognitive", "target_domain": "reasoning", "difficulty_level": 3, "instructions": "Answer these questions using logic and reasoning.", "prompts": ["Why do we wear coats in winter?", "What would happen if there was no sun?", "Why do birds fly south in winter?"], "duration_seconds": 300},
    
    # Fluency training
    {"id": "ex_flu_001", "title": "Pacing Techniques", "category": "fluency", "target_domain": "pacing", "difficulty_level": 1, "instructions": "Practice speaking at a slow, steady pace. Say each phrase while tapping your finger.", "prompts": ["I am speaking slowly", "One word at a time", "Nice and easy"], "duration_seconds": 120},
    {"id": "ex_flu_002", "title": "Breathing Rhythm", "category": "fluency", "target_domain": "breathing", "difficulty_level": 1, "instructions": "Take a deep breath before each phrase. Speak on the exhale.", "prompts": ["Breathe in... 'Hello, how are you?'", "Breathe in... 'My name is...'", "Breathe in... 'I feel good today'"], "duration_seconds": 120},
    {"id": "ex_flu_003", "title": "Stuttering Control", "category": "fluency", "target_domain": "stuttering", "difficulty_level": 2, "instructions": "Practice easy onset of speech. Start words gently without forcing.", "prompts": ["Ssssnake", "Rrrain", "Mmmorning"], "duration_seconds": 150},
    
    # Voice therapy
    {"id": "ex_voice_001", "title": "Breath Support", "category": "voice", "target_domain": "breath_support", "difficulty_level": 1, "instructions": "Practice diaphragmatic breathing. Place hand on stomach and feel it rise as you breathe in.", "prompts": ["Breathe in for 4 counts", "Hold for 2 counts", "Breathe out slowly saying 'ahhhh'"], "duration_seconds": 120},
    {"id": "ex_voice_002", "title": "Pitch Control", "category": "voice", "target_domain": "pitch", "difficulty_level": 2, "instructions": "Practice moving your voice up and down in pitch.", "prompts": ["Say 'eeee' starting low and going high", "Say 'oooo' starting high and going low", "Glide up and down on 'ahhh'"], "duration_seconds": 120},
    {"id": "ex_voice_003", "title": "Vocal Strength", "category": "voice", "target_domain": "strength", "difficulty_level": 2, "instructions": "Practice projecting your voice clearly without straining.", "prompts": ["Say 'HEY' loudly but not shouting", "Count 1-10 getting gradually louder", "Say 'I am here' with a strong voice"], "duration_seconds": 120},
    
    # Neurological speech therapy
    {"id": "ex_neuro_001", "title": "Aphasia Word Finding", "category": "neurological", "target_domain": "aphasia", "difficulty_level": 2, "instructions": "Look at each picture and try to name what you see. Take your time.", "prompts": ["Cup", "Key", "Flower", "House", "Car"], "duration_seconds": 180},
    {"id": "ex_neuro_002", "title": "Apraxia Sequences", "category": "neurological", "target_domain": "apraxia", "difficulty_level": 3, "instructions": "Practice these movement sequences slowly. Watch your mouth in a mirror.", "prompts": ["Pa-Ta-Ka", "Buttercup", "Hippopotamus"], "duration_seconds": 180},
    {"id": "ex_neuro_003", "title": "Dysarthria Clarity", "category": "neurological", "target_domain": "dysarthria", "difficulty_level": 2, "instructions": "Over-articulate each word. Exaggerate your mouth movements.", "prompts": ["Spectacular", "Beautiful", "Magnificent", "Wonderful"], "duration_seconds": 150}
]

@api_router.get("/exercises")
async def get_exercises(
    category: Optional[str] = None,
    difficulty: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    exercises = EXERCISE_LIBRARY.copy()
    
    if category:
        exercises = [e for e in exercises if e["category"] == category]
    
    if difficulty:
        exercises = [e for e in exercises if e["difficulty_level"] <= difficulty]
    
    return exercises

@api_router.get("/exercises/{exercise_id}")
async def get_exercise(exercise_id: str, current_user: dict = Depends(get_current_user)):
    for exercise in EXERCISE_LIBRARY:
        if exercise["id"] == exercise_id:
            return exercise
    raise HTTPException(status_code=404, detail="Exercise not found")

@api_router.get("/exercises/categories/list")
async def get_exercise_categories(current_user: dict = Depends(get_current_user)):
    categories = {
        "oro_motor": {"name": "Oro-Motor Exercises", "description": "Strengthen mouth and facial muscles"},
        "articulation": {"name": "Articulation Therapy", "description": "Improve sound production"},
        "automatic_speech": {"name": "Automatic Speech", "description": "Practice familiar sequences"},
        "speech_language": {"name": "Speech & Language", "description": "Build vocabulary and sentences"},
        "cognitive": {"name": "Cognitive-Linguistic", "description": "Memory, sequencing, reasoning"},
        "fluency": {"name": "Fluency Training", "description": "Improve speech flow"},
        "voice": {"name": "Voice Therapy", "description": "Breath support and vocal control"},
        "neurological": {"name": "Neurological Speech", "description": "Aphasia, apraxia, dysarthria exercises"}
    }
    return categories

# ============= SESSION ROUTES =============

@api_router.post("/sessions/result")
async def save_session_result(result: SessionResult, current_user: dict = Depends(get_current_user)):
    result_dict = result.model_dump()
    result_dict["user_id"] = current_user["id"]
    await db.session_results.insert_one(result_dict)
    
    # Check for adaptive difficulty adjustment
    await check_and_adjust_difficulty(current_user["id"], result.plan_id)
    
    return result_dict

async def check_and_adjust_difficulty(user_id: str, plan_id: str):
    """Check recent performance and adjust difficulty if needed"""
    plan = await db.therapy_plans.find_one({"id": plan_id, "user_id": user_id}, {"_id": 0})
    if not plan:
        return
    
    # Get last 3 sessions
    recent_results = await db.session_results.find(
        {"user_id": user_id, "plan_id": plan_id},
        {"_id": 0}
    ).sort("completed_at", -1).to_list(3)
    
    if len(recent_results) < 3:
        return
    
    avg_accuracy = sum(r.get("accuracy", 0) for r in recent_results) / len(recent_results)
    current_difficulty = plan.get("current_difficulty", 1)
    
    new_difficulty = current_difficulty
    if avg_accuracy > 0.85 and current_difficulty < 5:
        new_difficulty = current_difficulty + 1
    elif avg_accuracy < 0.60 and current_difficulty > 1:
        new_difficulty = current_difficulty - 1
    
    if new_difficulty != current_difficulty:
        await db.therapy_plans.update_one(
            {"id": plan_id},
            {"$set": {"current_difficulty": new_difficulty}}
        )

@api_router.get("/sessions/results")
async def get_session_results(
    plan_id: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    query = {"user_id": current_user["id"]}
    if plan_id:
        query["plan_id"] = plan_id
    
    results = await db.session_results.find(query, {"_id": 0}).sort("completed_at", -1).to_list(limit)
    return results

@api_router.get("/sessions/progress")
async def get_progress(current_user: dict = Depends(get_current_user)):
    """Get progress statistics for the user"""
    user_id = current_user["id"]
    
    # Get all session results
    results = await db.session_results.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    
    if not results:
        return {
            "total_sessions": 0,
            "total_exercises": 0,
            "avg_accuracy": 0,
            "streak_days": 0,
            "weekly_progress": [],
            "category_progress": {}
        }
    
    # Calculate statistics
    total_sessions = len(results)
    avg_accuracy = sum(r.get("accuracy", 0) for r in results) / total_sessions if total_sessions > 0 else 0
    
    # Weekly progress (last 7 days)
    from collections import defaultdict
    daily_results = defaultdict(list)
    for r in results:
        date = r.get("completed_at", "")[:10]
        daily_results[date].append(r.get("accuracy", 0))
    
    weekly_progress = []
    for i in range(7):
        date = (datetime.now(timezone.utc) - timedelta(days=6-i)).strftime("%Y-%m-%d")
        day_results = daily_results.get(date, [])
        weekly_progress.append({
            "date": date,
            "sessions": len(day_results),
            "avg_accuracy": sum(day_results) / len(day_results) if day_results else 0
        })
    
    # Calculate streak
    streak = 0
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    check_date = today
    while check_date in daily_results:
        streak += 1
        check_date = (datetime.now(timezone.utc) - timedelta(days=streak)).strftime("%Y-%m-%d")
    
    return {
        "total_sessions": total_sessions,
        "total_exercises": total_sessions,
        "avg_accuracy": round(avg_accuracy * 100, 1),
        "streak_days": streak,
        "weekly_progress": weekly_progress,
        "improvement_trend": "improving" if len(results) > 5 and sum(r.get("accuracy", 0) for r in results[:5]) / 5 > sum(r.get("accuracy", 0) for r in results[-5:]) / 5 else "stable"
    }

# ============= TODAY'S SESSION =============

@api_router.get("/sessions/today")
async def get_today_session(current_user: dict = Depends(get_current_user)):
    """Get today's recommended exercises based on active therapy plan"""
    user_id = current_user["id"]
    
    # Get active plan
    plan = await db.therapy_plans.find_one(
        {"user_id": user_id, "status": "active"},
        {"_id": 0}
    )
    
    if not plan:
        return {"has_plan": False, "exercises": [], "message": "No active therapy plan. Complete the triage assessment first."}
    
    # Get exercises for today based on plan categories and difficulty
    difficulty = plan.get("current_difficulty", 1)
    categories = plan.get("exercise_categories", [])
    exercises_count = plan.get("exercises_per_session", 5)
    
    available_exercises = [
        e for e in EXERCISE_LIBRARY 
        if e["category"] in categories and e["difficulty_level"] <= difficulty
    ]
    
    # Select exercises
    import random
    if len(available_exercises) > exercises_count:
        selected = random.sample(available_exercises, exercises_count)
    else:
        selected = available_exercises
    
    return {
        "has_plan": True,
        "plan": plan,
        "exercises": selected,
        "session_duration_minutes": plan.get("session_duration_minutes", 20)
    }

# ============= THERAPIST ROUTES =============

@api_router.post("/therapist/patients")
async def create_therapist_patient(
    patient_data: TherapistPatientCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new patient account and assign it to the therapist"""

    if current_user["role"] != "therapist":
        raise HTTPException(
            status_code=403,
            detail="Only therapists can add patients"
        )

    # Check if email already exists
    existing_user = await db.users.find_one({"email": patient_data.email})
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists"
        )

    # Create patient user
    user_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    user_doc = {
        "id": user_id,
        "email": patient_data.email,
        "name": patient_data.name,
        "role": "patient",
        "password_hash": hash_password(patient_data.password),
        "created_at": created_at
    }

    await db.users.insert_one(user_doc)

    # Create patient information and assign therapist
    patient_info = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "patient_name": patient_data.name,
        "patient_age": patient_data.patient_age,
        "patient_type": patient_data.patient_type,
        "relationship": patient_data.relationship,
        "therapist_id": current_user["id"],
        "created_at": created_at
    }

    await db.patient_info.insert_one(patient_info)
    patient_info.pop("_id", None)


    return {
        "message": "Patient added successfully",
        "patient": {
            **patient_info,
            "user": {
                "id": user_id,
                "email": patient_data.email,
                "name": patient_data.name,
                "role": "patient",
                "created_at": created_at
            }
        }
    }


@api_router.get("/therapist/patients")
async def get_therapist_patients(current_user: dict = Depends(get_current_user)):
    """Get all patients assigned to a therapist"""
    if current_user["role"] != "therapist":
        raise HTTPException(status_code=403, detail="Only therapists can access this")
    
    patients = await db.patient_info.find(
        {"therapist_id": current_user["id"]},
        {"_id": 0}
    ).to_list(100)
    
    # Get user details for each patient
    result = []
    for p in patients:
        user = await db.users.find_one({"id": p["user_id"]}, {"_id": 0, "password_hash": 0})
        if user:
            result.append({**p, "user": user})
    
    return result

@api_router.get("/therapist/patient/{patient_id}/progress")
async def get_patient_progress(patient_id: str, current_user: dict = Depends(get_current_user)):
    """Get progress for a specific patient"""
    if current_user["role"] != "therapist":
        raise HTTPException(status_code=403, detail="Only therapists can access this")
    
    # Get session results
    results = await db.session_results.find({"user_id": patient_id}, {"_id": 0}).to_list(100)
    plans = await db.therapy_plans.find({"user_id": patient_id}, {"_id": 0}).to_list(10)
    profiles = await db.speech_profiles.find({"user_id": patient_id}, {"_id": 0}).to_list(10)
    
    return {
        "session_results": results,
        "therapy_plans": plans,
        "speech_profiles": profiles
    }

@api_router.post("/therapist/assign/{patient_id}")
async def assign_patient(patient_id: str, current_user: dict = Depends(get_current_user)):
    """Assign a patient to a therapist"""
    if current_user["role"] != "therapist":
        raise HTTPException(status_code=403, detail="Only therapists can do this")
    
    await db.patient_info.update_one(
        {"user_id": patient_id},
        {"$set": {"therapist_id": current_user["id"]}}
    )
    
    return {"message": "Patient assigned successfully"}

# ============= PATIENT INFO =============

@api_router.post("/patient/info")
async def save_patient_info(info: PatientInfo, current_user: dict = Depends(get_current_user)):
    info_dict = info.model_dump()
    info_dict["user_id"] = current_user["id"]
    
    # Update or insert
    await db.patient_info.update_one(
        {"user_id": current_user["id"]},
        {"$set": info_dict},
        upsert=True
    )
    return info_dict

@api_router.get("/patient/info")
async def get_patient_info(current_user: dict = Depends(get_current_user)):
    info = await db.patient_info.find_one({"user_id": current_user["id"]}, {"_id": 0})
    return info

# ============= ROOT ROUTE =============

@api_router.get("/")
async def root():
    return {"message": "FluentAI Speech Therapy Platform API", "version": "1.0.0"}

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
