"""AI-based deepfake / manipulation detection.

Primary: MesoNet-4 CNN (PyTorch) if weights are available.
Fallback: Statistical ensemble using frequency analysis, ELA stats,
          color distribution, and edge consistency.
"""

import logging
from io import BytesIO
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

# ---------- Try importing PyTorch for MesoNet ----------
_torch_available = False
try:
    import torch
    import torch.nn as nn

    _torch_available = True
except ImportError:
    logger.info("PyTorch not installed, using statistical fallback for AI detection")


# ---------- MesoNet-4 Architecture ----------
if _torch_available:

    class MesoNet4(nn.Module):
        def __init__(self):
            super().__init__()
            self.conv1 = nn.Sequential(
                nn.Conv2d(3, 8, 3, padding=1),
                nn.BatchNorm2d(8),
                nn.ReLU(),
                nn.MaxPool2d(2, 2),
            )
            self.conv2 = nn.Sequential(
                nn.Conv2d(8, 8, 5, padding=2),
                nn.BatchNorm2d(8),
                nn.ReLU(),
                nn.MaxPool2d(2, 2),
            )
            self.conv3 = nn.Sequential(
                nn.Conv2d(8, 16, 5, padding=2),
                nn.BatchNorm2d(16),
                nn.ReLU(),
                nn.MaxPool2d(2, 2),
            )
            self.conv4 = nn.Sequential(
                nn.Conv2d(16, 16, 5, padding=2),
                nn.BatchNorm2d(16),
                nn.ReLU(),
                nn.MaxPool2d(4, 4),
            )
            self.fc = nn.Sequential(
                nn.Flatten(),
                nn.Linear(16 * 4 * 4, 16),
                nn.ReLU(),
                nn.Dropout(0.5),
                nn.Linear(16, 1),
                nn.Sigmoid(),
            )

        def forward(self, x):
            x = self.conv1(x)
            x = self.conv2(x)
            x = self.conv3(x)
            x = self.conv4(x)
            return self.fc(x)


class AIDetector:
    def __init__(self, model_path: Path | None = None):
        self.model = None
        self.model_loaded = False
        self.model_name = "Statistical Ensemble"

        if _torch_available and model_path and model_path.exists():
            try:
                self.model = MesoNet4()
                state = torch.load(str(model_path), map_location="cpu", weights_only=True)
                self.model.load_state_dict(state)
                self.model.eval()
                self.model_loaded = True
                self.model_name = "MesoNet-4"
                logger.info("MesoNet-4 model loaded from %s", model_path)
            except Exception as e:
                logger.warning("Failed to load MesoNet weights: %s. Using fallback.", e)
                self.model = None
                self.model_loaded = False

    def predict(self, file_bytes: bytes, ela_stats: dict | None = None) -> dict:
        if self.model_loaded:
            return self._run_model(file_bytes)
        return self._statistical_fallback(file_bytes, ela_stats)

    # ---------- MesoNet inference ----------
    def _run_model(self, file_bytes: bytes) -> dict:
        try:
            img = Image.open(BytesIO(file_bytes)).convert("RGB")
            img = img.resize((256, 256), Image.LANCZOS)
            arr = np.array(img, dtype=np.float32) / 255.0
            tensor = torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0)

            with torch.no_grad():
                prob = self.model(tensor).item()

            return {
                "deepfake_probability": round(prob, 4),
                "confidence": 0.85,
                "model_used": self.model_name,
            }
        except Exception as e:
            logger.error("MesoNet inference failed: %s, using fallback", e)
            return self._statistical_fallback(file_bytes, None)

    # ---------- Statistical ensemble fallback ----------
    def _statistical_fallback(
        self, file_bytes: bytes, ela_stats: dict | None = None
    ) -> dict:
        try:
            img = Image.open(BytesIO(file_bytes)).convert("RGB")
            arr = np.array(img)
        except Exception:
            return {
                "deepfake_probability": 0.5,
                "confidence": 0.3,
                "model_used": "Statistical Ensemble (degraded)",
            }

        scores = []
        weights = []

        # 1. ELA-based signal (35%)
        ela_score = 0.0
        if ela_stats:
            mean_d = ela_stats.get("mean_diff", 0)
            ela_score = min(mean_d / 30.0, 1.0)
        scores.append(ela_score)
        weights.append(0.35)

        # 2. Frequency domain analysis (25%)
        freq_score = self._frequency_analysis(arr)
        scores.append(freq_score)
        weights.append(0.25)

        # 3. Color histogram irregularity (20%)
        color_score = self._color_analysis(arr)
        scores.append(color_score)
        weights.append(0.20)

        # 4. Edge consistency (20%)
        edge_score = self._edge_analysis(arr)
        scores.append(edge_score)
        weights.append(0.20)

        raw = sum(s * w for s, w in zip(scores, weights))
        # Sigmoid shaping
        probability = 1.0 / (1.0 + np.exp(-8 * (raw - 0.45)))
        probability = float(np.clip(probability, 0.01, 0.99))

        confidence = 0.6 + 0.2 * abs(probability - 0.5) * 2

        return {
            "deepfake_probability": round(probability, 4),
            "confidence": round(confidence, 4),
            "model_used": "Statistical Ensemble",
        }

    def _frequency_analysis(self, arr: np.ndarray) -> float:
        """Analyze high-frequency content via 2D FFT.
        Manipulated images often show unusual frequency patterns."""
        try:
            gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY).astype(np.float32)
            f = np.fft.fft2(gray)
            fshift = np.fft.fftshift(f)
            magnitude = np.log1p(np.abs(fshift))

            h, w = magnitude.shape
            cy, cx = h // 2, w // 2
            radius = min(h, w) // 4

            # High frequency energy ratio
            total_energy = np.sum(magnitude)
            center_mask = np.zeros_like(magnitude)
            cv2.circle(center_mask, (cx, cy), radius, 1, -1)
            low_energy = np.sum(magnitude * center_mask)
            high_energy = total_energy - low_energy

            ratio = high_energy / (total_energy + 1e-10)
            # Unusual ratio suggests manipulation
            deviation = abs(ratio - 0.7)
            return min(deviation * 3.0, 1.0)
        except Exception:
            return 0.3

    def _color_analysis(self, arr: np.ndarray) -> float:
        """Check color histogram for irregularities."""
        try:
            scores = []
            for ch in range(3):
                hist, _ = np.histogram(arr[:, :, ch], bins=256, range=(0, 256))
                hist = hist.astype(np.float64)
                hist /= hist.sum() + 1e-10

                # Check for unusual gaps or spikes
                zero_bins = np.sum(hist == 0) / 256.0
                max_spike = np.max(hist)
                scores.append(zero_bins * 0.5 + max_spike * 2.0)

            avg = np.mean(scores)
            return float(np.clip(avg, 0, 1))
        except Exception:
            return 0.3

    def _edge_analysis(self, arr: np.ndarray) -> float:
        """Analyze edge consistency across image regions."""
        try:
            gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
            edges = cv2.Canny(gray, 100, 200)

            h, w = edges.shape
            block_h, block_w = h // 4, w // 4
            densities = []

            for i in range(4):
                for j in range(4):
                    block = edges[
                        i * block_h : (i + 1) * block_h,
                        j * block_w : (j + 1) * block_w,
                    ]
                    density = np.mean(block) / 255.0
                    densities.append(density)

            # High variance in edge density suggests manipulation
            variance = np.var(densities)
            return float(np.clip(variance * 20.0, 0, 1))
        except Exception:
            return 0.3
