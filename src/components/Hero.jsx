import React from 'react';

const Hero = () => {
  return (
    <section className="w-full pt-[25vh] lg:pt-[30vh] pb-20 lg:pb-32 flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight text-gray-900 dark:text-white transition-colors duration-300">
        <span className="text-gradient">ขับเคลื่อนการพัฒนาท้องถิ่น</span> <br />
        ด้วยปัญญาประดิษฐ์
      </h1>
      <br />
      <br />
      <p className="text-lg md:text-xl text-gray-600 dark:text-yrugray-100 max-w-2xl mb-10 leading-relaxed opacity-90 transition-colors duration-300">
        สัมผัสเทคโนโลยี AI ล้ำสมัย ยกระดับทักษะของคุณด้วยหลักสูตรเฉพาะทาง และร่วมสร้างสรรค์ในพื้นที่ปฏิบัติการที่ออกแบบมาเพื่อนักนวัตกรรมแห่งอนาคต
      </p>
    </section>
  );
};

export default Hero;
