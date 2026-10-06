import { useEffect, useState } from 'react'
import Header from '../../components/layout/Header/Header'
import { API, CUSTOMER_ID } from '../../api/apiEndpoints'
import bannerImg from '../../assets/images/banner.jpg' // Fallback image since banner.jpg is missing

function imageUrl(image) {
  if (!image) return ''
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  if (image.startsWith('/')) return `${API}${image}`
  return ''
}

function money(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`
}

function ReportCards({ title, data, loading, error, isTopInventory }) {
  if (loading) {
    return (
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
        <div className="flex animate-pulse space-x-4">
          <div className="h-28 w-64 bg-slate-800/50 rounded-2xl"></div>
          <div className="h-28 w-64 bg-slate-800/50 rounded-2xl"></div>
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
        <div className="text-red-400 bg-red-500/10 p-4 rounded-xl inline-block">{error}</div>
      </div>
    )
  }
  if (!data || data.length === 0) {
    return (
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
        <p className="text-slate-400">No data</p>
      </div>
    )
  }
  
  return (
    <div className="mb-12">
      <h3 className="text-2xl font-bold text-white mb-6">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((item) => (
          <div key={item.id} className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 flex gap-4 items-center">
            <div className="w-20 h-20 shrink-0 bg-slate-800 rounded-xl overflow-hidden">
              {imageUrl(item.image) ? (
                <img src={imageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">No Img</div>
              )}
            </div>
            <div className="flex flex-col justify-center overflow-hidden">
              <h4 className="text-white font-semibold truncate text-sm mb-1">{item.name}</h4>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-blue-400 font-bold text-sm">{money(item.price)}</span>
                {isTopInventory ? (
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-medium">
                    Val: {money(item.inventory_value)}
                  </span>
                ) : (
                  <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded font-medium">
                    Stock: {item.stock}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CategorySummaryTable({ data, loading, error }) {
  if (loading) {
    return (
      <div className="mb-8 animate-pulse">
        <h3 className="text-2xl font-bold text-white mb-4">Category summary</h3>
        <div className="h-48 w-full max-w-4xl bg-slate-800/50 rounded-2xl"></div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-white mb-4">Category summary</h3>
        <div className="text-red-400 bg-red-500/10 p-4 rounded-xl inline-block">{error}</div>
      </div>
    )
  }
  if (!data || data.length === 0) {
    return (
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-white mb-4">Category summary</h3>
        <p className="text-slate-400">No data</p>
      </div>
    )
  }
  
  return (
    <div className="mb-12">
      <h3 className="text-2xl font-bold text-white mb-6">Category summary</h3>
      <div className="overflow-x-auto bg-slate-900/60 border border-white/5 rounded-2xl max-w-4xl">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-800/50 text-slate-300 border-b border-white/5">
            <tr>
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold">Products</th>
              <th className="p-4 font-semibold">Total stock</th>
              <th className="p-4 font-semibold">Avg price</th>
              <th className="p-4 font-semibold">Inventory value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors text-slate-300">
                <td className="p-4 font-medium text-white">{row.category}</td>
                <td className="p-4">{row.product_count}</td>
                <td className="p-4">{row.total_stock}</td>
                <td className="p-4">{money(row.avg_price)}</td>
                <td className="p-4 text-emerald-400">{money(row.inventory_value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [coupon, setCoupon] = useState('SAVE10')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [placing, setPlacing] = useState(false)
  const [order, setOrder] = useState(null)
  const [orderError, setOrderError] = useState('')
  const [activeView, setActiveView] = useState('products')

  const [lowStock, setLowStock] = useState({ data: [], loading: false, error: '' })
  const [topInventory, setTopInventory] = useState({ data: [], loading: false, error: '' })
  const [categorySummary, setCategorySummary] = useState({ data: [], loading: false, error: '' })

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/products/`)
      if (!res.ok) throw new Error('Failed to load products')
      setProducts(await res.json())
      setError('')
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Products could not be loaded. Please ensure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const fetchLowStock = () => {
    setLowStock(prev => ({ ...prev, loading: true }))
    fetch(`${API}/products/low-stock?threshold=10`)
      .then(res => { if (!res.ok) throw new Error('Failed to load low stock'); return res.json() })
      .then(data => setLowStock({ data, loading: false, error: '' }))
      .catch(err => setLowStock({ data: [], loading: false, error: err.message }))
  }

  const fetchTopInventory = () => {
    setTopInventory(prev => ({ ...prev, loading: true }))
    fetch(`${API}/reports/inventory?max_price=100000`)
      .then(res => { if (!res.ok) throw new Error('Failed to load inventory'); return res.json() })
      .then(data => {
        const top3 = Array.isArray(data) ? data.slice(0, 3) : []
        setTopInventory({ data: top3, loading: false, error: '' })
      })
      .catch(err => setTopInventory({ data: [], loading: false, error: err.message }))
  }

  const fetchCategorySummary = () => {
    setCategorySummary(prev => ({ ...prev, loading: true }))
    fetch(`${API}/reports/category-summary`)
      .then(res => { if (!res.ok) throw new Error('Failed to load category summary'); return res.json() })
      .then(data => setCategorySummary({ data, loading: false, error: '' }))
      .catch(err => setCategorySummary({ data: [], loading: false, error: err.message }))
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (cartOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [cartOpen])

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
    <>
      <Header 
        cartCount={cartCount} 
        setCartOpen={setCartOpen} 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
      />

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        
        {/* Hero Banner */}
        <div className="w-full h-48 sm:h-72 md:h-80 rounded-[2rem] mb-8 relative overflow-hidden shadow-2xl shadow-indigo-500/10 group flex items-center">
          <img 
            src={bannerImg} 
            alt="Promotional Banner" 
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 z-0"
          />
          <div className="relative z-10 px-8 sm:px-16 max-w-xl">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight drop-shadow-sm">
              Tech you'll<br/>actually use
            </h2>
          </div>
        </div>

        {/* Categories */}
        <div className="flex overflow-x-auto pb-4 mb-8 gap-3 scrollbar-hide">
          {['All', 'Computers', 'Accessories', 'Phones', 'Audio'].map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-semibold transition-all duration-300 ${
                activeCategory === category 
                  ? 'bg-[#6366f1] text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] border border-[#818cf8]' 
                  : 'bg-slate-900/50 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 mt-12 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Discover Products</h2>
            <p className="text-slate-400">Explore our premium collection of unique items.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setActiveView('products'); loadProducts(); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeView === 'products' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Products
            </button>
            <button
              onClick={() => { setActiveView('low-stock'); fetchLowStock(); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeView === 'low-stock' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => { setActiveView('top-inventory'); fetchTopInventory(); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeView === 'top-inventory' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Top Inventory
            </button>
            <button
              onClick={() => { setActiveView('category-summary'); fetchCategorySummary(); }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeView === 'category-summary' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Categories
            </button>
          </div>
        </div>

        {activeView === 'low-stock' && (
          <ReportCards title="Low stock" data={lowStock.data} loading={lowStock.loading} error={lowStock.error} />
        )}

        {activeView === 'top-inventory' && (
          <ReportCards title="Top inventory" data={topInventory.data} loading={topInventory.loading} error={topInventory.error} isTopInventory={true} />
        )}

        {activeView === 'category-summary' && (
          <CategorySummaryTable data={categorySummary.data} loading={categorySummary.loading} error={categorySummary.error} />
        )}

        {activeView === 'products' && (
          <>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl text-center backdrop-blur-md mb-8">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <p className="font-medium">{error}</p>
              </div>
            )}

            {loading && products.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden animate-pulse">
                    <div className="w-full h-56 bg-slate-800/50"></div>
                    <div className="p-6">
                      <div className="h-5 bg-slate-800/80 rounded w-3/4 mb-4"></div>
                      <div className="h-3 bg-slate-800/50 rounded w-full mb-2"></div>
                      <div className="h-3 bg-slate-800/50 rounded w-5/6 mb-6"></div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="h-6 bg-slate-800/80 rounded w-1/3"></div>
                        <div className="h-9 bg-slate-800/80 rounded-xl w-24"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {products.map((product) => {
                  const inCart = cart.find((item) => item.product.id === product.id)
                  const qty = inCart ? inCart.quantity : 0
                  const src = imageUrl(product.image)
                  return (
                    <div
                      key={product.id}
                      className="group bg-slate-900/60 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2 flex flex-col relative"
                    >
                      {/* Stock Badge */}
                      {product.stock > 0 && product.stock <= 5 && (
                        <div className="absolute top-3 left-3 z-20 bg-orange-500/90 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                          Only {product.stock} left
                        </div>
                      )}

                      <div className="w-full h-56 relative overflow-hidden bg-slate-800/50 flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                        {src ? (
                          <img
                            src={src}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                            <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="text-sm font-medium">{product.name}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-80"></div>
                      </div>

                      <div className="p-6 flex flex-col flex-grow relative z-10 -mt-6 bg-gradient-to-b from-transparent to-slate-900/90 rounded-b-2xl">
                        <h3 className="font-bold text-lg text-white mb-2 group-hover:text-blue-400 transition-colors mt-3">{product.name}</h3>
                        <p className="text-slate-400 text-sm mb-4 line-clamp-2 flex-grow">{product.description}</p>
                        
                        <div className="mt-auto flex justify-between items-center pt-4 border-t border-white/5">
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500 font-medium mb-1">Price</span>
                            <span className="text-blue-400 font-black text-xl tracking-tight">
                              {money(product.price)}
                            </span>
                          </div>
                          <button
                            onClick={() => addToCart(product)}
                            disabled={product.stock === 0 || qty >= product.stock}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] hover:-translate-y-0.5 disabled:translate-y-0 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none disabled:border border-white/5 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {product.stock === 0 ? (
                              'Out of stock'
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                Add
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Slide-over Cart */}
      <div 
        className={`fixed inset-0 z-50 transition-all duration-500 ease-in-out ${cartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div 
          className={`absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-500 ${cartOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setCartOpen(false)}
        ></div>

        <aside
          className={`absolute right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-white/10 shadow-2xl flex flex-col transition-transform duration-500 ease-out transform ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cart Header */}
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/80 backdrop-blur-md relative z-10">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Your Cart
            </h2>
            <button 
              onClick={() => setCartOpen(false)} 
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Cart Body */}
          <div className="flex-grow overflow-y-auto p-6 scrollbar-hide relative">
            {order ? (
              <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                <div className="w-full rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-6 space-y-4 relative overflow-hidden shadow-2xl shadow-emerald-500/5">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="flex flex-col items-center justify-center text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="font-black text-white text-2xl mb-1">Order Confirmed!</h3>
                    <p className="font-medium text-emerald-400">{order.message}</p>
                  </div>

                  <div className="bg-slate-900/60 rounded-xl p-5 space-y-3 text-sm border border-white/5 backdrop-blur-sm">
                    <div className="flex justify-between text-slate-400"><span className="text-slate-500">Order ID</span> <span className="font-mono text-slate-300">{order.order_id}</span></div>
                    <div className="flex justify-between text-slate-400"><span className="text-slate-500">Subtotal</span> <span>{money(order.subtotal)}</span></div>
                    <div className="flex justify-between text-slate-400"><span className="text-slate-500">Discount</span> <span className="text-emerald-400">{money(order.discount)}</span></div>
                    <div className="flex justify-between text-slate-400"><span className="text-slate-500">Tax</span> <span>{money(order.tax)}</span></div>
                    <div className="flex justify-between text-slate-400"><span className="text-slate-500">Shipping</span> <span>{money(order.shipping_charge)}</span></div>
                    <div className="pt-3 mt-3 border-t border-white/10 flex justify-between font-black text-white text-lg">
                      <span>Total Paid</span>
                      <span className="text-emerald-400">{money(order.grand_total)}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setOrder(null);
                      setCartOpen(false);
                    }}
                    className="w-full mt-6 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 py-3.5 rounded-xl font-bold text-base transition-colors border border-emerald-500/30"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            ) : cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                </div>
                <p className="text-xl font-medium text-slate-400">Your cart is empty</p>
                <button 
                  onClick={() => setCartOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600/10 text-blue-400 font-semibold hover:bg-blue-600/20 transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <ul className="space-y-6">
                {cart.map((item) => (
                  <li key={item.product.id} className="flex gap-4 group">
                    <div className="w-20 h-20 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 border border-white/5 relative">
                       {imageUrl(item.product.image) ? (
                         <img src={imageUrl(item.product.image)} alt={item.product.name} className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">No Img</div>
                       )}
                    </div>
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <p className="font-bold text-slate-200 line-clamp-1">{item.product.name}</p>
                        <p className="text-blue-400 font-bold">{money(item.product.price)}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center bg-slate-950 rounded-lg border border-white/10 overflow-hidden">
                          <button
                            onClick={() => changeQty(item.product.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-white">{item.quantity}</span>
                          <button
                            onClick={() => changeQty(item.product.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <button 
                          onClick={() => changeQty(item.product.id, 0)}
                          className="text-xs text-red-400/70 hover:text-red-400 underline underline-offset-2 transition-colors ml-auto"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {!order && orderError && (
              <div className="mt-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p>{orderError}</p>
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-white/10 bg-slate-900/80 backdrop-blur-md z-10">
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Discount Code
                </label>
                <div className="flex gap-2">
                  <input
                    value={coupon}
                    onChange={(event) => setCoupon(event.target.value)}
                    className="flex-grow bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder:text-slate-600"
                    placeholder="e.g. SAVE10"
                  />
                </div>
              </div>

              <div className="flex justify-between items-end mb-6">
                <span className="text-slate-400 font-medium">Estimated Total</span>
                <span className="text-2xl font-black text-white">
                  {money(cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0))}
                </span>
              </div>

              <button
                onClick={placeOrder}
                disabled={placing}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-xl font-bold text-lg shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-300 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {placing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Processing...
                  </>
                ) : (
                  <>
                    Complete Order
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </button>
            </div>
          )}
        </aside>
      </div>
    </>
  )
}
