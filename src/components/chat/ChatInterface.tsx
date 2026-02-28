'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Restaurant {
  id: number;
  name: string;
  logo_emoji: string | null;
  currency: string | null;
  slug: string;
}

interface Config {
  ai_greeting: string | null;
  ai_personality: string | null;
  languages: string | null;
}

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  veg: boolean | null;
  spice_level: number | null;
  calories: number | null;
  allergens: string | null;
  is_popular: boolean | null;
  is_chef_special: boolean | null;
  is_today_special: boolean | null;
  in_stock: boolean | null;
  category_name: string | null;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  cartAdded?: CartItem[];
}

interface Order {
  id: number;
  items: CartItem[];
  total: number;
  status: string | null;
  created_at: string | null;
}

const T = {
  bg: '#0C0A09', bgCard: '#1C1917', bgEl: '#292524',
  acc: '#F59E0B', accSoft: 'rgba(245,158,11,0.12)', accHov: '#D97706',
  tx: '#FAFAF9', txM: '#A8A29E', txD: '#78716C',
  brd: '#292524', brdL: '#3F3B37',
  ok: '#22C55E', err: '#EF4444', veg: '#22C55E', nv: '#EF4444',
};

const SPICE_LABELS = ['', '🌶', '🌶🌶', '🌶🌶🌶'];
const QUICK_PROMPTS = ["What's popular today?", "Do you have veg options?", "What are today's specials?", "Recommend something for a first-timer"];

export default function ChatInterface({
  restaurant, config, menuItems, tableId, tableLabel
}: {
  restaurant: Restaurant;
  config: Config | null;
  menuItems: MenuItem[];
  tableId: number | null;
  tableLabel?: string;
}) {
  const [tab, setTab] = useState<'chat' | 'menu' | 'cart' | 'orders'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const msgKey = `dineai_msgs_${restaurant.id}_${tableId || 'notab'}`;
  const [menuFilter, setMenuFilter] = useState('All');
  const [vegOnly, setVegOnly] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [nameSet, setNameSet] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currency = restaurant.currency === 'INR' ? '₹' : '$';
  const categories = ['All', ...Array.from(new Set(menuItems.map(i => i.category_name || 'Other')))];

  // Init session
  useEffect(() => {
    const key = `dineai_session_${restaurant.id}_${tableId || 'notab'}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setSessionId(stored);
    } else {
      const deviceId = localStorage.getItem('dineai_device') || crypto.randomUUID();
      localStorage.setItem('dineai_device', deviceId);
      fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_id: restaurant.id, table_id: tableId, device_id: deviceId }),
      }).then(r => r.json()).then(s => {
        setSessionId(s.id);
        localStorage.setItem(key, s.id);
      });
    }

    const savedName = localStorage.getItem('dineai_name');
    if (savedName) {
      setCustomerName(savedName);
      setNameSet(true);
    }

    const savedCart = localStorage.getItem(`dineai_cart_${restaurant.id}`);
    if (savedCart) setCart(JSON.parse(savedCart));

    const savedOrders = localStorage.getItem(`dineai_orders_${restaurant.id}`);
    if (savedOrders) setOrders(JSON.parse(savedOrders));

    const savedMsgs = localStorage.getItem(msgKey);
    if (savedMsgs) setMessages(JSON.parse(savedMsgs));
  }, [restaurant.id, tableId, msgKey]);

  const saveMessages = useCallback((msgs: Message[]) => {
    setMessages(msgs);
    localStorage.setItem(msgKey, JSON.stringify(msgs));
  }, [msgKey]);

  // Send greeting
  useEffect(() => {
    if (messages.length === 0) {
      const greeting = config?.ai_greeting ||
        `Welcome to ${restaurant.name}! ${restaurant.logo_emoji || '🍽️'} I'm your AI dining companion. How can I help you today?`;
      saveMessages([{ role: 'assistant', content: greeting }]);
    }
  }, [config, messages.length, restaurant.logo_emoji, restaurant.name, saveMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const saveCart = useCallback((newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem(`dineai_cart_${restaurant.id}`, JSON.stringify(newCart));
  }, [restaurant.id]);

  function addToCart(item: MenuItem) {
    const existing = cart.find(c => c.id === item.id);
    const newCart = existing
      ? cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      : [...cart, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    saveCart(newCart);
  }

  function removeFromCart(id: number) {
    const existing = cart.find(c => c.id === id);
    if (!existing) return;
    const newCart = existing.qty === 1 ? cart.filter(c => c.id !== id) : cart.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c);
    saveCart(newCart);
  }

  async function sendMessage(text?: string) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: msg }];
    saveMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          restaurant_id: restaurant.id,
          messages: newMessages,
          cart,
        }),
      });
      const data = await res.json();
      const cartItemsAdded: CartItem[] = data.cartActions || [];
      if (cartItemsAdded.length > 0) {
        const updated = [...cart];
        for (const action of cartItemsAdded) {
          const existing = updated.find(c => c.id === action.id);
          if (existing) existing.qty += action.qty;
          else updated.push({ id: action.id, name: action.name, price: action.price, qty: action.qty });
        }
        saveCart(updated);
      }
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.content || 'Sorry, something went wrong.',
        cartAdded: cartItemsAdded.length > 0 ? cartItemsAdded : undefined,
      };
      saveMessages([...newMessages, assistantMsg]);
    } catch {
      saveMessages([...newMessages, { role: 'assistant', content: 'Sorry, I ran into an issue. Please try again.' }]);
    }
    setLoading(false);
  }

  async function placeOrder() {
    if (cart.length === 0) return;
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + tax;
    // Persist to DB
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          restaurant_id: restaurant.id,
          table_id: tableId,
          items: cart,
          subtotal,
          tax,
          total,
        }),
      });
    } catch { /* ignore, still save locally */ }
    const order: Order = {
      id: Date.now(),
      items: [...cart],
      total,
      status: 'Preparing',
      created_at: new Date().toISOString(),
    };
    const newOrders = [order, ...orders];
    setOrders(newOrders);
    localStorage.setItem(`dineai_orders_${restaurant.id}`, JSON.stringify(newOrders));
    saveCart([]);
    setTab('orders');
  }

  function setName() {
    if (!customerName.trim()) return;
    localStorage.setItem('dineai_name', customerName.trim());
    if (sessionId) {
      fetch('/api/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, customer_name: customerName.trim() }),
      });
    }
    setNameSet(true);
  }

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const filteredMenu = menuItems.filter(i =>
    (menuFilter === 'All' || i.category_name === menuFilter) &&
    (!vegOnly || i.veg)
  );

  return (
    <div style={{ minHeight: '100dvh', background: T.bg, color: T.tx, fontFamily: "'DM Sans', -apple-system, sans-serif", display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: T.bgCard, borderBottom: `1px solid ${T.brd}`, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>{restaurant.logo_emoji || '🍽️'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.5px' }}>{restaurant.name}</div>
            {tableLabel && <div style={{ fontSize: 12, color: T.acc }}>{tableLabel}</div>}
          </div>
          {!nameSet && (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder="Your name"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setName()}
                style={{ background: T.bgEl, border: `1px solid ${T.brd}`, borderRadius: 8, padding: '6px 10px', color: T.tx, fontSize: 13, width: 110, outline: 'none' }}
              />
              <button onClick={setName} style={{ background: T.acc, color: '#000', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Go
              </button>
            </div>
          )}
          {nameSet && <span style={{ fontSize: 13, color: T.txM }}>Hi, {customerName}!</span>}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 14 }}>
          {(['chat', 'menu', 'cart', 'orders'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '8px 4px', border: 'none', borderRadius: 8, cursor: 'pointer',
                background: tab === t ? T.acc : T.bgEl,
                color: tab === t ? '#000' : T.txM,
                fontWeight: tab === t ? 700 : 400,
                fontSize: 13, position: 'relative',
              }}
            >
              {t === 'cart' ? `Cart${cartCount > 0 ? ` (${cartCount})` : ''}` : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Tab */}
      {tab === 'chat' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 0' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 12, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end' }}>
                {m.role === 'assistant' && (
                  <span style={{ fontSize: 20, marginRight: 8, flexShrink: 0 }}>🤖</span>
                )}
                <div style={{ maxWidth: '80%' }}>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                    background: m.role === 'user' ? T.acc : T.bgCard,
                    color: m.role === 'user' ? '#000' : T.tx,
                    fontSize: 14,
                    lineHeight: 1.5,
                    border: m.role === 'assistant' ? `1px solid ${T.brd}` : 'none',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {m.content}
                  </div>
                  {m.cartAdded && m.cartAdded.length > 0 && (
                    <div style={{ marginTop: 6, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>🛒</span>
                      <span style={{ fontSize: 12, color: '#22C55E', flex: 1, lineHeight: 1.3 }}>
                        {m.cartAdded.map(i => `${i.qty}× ${i.name}`).join(', ')} added to cart
                      </span>
                      <button onClick={() => setTab('cart')} style={{ fontSize: 11, color: T.acc, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap', padding: 0 }}>
                        View →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>🤖</span>
                <div style={{ background: T.bgCard, border: `1px solid ${T.brd}`, borderRadius: '4px 18px 18px 18px', padding: '10px 16px', display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: T.txD, display: 'inline-block', animation: `bounce 1s ${i * 0.15}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div style={{ padding: '12px 16px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => sendMessage(p)} style={{ background: T.bgCard, border: `1px solid ${T.brd}`, borderRadius: 20, padding: '6px 12px', color: T.txM, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: 16, display: 'flex', gap: 10, borderTop: `1px solid ${T.brd}`, marginTop: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask about the menu..."
              style={{ flex: 1, background: T.bgCard, border: `1px solid ${T.brd}`, borderRadius: 24, padding: '12px 16px', color: T.tx, fontSize: 14, outline: 'none' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{ background: T.acc, border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: loading || !input.trim() ? 0.5 : 1 }}
            >
              <span style={{ fontSize: 18 }}>↑</span>
            </button>
          </div>
        </div>
      )}

      {/* Menu Tab */}
      {tab === 'menu' && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.brd}`, position: 'sticky', top: 0, background: T.bg, zIndex: 10 }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
              {categories.map(c => (
                <button key={c} onClick={() => setMenuFilter(c)} style={{ background: menuFilter === c ? T.acc : T.bgCard, border: `1px solid ${menuFilter === c ? T.acc : T.brd}`, borderRadius: 20, padding: '6px 14px', color: menuFilter === c ? '#000' : T.txM, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: menuFilter === c ? 600 : 400 }}>
                  {c}
                </button>
              ))}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.txM, cursor: 'pointer', marginTop: 4 }}>
              <input type="checkbox" checked={vegOnly} onChange={e => setVegOnly(e.target.checked)} style={{ accentColor: T.ok }} />
              Veg only
            </label>
          </div>
          <div style={{ padding: '12px 16px' }}>
            {filteredMenu.map(item => (
              <div key={item.id} style={{ background: T.bgCard, border: `1px solid ${T.brd}`, borderRadius: 12, padding: 14, marginBottom: 10, opacity: item.in_stock ? 1 : 0.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: item.veg ? T.veg : T.nv }}>{'⬛'[0]}{item.veg ? '🟢' : '🔴'}</span>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>{item.name}</span>
                      {item.is_popular && <span style={{ fontSize: 10, background: T.accSoft, color: T.acc, padding: '2px 6px', borderRadius: 4 }}>Popular</span>}
                      {item.is_today_special && <span style={{ fontSize: 10, background: 'rgba(34,197,94,0.1)', color: T.ok, padding: '2px 6px', borderRadius: 4 }}>Today's Special</span>}
                      {!item.in_stock && <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.1)', color: T.err, padding: '2px 6px', borderRadius: 4 }}>Out of Stock</span>}
                    </div>
                    {item.description && <p style={{ fontSize: 13, color: T.txM, margin: '0 0 6px', lineHeight: 1.4 }}>{item.description}</p>}
                    <div style={{ display: 'flex', gap: 10, fontSize: 12, color: T.txD }}>
                      {item.spice_level ? <span>{SPICE_LABELS[item.spice_level]}</span> : null}
                      {item.calories && <span>{item.calories} cal</span>}
                      {item.allergens && JSON.parse(item.allergens).length > 0 && (
                        <span>⚠️ {JSON.parse(item.allergens as string).join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: T.acc }}>{currency}{item.price}</div>
                    {item.in_stock && (
                      <button
                        onClick={() => addToCart(item)}
                        style={{ marginTop: 8, background: T.acc, border: 'none', borderRadius: 8, padding: '6px 14px', color: '#000', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>
                {/* Cart qty indicator */}
                {cart.find(c => c.id === item.id) && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => removeFromCart(item.id)} style={{ background: T.bgEl, border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: T.tx, fontSize: 16 }}>-</button>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{cart.find(c => c.id === item.id)?.qty}</span>
                    <button onClick={() => addToCart(item)} style={{ background: T.bgEl, border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: T.tx, fontSize: 16 }}>+</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cart Tab */}
      {tab === 'cart' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: T.txM }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
              <p>Your cart is empty</p>
              <button onClick={() => setTab('menu')} style={{ marginTop: 16, background: T.acc, border: 'none', borderRadius: 10, padding: '10px 24px', color: '#000', fontWeight: 600, cursor: 'pointer' }}>Browse Menu</button>
            </div>
          ) : (
            <>
              {cart.map(item => (
                <div key={item.id} style={{ background: T.bgCard, border: `1px solid ${T.brd}`, borderRadius: 12, padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ color: T.acc, fontWeight: 700, marginTop: 2 }}>{currency}{item.price} × {item.qty} = {currency}{item.price * item.qty}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => removeFromCart(item.id)} style={{ background: T.bgEl, border: 'none', borderRadius: 6, width: 32, height: 32, cursor: 'pointer', color: T.tx, fontSize: 18 }}>-</button>
                    <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => { const m = menuItems.find(i => i.id === item.id); if (m) addToCart(m); }} style={{ background: T.bgEl, border: 'none', borderRadius: 6, width: 32, height: 32, cursor: 'pointer', color: T.tx, fontSize: 18 }}>+</button>
                  </div>
                </div>
              ))}
              <div style={{ background: T.bgCard, border: `1px solid ${T.brd}`, borderRadius: 12, padding: 16, marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: T.txM }}>
                  <span>Subtotal</span><span>{currency}{cartTotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14, color: T.txM }}>
                  <span>GST (5%)</span><span>{currency}{Math.round(cartTotal * 0.05)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, borderTop: `1px solid ${T.brd}`, paddingTop: 12 }}>
                  <span>Total</span><span style={{ color: T.acc }}>{currency}{cartTotal + Math.round(cartTotal * 0.05)}</span>
                </div>
                <button
                  onClick={placeOrder}
                  style={{ width: '100%', marginTop: 16, background: T.acc, border: 'none', borderRadius: 12, padding: '14px', color: '#000', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
                >
                  Place Order
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: T.txM }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <p>No orders yet</p>
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} style={{ background: T.bgCard, border: `1px solid ${T.brd}`, borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, color: T.txD }}>
                    {order.created_at ? new Date(order.created_at).toLocaleString() : ''}
                  </span>
                  <span style={{ fontSize: 12, background: T.accSoft, color: T.acc, padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                    {order.status}
                  </span>
                </div>
                {order.items.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                    <span style={{ color: T.txM }}>{item.name} × {item.qty}</span>
                    <span>{currency}{item.price * item.qty}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: `1px solid ${T.brd}`, paddingTop: 10, marginTop: 8 }}>
                  <span>Total</span>
                  <span style={{ color: T.acc }}>{currency}{order.total}</span>
                </div>
                <button
                  onClick={() => {
                    order.items.forEach(item => {
                      const m = menuItems.find(i => i.id === item.id);
                      if (m && m.in_stock) for (let k = 0; k < item.qty; k++) addToCart(m);
                    });
                    setTab('cart');
                  }}
                  style={{ marginTop: 10, width: '100%', background: T.bgEl, border: `1px solid ${T.brd}`, borderRadius: 8, padding: '8px', color: T.txM, cursor: 'pointer', fontSize: 13 }}
                >
                  Reorder
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>
    </div>
  );
}
