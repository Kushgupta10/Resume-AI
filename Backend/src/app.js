const express = require("express")
const cookieParser = require("cookie-parser")
const app = express();
const cors = require("cors")

app.use(express.json())
app.use(cookieParser())
app.use(cors({
   origin: [
        "http://localhost:5173",
        "https://resume-ai-ten-alpha.vercel.app",
        "https://resume-ai-git-main-kush-guptas-projects.vercel.app"
    ],
    credentials: true
}))

const authRouter = require("./routes/auth.routes")
const interviewRouter = require('./routes/interview.routes')

app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)


module.exports = app
