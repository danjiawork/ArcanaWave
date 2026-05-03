#!/usr/bin/env python3
"""
Extract 22 Major Arcana card images from PocketTarotCards2023.pdf.

Usage:
    pip install pymupdf Pillow
    python scripts/extract-cards.py /path/to/PocketTarotCards2023.pdf
"""

import sys
import os
from pathlib import Path

try:
    import fitz
except ImportError:
    print("Install pymupdf: pip install pymupdf")
    sys.exit(1)

from PIL import Image
import io

CARD_NAMES = [
    "00-the-fool", "01-the-magician", "02-the-high-priestess",
    "03-the-empress", "04-the-emperor", "05-the-hierophant",
    "06-the-lovers", "07-the-chariot", "08-strength",
    "09-the-hermit", "10-wheel-of-fortune", "11-justice",
    "12-the-hanged-man", "13-death", "14-temperance",
    "15-the-devil", "16-the-tower", "17-the-star",
    "18-the-moon", "19-the-sun", "20-judgement", "21-the-world"
]

TARGET_WIDTH = 400
TARGET_HEIGHT = 640

def extract_cards(pdf_path: str, output_dir: str):
    os.makedirs(output_dir, exist_ok=True)
    doc = fitz.open(pdf_path)
    card_index = 0

    for page_num in range(len(doc)):
        if card_index >= 22:
            break
        page = doc[page_num]
        mat = fitz.Matrix(3, 3)
        pix = page.get_pixmap(matrix=mat)
        img_data = pix.tobytes("png")
        img = Image.open(io.BytesIO(img_data))

        pw, ph = img.size
        cols, rows = 2, 4
        card_w = pw // cols
        card_h = ph // rows

        for row in range(rows):
            for col in range(cols):
                if card_index >= 22:
                    break
                x1 = col * card_w
                y1 = row * card_h
                card_img = img.crop((x1, y1, x1 + card_w, y1 + card_h))
                card_img = card_img.resize((TARGET_WIDTH, TARGET_HEIGHT), Image.LANCZOS)
                filename = f"{CARD_NAMES[card_index]}.png"
                card_img.save(os.path.join(output_dir, filename))
                print(f"  Extracted: {filename}")
                card_index += 1

    doc.close()
    print(f"\nDone! Extracted {card_index} cards to {output_dir}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(f"Usage: python {sys.argv[0]} <path-to-pdf>")
        sys.exit(1)
    pdf_path = sys.argv[1]
    project_root = Path(__file__).parent.parent
    output_dir = project_root / "public" / "cards" / "fronts"
    if not os.path.exists(pdf_path):
        print(f"Error: PDF not found at {pdf_path}")
        sys.exit(1)
    extract_cards(pdf_path, str(output_dir))
