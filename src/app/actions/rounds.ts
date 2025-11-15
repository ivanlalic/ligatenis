'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Actualiza las fechas de calendario de una jornada
 */
export async function updateRoundDates(
  roundId: string,
  periodStart: string,
  periodEnd: string
) {
  const supabase = await createClient()

  // Validar que period_end >= period_start
  const start = new Date(periodStart)
  const end = new Date(periodEnd)

  if (end < start) {
    throw new Error('La fecha de fin debe ser posterior o igual a la fecha de inicio')
  }

  const { error } = await supabase
    .from('rounds')
    .update({
      period_start: periodStart,
      period_end: periodEnd
    })
    .eq('id', roundId)

  if (error) {
    console.error('Error updating round dates:', error.message)
    throw new Error('Error al actualizar las fechas de la jornada')
  }

  revalidatePath('/admin/categorias')
}

/**
 * Actualiza el estado de una jornada
 */
export async function updateRoundStatus(
  roundId: string,
  status: 'pending' | 'active' | 'completed' | 'expired'
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('rounds')
    .update({ status })
    .eq('id', roundId)

  if (error) {
    console.error('Error updating round status:', error.message)
    throw new Error('Error al actualizar el estado de la jornada')
  }

  revalidatePath('/admin/categorias')
}
