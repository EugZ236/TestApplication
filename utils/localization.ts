export function getLocalizedName(item: any, language: string, fallback = "") {
  if (!item) return fallback;
  const preferUA = language === "uk";

  const uaCandidates = [
    item.nameUA,
    item.titleUA,
    item.productNameUA,
    item.category?.nameUA,
    item.categoryNameUA,
    item.categoryName,
  ];

  const enCandidates = [
    item.name,
    item.title,
    item.productName,
    item.category?.name,
    item.categoryName,
  ];

  const pick = (arr: any[]) => {
    for (const v of arr) {
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return null;
  };

  if (preferUA) {
    return (pick(uaCandidates) || pick(enCandidates) || fallback).toString();
  }

  return (pick(enCandidates) || pick(uaCandidates) || fallback).toString();
}

export default getLocalizedName;
