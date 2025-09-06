"""Contains mappings between YOLO class IDs and human-readable class names, including dart classes."""

from typing import Dict, Final

from detector.model.geometry_models import DART_CLASS_ID


class YoloDartClassMapping:
    """Maps YOLO class IDs to human-readable class names and checks for dart classes."""

    dart_class = DART_CLASS_ID
    mapping: Final[Dict[int, str]] = {
        0: "20",
        1: "3",
        2: "11",
        3: "6",
        dart_class: "dart",
        5: "9",
        6: "15",
    }

    @staticmethod
    def get_class_name(class_id: int) -> str:
        """Get the class name for a given class ID."""
        return YoloDartClassMapping.mapping.get(class_id, str(class_id))

    @classmethod
    def is_dart(cls, class_id: int) -> bool:
        """Check if the class ID corresponds to a dart."""
        from detector.model.geometry_models import DART_CLASS_ID

        return cls.mapping.get(class_id) == "dart" or class_id == DART_CLASS_ID
