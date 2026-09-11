import unittest

from main import StudentData, model_info, predict


class ApiContractTests(unittest.TestCase):
    def setUp(self):
        self.valid_data = StudentData(
            age=21,
            gender='Female',
            country='India',
            academic_level='Undergraduate',
            most_used_platform='Instagram',
            purpose_of_use='Education',
            avg_daily_usage_hours=4,
            daily_unlocks=60,
            study_hours=5,
            physical_activity_hours=1,
            sleep_hours_per_night=7,
            stress_level='Medium',
        )

    def test_model_info_exposes_regression_metrics(self):
        response = model_info()
        self.assertEqual(response['model'], 'RandomForestRegressor')
        self.assertGreater(response['metrics']['r2'], 0)
        self.assertEqual(response['metrics']['test_rows'], 1650)

    def test_prediction_is_on_score_scale(self):
        response = predict(self.valid_data)
        self.assertGreaterEqual(response.predicted_mental_health_score, 0)
        self.assertLessEqual(response.predicted_mental_health_score, 10)


if __name__ == '__main__':
    unittest.main()