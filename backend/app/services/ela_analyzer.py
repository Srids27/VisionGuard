import base64
import logging
from io import BytesIO

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

JPEG_QUALITY = 95
SCALE_FACTOR = 15


def perform_ela(file_bytes: bytes) -> dict:
    """Perform Error Level Analysis on an image.

    1. Load original as RGB
    2. Resave at JPEG quality 95
    3. Compute absolute pixel difference
    4. Enhance and create heatmap
    """
    try:
        original = Image.open(BytesIO(file_bytes)).convert("RGB")
    except Exception as e:
        logger.error("Failed to open image for ELA: %s", e)
        return {"heatmap_base64": "", "mean_diff": 0.0, "max_diff": 0.0}

    # Resave at known compression level
    buffer = BytesIO()
    original.save(buffer, format="JPEG", quality=JPEG_QUALITY)
    buffer.seek(0)
    resaved = Image.open(buffer).convert("RGB")

    # Compute pixel-level difference
    orig_array = np.array(original, dtype=np.int16)
    resaved_array = np.array(resaved, dtype=np.int16)
    diff = np.abs(orig_array - resaved_array)

    # Enhance the difference
    enhanced = np.clip(diff * SCALE_FACTOR, 0, 255).astype(np.uint8)

    # Convert to grayscale for heatmap
    gray = np.mean(enhanced, axis=2).astype(np.uint8)

    # Apply colormap
    heatmap = cv2.applyColorMap(gray, cv2.COLORMAP_JET)

    # Compute statistics
    mean_diff = float(np.mean(diff))
    max_diff = float(np.percentile(diff, 99))

    # Encode heatmap as base64 PNG
    _, png_buffer = cv2.imencode(".png", heatmap)
    heatmap_b64 = base64.b64encode(png_buffer.tobytes()).decode("utf-8")

    return {
        "heatmap_base64": f"data:image/png;base64,{heatmap_b64}",
        "mean_diff": round(mean_diff, 2),
        "max_diff": round(max_diff, 2),
    }
