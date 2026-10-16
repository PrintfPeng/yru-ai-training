import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { portfoliosApi } from '../api';

/**
 * "ผลงานที่ผ่านมา" — Expanding-panels / accordion carousel
 * (อ้างอิง https://codepen.io/Anantpatel9290/pen/azdLPra).
 * แผงที่ active จะขยายกว้างโชว์รูป+ชื่อ+คำอธิบายเต็ม ส่วนแผงอื่นหุบเป็นแถบแคบ
 * โชว์ชื่อแบบแนวตั้ง. ขยายเมื่อ hover (เดสก์ท็อป) หรือคลิก/ปัด (มือถือ).
 *
 * รองรับ: ปุ่มซ้าย/ขวา, คลิกแผงเพื่อขยาย, pagination dots, ปัดหน้าจอ (swipe),
 * auto-play หยุดเมื่อ hover. ใช้ Tailwind dark: variants → รองรับ Light/Dark.
 */
const AUTOPLAY_MS = 4500;
const SWIPE_THRESHOLD = 50; // px

const PastWorksCarousel = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const drag = useRef(null);

  useEffect(() => {
    let cancelled = false;
    portfoliosApi
      .getPortfolios()
      .then((rows) => { if (!cancelled) setItems(Array.isArray(rows) ? rows : []); })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const n = items.length;
  const go = useCallback((dir) => setActive((a) => (a + dir + n) % n), [n]);
  const goTo = useCallback((i) => setActive(((i % n) + n) % n), [n]);

  // Auto-play — หยุดเมื่อ hover หรือมีแผงเดียว
  useEffect(() => {
    if (paused || n <= 1) return undefined;
    const id = setInterval(() => setActive((a) => (a + 1) % n), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, n]);

  useEffect(() => { if (active > n - 1) setActive(0); }, [n, active]);

  const onPointerDown = (e) => { drag.current = { x: e.clientX, moved: false }; };
  const onPointerUp = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
    drag.current = null;
  };

  if (loading) {
    return (
      <section className="w-full py-16 flex justify-center">
        <Loader2 className="w-8 h-8 text-yrupink-500 animate-spin" />
      </section>
    );
  }
  if (n === 0) return null;

  return (
    <section id="past-works" className="w-full py-16 pb-24 transition-colors duration-300 scroll-mt-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white transition-colors duration-300">
          ผลงานที่ผ่านมา
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-yrupink-600 to-yrupink-400 mx-auto rounded-full"></div>
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* Panels row */}
        <div
          className="flex gap-2 md:gap-3 w-full h-[360px] sm:h-[420px] md:h-[460px] select-none"
          onMouseLeave={() => { setPaused(false); drag.current = null; }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {items.map((item, i) => {
            const isActive = i === active;
            return (
              <article
                key={item.id}
                onMouseEnter={() => { setActive(i); setPaused(true); }}
                onClick={() => setActive(i)}
                style={{ flexGrow: isActive ? 7 : 1 }}
                className={`relative h-full rounded-2xl overflow-hidden cursor-pointer min-w-0 flex-shrink basis-0 border transition-[flex-grow] duration-500 ease-in-out ${
                  isActive
                    ? 'border-yrupink-500/50 shadow-2xl shadow-yrupink-500/20'
                    : 'border-black/5 dark:border-white/10'
                }`}
                aria-label={item.title}
              >
                <img
                  src={item.image_url}
                  alt={item.title}
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />
                {/* Overlay */}
                <div className={`absolute inset-0 transition-all duration-500 ${
                  isActive
                    ? 'bg-gradient-to-t from-black/85 via-black/35 to-transparent'
                    : 'bg-black/45 hover:bg-black/30'
                }`} />

                {/* Active content */}
                <div className={`absolute bottom-0 left-0 right-0 p-5 md:p-7 text-left transition-all duration-500 ${
                  isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                }`}>
                  <h3 className="text-xl md:text-3xl font-extrabold text-white drop-shadow line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-sm md:text-[15px] text-white/85 mt-2 leading-relaxed line-clamp-3 max-w-xl">
                    {item.description}
                  </p>
                </div>

                {/* Collapsed vertical label — ตัดด้วย … เมื่อยาวเกินความสูงแผง
                    (ชื่อเต็มจะเห็นตอนแผงขยาย) */}
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                  isActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}>
                  <span className="inline-block -rotate-90 whitespace-nowrap overflow-hidden text-ellipsis max-w-[260px] sm:max-w-[330px] md:max-w-[370px] text-white font-semibold text-sm md:text-base drop-shadow-md tracking-wide">
                    {item.title}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {/* Prev / Next */}
        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="ก่อนหน้า"
              className="absolute -left-3 md:-left-5 top-1/2 -translate-y-1/2 z-40 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 dark:bg-yrugray-900/90 backdrop-blur border border-slate-200 dark:border-yrugray-700 text-slate-700 dark:text-white hover:bg-yrupink-600 hover:text-white hover:border-yrupink-500 shadow-lg flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="ถัดไป"
              className="absolute -right-3 md:-right-5 top-1/2 -translate-y-1/2 z-40 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 dark:bg-yrugray-900/90 backdrop-blur border border-slate-200 dark:border-yrugray-700 text-slate-700 dark:text-white hover:bg-yrupink-600 hover:text-white hover:border-yrupink-500 shadow-lg flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {n > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`ไปที่ผลงานที่ ${i + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === active
                  ? 'w-8 bg-yrupink-600 dark:bg-yrupink-500'
                  : 'w-2.5 bg-slate-300 dark:bg-yrugray-700 hover:bg-slate-400 dark:hover:bg-yrugray-600'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default PastWorksCarousel;
