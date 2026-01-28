import { supabase } from './supabaseClient';

export async function getProducerData(userId: string) {
  const { data, error } = await supabase
    .from('producers')
    .select('id, name, email, phone, cbu, user_id')
    .eq('user_id', userId)
    .single();

  return { data, error };
}

export async function updateProducerData(producerId: number, updates: { email?: string; phone?: string | null; cbu?: string | null }, userId?: string) {
  // Preparar los updates, asegurándose de que null se envíe correctamente para CBU y phone
  const cleanUpdates: { email?: string; phone?: string | null; cbu?: string | null } = {};
  
  if (updates.email !== undefined && updates.email) {
    cleanUpdates.email = updates.email;
  }
  
  if (updates.phone !== undefined) {
    cleanUpdates.phone = updates.phone === null || updates.phone === '' ? null : updates.phone;
  }
  
  if (updates.cbu !== undefined) {
    // Si es null o string vacío, enviar null para borrar el CBU
    cleanUpdates.cbu = updates.cbu === null || updates.cbu === '' ? null : updates.cbu;
  }

  console.log('Enviando updates a Supabase:', cleanUpdates);

  // Si se está actualizando el email, también actualizarlo en Auth y en la tabla users
  if (updates.email !== undefined && updates.email) {
    // Actualizar en auth.users
    const { error: authError } = await supabase.auth.updateUser({
      email: updates.email,
    });

    if (authError) {
      console.error('Error actualizando email en Auth:', authError);
      return { 
        data: null, 
        error: { 
          message: `Error al actualizar el email de autenticación: ${authError.message}` 
        } 
      };
    }

    // Actualizar en la tabla users si existe y tenemos el userId
    if (userId) {
      const { error: usersError } = await supabase
        .from('users')
        .update({ email: updates.email })
        .eq('id', userId);

      if (usersError) {
        console.error('Error actualizando email en tabla users:', usersError);
        // No retornamos error aquí porque auth.users ya se actualizó correctamente
        // Solo logueamos el error para debugging
      } else {
        console.log('Email actualizado en tabla users correctamente');
      }
    }
  }

  const { data: updateData, error: updateError } = await supabase
    .from('producers')
    .update(cleanUpdates)
    .eq('id', producerId)
    .select('id, name, email, phone, cbu, user_id');

  if (updateError) {
    console.error('Error en update:', updateError);
    return { data: null, error: updateError };
  }

  // Verificar que se actualizó al menos un registro
  if (!updateData || updateData.length === 0) {
    const error = { message: 'No se pudo actualizar el registro. Verifique los permisos o que el registro exista.' };
    console.error('No se actualizó ningún registro');
    return { data: null, error };
  }

  console.log('Datos actualizados recibidos de Supabase:', updateData[0]);
  // Retornar el primer registro actualizado
  return { data: updateData[0], error: null };
}
