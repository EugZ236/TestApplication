import api from "./api";

export interface GlobalProduct {
  id: number;
  name?: string;
  title?: string;
  productName?: string;
  [key: string]: any;
}

const productService = {
  searchGlobalProducts: async (q: string): Promise<string[]> => {
    if (!q.trim()) return [];
    try {
      const response = await api.get<GlobalProduct[]>("api/products/search", {
        params: { q: q.trim() },
      });
      const products = Array.isArray(response.data) ? response.data : [];
      const names = products
        .map((item) => {
          if (!item) return "";
          return (
            (typeof item.name === "string" && item.name.trim()
              ? item.name.trim()
              : "") ||
            (typeof item.title === "string" && item.title.trim()
              ? item.title.trim()
              : "") ||
            (typeof item.productName === "string" && item.productName.trim()
              ? item.productName.trim()
              : "") ||
            ""
          );
        })
        .filter((t) => t.length > 0);
      return Array.from(new Set(names)).slice(0, 10);
    } catch (error: unknown) {
      console.warn("searchGlobalProducts failed", error);
      return [];
    }
  },
};

export default productService;
