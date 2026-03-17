export type DietaryPreferenceId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface DietaryPreferenceOption {
  id: DietaryPreferenceId;
  label: string;
  emoji: string;
}

export const dietaryPreferenceOptions: DietaryPreferenceOption[] = [
  { id: 0, label: "Кето", emoji: "🥑" },
  { id: 1, label: "Гостре", emoji: "🌶️" },
  { id: 2, label: "Без глютену", emoji: "🚫" },
  { id: 3, label: "Веган", emoji: "🌱" },
  { id: 4, label: "Вегетаріанське", emoji: "🥗" },
  { id: 5, label: "Без лактози", emoji: "🥛" },
  { id: 6, label: "Низьковуглеводне", emoji: "🥬" },
  { id: 7, label: "Високобілкове", emoji: "🍗" },
];

const dietaryPreferenceMap = new Map<number, DietaryPreferenceOption>(
  dietaryPreferenceOptions.map((option) => [option.id, option]),
);

export const getDietaryPreferenceOption = (
  id: number,
): DietaryPreferenceOption =>
  dietaryPreferenceMap.get(id) ?? {
    id: 0,
    label: `Вподобання ${id}`,
    emoji: "🍽️",
  };
