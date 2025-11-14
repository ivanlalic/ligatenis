'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createCategory(formData: FormData) {
  const supabase = await createClient()

  const data = {
    name: formData.get('name') as string,
    season_year: parseInt(formData.get('season_year') as string),
    display_order: parseInt(formData.get('display_order') as string),
  }

  const { error } = await supabase
    .from('categories')
    .insert([data])

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/categorias')
  redirect('/admin/categorias')
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient()

  const data = {
    name: formData.get('name') as string,
    season_year: parseInt(formData.get('season_year') as string),
    display_order: parseInt(formData.get('display_order') as string),
  }

  const { error } = await supabase
    .from('categories')
    .update(data)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/categorias')
  redirect('/admin/categorias')
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/admin/categorias')
  redirect('/admin/categorias')
}
