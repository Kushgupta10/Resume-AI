# Resume AI Analyzer

A full-stack web application that analyzes resumes using AI, generates interview reports, and provides personalized preparation plans for job seekers.

## Features
- Upload and analyze resumes (PDF)
- AI-generated interview reports with:
  - Technical questions
  - Behavioral questions
  - Skill gap analysis
  - Personalized preparation plan (roadmap)
- User authentication and report history
- Downloadable resume PDFs
- Modern, responsive UI (React + Vite)

## Tech Stack
- **Frontend:** React, Vite, Axios, SCSS
- **Backend:** Node.js, Express, Mongoose, Google GenAI API
- **Database:** MongoDB
- **AI:** Google Gemini (GenAI)

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- MongoDB instance (local or Atlas)
- Google GenAI API key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/Resume-AI-Analyzer.git
   cd Resume-AI-Analyzer
   ```

2. **Backend setup:**
   ```bash
   cd Backend
   npm install
   # Create a .env file with your MongoDB URI and Google GenAI API key
   # Example .env:
   # MONGODB_URI=your_mongodb_uri
   # GOOGLE_GENAI_API_KEY=your_google_genai_api_key
   npm run dev
   ```

3. **Frontend setup:**
   ```bash
   cd ../Frontend
   npm install
   npm run dev
   ```

4. **Access the app:**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:3000](http://localhost:3000)

## Usage
- Register/login as a user
- Upload your resume (PDF)
- Fill in self-description and job description
- Receive an AI-generated interview report
- Download your resume or preparation plan as PDF

## Folder Structure
```
Resume-AI-Analyzer/
├── Backend/
│   ├── src/
│   ├── package.json
│   └── ...
├── Frontend/
│   ├── src/
│   ├── package.json
│   └── ...
└── README.md
```

## Environment Variables
- **Backend/.env:**
  - `MONGODB_URI` - MongoDB connection string
  - `GOOGLE_GENAI_API_KEY` - Google GenAI API key

## License
MIT

---
**Made with ❤️ for job seekers and interviewees!**
