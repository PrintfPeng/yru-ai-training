import React from 'react';
import logoYRU from '../assets/yru-logo.png';
import logoSTA from '../assets/logosta.png';
import logoAI from '../assets/logo-ai.png';

const Hero = () => {
  return (
    <section className="w-full pt-28 lg:pt-32 pb-28 lg:pb-30 flex flex-col items-center justify-center text-center">
      <div className="flex flex-row items-center justify-center gap-6 md:gap-10 mb-8">
        <img src={logoYRU} alt="มหาวิทยาลัยราชภัฏยะลา" className="h-20 w-auto transition-transform duration-300 hover:scale-105" />
        <img src={logoSTA} alt="สำนักงานปลัดกระทรวง อว." className="h-20 w-auto transition-transform duration-300 hover:scale-105" />
        <img src={logoAI} alt="AI Center YRU" className="h-20 w-auto transition-transform duration-300 hover:scale-105" />
      </div>
      <br />
      <p className="text-xl md:text-2xl text-gray-600 dark:text-yrugray-100 max-w-2xl mb-10 leading-relaxed opacity-90 transition-colors duration-300">
       พัฒนาศักยภาพกำลังคนและนวัตกรรมปัญญาประดิษฐ์ <br />เพื่อขับเคลื่อนการพัฒนาจังหวัดชายแดนภาคใต้
      </p>
    </section>
  );
};

export default Hero;
