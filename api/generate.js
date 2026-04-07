import axios from 'axios';

const SYSTEM_PROMPT = `
You are RECAI, a professional health-focused chef and nutritionist.
Your mission is to provide premium, health-conscious recipes.

ACADEMIC PROJECT REQUIREMENTS:
1.  **Local Swaps**: Identify high-cost/international ingredients (e.g., Kale, Quinoa, Avocado) and provide affordable, high-nutrition local alternatives (e.g., Spinach/Palak, Millets, Guava) for the user's region (Default: India).
2.  **Smart Cooking Timeline**: Generate a structured sequence of tasks with 'start_time' and 'duration' (in minutes) to ensure parallel task management (e.g., Boiling water while chopping).

CRITICAL INSTRUCTIONS:
- You MUST only output valid JSON. No conversational text before or after.
- Return a "json_object" only.

REQUIRED JSON FORMAT:
{
  "title": "Recipe Name",
  "nutrition": "Calories | Protein | Carbs | Fats",
  "health_score": 9,
  "nutrition_focus": "Detailed focus here...",
  "ingredients": ["1 cup ingredient name", "2 tbsp something else"],
  "steps": ["Step 1", "Step 2"],
  "dietary_labels": ["Vegan", "Gluten-Free"],
  "prep_time": "15 mins",
  "local_swaps": [
    {"original": "Ingredient name", "substitute": "Local alternative", "reason": "Why it's a good swap"}
  ],
  "cooking_timeline": [
    {"task": "Task description", "start_time": 0, "duration": 5}
  ]
}
`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { prompt, isLocalMode } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // Inject localization context if active
  const userMessage = isLocalMode 
    ? `Generate a LOCALLY OPTIMIZED recipe for: ${prompt}. Prioritize regional Indian alternatives for expensive ingredients.`
    : `Generate a recipe for: ${prompt}`;

  const payload = {
    model: "arcee-ai/trinity-large-preview:free", 
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage }
    ],
    response_format: { type: "json_object" }
  };

  console.log("\n--- 🚀 SENDING TO OPENROUTER ---");
  console.log("Model:", payload.model);
  console.log("Mode:", isLocalMode ? "LOCAL" : "STANDARD");

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      payload,
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": req.headers.referer || "http://localhost:3001",
          "X-Title": "RECAI Health Assistant",
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.data.choices || response.data.choices.length === 0) {
      return res.status(500).json({ error: "No response choices returned from AI." });
    }

    const content = response.data.choices[0].message.content;
    
    try {
      const recipeData = JSON.parse(content);
      res.status(200).json(recipeData);
    } catch (parseError) {
      console.error("❌ JSON PARSE ERROR:", parseError);
      res.status(500).json({ error: "AI returned invalid JSON. Please try again." });
    }

  } catch (error) {
    console.error("\n--- ❌ OPENROUTER API ERROR ---");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Details:", JSON.stringify(error.response.data, null, 2));
    }
    res.status(500).json({ error: "Failed to generate recipe. Check server logs." });
  }
}
