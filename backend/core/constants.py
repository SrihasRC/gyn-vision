"""
Constants for segmentation classes and color mappings.
"""

# Class metadata with IDs, names, and hex colors
CLASS_METADATA = [
    {"id": 0, "name": "background", "color": "#FF0000"},       # Red
    {"id": 1, "name": "uterus", "color": "#0000FF"},           # Blue
    {"id": 2, "name": "fallopian_tube", "color": "#00FF00"},   # Green
    {"id": 3, "name": "ovary", "color": "#A020F0"}             # Purple
]

# RGB color map for mask generation (class_id -> (R, G, B))
COLOR_MAP = {
    0: (255, 0, 0),      # Red - background
    1: (0, 0, 255),      # Blue - uterus
    2: (0, 255, 0),      # Green - fallopian tube
    3: (160, 32, 240)    # Purple - ovary
}

# Number of classes
NUM_CLASSES = 4
