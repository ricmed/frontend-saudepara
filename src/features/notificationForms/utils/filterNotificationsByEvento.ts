import { getNotificationEventId } from '@/features/dashboard/utils/eventLocalities';

export function filterNotificationsByEvento<T>(
  items: T[],
  eventId: number,
): T[] {
  return items.filter((item) => getNotificationEventId(item) === eventId);
}
