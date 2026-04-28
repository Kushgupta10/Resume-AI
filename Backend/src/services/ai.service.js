const { GoogleGenAI } = require('@google/genai')
const { z, config } = require("zod")
const {zodToJsonSchema} = require("zod-to-json-schema") 
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
}) 

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe, based on their resume and self-describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")        
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e., how much it can affect the candidate's chances of getting selected")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g., 'Data Structures and Algorithms', 'System Design', 'Behavioral Questions' etc."),
        tasks: z.array(z.string()).describe("List of tasks to be completed on this day to prepare for the interview")
    })).describe("A day-wise preparation plan for the candidate to prepare for the interview"),
       title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {


        const prompt = `Generate an interview report for a candidate with the following details:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}

The report must be a valid JSON object matching the provided schema and include:
- At least 3 technical interview questions relevant to the job, each with intention and a model answer.
- At least 3 behavioral interview questions, each with intention and a model answer.
- A list of at least 2 skill gaps identified from the resume compared to the job description, each with severity (low, medium, high).
- A detailed, day-wise preparation plan (at least 3 days), each day with a focus and a list of tasks.
Do not leave any array empty. If information is missing, make reasonable assumptions. Be specific and realistic in your output.
Return ONLY the JSON object, with no extra text, comments, or explanations.

Here is a sample output (fill with realistic content):
{
    "matchScore": 85,
    "technicalQuestions": [
        {
            "question": "Explain the difference between REST and GraphQL APIs.",
            "intention": "To assess understanding of API design and modern web technologies.",
            "answer": "REST is an architectural style using standard HTTP methods, while GraphQL is a query language allowing clients to request specific data. REST exposes multiple endpoints, GraphQL typically uses a single endpoint."
        },
        {
            "question": "How would you optimize a React application's performance?",
            "intention": "To evaluate knowledge of React best practices and performance tuning.",
            "answer": "Use React.memo, lazy loading, code splitting, avoid unnecessary re-renders, and optimize state management."
        },
        {
            "question": "Describe your experience with Docker and containerization.",
            "intention": "To check familiarity with DevOps and deployment.",
            "answer": "I have used Docker to containerize Node.js applications, create reproducible environments, and deploy to cloud platforms."
        }
    ],
    "behavioralQuestions": [
        {
            "question": "Tell me about a time you faced a tight deadline.",
            "intention": "To assess time management and problem-solving skills.",
            "answer": "I prioritized tasks, communicated with my team, and focused on critical features to deliver the project on time."
        },
        {
            "question": "How do you handle feedback from peers or managers?",
            "intention": "To evaluate openness to feedback and growth mindset.",
            "answer": "I welcome feedback, reflect on it, and use it to improve my work and collaboration."
        },
        {
            "question": "Describe a situation where you had to learn a new technology quickly.",
            "intention": "To see adaptability and willingness to learn.",
            "answer": "I researched documentation, followed tutorials, and built a small project to get hands-on experience."
        }
    ],
    "skillGaps": [
        {
            "skill": "Cloud deployment (AWS, Azure)",
            "severity": "medium"
        },
        {
            "skill": "Automated testing (Jest, Mocha)",
            "severity": "low"
        }
    ],
    "preparationPlan": [
        {
            "day": 1,
            "focus": "Technical fundamentals and coding",
            "tasks": ["Review data structures and algorithms", "Practice coding problems", "Revise JavaScript and React basics"]
        },
        {
            "day": 2,
            "focus": "System design and DevOps",
            "tasks": ["Study REST vs GraphQL", "Learn Docker basics", "Review deployment strategies"]
        },
        {
            "day": 3,
            "focus": "Behavioral questions and mock interviews",
            "tasks": ["Prepare answers for common behavioral questions", "Conduct mock interviews", "Review feedback and improve"]
        }
    ]
}`


    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseJsonSchema: zodToJsonSchema(interviewReportSchema)
        }
    })

    // Log the raw AI response for debugging
    console.log("AI RAW RESPONSE:", response.text);

    let report;
    try {
        report = JSON.parse(response.text);
    } catch (e) {
        throw new Error("AI response is not valid JSON: " + response.text);
    }


    // Helper to convert flat key-value arrays to array of objects
    function flatArrayToObjects(arr, keys) {
        if (!Array.isArray(arr)) return [];
        const result = [];
        for (let i = 0; i < arr.length; i += keys.length * 2) {
            const obj = {};
            for (let j = 0; j < keys.length * 2; j += 2) {
                const key = arr[i + j];
                const value = arr[i + j + 1];
                if (keys.includes(key)) {
                    obj[key] = value;
                }
            }
            // Only push if all keys are present
            if (keys.every(k => obj[k] !== undefined)) {
                result.push(obj);
            }
        }
        return result;
    }


    // Helper to robustly select the correct field from possible alternates
    function pickFirstValidField(obj, fieldNames) {
        for (const name of fieldNames) {
            if (Array.isArray(obj[name]) && obj[name].length > 0) {
                return obj[name];
            }
        }
        return [];
    }

    // Pick the correct technicalQuestions, behavioralQuestions, skillGaps, preparationPlan
    report.technicalQuestions = pickFirstValidField(report, [
        'technicalQuestions',
        'technicalQuestionsDetail',
        'technicalQuestions_fixed'
    ]);
    report.behavioralQuestions = pickFirstValidField(report, [
        'behavioralQuestions',
        'behavioralQuestionsDetail',
        'behavioralQuestions_fixed'
    ]);
    report.skillGaps = pickFirstValidField(report, [
        'skillGaps',
        'skillsGap',
        'skillGaps_fixed'
    ]);
    report.preparationPlan = pickFirstValidField(report, [
        'preparationPlan',
        'roadMap',
        'preparationPlan_fixed'
    ]);

    // Transform technicalQuestions
    if (Array.isArray(report.technicalQuestions) && typeof report.technicalQuestions[0] === 'string') {
        report.technicalQuestions = flatArrayToObjects(report.technicalQuestions, ['question', 'intention', 'answer']);
    }
    // Transform behavioralQuestions
    if (Array.isArray(report.behavioralQuestions) && typeof report.behavioralQuestions[0] === 'string') {
        report.behavioralQuestions = flatArrayToObjects(report.behavioralQuestions, ['question', 'intention', 'answer']);
    }
    // Transform skillGaps (support both flat and object array)
    if (Array.isArray(report.skillGaps)) {
        if (typeof report.skillGaps[0] === 'string') {
            report.skillGaps = flatArrayToObjects(report.skillGaps, ['skill', 'severity']);
        }
    } else {
        report.skillGaps = [];
    }

    // Transform preparationPlan (support both flat and object array, and multiple tasks)
    if (Array.isArray(report.preparationPlan)) {
        if (typeof report.preparationPlan[0] === 'string') {
            // Try to parse multiple tasks if present
            const result = [];
            let i = 0;
            while (i < report.preparationPlan.length) {
                let day, focus, tasks = [];
                // Find 'day'
                if (report.preparationPlan[i] === 'day') {
                    day = Number(report.preparationPlan[i + 1]);
                    i += 2;
                }
                // Find 'focus'
                if (report.preparationPlan[i] === 'focus') {
                    focus = report.preparationPlan[i + 1];
                    i += 2;
                }
                // Find 'tasks' (may be a string or array)
                if (report.preparationPlan[i] === 'tasks') {
                    // If next is an array, parse all until next 'day' or end
                    let j = i + 1;
                    while (j < report.preparationPlan.length && typeof report.preparationPlan[j] === 'string' && report.preparationPlan[j] !== 'day') {
                        tasks.push(report.preparationPlan[j]);
                        j++;
                    }
                    i = j;
                }
                if (!isNaN(day) && focus && tasks.length > 0) {
                    result.push({ day, focus, tasks });
                }
                // If parsing failed, move forward to avoid infinite loop
                if (i < report.preparationPlan.length && (typeof report.preparationPlan[i] !== 'string' || (report.preparationPlan[i] !== 'day' && report.preparationPlan[i] !== 'focus' && report.preparationPlan[i] !== 'tasks'))) {
                    i++;
                }
            }
            report.preparationPlan = result;
        }
    } else {
        report.preparationPlan = [];
    }

    // Now ensure arrays of objects (in case AI returns correct format)
    function ensureArrayOfObjects(arr) {
        if (!Array.isArray(arr)) return [];
        return arr.filter(q => q && typeof q === 'object');
    }
    report.technicalQuestions = ensureArrayOfObjects(report.technicalQuestions);
    report.behavioralQuestions = ensureArrayOfObjects(report.behavioralQuestions);
    report.skillGaps = ensureArrayOfObjects(report.skillGaps);
    report.preparationPlan = ensureArrayOfObjects(report.preparationPlan);

    // Log the processed report for debugging
    console.log("PROCESSED REPORT:", report);

    return report;
  
   
}

async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}


async function generateResumePdf({ resume, selfDescription, jobDescription }){
    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate a visually appealing resume for a candidate based on the following details:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}
 the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

                    const response = await ai.models.generateContent({
                        model: "gemini-3-flash-preview",
                        contents: prompt,
                        config: {
                            responseMimeType: "application/json",
                            responseJsonSchema: zodToJsonSchema(resumePdfSchema)
                        }
                    });

                    const jsonContent = JSON.parse(response.text);

                    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

                    return pdfBuffer
}

module.exports = {generateInterviewReport, generateResumePdf}

            