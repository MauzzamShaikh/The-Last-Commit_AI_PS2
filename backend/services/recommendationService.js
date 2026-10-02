function getSchemeId(scheme) {
  return scheme?._id ?? scheme?.id;
}

function getValue(scheme) {
  const value = Number(scheme?.benefits?.estimatedAnnualValue ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function buildRecommendation(profile, results, schemes) {
  const schemeById = new Map(schemes.map((scheme) => [getSchemeId(scheme), scheme]));
  const eligible = results
    .filter((result) => result.status === 'ELIGIBLE')
    .map((result) => {
      const scheme = schemeById.get(result.schemeId);
      return {
        result,
        scheme,
        estimatedAnnualValue: getValue(scheme),
        documentCount: (result.requiredDocuments || scheme?.documents || []).length,
      };
    })
    .sort((a, b) =>
      b.estimatedAnnualValue - a.estimatedAnnualValue ||
      a.documentCount - b.documentCount ||
      String(a.result.schemeId).localeCompare(String(b.result.schemeId))
    );

  if (eligible.length === 0) return null;

  const ranking = eligible.map(({ result, scheme, estimatedAnnualValue, documentCount }, index) => ({
    rank: index + 1,
    schemeId: result.schemeId,
    schemeName: result.schemeName,
    estimatedAnnualValue,
    benefitType: scheme?.benefits?.benefitType ?? null,
    frequency: scheme?.benefits?.frequency ?? null,
    documentCount,
  }));
  const best = ranking[0];
  const needsInformation = results
    .filter((result) => result.status === 'NEEDS_MORE_INFORMATION')
    .map((result) => ({
      schemeId: result.schemeId,
      schemeName: result.schemeName,
      estimatedAnnualValue: getValue(schemeById.get(result.schemeId)),
      missingInformation: result.missingInformation,
    }))
    .filter((entry) => entry.estimatedAnnualValue > best.estimatedAnnualValue);

  return {
    bestSchemeId: best.schemeId,
    bestSchemeName: best.schemeName,
    estimatedAnnualValue: best.estimatedAnnualValue,
    ranking,
    couldBeBetter: needsInformation,
    caveat: "Benefit amounts are estimates for this demo. Many schemes do not allow receiving more than one scholarship at the same time, so check each scheme's rules before applying to several.",
  };
}

module.exports = { buildRecommendation };
