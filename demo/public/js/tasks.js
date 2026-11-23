const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const TaskStatus = Object.freeze({ PENDING: 'pending', COMPLETED: 'completed' });

export function isTask(record) {
  if (record === null || typeof record !== 'object' || Array.isArray(record)) return false;

  const { id, title, status } = record;
  return typeof id === 'string' && id.length === 36 && uuidV4.test(id)
    && typeof title === 'string' && title.trim() !== ''
    && (status === TaskStatus.PENDING || status === TaskStatus.COMPLETED);
}