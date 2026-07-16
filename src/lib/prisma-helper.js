/**
 * Mengonversi parameter query filter terstruktur dari buildParams() useDataTable
 * menjadi objek `where` clause yang valid untuk Prisma secara rekursif.
 *
 * Contoh input:
 *   searchParams = URLSearchParams {
 *     'filter[customer.nama][operator]': 'contains',
 *     'filter[customer.nama][value]': 'Karya',
 *     'filter[customer.telepon][operator]': 'contains',
 *     'filter[customer.telepon][value]': '0812'
 *   }
 *
 * Hasil output:
 *   {
 *     customer: {
 *       nama: { contains: 'Karya' },
 *       telepon: { contains: '0812' }
 *     }
 *   }
 */
export function parsePrismaFilters(searchParams) {
  const filterConditions = [];
  const filterKeys = new Set();

  for (const [paramKey] of searchParams.entries()) {
    const match = paramKey.match(/^filter\[(.+?)\]\[operator\]$/);
    if (match) filterKeys.add(match[1]);
  }

  for (const colKey of filterKeys) {
    const operator = searchParams.get(`filter[${colKey}][operator]`);
    const value = searchParams.get(`filter[${colKey}][value]`);
    const value2 = searchParams.get(`filter[${colKey}][value2]`);

    const DATE_PRESET_OPERATORS = ['today', 'thisWeek', 'thisMonth'];
    if (!operator) continue;
    if (!DATE_PRESET_OPERATORS.includes(operator) && (value === null || value === '')) continue;


    // Tentukan condition leaf (misal: { contains: value })
    let conditionLeaf = null;
    if (operator === 'contains') {
      conditionLeaf = { contains: value };
    } else if (operator === 'startsWith') {
      conditionLeaf = { startsWith: value };
    } else if (operator === 'endsWith') {
      conditionLeaf = { endsWith: value };
    } else if (operator === 'equals' || operator === 'eq') {
      conditionLeaf = colKey === 'aktif' || colKey.endsWith('_id') 
        ? (isNaN(Number(value)) ? value : parseInt(value))
        : value;
    } else if (operator === 'gt') {
      conditionLeaf = { gt: isNaN(Number(value)) ? value : Number(value) };
    } else if (operator === 'lt') {
      conditionLeaf = { lt: isNaN(Number(value)) ? value : Number(value) };
    } else if (operator === 'between' && value2) {
      conditionLeaf = { gte: Number(value), lte: Number(value2) };
    } else if (operator === 'in') {
      conditionLeaf = { in: value.split(',').map(v => isNaN(Number(v)) ? v : BigInt(v)) };
    } else if (operator === 'today') {
      const start = new Date(); start.setHours(0,0,0,0);
      const end = new Date(); end.setHours(23,59,59,999);
      conditionLeaf = { gte: start, lte: end };
    } else if (operator === 'thisWeek') {
      const now = new Date();
      const start = new Date(now); start.setDate(now.getDate() - now.getDay()); start.setHours(0,0,0,0);
      const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
      conditionLeaf = { gte: start, lte: end };
    } else if (operator === 'thisMonth') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      conditionLeaf = { gte: start, lte: end };
    } else if (operator === 'custom' && value && value2) {
      conditionLeaf = { gte: new Date(value), lte: new Date(value2 + 'T23:59:59') };
    }

    if (conditionLeaf !== null) {
      // Rekursif membuat nested structure untuk path dot-notation (misal 'customer.nama')
      const parts = colKey.split('.');
      const buildNestedObject = (pathParts, leafVal) => {
        const [current, ...rest] = pathParts;
        if (rest.length === 0) {
          return { [current]: leafVal };
        }
        return { [current]: buildNestedObject(rest, leafVal) };
      };

      filterConditions.push(buildNestedObject(parts, conditionLeaf));
    }
  }

  return filterConditions;
}
