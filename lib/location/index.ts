import { getSettingsFromStore } from '@/lib/db/store';

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // round to 2 decimal places
}

export function isOperatingHoursOpen(): { isOpen: boolean; reason?: string } {
  const settings = getSettingsFromStore();
  if (settings.isOrderingPaused) {
    return { isOpen: false, reason: 'Ordering is currently paused by admin (kill-switch activated).' };
  }

  const now = new Date();
  const currentDay = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  if (!settings.operatingHours.daysOfWeek.includes(currentDay)) {
    return { isOpen: false, reason: 'Shop is closed today.' };
  }

  const [openH, openM] = settings.operatingHours.open.split(':').map(Number);
  const [closeH, closeM] = settings.operatingHours.close.split(':').map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (currentMinutes < openMinutes || currentMinutes > closeMinutes) {
    return {
      isOpen: false,
      reason: `Shop operating hours are from ${settings.operatingHours.open} to ${settings.operatingHours.close}.`,
    };
  }

  return { isOpen: true };
}

export function validateDeliveryLocationAndFee(
  lat?: number,
  lng?: number
): {
  isWithinZone: boolean;
  distanceKm: number;
  deliveryFeeKobo: number;
  message?: string;
} {
  const settings = getSettingsFromStore();
  const defaultFee = settings.deliveryFee.flatFeeKobo;

  if (lat === undefined || lng === undefined) {
    // If no coordinates provided (address landmark only), fallback to flat fee and default to zone ok
    return {
      isWithinZone: true,
      distanceKm: 0,
      deliveryFeeKobo: defaultFee,
      message: 'Landmark address accepted. Flat delivery fee applied.',
    };
  }

  const distance = calculateDistanceKm(
    settings.deliveryZone.centerLat,
    settings.deliveryZone.centerLng,
    lat,
    lng
  );

  if (distance > settings.deliveryZone.maxRadiusKm) {
    return {
      isWithinZone: false,
      distanceKm: distance,
      deliveryFeeKobo: 0,
      message: `Selected location (${distance} km away) is outside our maximum delivery radius of ${settings.deliveryZone.maxRadiusKm} km.`,
    };
  }

  let feeKobo = defaultFee;
  if (settings.deliveryFee.type === 'DISTANCE_BANDED') {
    if (distance > settings.deliveryFee.baseDistanceKm) {
      const extraKm = Math.ceil(distance - settings.deliveryFee.baseDistanceKm);
      feeKobo += extraKm * settings.deliveryFee.perKmKobo;
    }
  }

  return {
    isWithinZone: true,
    distanceKm: distance,
    deliveryFeeKobo: feeKobo,
    message: `Location within zone (${distance} km).`,
  };
}
