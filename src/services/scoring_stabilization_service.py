"""Service for stabilizing dart predictions by grouping similar positions."""

from typing import Dict, List, Tuple

from src.models.detection_models import DartPosition, DartPositions, ProcessingConfig
from src.utils.math_utils import calculate_distance


class ScoringStabilizingService:
    """Service for processing and stabilizing dart predictions."""

    def get_stable_darts(self, dart_predictions: List[DartPosition]) -> DartPositions:
        """Get stable dart positions from current predictions."""
        return self.__process_predictions(dart_predictions)

    def __process_predictions(self, dart_predictions: List[DartPosition]) -> DartPositions:
        return self.__stabilize_single_frame(dart_predictions)

    def __stabilize_single_frame(self, dart_predictions: List[DartPosition]) -> DartPositions:
        """
        Clean up dart predictions from a single frame by grouping similar positions.

        Removes duplicate detections and averages positions that are very close together.
        """
        if not dart_predictions:
            return DartPositions([])

        prediction_groups = self.__group_similar_darts(
            dart_predictions,
        )

        # Convert groups to stable positions (average of each group)
        stable_darts = [
            DartPosition(x=centroid[0], y=centroid[1])
            for centroid in prediction_groups
        ]

        return DartPositions(stable_darts[:ProcessingConfig.max_allowed_darts])

    def __group_similar_darts(self, predictions: List[DartPosition]) -> Dict[Tuple[float, float], List[DartPosition]]:
        """Group dart predictions that are spatially close together."""
        if not predictions:
            return {}

        groups: Dict[Tuple[float, float], List[DartPosition]] = {}

        for dart in predictions:
            dart_pos = (dart.x, dart.y)

            # Find existing group this dart belongs to
            assigned_group = None
            for centroid in groups:
                if calculate_distance(dart_pos, centroid) < ProcessingConfig.stabilizing_threshold:
                    assigned_group = centroid
                    break

            if assigned_group:
                groups[assigned_group].append(dart)
            else:
                # Create new group
                groups[dart_pos] = [dart]

        # Recalculate centroids for each group
        refined_groups: Dict[Tuple[float, float], List[DartPosition]] = {}
        for group_darts in groups.values():
            # Calculate average position as centroid
            avg_x = sum(dart.x for dart in group_darts) / len(group_darts)
            avg_y = sum(dart.y for dart in group_darts) / len(group_darts)
            centroid = (avg_x, avg_y)
            refined_groups[centroid] = group_darts

        return refined_groups
