import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Get started with a single assistant.',
    features: [
      '1 AI Assistant',
      '100 conversations/month',
      'Basic RAG (1 knowledge base)',
      'Community support',
    ],
    cta: 'Start Free',
    highlighted: false,
  },
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    description: 'For growing teams that need more power.',
    features: [
      '3 AI Assistants',
      '1,000 conversations/month',
      'Unlimited knowledge bases',
      '5 Data Connectors',
      'Cost dashboard',
      'Email support',
    ],
    cta: 'Get Started',
    highlighted: true,
  },
  {
    name: 'Pro',
    price: '$199',
    period: '/month',
    description: 'For businesses with advanced needs.',
    features: [
      '10 AI Assistants',
      '10,000 conversations/month',
      'Unlimited knowledge bases',
      'Unlimited Data Connectors',
      'Advanced cost analytics',
      'Budget alerts',
      'Priority support',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
              <span className="text-sm font-bold text-white">AI</span>
            </div>
            <span className="text-lg font-semibold">AI Assistant Platform</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Log in
            </Link>
            <Link href="/signup" className="btn-primary">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 px-6 py-24">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Choose the plan that fits your needs. Scale as you grow.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`card flex flex-col ${
                plan.highlighted
                  ? 'border-primary-500 ring-2 ring-primary-500'
                  : ''
              }`}
            >
              {plan.highlighted && (
                <span className="-mt-3 mb-4 inline-block self-start rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700">
                  Most Popular
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="ml-1 text-sm text-gray-500">
                  {plan.period}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-8 block text-center ${
                  plan.highlighted ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

