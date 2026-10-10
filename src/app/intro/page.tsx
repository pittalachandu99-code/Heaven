'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import IntroVideoModal from '@/components/common/IntroVideoModal';

export default function IntroPage() {
  const router = useRouter();

  const handleFinish = () => {
    router.push('/');
  };

  return (
    <main className="w-screen h-screen bg-black overflow-hidden">
      <IntroVideoModal onFinish={handleFinish} allowSkip={true} />
    </main>
  );
}
