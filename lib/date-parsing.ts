export type ParsedMonthYear = {
  date: string | null;
  estimated: boolean;
};

export function parseMonthYearInput(input: string): ParsedMonthYear {
  const value = input.trim();

  if (!value) {
    return { date: null, estimated: false };
  }

  const monthYearMatch = value.match(/^(0[1-9]|1[0-2])\/(\d{4})$/);
  if (monthYearMatch) {
    const [, month, year] = monthYearMatch;
    return { date: `${year}-${month}-01`, estimated: false };
  }

  const yearOnlyMatch = value.match(/^(\d{4})$/);
  if (yearOnlyMatch) {
    const [, year] = yearOnlyMatch;
    return { date: `${year}-01-01`, estimated: true };
  }

  throw new Error(`Fecha inválida: "${input}". Usá MM/AAAA o AAAA.`);
}
