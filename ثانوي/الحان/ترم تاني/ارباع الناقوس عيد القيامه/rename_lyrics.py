"""
بيلف على كل فولدرات الألحان ويسمّي الصورة اللي جواها lyrics.png

الاستخدام (من CMD أو Terminal):
    python rename_lyrics.py "C:\\path\\to\\الحان"            <- تجربة بس (مش بيغيّر حاجة)
    python rename_lyrics.py "C:\\path\\to\\الحان" --apply    <- تنفيذ فعلي

لو في صور jpg/webp بيحوّلها png (محتاج: pip install pillow)
"""
import sys
from pathlib import Path

IMG_EXT = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    root = Path(sys.argv[1])
    apply = "--apply" in sys.argv

    renamed = skipped = 0
    problems = []

    for folder in sorted(p for p in root.rglob("*") if p.is_dir()):
        images = [f for f in folder.iterdir()
                  if f.is_file() and f.suffix.lower() in IMG_EXT]
        if not images:
            continue

        target = folder / "lyrics.png"
        if target.exists():
            skipped += 1
            continue

        if len(images) > 1:
            problems.append(f"{folder}  ->  فيه {len(images)} صور، اختار واحدة بإيدك")
            continue

        src = images[0]
        print(f"{src.relative_to(root)}  ->  lyrics.png")
        if not apply:
            renamed += 1
            continue

        if src.suffix.lower() == ".png":
            src.rename(target)
        else:
            try:
                from PIL import Image
                Image.open(src).convert("RGB").save(target, "PNG")
                src.unlink()
            except ImportError:
                problems.append(f"{src}  ->  محتاج pip install pillow")
                continue
        renamed += 1

    print(f"\n{'تم تغيير' if apply else 'هيتغير'}: {renamed} | اتخطى (موجود): {skipped}")
    if problems:
        print("\nمشاكل:")
        for p in problems:
            print("  -", p)
    if not apply:
        print("\nده كان تجربة بس. ضيف --apply للتنفيذ.")

if __name__ == "__main__":
    main()
