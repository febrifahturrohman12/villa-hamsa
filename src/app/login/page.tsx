import LoginForm from "./LoginForm";

export const metadata = { title: "Masuk – Villa Hamsa", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <div className="mb-3 text-5xl">🏡</div>
        <h1 className="text-2xl font-bold">Villa Hamsa</h1>
        <p className="mt-1 text-slate-600">Masukkan PIN untuk mulai pengecekan</p>
      </div>
      <LoginForm />
    </main>
  );
}
