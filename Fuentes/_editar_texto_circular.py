from PIL import Image, ImageDraw, ImageFont
import pymupdf
import os

SRC_PDF = r"Fuentes/Logo_AndreCG_Original_Alta_Calidad.pdf"
OUT_PDF = r"Fuentes/Logo_AndreCG_Original_Alta_Calidad_texto_circular.pdf"
TMP_IMG = r"Fuentes/_tmp_logo_base.png"
TMP_EDIT = r"Fuentes/_tmp_logo_edit.png"
PREVIEW = r"Fuentes/_tmp_logo_preview_texto_circular.png"

NEW_TEXT = "ESPECIALISTA EN ALISADOS, LASH LIFTHING, BROWS ARTIST"


def load_embedded_image(pdf_path: str, out_img_path: str):
    doc = pymupdf.open(pdf_path)
    page = doc[0]
    xref = page.get_images(full=True)[0][0]
    data = doc.extract_image(xref)["image"]
    with open(out_img_path, "wb") as f:
        f.write(data)
    rect = page.rect
    doc.close()
    return rect.width, rect.height


def get_font(size: int):
    candidates = [
        r"C:/Windows/Fonts/arialbd.ttf",
        r"C:/Windows/Fonts/arial.ttf",
        r"C:/Windows/Fonts/segoeuib.ttf",
        r"C:/Windows/Fonts/segoeui.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def draw_text_on_arc(base: Image.Image, text: str):
    img = base.convert("RGBA")
    draw = ImageDraw.Draw(img)

    # Coordinates tuned for the current 1778x592 logo artwork.
    cx, cy = 889, 181

    # Draw readable curved-like text using 3 rotated segments on lower inner margin.
    font = get_font(10)
    color = (185, 146, 98, 255)

    segments = [
        ("ESPECIALISTA EN ALISADOS,", (812, 322), -14),
        ("LASH LIFTHING,", (889, 334), 0),
        ("BROWS ARTIST", (966, 322), 14),
    ]

    for value, (tx, ty), rot in segments:
        tw, th = draw.textbbox((0, 0), value, font=font)[2:4]
        patch = Image.new("RGBA", (tw + 20, th + 20), (0, 0, 0, 0))
        pdraw = ImageDraw.Draw(patch)
        pdraw.text((10, 10), value, font=font, fill=color)
        patch = patch.rotate(rot, resample=Image.Resampling.BICUBIC, expand=True)
        img.alpha_composite(patch, (int(tx - patch.width / 2), int(ty - patch.height / 2)))

    return img.convert("RGB")


def rebuild_pdf_from_image(image_path: str, pdf_path: str, page_w: float, page_h: float):
    out = pymupdf.open()
    p = out.new_page(width=page_w, height=page_h)
    p.insert_image(p.rect, filename=image_path)
    out.save(pdf_path, deflate=True)
    out.close()


def main():
    page_w, page_h = load_embedded_image(SRC_PDF, TMP_IMG)
    base = Image.open(TMP_IMG).convert("RGB")
    edited = draw_text_on_arc(base, NEW_TEXT)
    edited.save(TMP_EDIT, quality=96)

    rebuild_pdf_from_image(TMP_EDIT, OUT_PDF, page_w, page_h)

    # Generate preview for validation.
    d = pymupdf.open(OUT_PDF)
    d[0].get_pixmap(dpi=300).save(PREVIEW)
    d.close()

    print("created", OUT_PDF)
    print("preview", PREVIEW)


if __name__ == "__main__":
    main()
