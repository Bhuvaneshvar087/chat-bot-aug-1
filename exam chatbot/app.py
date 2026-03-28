from flask import Flask, render_template, request, jsonify
import time
from ai_engine import generate_exam_answer
from analytics import update_performance, generate_report

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/ask", methods=["POST"])
def ask():
    data = request.json
    question = data["question"]
    topic = data["topic"]
    marks = data["marks"]
    time_taken = data["time"]

    answer = "Error: Could not generate response."
    
    # Generate answer using local model
    try:
        # Pass all data to the model
        answer = generate_exam_answer(
            question=question,
            marks=marks,
            topic=topic,
            time=time_taken
        )
    except Exception as e:
        error_msg = str(e)
        print(f"AI Engine Error: {error_msg}")
        answer = "⚠️ Error generating answer. Please try again."

    # Simple correctness heuristic (AI self-check)
    correct = len(answer) > 50  

    update_performance(topic, correct, time_taken)

    return jsonify({"answer": answer})

@app.route("/report")
def report():
    return jsonify(generate_report())

if __name__ == "__main__":
    app.run(debug=True)
