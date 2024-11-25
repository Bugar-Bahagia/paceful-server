// Function to calculate calories burned
function calculateCalories(activity, duration) {
  // MET values for activities (average values)
  const MET_VALUES = {
    running: 9.8, // Running at 6 mph (approximately 9.65 km/h)
    cycling: 7.5, // Cycling at 12-14 mph (approximately 19-22.5 km/h)
    hiking: 6.0,
    walking: 3.8, // Walking at 3.5 mph (approximately 5.6 km/h)
    swimming: 8.0, // Swimming at moderate effort
  };

  // Average weight in kg (this can be adjusted or passed as a parameter)
  const weightInKg = 70;

  // Convert duration from minutes to hours
  const durationInHours = duration / 60;

  // Calculate calories burned (MET * weight in kg * duration in hours)
  const caloriesBurned = MET_VALUES[activity] * weightInKg * durationInHours;

  return Math.round(caloriesBurned);
}

module.exports = calculateCalories;
