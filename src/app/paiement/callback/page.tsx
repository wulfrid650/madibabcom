import { redirect } from 'next/navigation';

type PaymentCallbackPageProps = {
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
};

export default function PaymentCallbackPage({
  searchParams = {},
}: PaymentCallbackPageProps) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry));
      return;
    }

    if (typeof value === 'string') {
      params.set(key, value);
    }
  });

  const queryString = params.toString();

  redirect(
    queryString
      ? `/paiement/confirmation?${queryString}`
      : '/paiement/confirmation'
  );
}
