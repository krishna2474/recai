import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Debug API key
console.log("API KEY:", process.env.API_KEY);

// ✅ HOME ROUTE (FIXED)
app.get("/", (req, res) => {
  res.render("index", { recipe: null }); // ALWAYS PASS recipe
});

// ✅ GENERATE ROUTE
app.post("/generate", async (req, res) => {
  const prompt = req.body.prompt;

  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
      {
        contents: [
          {
            parts: [
              {
                text: `
You are RECAI - AI Cooking Assistant.

Give:
- Dish Name
- Ingredients
- Steps
- Nutrition

User Prompt: ${prompt}
`
              }
            ]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": process.env.API_KEY
        }
      }
    );

    const recipe =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ No response from AI";

    res.render("index", { recipe });

  } catch (error) {
    console.error("ERROR:", error.response?.data || error.message);

    res.render("index", {
      recipe: "❌ Error generating recipe. Check API key or API config."
    });
  }
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});