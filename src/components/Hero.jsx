import React from 'react';
import logoYRU from '../assets/yru-logo.png';
import logoSTA from '../assets/logosta.png';
import logoAI from '../assets/logo-ai.png';

const Hero = () => {
  return (
<section className="w-full px-4 pt-28 lg:pt-32 pb-28 lg:pb-32 flex flex-col items-center justify-center text-center overflow-x-hidden">
  {/* ส่วนแสดงโลโก้ */}
  <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 mb-10">
    <img 
      src={logoYRU} 
      alt="มหาวิทยาลัยราชภัฏยะลา" 
      className="h-16 md:h-20 w-auto object-contain transition-transform duration-300 hover:scale-105" 
    />
    <img 
      src={logoSTA} 
      alt="สำนักงานปลัดกระทรวง อว." 
      className="h-16 md:h-20 w-auto object-contain transition-transform duration-300 hover:scale-105" 
    />
    <img 
      src={logoAI} 
      alt="AI Center YRU" 
      className="h-16 md:h-20 w-auto object-contain transition-transform duration-300 hover:scale-105" 
    />
  </div>

  {/* หัวข้อหลัก — อยู่ใน flow ปกติของ main (จัดกลางอัตโนมัติ) ฟอนต์ปรับตามจอ (clamp+vw)
      ให้พอดีกรอบทุกขนาดจอ ไม่ตัดบรรทัด/ไม่โดนตัดขอบ และอยู่กึ่งกลางเสมอ */}
 <h1 className="w-full font-extrabold tracking-tight text-gray-900 dark:text-white transition-colors duration-300">
  <span className="text-gradient block text-center text-[clamp(1.5rem,3vw,2.75rem)] !leading-normal md:!leading-relaxed py-2 px-4 md:whitespace-nowrap">
    พัฒนาศักยภาพกำลังคนและนวัตกรรมปัญญาประดิษฐ์ <br /> เพื่อขับเคลื่อนการพัฒนาจังหวัดชายแดนภาคใต้
  </span>
</h1>
</section>
  );
};

export default Hero;
