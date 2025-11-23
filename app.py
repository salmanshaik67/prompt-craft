from flask import Flask, render_template, request, jsonify
import os
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Initialize OpenAI Client
# We use Pollinations.ai as a free, no-signup alternative that is OpenAI-compatible.
# No real API key is required, but the client expects one.
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY", "dummy-key"),
    base_url="https://text.pollinations.ai/openai"
)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/craft', methods=['POST'])
def craft_prompt():
    data = request.json
    user_input = data.get('prompt', '')
    
    if not user_input:
        return jsonify({'error': 'No prompt provided'}), 400

    try:
        # Optimization: Combine Refinement and Response into a single API call to reduce latency by 50%.
        # We also explicitly instruct the model to use Markdown for the response.
        combined_response = client.chat.completions.create(
            model="openai",
            messages=[
                {"role": "system", "content": """You are an expert AI assistant. Your task is two-fold:
1. Analyze the user's prompt.
2. IF the prompt is extremely vague (e.g., just "logo", "story", "help"), you MUST ask a single clarifying question to understand the user's intent.
   Output format: CLARIFICATION_REQUIRED: <your question>
3. IF the prompt is clear enough to proceed (even if not perfect):
   a. Refine it: Correct grammar, clarify intent, and make it precise.
   b. Answer it: Provide a concise, direct answer.

IMPORTANT FORMATTING INSTRUCTIONS:
- If the user asks for a list, you MUST provide a Markdown bulleted or numbered list.
- If the user asks for a paragraph, provide a paragraph.
- Use Markdown (bold, italics, lists) to make the output readable.

Return your output EXACTLY in one of these two formats:

Format A (Clarification Needed):
CLARIFICATION_REQUIRED: <your question>

Format B (Success):
REFINED_PROMPT: <insert refined prompt here>
|||SEPARATOR|||
GPT_RESPONSE: <insert answer here>"""},
                {"role": "user", "content": user_input}
            ]
        )
        
        full_text = combined_response.choices[0].message.content.strip()
        
        # Parse the result
        if "CLARIFICATION_REQUIRED:" in full_text:
            question = full_text.replace("CLARIFICATION_REQUIRED:", "").strip()
            return jsonify({
                'status': 'clarification',
                'question': question
            })
        elif "|||SEPARATOR|||" in full_text:
            parts = full_text.split("|||SEPARATOR|||")
            refined_prompt = parts[0].replace("REFINED_PROMPT:", "").strip()
            gpt_response = parts[1].replace("GPT_RESPONSE:", "").strip()
            return jsonify({
                'status': 'success',
                'refined_prompt': refined_prompt,
                'gpt_response': gpt_response
            })
        else:
            # Fallback
            return jsonify({
                'status': 'success',
                'refined_prompt': "Refined version unavailable (Model format error)",
                'gpt_response': full_text
            })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
