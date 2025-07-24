import { useState, useCallback } from 'react';
import { useStore2Users } from './useStore2Users';

interface Store2AttendanceSession {
  isAuthenticated: boolean;
  user?: {
    id: string;
    username: string;
    name: string;
    role: 'attendant' | 'admin';
    permissions: {
      can_view_orders: boolean;
      can_update_status: boolean;
      can_chat: boolean;
      can_create_manual_orders: boolean;
      can_print_orders: boolean;
    };
  };
}

export const useStore2Attendance = () => {
  const [session, setSession] = useState<Store2AttendanceSession>({
    isAuthenticated: false
  });
  const { getUserByCredentials } = useStore2Users();

  const login = useCallback((username: string, password: string): boolean => {
    // Usar hook para verificar credenciais no banco
    getUserByCredentials(username, password).then(user => {
      if (user && user.permissions?.can_view_sales) {
        console.log('Login da Loja 2 bem-sucedido para:', user.name);
        
        setSession({
          isAuthenticated: true,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role === 'admin' ? 'admin' : 'attendant',
            permissions: {
              can_view_orders: false, // Loja 2 não tem delivery
              can_update_status: false,
              can_chat: false,
              can_create_manual_orders: false,
              can_print_orders: true
            }
          }
        });
      } else {
        console.log('Login da Loja 2 falhou - usuário não encontrado ou sem permissão');
      }
    }).catch(error => {
      console.error('Erro no login da Loja 2:', error);
    });
    
    // Retornar false por enquanto, o estado será atualizado assincronamente
    return false;
  }, [getUserByCredentials]);

  const logout = useCallback(() => {
    console.log('Logout da Loja 2');
    setSession({
      isAuthenticated: false
    });
  }, []);

  return {
    session,
    login,
    logout
  };
};