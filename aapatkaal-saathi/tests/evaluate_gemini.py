"""Opt-in live evaluation; sends the synthetic cases in gemini_cases.json to Google."""
import argparse
import asyncio
import json
from collections import Counter
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from backend import gemini

CASES = Path(__file__).with_name("gemini_cases.json")


async def evaluate() -> None:
    cases = json.loads(CASES.read_text(encoding="utf-8"))
    expected_counts: Counter[str] = Counter()
    correct_counts: Counter[str] = Counter()
    outcomes: Counter[str] = Counter()
    errors = 0
    for index, case in enumerate(cases):
        expected = case["expected"]
        expected_counts[expected] += 1
        try:
            result = await gemini.classify(case["description"], case["language"])
            actual = result["card_id"]
        except gemini.GeminiError:
            actual = "provider_error"
            errors += 1
        outcomes[f"{expected} -> {actual}"] += 1
        if actual == expected:
            correct_counts[expected] += 1
        if index + 1 < len(cases):
            await asyncio.sleep(12)

    total = len(cases)
    correct = sum(correct_counts.values())
    print(f"Gemini closed-set match: {correct}/{total} ({correct / total:.0%})")
    print(f"Provider/request errors: {errors}/{total}")
    print("Per-label match:")
    for label, support in sorted(expected_counts.items()):
        matched = correct_counts[label]
        print(f"  {label}: {matched}/{support} ({matched / support:.0%})")
    print("Observed label confusions:")
    for outcome, count in sorted(outcomes.items()):
        if " -> " in outcome and outcome.split(" -> ", 1)[0] != outcome.split(" -> ", 1)[1]:
            print(f"  {outcome}: {count}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--run",
        action="store_true",
        help="send synthetic requests; may consume Gemini API quota",
    )
    args = parser.parse_args()
    if not args.run:
        parser.error("Pass --run to explicitly send the evaluation prompts to Google.")
    if not gemini.configured():
        parser.error("Set GEMINI_API_KEY before running the live evaluation.")
    asyncio.run(evaluate())


if __name__ == "__main__":
    main()
