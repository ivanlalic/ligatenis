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
    console.error('Error creating category:', error.message)
    throw new Error(error.message)
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
    console.error('Error updating category:', error.message)
    throw new Error(error.message)
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
    console.error('Error deleting category:', error.message)
    throw new Error(error.message)
  }

  revalidatePath('/admin')
  revalidatePath('/admin/categorias')
  redirect('/admin/categorias')
}

export async function moveCategoryUp(id: string) {
  const supabase = await createClient()

  // Obtener la categoría actual
  const { data: currentCategory } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  if (!currentCategory) {
    console.error('Category not found')
    return
  }

  // Obtener la categoría inmediatamente arriba
  const { data: previousCategory } = await supabase
    .from('categories')
    .select('*')
    .eq('season_year', currentCategory.season_year)
    .lt('display_order', currentCategory.display_order)
    .order('display_order', { ascending: false })
    .limit(1)
    .single()

  if (!previousCategory) {
    console.log('Already at first position')
    return
  }

  // Intercambiar los display_order
  const tempOrder = currentCategory.display_order

  await supabase
    .from('categories')
    .update({ display_order: previousCategory.display_order })
    .eq('id', currentCategory.id)

  await supabase
    .from('categories')
    .update({ display_order: tempOrder })
    .eq('id', previousCategory.id)

  revalidatePath('/admin')
  revalidatePath('/admin/categorias')
}

export async function moveCategoryDown(id: string) {
  const supabase = await createClient()

  // Obtener la categoría actual
  const { data: currentCategory } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  if (!currentCategory) {
    console.error('Category not found')
    return
  }

  // Obtener la categoría inmediatamente abajo
  const { data: nextCategory } = await supabase
    .from('categories')
    .select('*')
    .eq('season_year', currentCategory.season_year)
    .gt('display_order', currentCategory.display_order)
    .order('display_order', { ascending: true })
    .limit(1)
    .single()

  if (!nextCategory) {
    console.log('Already at last position')
    return
  }

  // Intercambiar los display_order
  const tempOrder = currentCategory.display_order

  await supabase
    .from('categories')
    .update({ display_order: nextCategory.display_order })
    .eq('id', currentCategory.id)

  await supabase
    .from('categories')
    .update({ display_order: tempOrder })
    .eq('id', nextCategory.id)

  revalidatePath('/admin')
  revalidatePath('/admin/categorias')
}
