'use client';

import { useRouter } from 'next/navigation';
import styles from './PaiementButton.module.css';

type Props = {
  plan: string;
  montant: number;
};

export default function PaiementButton({ plan, montant }: Props) {
  const router = useRouter();

  const handleRedirection = () => {
    router.push(`/checkout?plan=${plan}`);
  };

  return (
    <button className={styles.ctaButton} onClick={handleRedirection}>
      Choisir cette offre
    </button>
  );
}
