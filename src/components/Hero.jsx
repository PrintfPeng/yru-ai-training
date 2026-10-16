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
      <h1 className="text-2xl md:text-3xl lg:text-5xl font-extrabold tracking-tight max-w-4xl leading-tight mb-10 transition-colors duration-300">
        <span className="text-gradient">
          พัฒนาศักยภาพกำลังคนและนวัตกรรมปัญญาประดิษฐ์ <br />เพื่อขับเคลื่อนการพัฒนาจังหวัดชายแดนภาคใต้
        </span>
      </h1>
    </section>
  );
};

export default Hero;
