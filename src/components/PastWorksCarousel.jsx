import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Loader2, X, ArrowUpRight } from 'lucide-react';
import { portfoliosApi } from '../api';

/**
 * "ผลงานที่ผ่านมา" — 3D center-mode / coverflow carousel.
 * การ์ดตรงกลางขยายเด่น การ์ดด้านข้างย่อ+เอียงเป็นมิติซ้อนกัน (perspective + rotateY).
 * การ์ดโชว์ "แค่ชื่อ" — คลิกการ์ดกลางเพื่อเปิดหน้ารายละเอียดเต็ม (รูป+ชื่อ+คำอธิบาย).
 *
 * รองรับ: ปุ่มซ้าย/ขวา, คลิกการ์ดด้านข้างเพื่อเลื่อนมากลาง, pagination dots,
 * ปัดหน้าจอ (swipe), auto-play หยุดเมื่อ hover. รองรับ Light/Dark mode.
 */
const AUTOPLAY_MS = 4500;
const SWIPE_THRESHOLD = 50; // px

const PastWorksCarousel = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [detail, setDetail] = useState(null); // ผลงานที่เปิดดูรายละเอียดอยู่
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

  // Auto-play — หยุดเมื่อ hover/เปิดรายละเอียด หรือมีการ์ดเดียว
  useEffect(() => {
    if (paused || detail || n <= 1) return undefined;
    const id = setInterval(() => setActive((a) => (a + 1) % n), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, detail, n]);

  useEffect(() => { if (active > n - 1) setActive(0); }, [n, active]);

  const onPointerDown = (e) => { drag.current = { x: e.clientX }; };
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

      {/* Stage */}
      <div
        className="relative mx-auto max-w-6xl h-[340px] sm:h-[400px] md:h-[460px] [perspective:1200px] select-none"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => { setPaused(false); drag.current = null; }}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={(e) => onPointerUp(e)}
      >
        {items.map((item, i) => {
          let offset = i - active;
          if (offset > n / 2) offset -= n;
          if (offset < -n / 2) offset += n;
          const abs = Math.abs(offset);
          const hidden = abs > 2;
          const isActive = offset === 0;

          return (
            <article
              key={item.id}
              onClick={() => { if (hidden) return; isActive ? setDetail(item) : goTo(i); }}
              className={`absolute top-0 left-1/2 w-[80%] sm:w-[62%] md:w-[48%] lg:w-[40%] h-full rounded-2xl overflow-hidden border border-black/5 dark:border-white/10 bg-slate-200 dark:bg-yrugray-800 shadow-xl transition-all duration-500 ease-out ${
                isActive ? 'cursor-pointer ring-2 ring-yrupink-500/60 shadow-2xl shadow-yrupink-500/20' : 'cursor-pointer'
              }`}
              style={{
                transform: `translateX(calc(-50% + ${offset * 52}%)) scale(${1 - abs * 0.14}) rotateY(${offset * -6}deg)`,
                zIndex: 30 - abs,
                opacity: hidden ? 0 : 1 - abs * 0.25,
                pointerEvents: hidden ? 'none' : 'auto',
              }}
              aria-hidden={hidden}
            >
              <img
                src={item.image_url}
                alt={item.title}
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
              {/* Overlay — โชว์แค่ชื่อ */}
              <div className={`absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 text-left">
                <h3 className="text-lg md:text-2xl font-bold text-white drop-shadow-sm line-clamp-2">
                  {item.title}
                </h3>
                {isActive && (
                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-white/90 bg-white/15 hover:bg-yrupink-600 border border-white/25 rounded-full px-3 py-1 backdrop-blur transition-colors">
                    ดูรายละเอียด <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </article>
          );
        })}

        {/* Prev / Next */}
        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="ก่อนหน้า"
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/80 dark:bg-yrugray-900/80 backdrop-blur border border-slate-200 dark:border-yrugray-700 text-slate-700 dark:text-white hover:bg-yrupink-600 hover:text-white hover:border-yrupink-500 shadow-lg flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="ถัดไป"
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-40 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/80 dark:bg-yrugray-900/80 backdrop-blur border border-slate-200 dark:border-yrugray-700 text-slate-700 dark:text-white hover:bg-yrupink-600 hover:text-white hover:border-yrupink-500 shadow-lg flex items-center justify-center transition-colors"
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

      {detail && <PortfolioDetailModal item={detail} onClose={() => setDetail(null)} />}
    </section>
  );
};

// หน้ารายละเอียดผลงาน (รูปเต็ม + ชื่อ + คำอธิบายทั้งหมด)
const PortfolioDetailModal = ({ item, onClose }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div onClick={onClose} className="absolute inset-0" />
      <div className="relative my-8 w-full max-w-3xl bg-white dark:bg-yrugray-900 border border-slate-200 dark:border-yrugray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="relative">
          <img src={item.image_url} alt={item.title} className="w-full max-h-[55vh] object-cover bg-slate-100 dark:bg-yrugray-800" />
          <button
            onClick={onClose}
            aria-label="ปิด"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 md:p-8 overflow-y-auto">
          <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white mb-3">{item.title}</h3>
          <p className="text-[15px] md:text-base text-slate-700 dark:text-yrugray-300 leading-relaxed whitespace-pre-line">
            {item.description}
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default PastWorksCarousel;
