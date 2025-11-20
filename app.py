from flask import Flask, render_template, request, jsonify
import random

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/craft', methods=['POST'])
def craft_prompt():
    data = request.json
    user_input = data.get('prompt', '')
    
    # Simple "Futuristic" Logic for Prompt Crafting
    # In a real app, this would call an LLM. Here we use templates/heuristics.
    
    enhancers = [
        "highly detailed", "futuristic style", "cinematic lighting", 
        "8k resolution", "unreal engine 5 render", "cyberpunk aesthetics",
        "hyper-realistic", "volumetric fog", "neon accents"
    ]
    
    crafted = user_input.strip()
    
    # Basic structure enhancement
    if not any(role in crafted.lower() for role in ["act as", "you are a"]):
        crafted = "Act as an expert creative assistant. " + crafted
        
    # Add random aesthetic enhancers if short
    if len(crafted) < 50:
        crafted += ", " + ", ".join(random.sample(enhancers, 2))
        
    return jsonify({'crafted_prompt': crafted})

if __name__ == '__main__':
    app.run(debug=True)
