const parsePositiveInt = (value, fallback) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

export const config = {
  port: parsePositiveInt(process.env.PORT, 3000),
  proxy_url: String(process.env.PROXY_URL || '').trim(),
};
