# FluentAI - AI-Powered Speech Therapy Platform

## Original Problem Statement
Build a modern AI-powered speech therapy platform with:
- AI Speech Difficulty Triage using conversational AI
- Personalized therapy path generation
- Adaptive training engine based on performance
- Comprehensive exercise library
- Patient dashboard with progress tracking
- Therapist portal for monitoring patients

## User Choices
- **AI Model**: OpenAI GPT-5.2 (via Emergent LLM Key)
- **Speech API**: Browser native Web Speech API
- **Authentication**: JWT-based custom auth
- **Design**: Modern healthcare (calming blues/greens with Deep Moss Green #2D4A3E primary)
- **Roles**: Patient, Parent/Caregiver, Therapist

## Architecture
### Backend (FastAPI)
- **Auth**: JWT tokens with bcrypt password hashing
- **Database**: MongoDB with motor async driver
- **AI**: OpenAI GPT-5.2 via emergentintegrations library
- **Routes**: /api/auth, /api/triage, /api/therapy, /api/exercises, /api/sessions

### Frontend (React)
- **Routing**: React Router v7
- **UI Components**: Shadcn/UI + Tailwind CSS
- **Charts**: Recharts for progress visualization
- **Fonts**: Fraunces (headings) + Manrope (body)

## What's Been Implemented (March 10, 2026)

### Core Features ✅
1. **Landing Page** - Role selection (patient/parent/therapist)
2. **Authentication** - Register/Login with JWT
3. **AI Triage System** - Conversational speech assessment
4. **Speech Profiles** - Generated from AI triage
5. **Therapy Plans** - Auto-generated based on profiles
6. **Exercise Library** - 27 exercises across 8 categories
7. **Practice Sessions** - With Web Speech API recording
8. **Progress Tracking** - Charts and statistics
9. **Adaptive Difficulty** - Auto-adjusts based on performance
10. **Therapist Dashboard** - Patient monitoring

### Exercise Categories
- Oro-motor exercises
- Articulation therapy
- Automatic speech
- Speech & language
- Cognitive-linguistic
- Fluency training
- Voice therapy
- Neurological speech

## P0 (Completed)
- ✅ User authentication
- ✅ AI triage conversation
- ✅ Therapy plan generation
- ✅ Exercise practice interface
- ✅ Progress tracking

## P1 (Next Phase)
- [ ] Enhanced pronunciation scoring
- [ ] Image/video prompts in exercises
- [ ] Therapist can create custom exercises
- [ ] Patient assignment system
- [ ] Push notifications for practice reminders

## P2 (Future)
- [ ] Multi-language support
- [ ] Gamification elements
- [ ] Mobile app
- [ ] Tele-therapy video sessions
- [ ] Advanced speech analysis with AI

## Technical Notes
- All API routes prefixed with /api
- MongoDB collections: users, triage_chats, speech_profiles, therapy_plans, session_results
- Environment variables in backend/.env and frontend/.env
