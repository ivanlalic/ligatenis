'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error('Error logging in:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  redirect('/admin')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    console.error('Error signing up:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  redirect('/admin')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

// ============================================
// AUTENTICACIÓN PARA JUGADORES (v2.0)
// ============================================

export async function signInPlayer(formData: FormData) {
  const supabase = await createClient()

  const credentials = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data, error } = await supabase.auth.signInWithPassword(credentials)

  if (error) {
    // Redirigir con error
    redirect(`/jugador/login?error=${encodeURIComponent(error.message)}`)
  }

  // Verificar que el usuario tenga un jugador asociado
  const { data: player } = await supabase
    .from('players')
    .select('id, first_name, last_name, status')
    .eq('auth_user_id', data.user.id)
    .single()

  if (!player) {
    // El usuario no tiene jugador asociado
    await supabase.auth.signOut()
    redirect('/jugador/login?error=' + encodeURIComponent('No tienes acceso como jugador'))
  }

  if (player.status !== 'active') {
    // El jugador está inactivo
    await supabase.auth.signOut()
    redirect('/jugador/login?error=' + encodeURIComponent('Tu cuenta está inactiva. Contacta al administrador.'))
  }

  // Login exitoso, redirigir al dashboard
  revalidatePath('/', 'layout')
  redirect('/jugador/dashboard')
}

export async function signOutPlayer() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/jugador/login')
}
