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


def trim_card(img, threshold=235):
    """Trim white borders from a card image by finding columns/rows
    where >70% of pixels are near-white."""
    import numpy as np
    arr = np.array(img)
    h, w = arr.shape[:2]

    # A pixel is "white" if all channels > threshold
    white_mask = arr.min(axis=2) > threshold

    # For each column, what fraction of pixels are white?
    col_white_frac = white_mask.mean(axis=0)
    # For each row, what fraction are white?
    row_white_frac = white_mask.mean(axis=1)

    # Find left: scan from left, skip columns that are >70% white
    left = 0
    for x in range(w):
        if col_white_frac[x] < 0.7:
            left = x
            break

    # Find right: scan from right
    right = w
    for x in range(w - 1, -1, -1):
        if col_white_frac[x] < 0.7:
            right = x + 1
            break

    # Find top
    top = 0
    for y in range(h):
        if row_white_frac[y] < 0.7:
            top = y
            break

    # Find bottom
    bottom = h
    for y in range(h - 1, -1, -1):
        if row_white_frac[y] < 0.7:
            bottom = y + 1
            break

    if right <= left or bottom <= top:
        return img
    return img.crop((left, top, right, bottom))


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
        # 4 columns x 2 rows per page
        cols, rows = 4, 2
        cell_w = pw / cols
        cell_h = ph / rows

        for row in range(rows):
            for col in range(cols):
                if card_index >= 22:
                    break
                # Large inset to guarantee no adjacent card bleed
                inset_x = cell_w * 0.12
                inset_y = cell_h * 0.04
                x1 = int(col * cell_w + inset_x)
                y1 = int(row * cell_h + inset_y)
                x2 = int((col + 1) * cell_w - inset_x)
                y2 = int((row + 1) * cell_h - inset_y)
                card_img = img.crop((x1, y1, x2, y2))
                # Trim any remaining white borders
                card_img = trim_card(card_img)
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
