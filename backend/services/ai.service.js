const axios = require("axios");

const HUGGINGFACE_API_URL = "https://router.huggingface.co/hf-inference/models";
const API_KEY = process.env.HUGGINGFACE_API_KEY;

// Helper function to make API calls to Hugging Face
const queryHuggingFace = async (model, data) => {
  try {
    const response = await axios.post(`${HUGGINGFACE_API_URL}/${model}`, data, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Hugging Face API Error:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

// Categorize complaint using zero-shot classification
exports.categorizeComplaint = async (text) => {
  try {
    const categories = [
      "cleanliness",
      "safety",
      "staff behavior",
      "staff complaint",
      "overcharging",
      "facilities",
      "ticketing",
      "punctuality",
      "food quality",
      "infrastructure",
      "other",
    ];

    const result = await queryHuggingFace("facebook/bart-large-mnli", {
      inputs: text,
      parameters: { candidate_labels: categories },
    });

    // New router.huggingface.co returns [{label, score}, ...]
    const sorted = Array.isArray(result)
      ? result
      : result.labels
        ? result.labels.map((label, idx) => ({
            label,
            score: result.scores[idx],
          }))
        : [];
    sorted.sort((a, b) => b.score - a.score);

    const topCategory = sorted[0].label.replace(/ /g, "_");
    const confidence = sorted[0].score;

    return {
      category: topCategory,
      confidence: confidence,
      allScores: sorted.map((item) => ({
        category: item.label.replace(/ /g, "_"),
        score: item.score,
      })),
    };
  } catch (error) {
    console.error("Error in categorizeComplaint:", error.message);
    return {
      category: "other",
      confidence: 0,
      error: "AI categorization failed",
    };
  }
};

// Analyze sentiment of complaint
exports.analyzeSentiment = async (text) => {
  try {
    const result = await queryHuggingFace(
      "distilbert/distilbert-base-uncased-finetuned-sst-2-english",
      { inputs: text },
    );

    // New format: [[{ label, score }, ...]] or [{ label, score }, ...]
    const inner = Array.isArray(result[0]) ? result[0] : result;
    const top = inner.sort((a, b) => b.score - a.score)[0];
    const sentiment = top.label.toLowerCase();
    const score = top.score;

    // Map to our sentiment categories
    let mappedSentiment = "neutral";
    if (sentiment === "positive" && score > 0.6) {
      mappedSentiment = "positive";
    } else if (sentiment === "negative" && score > 0.6) {
      mappedSentiment = "negative";
    }

    return {
      sentiment: mappedSentiment,
      confidence: score,
    };
  } catch (error) {
    console.error("Error in analyzeSentiment:", error.message);
    return {
      sentiment: "neutral",
      confidence: 0,
      error: "Sentiment analysis failed",
    };
  }
};

// Suggest priority based on text analysis
exports.suggestPriority = async (text, sentiment) => {
  try {
    // Priority keywords
    const urgentKeywords = [
      "urgent",
      "emergency",
      "immediate",
      "dangerous",
      "critical",
      "severe",
      "accident",
      "injury",
      "threat",
    ];
    const highKeywords = [
      "serious",
      "important",
      "broken",
      "damaged",
      "unsafe",
      "health",
      "security",
    ];

    const lowerText = text.toLowerCase();

    // Check for urgent keywords
    if (urgentKeywords.some((keyword) => lowerText.includes(keyword))) {
      return { priority: "urgent", confidence: 0.9 };
    }

    // Check for high priority keywords
    if (highKeywords.some((keyword) => lowerText.includes(keyword))) {
      return { priority: "high", confidence: 0.8 };
    }

    // Use sentiment to determine priority
    if (sentiment === "negative") {
      return { priority: "high", confidence: 0.7 };
    } else if (sentiment === "positive") {
      return { priority: "low", confidence: 0.6 };
    }

    return { priority: "medium", confidence: 0.5 };
  } catch (error) {
    console.error("Error in suggestPriority:", error.message);
    return { priority: "medium", confidence: 0 };
  }
};

// Generate suggested response using text generation
exports.generateSuggestedResponse = async (complaintText, category) => {
  try {
    const prompt = `As a railway customer service representative, write a professional and empathetic response to this ${category} complaint: "${complaintText}". Keep it brief and helpful.`;

    const result = await queryHuggingFace("gpt2", {
      inputs: prompt,
      parameters: {
        max_length: 150,
        temperature: 0.7,
      },
    });

    return {
      response: result[0].generated_text.replace(prompt, "").trim(),
    };
  } catch (error) {
    console.error("Error in generateSuggestedResponse:", error.message);
    // Provide a generic fallback response
    return {
      response: `Thank you for bringing this ${category} issue to our attention. We are reviewing your complaint and will take appropriate action shortly. We apologize for any inconvenience caused.`,
      error: "AI response generation failed, using template",
    };
  }
};

// Main function to process complaint with all AI features
exports.processComplaintWithAI = async (title, description) => {
  try {
    const fullText = `${title}. ${description}`;

    // Run AI analyses in parallel for better performance
    const [categoryResult, sentimentResult] = await Promise.all([
      exports.categorizeComplaint(fullText),
      exports.analyzeSentiment(fullText),
    ]);

    // Get priority based on sentiment
    const priorityResult = await exports.suggestPriority(
      fullText,
      sentimentResult.sentiment,
    );

    // Generate suggested response
    const responseResult = await exports.generateSuggestedResponse(
      fullText,
      categoryResult.category,
    );

    return {
      category: categoryResult.category,
      sentiment: sentimentResult.sentiment,
      priority: priorityResult.priority,
      suggestedResponse: responseResult.response,
      confidence: {
        category: categoryResult.confidence,
        sentiment: sentimentResult.confidence,
        priority: priorityResult.confidence,
      },
    };
  } catch (error) {
    console.error("Error in processComplaintWithAI:", error.message);
    // Return safe defaults if AI processing fails
    return {
      category: "other",
      sentiment: "neutral",
      priority: "medium",
      suggestedResponse:
        "Thank you for your complaint. We are reviewing it and will respond soon.",
      confidence: {
        category: 0,
        sentiment: 0,
        priority: 0,
      },
      error: "AI processing failed, using defaults",
    };
  }
};
