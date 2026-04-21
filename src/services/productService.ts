import api from "./api";

export interface GlobalProduct {
  id: number;
  name?: string;
  title?: string;
  productName?: string;
  [key: string]: any;
}

export interface ProductDetailsDto {
  id: number;
  name: string;
  defaultUnit: string;
  categoryId: number;
  categoryName: string;
  imageBase64?: string | null;
}

export interface CreateProductRequest {
  name: string;
  nameUA: string;
  defaultUnit: string;
  categoryId: number;
  imageBase64?: string | null;
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

  getProductById: async (id: number): Promise<ProductDetailsDto> => {
    const response = await api.get<ProductDetailsDto>(`api/Products/${id}`);
    return response.data;
  },

  createProduct: async (payload: CreateProductRequest): Promise<number> => {
    const response = await api.post<number>("api/Products", payload);
    const productId = Number(response.data);
    if (!Number.isFinite(productId)) {
      throw new Error("Invalid product id returned by API");
    }
    return productId;
  },
};

export default productService;
