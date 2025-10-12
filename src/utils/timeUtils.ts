import React from 'react';

/**
 * Formats a timestamp to a user-friendly "time ago" format
 * Examples: "1 sec ago", "2 sec ago", "30 sec ago", "2 min ago", "1 hour ago", "2 days ago"
 */
export function formatTimeAgo(timestamp: string | Date): string {
  if (!timestamp) return '-';

  const now = new Date();
  const time = new Date(timestamp);

  // Check if the date is valid
  if (isNaN(time.getTime())) {
    return '-';
  }

  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  // Handle future dates (shouldn't happen but just in case)
  if (diffInSeconds < 0) {
    return 'just now';
  }

  // Less than 10 seconds: count each second (1 sec ago, 2 sec ago, etc.)
  if (diffInSeconds <= 1) {
    return 'just now';
  }

  if (diffInSeconds < 10) {
    return `${diffInSeconds} sec ago`;
  }

  // 10 seconds to 1 minute: round to nearest 10 seconds (10 sec ago, 20 sec ago, 30 sec ago, etc.)
  if (diffInSeconds < 60) {
    const roundedSeconds = Math.round(diffInSeconds / 10) * 10;
    return `${roundedSeconds} sec ago`;
  }

  // 1 minute to 1 hour: show minutes
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return minutes === 1 ? '1 min ago' : `${minutes} min ago`;
  }

  // 1 hour to 1 day: show hours
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }

  // 1 day to 1 week: show days
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }

  // More than 1 week: show weeks
  if (diffInSeconds < 2629746) {
    // approximately 1 month
    const weeks = Math.floor(diffInSeconds / 604800);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }

  // More than 1 month: show months
  if (diffInSeconds < 31556952) {
    // approximately 1 year
    const months = Math.floor(diffInSeconds / 2629746);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }

  // More than 1 year: show years
  const years = Math.floor(diffInSeconds / 31556952);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

/**
 * Hook to provide a time ago formatter that updates every second for recent times
 */
export function useTimeAgo(timestamp: string | Date): string {
  const [timeAgo, setTimeAgo] = React.useState(() => formatTimeAgo(timestamp));

  React.useEffect(() => {
    if (!timestamp) return;

    const updateTimeAgo = () => {
      setTimeAgo(formatTimeAgo(timestamp));
    };

    // Update immediately
    updateTimeAgo();

    // Set up interval to update every second for times less than 10 minutes
    // For older times, update every minute
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    let interval: NodeJS.Timeout;

    if (diffInSeconds < 60) {
      // Less than 1 minute - update every second for real-time counting
      interval = setInterval(updateTimeAgo, 1000);
    } else if (diffInSeconds < 600) {
      // Less than 10 minutes - update every 10 seconds
      interval = setInterval(updateTimeAgo, 10000);
    } else if (diffInSeconds < 3600) {
      // Less than 1 hour - update every 30 seconds
      interval = setInterval(updateTimeAgo, 30000);
    } else {
      // More than 1 hour - update every minute
      interval = setInterval(updateTimeAgo, 60000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timestamp]);

  return timeAgo;
}
