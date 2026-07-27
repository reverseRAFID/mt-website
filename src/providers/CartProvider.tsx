'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  addItem,
  cartCount,
  parseCart,
  removeItem,
  serializeCart,
  setQuantity,
  type CartItem,
} from '@/lib/cart'
import { CART_STORAGE_KEY, DEFAULT_MAX_QTY_PER_ITEM } from '@/lib/shop'

interface CartContextValue {
  items: CartItem[]
  count: number
  /**
   * False until localStorage has been read.
   *
   * The server cannot know what is in a browser's storage, so the first render
   * must match the server's view — an empty cart — and only then adopt the real
   * one. Components use this to render a stable placeholder instead of a badge
   * that flickers from empty to "3".
   */
  hydrated: boolean
  maxQtyPerItem: number
  add: (productId: string, variantKey: string, quantity?: number) => void
  setQty: (productId: string, variantKey: string, quantity: number) => void
  remove: (productId: string, variantKey: string) => void
  clear: () => void
  /** Replace the cart with what the server said survived validation. */
  replace: (items: CartItem[]) => void
  /** Adopt the real per-item cap once a server response has revealed it. */
  applyLimits: (limits: { maxQtyPerItem?: number }) => void
  /** Bumped on every add, so an "added to cart" confirmation can react. */
  addedAt: number
}

const CartContext = createContext<CartContextValue | null>(null)

/**
 * Cart state, backed by localStorage.
 *
 * There is no account to hang a cart off, so the browser is the only place it
 * can live. Everything here is thin plumbing around the pure helpers in
 * src/lib/cart.ts — see that file's header for why a cart line never holds a
 * price.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [maxQtyPerItem, setMaxQtyPerItem] = useState(DEFAULT_MAX_QTY_PER_ITEM)
  const [addedAt, setAddedAt] = useState(0)

  // Guards the write-back effect. Without it, the first render would persist an
  // empty cart over the real one before hydration had a chance to read it.
  const hydratedRef = useRef(false)

  // ── Hydrate ─────────────────────────────────────────────────
  useEffect(() => {
    try {
      setItems(parseCart(window.localStorage.getItem(CART_STORAGE_KEY), DEFAULT_MAX_QTY_PER_ITEM))
    } catch {
      // Private browsing, a storage quota error, or a disabled-storage policy.
      // An empty cart is a working page; a thrown error is not.
    }
    hydratedRef.current = true
    setHydrated(true)
  }, [])

  // ── Persist ─────────────────────────────────────────────────
  useEffect(() => {
    if (!hydratedRef.current) return
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, serializeCart(items))
    } catch {
      // Out of quota or storage blocked. The cart still works for this page
      // view; it just will not survive a reload.
    }
  }, [items])

  // ── Cross-tab sync ──────────────────────────────────────────
  // Two tabs open on the shop is normal — one browsing, one at checkout. The
  // `storage` event fires only in the *other* tabs, so this cannot loop.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== CART_STORAGE_KEY) return
      setItems(parseCart(event.newValue, DEFAULT_MAX_QTY_PER_ITEM))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const add = useCallback(
    (productId: string, variantKey: string, quantity = 1) => {
      setItems((current) => addItem(current, productId, variantKey, quantity, maxQtyPerItem))
      setAddedAt(Date.now())
    },
    [maxQtyPerItem]
  )

  const setQty = useCallback(
    (productId: string, variantKey: string, quantity: number) => {
      setItems((current) => setQuantity(current, productId, variantKey, quantity, maxQtyPerItem))
    },
    [maxQtyPerItem]
  )

  const remove = useCallback((productId: string, variantKey: string) => {
    setItems((current) => removeItem(current, productId, variantKey))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const replace = useCallback((next: CartItem[]) => setItems(next), [])

  /**
   * The provider mounts in the root layout, which has no reason to read shop
   * settings, so it starts on the documented default. The first cart response
   * carries the real cap and it is adopted here. Getting this wrong is not a
   * correctness problem — the server clamps regardless and reports a
   * `quantity_reduced` issue — but it stops the stepper from stopping short of
   * a limit the team actually raised.
   */
  const applyLimits = useCallback((limits: { maxQtyPerItem?: number }) => {
    if (typeof limits.maxQtyPerItem === 'number' && limits.maxQtyPerItem > 0) {
      setMaxQtyPerItem(limits.maxQtyPerItem)
    }
  }, [])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: cartCount(items),
      hydrated,
      maxQtyPerItem,
      add,
      setQty,
      remove,
      clear,
      replace,
      applyLimits,
      addedAt,
    }),
    [items, hydrated, maxQtyPerItem, add, setQty, remove, clear, replace, applyLimits, addedAt]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used inside <CartProvider>. Check src/app/layout.tsx.')
  }
  return context
}
