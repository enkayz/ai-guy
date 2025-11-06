import React from "react";

export function Scheduler({
  onBook,
  loading,
  error: externalError,
}: {
  onBook: (slot: string, timezone: string, email: string) => void;
  loading?: boolean;
  error?: string;
}) {
  // Generate realistic upcoming slots
  const generateSlots = () => {
    const slots: Array<{ time: string; label: string }> = [];
    const now = new Date();
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const times = ['10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];
    
    for (let d = 1; d <= 5; d++) {
      const date = new Date(now);
      date.setDate(now.getDate() + d);
      const dayName = days[(date.getDay() + 6) % 7]; // Adjust for Monday start
      
      times.forEach(time => {
        const [hour, period] = time.split(' ');
        const [hourNum] = hour.split(':');
        let hour24 = parseInt(hourNum);
        if (period === 'PM' && hour24 !== 12) hour24 += 12;
        if (period === 'AM' && hour24 === 12) hour24 = 0;
        
        const slotDate = new Date(date);
        slotDate.setHours(hour24, 0, 0, 0);
        
        slots.push({
          time: slotDate.toISOString(),
          label: `${dayName}, ${date.getMonth() + 1}/${date.getDate()} at ${time}`,
        });
      });
    }
    
    return slots.slice(0, 12); // Show 12 slots
  };

  const slots = generateSlots();
  const [selected, setSelected] = React.useState(slots[0]?.time || "");
  const [customTime, setCustomTime] = React.useState("");
  const [showCustomTime, setShowCustomTime] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [timezone, setTimezone] = React.useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [error, setError] = React.useState("");

  const validateCustomTime = (dateTimeString: string): boolean => {
    try {
      const date = new Date(dateTimeString);
      const now = new Date();
      
      // Check if it's a valid date
      if (isNaN(date.getTime())) {
        setError("Please enter a valid date and time");
        return false;
      }
      
      // Check if it's in the future
      if (date <= now) {
        setError("Please select a time in the future");
        return false;
      }
      
      // Check if it's within business hours (9 AM - 6 PM)
      const hour = date.getHours();
      if (hour < 9 || hour >= 18) {
        setError("Please select a time between 9 AM and 6 PM");
        return false;
      }
      
      // Check if it's a weekday
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        setError("Please select a weekday (Monday-Friday)");
        return false;
      }
      
      setError("");
      return true;
    } catch {
      setError("Please enter a valid date and time");
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    let finalSlot = selected;
    
    // If custom time is being used, validate and use it
    if (showCustomTime && customTime) {
      if (!validateCustomTime(customTime)) {
        return;
      }
      finalSlot = new Date(customTime).toISOString();
    }
    
    if (finalSlot && email && !loading) {
      onBook(finalSlot, timezone, email);
    }
  };

  const handleCustomTimeToggle = () => {
    setShowCustomTime(!showCustomTime);
    setError("");
    if (!showCustomTime) {
      // When enabling custom time, set a default value
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0); // 2 PM tomorrow
      setCustomTime(tomorrow.toISOString().slice(0, 16)); // Format for datetime-local input
    }
  };

  return (
    <div className="slide-up">
      <div className="card">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📅</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Book Your Free Discovery Session
          </h2>
          <p className="text-gray-600">
            Let's discuss how AI can transform your business. No commitment required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Choose your preferred time:
              </label>
              <button
                type="button"
                onClick={handleCustomTimeToggle}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showCustomTime ? "Choose from slots" : "Enter custom time"}
              </button>
            </div>
            
            {(error || externalError) && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error || externalError}</p>
              </div>
            )}

            {showCustomTime ? (
              <div className="space-y-3">
                <input
                  type="datetime-local"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="input-field"
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
                <p className="text-xs text-gray-500">
                  Please select a weekday between 9 AM and 6 PM in your timezone
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {slots.map(slot => (
                  <label
                    key={slot.time}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                      selected === slot.time
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="slot"
                      value={slot.time}
                      checked={selected === slot.time}
                      onChange={e => setSelected(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      selected === slot.time
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selected === slot.time && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                      )}
                    </div>
                    <span className="font-medium">{slot.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your email address:
            </label>
            <input
              className="input-field"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone:
            </label>
            <input
              className="input-field"
              type="text"
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              placeholder="America/New_York"
              required
            />
          </div>

          <button
            className="button-primary w-full text-lg py-4"
            type="submit"
            disabled={loading || !email || (!selected && !customTime)}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Booking your session...</span>
              </div>
            ) : (
              <span className="flex items-center justify-center space-x-2">
                <span>Book Free Session</span>
                <span>📅</span>
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <span className="text-blue-500 mt-0.5">ℹ️</span>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">What to expect:</p>
              <ul className="space-y-1 text-blue-600">
                <li>• 30-minute personalized consultation</li>
                <li>• AI strategy tailored to your business</li>
                <li>• No sales pitch, just valuable insights</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
