import { useEffect, useState } from 'react'

const API = 'http://127.0.0.1:8000'
const CUSTOMER_ID = 202

function imageUrl(image) {
  if (!image) return ''
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  return ''
}

function money(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`
}

function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [coupon, setCoupon] = useState('SAVE10')
  const [placing, setPlacing] = useState(false)
  const [order, setOrder] = useState(null)
  const [orderError, setOrderError] = useState('')

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/products/`)
      if (!res.ok) throw new Error('Failed to load products')
      setProducts(await res.json())
      setError('')
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Products not load Backend http://127.0.0.1:8000 run.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const addToCart = (product) => {
    setOrder(null)
    setOrderError('')
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return prev
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      if (product.stock < 1) return prev
      return [...prev, { product, quantity: 1 }]
    })
    setCartOpen(true)
  }

  const changeQty = (productId, nextQty) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item
          const quantity = Math.min(Math.max(nextQty, 0), item.product.stock)
          return { ...item, quantity }
        })
        .filter((item) => item.quantity > 0)
    )
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const placeOrder = async () => {
    if (cart.length === 0 || placing) return
    setPlacing(true)
    setOrder(null)
    setOrderError('')
    try {
      const res = await fetch(`${API}/api/orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: CUSTOMER_ID,
          coupon_code: coupon.trim() || null,
          items: cart.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        const detail = data.detail
        throw new Error(typeof detail === 'string' ? detail : 'Order failed')
      }
      setOrder(data)
      setCart([])
      await loadProducts()
    } catch (err) {
      setOrderError(err.message || 'Order failed')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-300">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">MiniShop</h1>
          <button
            onClick={() => setCartOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Cart ({cartCount})
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Products</h2>

        {loading && products.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Loading products...</div>
        ) : error ? (
          <div className="text-center py-20 text-red-600">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const inCart = cart.find((item) => item.product.id === product.id)
              const qty = inCart ? inCart.quantity : 0
              const src = imageUrl(product.image)
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
                >
                  {src ? (
                    <img
                      src={src}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                      {product.name}
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-800">{product.name}</h3>
                    <p className="text-gray-500 text-sm mt-1 line-clamp-2">{product.description}</p>
                    <p className="text-xs text-gray-400 mt-2">Stock: {product.stock}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-blue-600 font-bold text-lg">
                        {money(product.price)}
                      </span>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0 || qty >= product.stock}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition disabled:bg-gray-400"
                      >
                        {product.stock === 0 ? 'Out of stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {cartOpen && (
        <div className="fixed inset-0 z-20 flex justify-end bg-black/40" onClick={() => setCartOpen(false)}>
          <aside
            className="h-full w-full max-w-md bg-white shadow-xl p-5 overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Cart</h2>
              <button onClick={() => setCartOpen(false)} className="text-gray-500 text-sm">
                Close
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="text-gray-500">Cart empty.</p>
            ) : (
              <ul className="space-y-4">
                {cart.map((item) => (
                  <li key={item.product.id} className="flex justify-between gap-3 border-b pb-3">
                    <div>
                      <p className="font-medium text-gray-800">{item.product.name}</p>
                      <p className="text-sm text-blue-600">{money(item.product.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => changeQty(item.product.id, item.quantity - 1)}
                        className="w-8 h-8 rounded border"
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => changeQty(item.product.id, item.quantity + 1)}
                        className="w-8 h-8 rounded border"
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <label className="block mt-6 text-sm text-gray-600">
              Coupon
              <input
                value={coupon}
                onChange={(event) => setCoupon(event.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2"
                placeholder="SAVE10"
              />
            </label>

            <button
              onClick={placeOrder}
              disabled={cart.length === 0 || placing}
              className="mt-4 w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {placing ? 'Placing order...' : 'Place order'}
            </button>

            {orderError && <p className="mt-4 text-sm text-red-600">{orderError}</p>}

            {order && (
              <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-gray-800 space-y-1">
                <p className="font-semibold text-green-700">{order.message}</p>
                <p>Order ID: {order.order_id}</p>
                <p>Subtotal: {money(order.subtotal)}</p>
                <p>Discount: {money(order.discount)}</p>
                <p>Tax: {money(order.tax)}</p>
                <p>Shipping: {money(order.shipping_charge)}</p>
                <p className="font-semibold">Grand total: {money(order.grand_total)}</p>
                <p>Status: {order.status}</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

export default App
