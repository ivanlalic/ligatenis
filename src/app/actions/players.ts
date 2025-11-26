'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Función auxiliar para generar password seguro
function generateSecurePassword(): string {
  const length = 12
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%'
  let password = ''

  // Asegurar al menos: 1 mayúscula, 1 minúscula, 1 número, 1 especial
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
  password += '0123456789'[Math.floor(Math.random() * 10)]
  password += '!@#$%'[Math.floor(Math.random() * 5)]

  // Completar el resto
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }

  // Mezclar caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export async function createPlayer(formData: FormData) {
  const supabase = await createClient()

  const categoryId = formData.get('category_id') as string
  const redirectTo = formData.get('redirect_to') as string | null
  const createAuthUser = formData.get('create_auth_user') === 'true'

  const playerData = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string || null,
    notes: formData.get('notes') as string || null,
    initial_category_id: categoryId,
    current_category_id: categoryId,
    status: 'active' as const,
  }

  let generatedPassword: string | null = null
  let authUserId: string | null = null

  // Si se solicita crear usuario de autenticación
  if (createAuthUser) {
    generatedPassword = generateSecurePassword()

    // Usar cliente admin para crear usuario en Supabase Auth
    const adminClient = createAdminClient()
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: playerData.email,
      password: generatedPassword,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        first_name: playerData.first_name,
        last_name: playerData.last_name,
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError.message)
      throw new Error(`Error al crear usuario: ${authError.message}`)
    }

    authUserId = authData.user.id
  }

  // Crear jugador en la tabla players
  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert([{
      ...playerData,
      auth_user_id: authUserId,
    }])
    .select()
    .single()

  if (playerError) {
    // Si falla la creación del player pero se creó el auth user, eliminarlo (rollback)
    if (authUserId) {
      const adminClient = createAdminClient()
      await adminClient.auth.admin.deleteUser(authUserId)
    }
    console.error('Error creating player:', playerError.message)
    throw new Error(playerError.message)
  }

  revalidatePath('/admin')
  revalidatePath('/admin/jugadores')
  revalidatePath(`/admin/categorias/${categoryId}`)

  // Si se generó password, retornar las credenciales (se mostrará en un modal)
  if (generatedPassword) {
    // Guardar temporalmente en sessionStorage del servidor para mostrar después
    // Por ahora, redirigir con query params (temporal - mejorar en producción)
    const params = new URLSearchParams({
      email: playerData.email,
      password: generatedPassword,
      name: `${playerData.first_name} ${playerData.last_name}`
    })

    if (redirectTo && redirectTo.startsWith('/admin/categorias/')) {
      redirect(`${redirectTo}?newPlayer=true&${params.toString()}`)
    } else {
      redirect(`/admin/jugadores?newPlayer=true&${params.toString()}`)
    }
  }

  // Redirigir normal si no se creó usuario
  if (redirectTo && redirectTo.startsWith('/admin/categorias/')) {
    redirect(redirectTo)
  } else {
    redirect('/admin/jugadores')
  }
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

export async function addPlayerToCategory(playerId: string, categoryId: string) {
  const supabase = await createClient()

  // Verificar que no haya fixture generado
  const { count: roundsCount } = await supabase
    .from('rounds')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId)

  if (roundsCount && roundsCount > 0) {
    throw new Error('No se pueden agregar jugadores a una categoría con fixture generado')
  }

  // Actualizar el jugador para asignarlo a esta categoría
  const { error } = await supabase
    .from('players')
    .update({ current_category_id: categoryId })
    .eq('id', playerId)

  if (error) {
    throw new Error(`Error al agregar jugador a la categoría: ${error.message}`)
  }

  revalidatePath(`/admin/categorias/${categoryId}`)
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
