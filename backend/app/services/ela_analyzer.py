import base64
import logging
from io import BytesIO
from PIL import Image, ImageChops, ImageEnhance

logger = logging.getLogger(__name__)

JPEG_QUALITY = 70   # lower quality = lighter memory
SCALE_FACTOR = 15


def perform_ela(file_bytes: bytes) -> dict:
    """Low-memory Error Level Analysis using PIL only."""

    try:
        # Open and ensure small size
        original = Image.open(BytesIO(file_bytes)).convert("RGB")
        original.thumbnail((512, 512))   # 🔥 very important
    except Exception as e:
        logger.error("Failed to open image for ELA: %s", e)
        return {"heatmap_base64": "", "mean_diff": 0.0, "max_diff": 0.0}

    # Re-save compressed version
    buffer = BytesIO()
    original.save(buffer, "JPEG", quality=JPEG_QUALITY)
    buffer.seek(0)
    resaved = Image.open(buffer).convert("RGB")

    # Compute difference (PIL version — no numpy)
    diff = ImageChops.difference(original, resaved)

    # Enhance difference
    enhancer = ImageEnhance.Brightness(diff)
    diff_enhanced = enhancer.enhance(SCALE_FACTOR)

    # Convert to grayscale heatmap
    heatmap = diff_enhanced.convert("L")

    # Compute simple statistics
    extrema = diff.getextrema()  # [(min,max), (min,max), (min,max)]
    max_diff = max([e[1] for e in extrema])
    mean_diff = sum([e[1] for e in extrema]) / len(extrema)

    # Encode to base64 PNG
    buffer2 = BytesIO()
    heatmap.save(buffer2, format="PNG")
    heatmap_b64 = base64.b64encode(buffer2.getvalue()).decode()

    return {
        "heatmap_base64": f"data:image/png;base64,{heatmap_b64}",
        "mean_diff": round(mean_diff, 2),
        "max_diff": round(max_diff, 2),
    }