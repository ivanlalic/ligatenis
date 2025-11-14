'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createPlayer(formData: FormData) {
  const supabase = await createClient()

  const categoryId = formData.get('category_id') as string

  const data = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string || null,
    notes: formData.get('notes') as string || null,
    initial_category_id: categoryId,
    current_category_id: categoryId,
    status: 'active' as const,
  }

  const { error } = await supabase
    .from('players')
    .insert([data])

  if (error) {
    console.error('Error creating player:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin')
  revalidatePath('/admin/jugadores')
  redirect('/admin/jugadores')
}

export async function updatePlayer(id: string, formData: FormData) {
  const supabase = await createClient()

  const data = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string || null,
    notes: formData.get('notes') as string || null,
    current_category_id: formData.get('current_category_id') as string,
  }

  const { error } = await supabase
    .from('players')
    .update(data)
    .eq('id', id)

  if (error) {
    console.error('Error updating player:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin')
  revalidatePath('/admin/jugadores')
  redirect('/admin/jugadores')
}

export async function deactivatePlayer(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('players')
    .update({
      status: 'inactive',
      deactivated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('Error deactivating player:', error.message)
    return
  }

  // TODO: Marcar partidos futuros como WO automáticamente

  revalidatePath('/admin')
  revalidatePath('/admin/jugadores')
}

export async function reactivatePlayer(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('players')
    .update({
      status: 'active',
      deactivated_at: null,
    })
    .eq('id', id)

  if (error) {
    console.error('Error reactivating player:', error.message)
    return
  }

  revalidatePath('/admin')
  revalidatePath('/admin/jugadores')
}
