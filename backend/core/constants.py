"""
Constants for segmentation classes and color mappings.
"""
import numpy as np

# 4-class model (original)
CLASS_METADATA_4 = [
    {"id": 0, "name": "background", "color": "#FF0000"},       # Red
    {"id": 1, "name": "uterus", "color": "#0000FF"},           # Blue
    {"id": 2, "name": "fallopian_tube", "color": "#00FF00"},   # Green
    {"id": 3, "name": "ovary", "color": "#A020F0"}             # Purple
]

COLOR_MAP_4 = {
    0: (255, 0, 0),      # Red - background
    1: (0, 0, 255),      # Blue - uterus
    2: (0, 255, 0),      # Green - fallopian tube
    3: (160, 32, 240)    # Purple - ovary
}

# 8-class model (round 2)
CLASS_METADATA_8 = [
    {"id": 0, "name": "background", "color": "#000000"},               # Black
    {"id": 1, "name": "External Iliac Artery", "color": "#FF0000"},    # Red
    {"id": 2, "name": "External Iliac Vein", "color": "#0000FF"},      # Blue
    {"id": 3, "name": "Obturator Nerve", "color": "#00FF00"},          # Green
    {"id": 4, "name": "Ovary", "color": "#FFFF00"},                    # Yellow
    {"id": 5, "name": "Ureter", "color": "#FF00FF"},                   # Magenta
    {"id": 6, "name": "Uterine Artery", "color": "#00FFFF"},           # Cyan
    {"id": 7, "name": "Uterus", "color": "#A020F0"}                    # Purple
]

COLOR_MAP_8 = {
    0: (0, 0, 0),        # Black - background
    1: (255, 0, 0),      # Red - External Iliac Artery
    2: (0, 0, 255),      # Blue - External Iliac Vein
    3: (0, 255, 0),      # Green - Obturator Nerve
    4: (255, 255, 0),    # Yellow - Ovary
    5: (255, 0, 255),    # Magenta - Ureter
    6: (0, 255, 255),    # Cyan - Uterine Artery
    7: (160, 32, 240)    # Purple - Uterus
}

# 2-class model (b1_med)
CLASS_METADATA_2 = [
    {"id": 0, "name": "background", "color": "#000000"},       # Black
    {"id": 1, "name": "tissue", "color": "#FF0000"}            # Red
]

COLOR_MAP_2 = {
    0: (0, 0, 0),        # Black - background
    1: (255, 0, 0)       # Red - tissue
}

# Default (backwards compatibility)
CLASS_METADATA = CLASS_METADATA_4
COLOR_MAP = COLOR_MAP_4
NUM_CLASSES = 4


def get_color_map(num_classes: int):
    """Get color map based on number of classes."""
    if num_classes == 2:
        return COLOR_MAP_2
    elif num_classes == 8:
        return COLOR_MAP_8
    else:
        return COLOR_MAP_4


def get_class_metadata(num_classes: int):
    """Get class metadata based on number of classes."""
    if num_classes == 2:
        return CLASS_METADATA_2
    elif num_classes == 8:
        return CLASS_METADATA_8
    else:
        return CLASS_METADATA_4
