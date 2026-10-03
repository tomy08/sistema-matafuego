export function getRequiredEnv(
  name: string,
  validate?: (value: string) => void,
) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  validate?.(value);

  return value;
}
