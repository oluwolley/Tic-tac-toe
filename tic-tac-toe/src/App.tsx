import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import GamePage from './pages/Game'
import Landing from './pages/Landing'
import ProfilePage from './pages/Profile'
import { SupabaseProvider } from './providers/SupabaseProvider'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/game/:gameId',
    element: <GamePage />,
  },
  {
    path: '/profile',
    element: <ProfilePage />,
  },
])

export default function App() {
  return (
    <SupabaseProvider>
      <RouterProvider router={router} />
    </SupabaseProvider>
  )
}
