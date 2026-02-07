const VALID_SENIORITIES = ['c_suite', 'vp', 'director', 'manager', 'senior', 'entry'];
const VALID_FUNDING_STAGES = ['Seed', 'Series A', 'Series B', 'Series C', 'Series D', 'Growth', 'Public', 'Acquired'];
const VALID_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'];

const SIZE_RANGES = [
  { label: '1-10', min: 1, max: 10 },
  { label: '11-50', min: 11, max: 50 },
  { label: '51-200', min: 51, max: 200 },
  { label: '201-500', min: 201, max: 500 },
  { label: '501-1000', min: 501, max: 1000 },
  { label: '1001-5000', min: 1001, max: 5000 },
  { label: '5000+', min: 5001, max: Number.POSITIVE_INFINITY }
];

function cleanArray(arr) {
  if (!Array.isArray(arr)) return [];
  return [...new Set(arr.filter(Boolean).map((item) => String(item).trim()).filter(Boolean))];
}

function normalizeCompanySizes(companySizes) {
  const cleaned = cleanArray(companySizes);

  const normalized = cleaned.map((size) => {
    if (VALID_SIZES.includes(size)) return size;

    const rangeMatch = /^\s*(\d+)\s*-\s*(\d+)\s*$/.exec(size);
    if (rangeMatch) {
      const min = parseInt(rangeMatch[1], 10);
      const max = parseInt(rangeMatch[2], 10);

      let best = null;
      let bestOverlap = 0;

      SIZE_RANGES.forEach((range) => {
        const overlapMin = Math.max(range.min, min);
        const overlapMax = Math.min(range.max, max);
        const overlap = Math.max(0, overlapMax - overlapMin + 1);
        if (overlap > bestOverlap) {
          bestOverlap = overlap;
          best = range.label;
        }
      });

      return best;
    }

    const plusMatch = /^\s*(\d+)\s*\+\s*$/.exec(size);
    if (plusMatch) {
      const min = parseInt(plusMatch[1], 10);
      const best = SIZE_RANGES.find((range) => min >= range.min && min <= range.max);
      return best ? best.label : '5000+';
    }

    return null;
  }).filter(Boolean);

  return [...new Set(normalized)];
}

function validateCriteria(criteria) {
  return {
    industries: cleanArray(criteria.industries),
    jobTitles: cleanArray(criteria.jobTitles),
    seniorities: cleanArray(criteria.seniorities).filter((s) => VALID_SENIORITIES.includes(s)),
    departments: cleanArray(criteria.departments),
    companySizes: normalizeCompanySizes(criteria.companySizes),
    locations: cleanArray(criteria.locations),
    fundingStages: cleanArray(criteria.fundingStages).filter((s) => VALID_FUNDING_STAGES.includes(s)),
    technologies: cleanArray(criteria.technologies),
    keywords: cleanArray(criteria.keywords)
  };
}

module.exports = {
  cleanArray,
  normalizeCompanySizes,
  validateCriteria
};
