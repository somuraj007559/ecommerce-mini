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

export default function App() {
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

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/products/`)
      if (!res.ok) throw new Error('Failed to load products')
      setProducts(await res.json())
      setError('')
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Products could not be loaded. Please ensure the backend is running at http://127.0.0.1:8000.')
    } finally {
      setLoading(false)
    }
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
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Glow Effects Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/70 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              </div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
                MiniShop
              </h1>
            </div>
            
            {/* Mobile Cart Button */}
            <button
              onClick={() => setCartOpen(true)}
              className="sm:hidden group relative flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-4 py-2 rounded-xl transition-all duration-300"
            >
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="w-full sm:max-w-md relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/60 border border-white/10 text-white rounded-full py-2.5 pl-11 pr-4 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-colors placeholder:text-slate-500 shadow-inner"
              placeholder="Search products..."
            />
          </div>

          {/* Desktop Cart Button */}
          <button
            onClick={() => setCartOpen(true)}
            className="hidden sm:flex group relative items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:border-blue-500/50"
          >
            <svg className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <span className="font-semibold">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50 animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        
        {/* Hero Banner */}
        <div className="w-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-[2rem] p-8 sm:p-12 mb-8 relative overflow-hidden shadow-2xl shadow-indigo-500/20">
          {/* Decorative shapes behind text */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-lg">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight tracking-tight">
              Tech you'll actually use
            </h2>
            <p className="text-white/90 text-lg">
              Phones, laptops and accessories in one place.
            </p>
          </div>
          
          {/* Banner Graphics - Stylized Tech */}
          <div className="absolute right-0 top-0 bottom-0 w-[45%] hidden md:flex items-center justify-end pr-12 opacity-100 pointer-events-none">
            <div className="relative w-full h-full flex items-center justify-center">
               {/* 3D-like floating cards */}
               <div className="absolute top-1/2 -translate-y-1/2 right-4 w-32 h-40 bg-white/20 backdrop-blur-xl border border-white/40 rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] transform rotate-[15deg] translate-x-8 animate-[bounce_6s_infinite_ease-in-out]">
                 <div className="h-full w-full bg-gradient-to-br from-pink-400 to-orange-400 opacity-90 rounded-2xl flex items-center justify-center">
                   <svg className="w-12 h-12 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                 </div>
               </div>
               
               <div className="absolute top-1/2 -translate-y-1/2 right-24 w-32 h-48 bg-white/20 backdrop-blur-xl border border-white/40 rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] transform -rotate-[5deg] z-10 animate-[bounce_5s_infinite_ease-in-out_0.5s]">
                 <div className="h-full w-full bg-gradient-to-br from-emerald-400 to-teal-500 opacity-90 rounded-2xl flex items-center justify-center">
                   <svg className="w-12 h-12 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                 </div>
               </div>
            </div>
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

        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Discover Products</h2>
            <p className="text-slate-400">Explore our premium collection of unique items.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl text-center backdrop-blur-md">
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
                    <h3 className="font-bold text-lg text-white mb-2 group-hover:text-blue-400 transition-colors">{product.name}</h3>
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
      </main>

      {/* Slide-over Cart */}
      <div 
        className={`fixed inset-0 z-50 transition-all duration-500 ease-in-out ${cartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-500 ${cartOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setCartOpen(false)}
        ></div>

        {/* Drawer */}
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
            {cart.length === 0 ? (
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

            {orderError && (
              <div className="mt-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p>{orderError}</p>
              </div>
            )}

            {order && (
              <div className="mt-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-5 space-y-3 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <p className="font-bold text-emerald-400 text-lg">{order.message}</p>
                </div>
                <div className="bg-slate-900/50 rounded-xl p-4 space-y-2 text-sm border border-white/5">
                  <div className="flex justify-between text-slate-400"><span className="text-slate-500">Order ID</span> <span className="font-mono text-slate-300">{order.order_id}</span></div>
                  <div className="flex justify-between text-slate-400"><span className="text-slate-500">Subtotal</span> <span>{money(order.subtotal)}</span></div>
                  <div className="flex justify-between text-slate-400"><span className="text-slate-500">Discount</span> <span className="text-emerald-400">{money(order.discount)}</span></div>
                  <div className="flex justify-between text-slate-400"><span className="text-slate-500">Tax</span> <span>{money(order.tax)}</span></div>
                  <div className="flex justify-between text-slate-400"><span className="text-slate-500">Shipping</span> <span>{money(order.shipping_charge)}</span></div>
                  <div className="pt-2 mt-2 border-t border-white/10 flex justify-between font-bold text-white text-base">
                    <span>Grand total</span>
                    <span className="text-emerald-400">{money(order.grand_total)}</span>
                  </div>
                </div>
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
    </div>
  )
}
