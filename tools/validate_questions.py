import json, sys
from pathlib import Path
from collections import Counter

EXPECTED_CATEGORIES = {
    "Basic AI Concepts": 60,
    "Machine Learning": 60,
    "Deep Learning": 40,
    "Data Science for AI": 40,
    "Generative AI & LLM": 60,
    "NLP": 32,
    "Computer Vision": 28,
    "AI Ethics, Regulation & Security": 40,
    "AI Applications": 20,
    "Logic & Computational Thinking": 20,
}

EXPECTED_DIFFICULTY = {
    "Easy": 100,
    "Medium": 200,
    "Hard": 100,
}

REQUIRED = [
    "id","category","topic","subtopic","difficulty",
    "cognitiveLevel","question","options","answer","explanation"
]

questions=[]

for i in range(1,5):
    path=Path(f"data/banksoal{i}.json")
    data=json.loads(path.read_text())
    arr=data if isinstance(data,list) else data.get("questions",[])
    questions.extend(arr)

errors=[]

if len(questions) != 400:
    errors.append(f"Total harus 400, sekarang {len(questions)}")

ids=Counter()
texts=Counter()
categories=Counter()
difficulty=Counter()
answers=Counter()

for n,q in enumerate(questions,1):
    for field in REQUIRED:
        if field not in q or q[field] in (None,"",[]):
            errors.append(f"Soal #{n}: field {field} kosong")

    ids[str(q.get("id",""))] += 1
    texts[str(q.get("question","")).strip().lower()] += 1
    categories[q.get("category")] += 1
    difficulty[q.get("difficulty")] += 1
    answers[q.get("answer")] += 1

    opts=q.get("options")

    if isinstance(opts,list):
        keys={
            str(opt.get("key","")).strip().upper()
            for opt in opts
            if isinstance(opt,dict)
        }

        if len(opts) != 4:
            errors.append(f"{q.get('id')}: harus punya tepat 4 options")

        for opt in opts:
            if not isinstance(opt,dict) or not str(opt.get("text","")).strip():
                errors.append(f"{q.get('id')}: option text kosong/invalid")
                break
    else:
        keys=set()
        errors.append(f"{q.get('id')}: options harus berupa array")

    if keys != {"A","B","C","D"}:
        errors.append(f"{q.get('id')}: option keys harus A/B/C/D")

    if q.get("answer") not in {"A","B","C","D"}:
        errors.append(f"{q.get('id')}: answer invalid")

for k,v in ids.items():
    if k and v>1:
        errors.append(f"Duplicate ID: {k}")

for k,v in texts.items():
    if k and v>1:
        errors.append(f"Duplicate question: {k[:70]}")

if dict(categories) != EXPECTED_CATEGORIES:
    errors.append(f"Distribusi kategori salah: {dict(categories)}")

if dict(difficulty) != EXPECTED_DIFFICULTY:
    errors.append(f"Difficulty salah: {dict(difficulty)}")

for key in "ABCD":
    if not 90 <= answers[key] <= 110:
        errors.append(f"Answer {key} terlalu timpang: {answers[key]}")

apa=sum(
    str(q.get("question","")).strip().lower().startswith("apa")
    for q in questions
)

if apa > 80:
    errors.append(f"Terlalu banyak pertanyaan dimulai 'Apa': {apa}")

print("=== OKTAL V3 QUESTION VALIDATOR ===")
print("Total      :",len(questions))
print("Categories :",dict(categories))
print("Difficulty :",dict(difficulty))
print("Answers    :",dict(answers))
print("Starts Apa :",apa)

if errors:
    print(f"\n❌ FAIL — {len(errors)} masalah")
    for x in errors[:30]:
        print("-",x)
    sys.exit(1)

print("\n🔥 400 QUESTION BANK PASS")
