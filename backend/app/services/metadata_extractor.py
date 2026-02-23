import logging
from io import BytesIO

from PIL import Image, ExifTags
import piexif

logger = logging.getLogger(__name__)

SUSPICIOUS_SOFTWARE = ["photoshop", "gimp", "canva", "affinity", "pixlr", "paint.net"]


def _convert_gps_to_decimal(gps_data: dict) -> dict | None:
    try:
        lat_ref = gps_data.get(piexif.GPSIFD.GPSLatitudeRef, b"N")
        lon_ref = gps_data.get(piexif.GPSIFD.GPSLongitudeRef, b"E")
        lat = gps_data.get(piexif.GPSIFD.GPSLatitude)
        lon = gps_data.get(piexif.GPSIFD.GPSLongitude)

        if not lat or not lon:
            return None

        def rational_to_float(vals):
            d = vals[0][0] / vals[0][1]
            m = vals[1][0] / vals[1][1]
            s = vals[2][0] / vals[2][1]
            return d + m / 60.0 + s / 3600.0

        lat_dec = rational_to_float(lat)
        lon_dec = rational_to_float(lon)

        if isinstance(lat_ref, bytes):
            lat_ref = lat_ref.decode()
        if isinstance(lon_ref, bytes):
            lon_ref = lon_ref.decode()

        if lat_ref == "S":
            lat_dec = -lat_dec
        if lon_ref == "W":
            lon_dec = -lon_dec

        return {"lat": round(lat_dec, 6), "lon": round(lon_dec, 6)}
    except Exception:
        logger.debug("Failed to parse GPS data", exc_info=True)
        return None


def extract_metadata(file_bytes: bytes) -> dict:
    result = {
        "has_exif": False,
        "metadata_status": "Unknown",
        "camera_model": None,
        "camera_make": None,
        "software": None,
        "date_taken": None,
        "gps": None,
        "warnings": [],
        "all_tags": {},
    }

    try:
        img = Image.open(BytesIO(file_bytes))
        logger.info(
            "Image opened for metadata extraction: format=%s, size=%s, mode=%s",
            img.format, img.size, img.mode,
        )
    except Exception as e:
        logger.error(
            "Pillow failed to open image for metadata extraction: %s "
            "(file_bytes length=%d, first 16 bytes=%r)",
            e, len(file_bytes), file_bytes[:16],
        )
        result["metadata_status"] = "Error"
        result["warnings"].append(
            "Could not open image for metadata extraction. "
            "The file may be corrupted or in an unsupported format."
        )
        return result

    # Try piexif first for full EXIF access
    try:
        raw_exif = img.info.get("exif", b"")
        if raw_exif:
            exif_dict = piexif.load(raw_exif)
            logger.debug("piexif loaded EXIF data: IFDs present=%s",
                         [k for k in exif_dict if exif_dict.get(k)])
        else:
            exif_dict = None
            logger.info("No raw EXIF bytes found in image info dict (img.info keys=%s)",
                        list(img.info.keys()))
    except Exception as e:
        exif_dict = None
        logger.warning(
            "piexif.load() failed: %s (raw exif length=%d)",
            e, len(img.info.get("exif", b"")),
        )

    if exif_dict:
        zeroth = exif_dict.get("0th", {})
        exif_ifd = exif_dict.get("Exif", {})
        gps_ifd = exif_dict.get("GPS", {})

        # Camera model
        model = zeroth.get(piexif.ImageIFD.Model, b"")
        if isinstance(model, bytes):
            model = model.decode("utf-8", errors="ignore").strip()
        if model:
            result["camera_model"] = model

        # Camera make
        make = zeroth.get(piexif.ImageIFD.Make, b"")
        if isinstance(make, bytes):
            make = make.decode("utf-8", errors="ignore").strip()
        if make:
            result["camera_make"] = make

        # Software
        software = zeroth.get(piexif.ImageIFD.Software, b"")
        if isinstance(software, bytes):
            software = software.decode("utf-8", errors="ignore").strip()
        if software:
            result["software"] = software
            sw_lower = software.lower()
            for sus in SUSPICIOUS_SOFTWARE:
                if sus in sw_lower:
                    result["warnings"].append(
                        f"Editing software detected: {software}"
                    )
                    break

        # Date taken
        date_taken = exif_ifd.get(piexif.ExifIFD.DateTimeOriginal, b"")
        if isinstance(date_taken, bytes):
            date_taken = date_taken.decode("utf-8", errors="ignore").strip()
        if date_taken:
            result["date_taken"] = date_taken

        # GPS
        if gps_ifd:
            gps = _convert_gps_to_decimal(gps_ifd)
            if gps:
                result["gps"] = gps

        result["has_exif"] = True
        result["metadata_status"] = "Present"

    # Fallback: try PIL EXIF tags
    if not result["has_exif"]:
        try:
            pil_exif = img._getexif()
            if pil_exif:
                result["has_exif"] = True
                result["metadata_status"] = "Present"
                tag_map = {ExifTags.TAGS.get(k, k): v for k, v in pil_exif.items()}
                result["all_tags"] = {
                    str(k): str(v)[:200] for k, v in tag_map.items()
                }
                if "Model" in tag_map:
                    result["camera_model"] = str(tag_map["Model"])
                if "Make" in tag_map:
                    result["camera_make"] = str(tag_map["Make"])
                if "Software" in tag_map:
                    sw = str(tag_map["Software"])
                    result["software"] = sw
                    sw_lower = sw.lower()
                    for sus in SUSPICIOUS_SOFTWARE:
                        if sus in sw_lower:
                            result["warnings"].append(
                                f"Editing software detected: {sw}"
                            )
                            break
                if "DateTimeOriginal" in tag_map:
                    result["date_taken"] = str(tag_map["DateTimeOriginal"])
        except Exception as e:
            logger.warning(
                "PIL _getexif() failed: %s (image format=%s, mode=%s)",
                e, img.format, img.mode,
            )

    if not result["has_exif"]:
        result["metadata_status"] = "Inconclusive / Stripped"
        result["warnings"].append(
            "No EXIF data found. This image may be synthetic or have been "
            "processed by social media/editing software."
        )
        logger.info(
            "No EXIF data found for image (format=%s, size=%s, mode=%s, "
            "info_keys=%s). Marking as Inconclusive / Stripped.",
            img.format, img.size, img.mode, list(img.info.keys()),
        )

    # Build all_tags from piexif if available
    if exif_dict and not result["all_tags"]:
        all_tags = {}
        for ifd_name in ("0th", "Exif", "1st"):
            ifd = exif_dict.get(ifd_name, {})
            for tag_id, value in ifd.items():
                tag_name = piexif.TAGS.get(ifd_name, {}).get(tag_id, {}).get(
                    "name", str(tag_id)
                )
                if isinstance(value, bytes):
                    try:
                        value = value.decode("utf-8", errors="ignore").strip()
                    except Exception:
                        value = repr(value)
                all_tags[tag_name] = str(value)[:200]
        result["all_tags"] = all_tags

    return result
