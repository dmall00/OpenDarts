import logging

import numpy as np

from src.utils.coordinates import calculate_distance

logger = logging.getLogger(__name__)


class PredictionQueue:
    def __init__(self, queue_size=5):
        self.queue_size = queue_size
        self.reset()

    def reset(self):
        self.prediction_queue = -np.ones((self.queue_size, 3, 2))
        self.queue_count = 0
        self.stable_darts = []

    def process_predictions(self, transformed_coords, repeat_threshold, current_darts):
        logger.debug(f"Processing {len(transformed_coords)} dart predictions")
        self._update_queue(transformed_coords)

        if len(current_darts) < 3:
            self._extract_stable_predictions(repeat_threshold, current_darts)

    def _update_queue(self, transformed_coords):
        if len(transformed_coords) == 0:
            self.prediction_queue[self.queue_count % self.queue_size] = -np.ones((3, 2))
        else:
            padded_coords = np.vstack((
                transformed_coords,
                -np.ones((3 - len(transformed_coords), 2))
            ))
            self.prediction_queue[self.queue_count % self.queue_size] = padded_coords

        self.queue_count += 1

    def _extract_stable_predictions(self, repeat_threshold, current_darts):
        valid_predictions = self.prediction_queue[self.prediction_queue != -1].reshape(-1, 2)
        unique_predictions = np.unique(valid_predictions, axis=0)

        if len(unique_predictions) == 0:
            return

        prediction_groups = {tuple(pred): [] for pred in unique_predictions}

        for frame in self.prediction_queue:
            for pred in frame:
                if np.any(pred == -1):
                    continue
                for unique_pred in unique_predictions:
                    if calculate_distance(pred, unique_pred) < 0.01:
                        prediction_groups[tuple(unique_pred)].append(pred)
                        break

        stable_predictions = {
            k: v for k, v in sorted(prediction_groups.items(), key=lambda item: len(item[1]), reverse=True)
            if len(v) >= repeat_threshold
        }

        best_predictions = [np.mean(matches, axis=0) for matches in stable_predictions.values()]

        if len(current_darts) == 0:
            self.stable_darts = best_predictions[:3]
            logger.info(f"Added first darts to visit: {len(self.stable_darts)} darts")
        else:
            self._add_new_darts(best_predictions, current_darts)

    def _add_new_darts(self, new_predictions, current_darts):
        for new_pred in new_predictions:
            is_duplicate = any(
                calculate_distance(existing_dart, new_pred) <= 0.01
                for existing_dart in current_darts
            )

            if not is_duplicate and len(current_darts) < 3:
                self.stable_darts.append(new_pred)
                logger.info(f"Added new dart at position: {new_pred}")
            elif len(current_darts) >= 3:
                break

    def get_stable_darts(self):
        return self.stable_darts
