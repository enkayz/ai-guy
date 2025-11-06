import React from "react";

export function Confirmation({ 
  booking 
}: { 
  booking?: { slot: string; timezone: string; email: string } | null
}) {
  const [showConfetti, setShowConfetti] = React.useState(false);

  React.useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <div className="slide-up">
      <div className="card text-center relative overflow-hidden">
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              >
                {['🎉', '✨', '🎊', '🌟'][Math.floor(Math.random() * 4)]}
              </div>
            ))}
          </div>
        )}

        <div className="relative z-10">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            You're All Set! 🎉
          </h2>
          
          <p className="text-lg text-gray-600 mb-8">
            Your free discovery session has been booked successfully.
          </p>

          {booking && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-gray-900 mb-4">Session Details:</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-blue-500">📅</span>
                  <span className="text-gray-700">{formatDate(booking.slot)}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-blue-500">📧</span>
                  <span className="text-gray-700">{booking.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-blue-500">🌍</span>
                  <span className="text-gray-700">{booking.timezone}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-blue-700 font-medium mb-2">What happens next?</p>
              <ul className="text-sm text-blue-600 space-y-1 text-left">
                <li>✓ Confirmation email sent to your inbox</li>
                <li>✓ Calendar invite with meeting link</li>
                <li>✓ Reminder 24 hours before the session</li>
              </ul>
            </div>

            <button
              className="button-secondary w-full"
              onClick={() => window.location.reload()}
            >
              Book Another Session
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Questions? Email us at{" "}
              <a href="mailto:hello@theaiguy.com" className="text-blue-600 hover:underline">
                hello@theaiguy.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
