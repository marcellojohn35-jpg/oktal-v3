import json
import re
import sys
from pathlib import Path
from collections import Counter

EXPECTED_CATEGORIES = {
    "Basic AI Concepts": 15,
    "Machine Learning": 15,
    "Deep Learning": 10,
    "Data Science for AI": 10,
    "Generative AI & LLM": 15,
    "NLP": 8,
    "Computer Vision": 7,
    "AI Ethics, Regulation & Security": 10,
    "AI Applications": 5,
    "Logic & Computational Thinking": 5,
}

EXPECTED_BANKS = {
    1: ("A", "Easy"),
    2: ("B", "Medium"),
    3: ("C", "Medium"),
    4: ("D", "Hard"),
}

REQUIRED = [
    "id",
    "indicatorId",
    "variant",
    "category",
    "topic",
    "subtopic",
    "difficulty",
    "cognitiveLevel",
    "question",
    "options",
    "answer",
    "explanation",
]

ABSOLUTE_PATTERNS = [
    r"\bselalu\b",
    r"\bpasti\b",
    r"\btidak pernah\b",
    r"\botomatis\b",
    r"\bwajib\b",
    r"\bsemua ai\b",
    r"\bhanya jika\b",
]

errors = []
warnings = []
all_questions = []
global_ids = Counter()
global_stems = Counter()
global_answers = Counter()

def fail(msg):
    errors.append(msg)

def warn(msg):
    warnings.append(msg)

def longest_run(seq):
    best = cur = 0
    prev = None
    for x in seq:
        if x == prev:
            cur += 1
        else:
            prev = x
            cur = 1
        best = max(best, cur)
    return best

for bank_no in range(1, 5):
    path = Path(f"data/banksoal{bank_no}.json")

    if not path.exists():
        fail(f"Bank {bank_no}: file tidak ditemukan")
        continue

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        fail(f"Bank {bank_no}: JSON invalid — {e}")
        continue

    bank = data if isinstance(data, list) else data.get("questions", [])

    if not isinstance(bank, list):
        fail(f"Bank {bank_no}: root harus array/questions array")
        continue

    expected_variant, expected_difficulty = EXPECTED_BANKS[bank_no]

    print(f"\n--- BANK {bank_no} / VARIANT {expected_variant} ---")
    print("Questions :", len(bank))

    if len(bank) != 100:
        fail(f"Bank {bank_no}: harus 100 soal, sekarang {len(bank)}")

    indicator_ids = []
    categories = Counter()
    difficulties = Counter()
    variants = Counter()
    answers = Counter()
    answer_sequence = []

    for pos, q in enumerate(bank, 1):
        qid = str(q.get("id", "")).strip() or f"Bank{bank_no}#{pos}"

        for field in REQUIRED:
            if field not in q or q[field] in (None, "", []):
                fail(f"{qid}: field {field} kosong")

        expected_id = f"OKTAL-{expected_variant}-{pos:03d}"
        if q.get("id") != expected_id:
            fail(
                f"Bank {bank_no} posisi {pos}: "
                f"ID harus {expected_id}, dapat {q.get('id')}"
            )

        indicator = q.get("indicatorId")

        if type(indicator) is not int or not 1 <= indicator <= 100:
            fail(f"{qid}: indicatorId harus integer 1..100")
        else:
            indicator_ids.append(indicator)

            if indicator != pos:
                fail(
                    f"{qid}: indicatorId {indicator} "
                    f"tidak cocok posisi resmi {pos}"
                )

        if q.get("variant") != expected_variant:
            fail(
                f"{qid}: variant harus {expected_variant}, "
                f"dapat {q.get('variant')}"
            )

        if q.get("difficulty") != expected_difficulty:
            fail(
                f"{qid}: difficulty harus {expected_difficulty}, "
                f"dapat {q.get('difficulty')}"
            )

        categories[q.get("category")] += 1
        difficulties[q.get("difficulty")] += 1
        variants[q.get("variant")] += 1

        stem = str(q.get("question", "")).strip()
        normalized_stem = re.sub(r"\s+", " ", stem.casefold())

        global_ids[qid] += 1
        global_stems[normalized_stem] += 1

        opts = q.get("options")
        option_texts = []

        if not isinstance(opts, list):
            fail(f"{qid}: options harus array")
            opts = []

        if len(opts) != 4:
            fail(f"{qid}: harus tepat 4 options")

        keys = []

        for opt in opts:
            if not isinstance(opt, dict):
                fail(f"{qid}: option harus object")
                continue

            key = str(opt.get("key", "")).strip().upper()
            text = str(opt.get("text", "")).strip()

            keys.append(key)

            if not text:
                fail(f"{qid}: option {key or '?'} text kosong")

            option_texts.append(text.casefold())

        if keys != ["A", "B", "C", "D"]:
            fail(f"{qid}: option keys/order harus A,B,C,D")

        if len(option_texts) == 4 and len(set(option_texts)) != 4:
            fail(f"{qid}: option text harus unik")

        answer = q.get("answer")

        if answer not in {"A", "B", "C", "D"}:
            fail(f"{qid}: answer invalid: {answer}")
        else:
            answers[answer] += 1
            global_answers[answer] += 1
            answer_sequence.append(answer)

        explanation = str(q.get("explanation", "")).strip()
        if len(explanation) < 20:
            warn(f"{qid}: explanation sangat pendek ({len(explanation)} chars)")

        all_questions.append(q)

    expected_indicators = list(range(1, 101))

    if sorted(indicator_ids) != expected_indicators:
        missing = sorted(set(expected_indicators) - set(indicator_ids))
        duplicate = sorted(
            k for k, v in Counter(indicator_ids).items()
            if v > 1
        )
        fail(
            f"Bank {bank_no}: indicator 1..100 tidak lengkap; "
            f"missing={missing}, duplicate={duplicate}"
        )

    if dict(categories) != EXPECTED_CATEGORIES:
        fail(
            f"Bank {bank_no}: distribusi kategori salah: "
            f"{dict(categories)}"
        )

    run = longest_run(answer_sequence)

    if run > 6:
        warn(f"Bank {bank_no}: answer run terlalu panjang: {run}")

    for key in "ABCD":
        if not 15 <= answers[key] <= 35:
            warn(
                f"Bank {bank_no}: answer {key} cukup timpang: "
                f"{answers[key]}"
            )

    print("Indicators:", len(set(indicator_ids)))
    print("Categories:", dict(categories))
    print("Difficulty:", dict(difficulties))
    print("Variants  :", dict(variants))
    print("Answers   :", dict(answers))
    print("Max run   :", run)

if len(all_questions) != 400:
    fail(f"Total harus 400, sekarang {len(all_questions)}")

for qid, count in global_ids.items():
    if qid and count > 1:
        fail(f"Duplicate ID: {qid}")

for stem, count in global_stems.items():
    if stem and count > 1:
        fail(f"Duplicate question ({count}x): {stem[:90]}")

starts_apa = sum(
    str(q.get("question", "")).strip().casefold().startswith("apa")
    for q in all_questions
)

unique_longest = 0
severe_135 = 0
severe_150 = 0
margin_20 = 0
suspicious = 0
double_issue = 0

for q in all_questions:
    opts = q.get("options")

    if not isinstance(opts, list) or len(opts) != 4:
        continue

    answer = q.get("answer")
    lengths = {
        str(o.get("key", "")).upper(): len(str(o.get("text", "")).strip())
        for o in opts
        if isinstance(o, dict)
    }

    if answer not in lengths:
        continue

    correct_len = lengths[answer]
    other_lengths = [
        length for key, length in lengths.items()
        if key != answer
    ]

    if len(other_lengths) != 3:
        continue

    max_other = max(other_lengths)
    is_longest = correct_len > max_other

    if is_longest:
        unique_longest += 1
        ratio = correct_len / max(max_other, 1)
        margin = correct_len - max_other

        if ratio >= 1.35:
            severe_135 += 1
        if ratio >= 1.50:
            severe_150 += 1
        if margin >= 20:
            margin_20 += 1

    hits = 0

    for o in opts:
        if not isinstance(o, dict):
            continue
        if str(o.get("key", "")).upper() == answer:
            continue

        text = str(o.get("text", "")).casefold()

        if any(re.search(p, text) for p in ABSOLUTE_PATTERNS):
            hits += 1

    suspicious += hits

    if is_longest and hits:
        double_issue += 1

if severe_150 > 0:
    fail(
        f"Masih ada {severe_150} soal dengan correct answer "
        f">=1.50x distractor terpanjang"
    )

if double_issue > 0:
    fail(f"Masih ada {double_issue} double-issue length+wording")

if starts_apa > 20:
    warn(f"Pertanyaan dimulai 'Apa' cukup banyak: {starts_apa}")

if unique_longest > 120:
    warn(f"Correct answer uniquely-longest masih tinggi: {unique_longest}")

if severe_135 > 35:
    warn(f"Correct answer ratio >=1.35 masih tinggi: {severe_135}")

if margin_20 > 10:
    warn(f"Correct answer margin >=20 masih tinggi: {margin_20}")

if suspicious > 50:
    warn(f"Absolute-word distractor cukup banyak: {suspicious}")

print("\n=== OKTAL V3 OFFICIAL QUESTION VALIDATOR ===")
print("Total             :", len(all_questions))
print("Unique IDs        :", len(global_ids))
print("Unique stems      :", len(global_stems))
print("Starts Apa        :", starts_apa)
print("Answers global    :", dict(global_answers))
print("Unique longest    :", unique_longest)
print("Ratio >= 1.35     :", severe_135)
print("Ratio >= 1.50     :", severe_150)
print("Margin >= 20      :", margin_20)
print("Suspicious        :", suspicious)
print("Double issue      :", double_issue)

if warnings:
    print(f"\n⚠️ WARNINGS — {len(warnings)}")
    for x in warnings:
        print("-", x)

if errors:
    print(f"\n❌ FAIL — {len(errors)} masalah")
    for x in errors:
        print("-", x)
    sys.exit(1)

print("\n🔥 OFFICIAL 100×4 QUESTION ARCHITECTURE PASS")
