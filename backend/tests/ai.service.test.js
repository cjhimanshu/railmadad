const test = require("node:test");
const assert = require("node:assert/strict");
const axios = require("axios");

const servicePath = require.resolve("../services/ai.service");

function loadAiService() {
  delete require.cache[servicePath];
  return require("../services/ai.service");
}

test.afterEach(() => {
  delete require.cache[servicePath];
});

test("generateSuggestedResponse uses the supported default Hugging Face model", async () => {
  const originalPost = axios.post;
  const capturedRequests = [];

  delete process.env.HF_MODEL_RESPONSE;
  process.env.HUGGINGFACE_API_KEY =
    process.env.HUGGINGFACE_API_KEY || "test_key";

  axios.post = async (url, payload) => {
    capturedRequests.push({ url, payload });
    return {
      data: [
        {
          generated_text:
            'As a railway customer service representative, write a professional and empathetic response to this infrastructure complaint: "Broken seat". Keep it brief and helpful. Thank you for reporting this issue. We are reviewing it now.',
        },
      ],
    };
  };

  try {
    const aiService = loadAiService();
    const result = await aiService.generateSuggestedResponse(
      "Broken seat",
      "infrastructure",
    );

    assert.equal(capturedRequests.length, 1);
    assert.equal(
      capturedRequests[0].url,
      "https://router.huggingface.co/hf-inference/models/google/flan-t5-small",
    );
    assert.equal(
      result.response,
      "Thank you for reporting this issue. We are reviewing it now.",
    );
  } finally {
    axios.post = originalPost;
  }
});
