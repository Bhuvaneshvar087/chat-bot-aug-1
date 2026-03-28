import google.generativeai as genai

# This is the key you posted
genai.configure(api_key="AIzaSyA_MZ2RD-DqZsRobfzULp2utByP8qe5H-c") 

print("--- CHECKING AVAILABLE MODELS ---")
try:
    available_models = []
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"Found model: {m.name}")
            available_models.append(m.name)
            
    if not available_models:
        print("ERROR: No models found. Your API Key might be invalid or restricted.")
    else:
        print(f"\nTotal models found: {len(available_models)}")

except Exception as e:
    print("\nCRITICAL ERROR:", e)