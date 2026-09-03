export const sanitizeString = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.replace(/[<>]/g, '').trim();
};
