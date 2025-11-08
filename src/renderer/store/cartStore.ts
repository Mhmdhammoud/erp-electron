import { create } from 'zustand';
import { Currency } from '../utils/constants';

export interface CartItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price_usd: number;
  subtotal_usd: number;
}

interface CartState {
  customer_id: string | null;
  items: CartItem[];
  currency: Currency;
  notes: string;
  internal_notes: string;

  // Actions
  setCustomer: (customer_id: string) => void;
  addItem: (item: Omit<CartItem, 'subtotal_usd'>) => void;
  removeItem: (product_id: string) => void;
  updateQuantity: (product_id: string, quantity: number) => void;
  setCurrency: (currency: Currency) => void;
  setNotes: (notes: string) => void;
  setInternalNotes: (notes: string) => void;
  clear: () => void;

  // Computed
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  customer_id: null,
  items: [],
  currency: Currency.USD,
  notes: '',
  internal_notes: '',

  setCustomer: (customer_id) => set({ customer_id }),

  addItem: (item) =>
    set((state) => {
      const existingItem = state.items.find((i) => i.product_id === item.product_id);

      if (existingItem) {
        return {
          items: state.items.map((i) =>
            i.product_id === item.product_id
              ? {
                  ...i,
                  quantity: i.quantity + item.quantity,
                  subtotal_usd: (i.quantity + item.quantity) * i.unit_price_usd,
                }
              : i
          ),
        };
      }

      return {
        items: [
          ...state.items,
          {
            ...item,
            subtotal_usd: item.quantity * item.unit_price_usd,
          },
        ],
      };
    }),

  removeItem: (product_id) =>
    set((state) => ({
      items: state.items.filter((i) => i.product_id !== product_id),
    })),

  updateQuantity: (product_id, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.product_id === product_id
          ? {
              ...i,
              quantity,
              subtotal_usd: quantity * i.unit_price_usd,
            }
          : i
      ),
    })),

  setCurrency: (currency) => set({ currency }),

  setNotes: (notes) => set({ notes }),

  setInternalNotes: (internal_notes) => set({ internal_notes }),

  clear: () =>
    set({
      customer_id: null,
      items: [],
      currency: Currency.USD,
      notes: '',
      internal_notes: '',
    }),

  getTotal: () => {
    return get().items.reduce((sum, item) => sum + item.subtotal_usd, 0);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
