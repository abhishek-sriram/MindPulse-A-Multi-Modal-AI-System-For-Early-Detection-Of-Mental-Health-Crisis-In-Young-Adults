from groq import Groq

client = Groq(api_key="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")

print("\n🔥 MODELS AVAILABLE FOR YOUR GROQ KEY:\n")

models = client.models.list()

for m in models.data:
    print(m.id)