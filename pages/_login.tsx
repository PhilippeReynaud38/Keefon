import { useRouter } from 'next/router'

export default function LoginPage() {
  const router = useRouter()
  const error = router.query.error

  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', marginTop: '20%' }}>
      <h1>Accès protégé</h1>
      {error && <p style={{ color: 'red' }}>Mot de passe incorrect</p>}
      <form method="POST" action="/_auth">
        <input
          type="password"
          name="password"
          placeholder="Mot de passe"
          style={{ padding: '8px', margin: '5px' }}
        />
        <button type="submit" style={{ padding: '8px 16px' }}>
          Entrer
        </button>
      </form>
    </div>
  )
}
