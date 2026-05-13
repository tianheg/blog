#!/usr/bin/env python3
"""Subset Satoshi fonts to Latin character set."""

import subprocess
import sys
from pathlib import Path

# Google Fonts Latin subset Unicode ranges
# U+0000-00FF : Basic Latin + Latin-1 Supplement (A-Z, a-z, 0-9, common punctuation, Western European chars)
# U+0131      : Dotless i (Turkish)
# U+0152-0153 : Œ œ ligatures (French)
# U+02BB-02BC : ʻ ʼ modifier letter apostrophes (Hawaiian, Samoan)
# U+02C6      : ˆ circumflex modifier
# U+02DA      : ˚ ring above modifier
# U+02DC      : ˜ tilde modifier
# U+2000-206F : General Punctuation (quotes, dashes, ellipsis, etc.)
# U+2074      : Superscript 4
# U+20AC      : € Euro sign
# U+2122      : ™ Trademark sign
# U+2191      : ↑ Up arrow
# U+2193      : ↓ Down arrow
# U+2212      : − Minus sign (longer than hyphen)
# U+2215      : ∕ Division slash
# U+FEFF      : Zero-width no-break space (BOM)
# U+FFFD      : � Replacement character
LATIN_RANGES = (
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,"
    "U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"
)

FONTS_DIR = Path("static/fonts")


def subset_font(input_file: Path, output_file: Path, unicode_range: str) -> None:
    """Subset a font file using fontTools.subset."""
    cmd = [
        sys.executable,
        "-m",
        "fontTools.subset",
        str(input_file),
        "--flavor=woff2",
        f"--output-file={output_file}",
        f"--unicodes={unicode_range}",
        "--layout-features=*",
        "--glyph-names",
        "--symbol-cmap",
        "--legacy-cmap",
        "--notdef-glyph",
        "--notdef-outline",
        "--recommended-glyphs",
        "--name-IDs=*",
        "--drop-tables=DSIG",
    ]
    subprocess.run(cmd, check=True)


def main() -> None:
    fonts = [
        "Satoshi-Variable.woff2",
        "Satoshi-VariableItalic.woff2",
    ]

    total_original = 0
    total_subset = 0

    for filename in fonts:
        input_path = FONTS_DIR / filename
        if not input_path.exists():
            print(f"Warning: {input_path} not found, skipping.")
            continue

        # Create subset in temp location
        temp_output = FONTS_DIR / f"{input_path.stem}-subset.woff2"
        subset_font(input_path, temp_output, LATIN_RANGES)

        # Calculate savings
        original_size = input_path.stat().st_size
        subset_size = temp_output.stat().st_size
        savings_pct = (1 - subset_size / original_size) * 100

        total_original += original_size
        total_subset += subset_size

        print(
            f"  {filename}: {original_size / 1024:.1f} KB -> {subset_size / 1024:.1f} KB "
            f"({savings_pct:.1f}% reduction)"
        )

        # Replace original with subset
        backup_path = input_path.with_suffix(input_path.suffix + ".bak")
        input_path.rename(backup_path)
        temp_output.rename(input_path)
        backup_path.unlink()

        print(f"  Replaced {filename} with subset version")

    if total_original > 0:
        total_savings = (1 - total_subset / total_original) * 100
        print(
            f"\nTotal: {total_original / 1024:.1f} KB -> {total_subset / 1024:.1f} KB "
            f"({total_savings:.1f}% reduction)"
        )


if __name__ == "__main__":
    main()
