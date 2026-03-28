from openai import OpenAI
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# GROQ API setup (FREE alternative to OpenAI)
# Get your FREE API key from: https://console.groq.com/keys
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "your-groq-api-key-here")

try:
    # Groq uses OpenAI-compatible API
    client = OpenAI(
        api_key=GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1"
    )
    print("Groq client initialized successfully! (FREE)")
except Exception as e:
    print(f"Error initializing Groq: {e}")
    client = None

def generate_exam_answer(question, marks, topic=None, time=None):
    """
    Generate exam answer using Groq API (FREE).
    Accepts data format: {
        "topic": "bayes theorem",
        "question": "what is bayes",
        "marks": "10",
        "time": 220.192
    }
    """
    if client is None:
        return "Error: Groq client not initialized. Please set GROQ_API_KEY."
    
    # Convert marks to int for calculations
    try:
        marks_int = int(marks)
    except:
        marks_int = 2
    
    # Adjust prompt detail based on marks
    if marks_int <= 2:
        detail_instruction = "Provide a brief answer (2-3 sentences)"
    elif marks_int <= 6:
        detail_instruction = "Provide a moderate detailed answer with examples (1-2 paragraphs)"
    else:  # 10 marks or more
        detail_instruction = "Provide a comprehensive detailed answer with examples, explanations, and key points (2-3 paragraphs)"
    
    # Build system prompt
    system_prompt = f"""You are an exam preparation assistant. 
Answer questions in a clear, structured format suitable for {marks} mark exam questions.
Use simple English and exam-oriented explanations."""
    
    # Build user prompt
    if topic:
        user_prompt = f"""Topic: {topic}
Question: {question}

{detail_instruction} for {marks} marks."""
    else:
        user_prompt = f"""Question: {question}

{detail_instruction} for {marks} marks."""
    
    try:
        # Call Groq API (FREE - uses OpenAI compatible endpoint)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # Free model options: llama-3.3-70b-versatile, mixtral-8x7b-32768
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=500 if marks_int >= 10 else (300 if marks_int >= 6 else 150)
        )
        
        answer = response.choices[0].message.content
        return answer
        
    except Exception as e:
        error_msg = str(e)
        print(f"Groq API ERROR: {error_msg}")
        
        # Handle specific errors
        if "api_key" in error_msg.lower():
            return "⚠️ Invalid API Key. Please set your Groq API key."
        elif "rate_limit" in error_msg.lower():
            return "⚠️ Rate limit exceeded. Please wait and try again."
        
        return f"Error: {error_msg}"