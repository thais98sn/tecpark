import { supabase } from './supabaseClient.js'

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Loading state on button
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span>Acessando...</span><span class="material-symbols-outlined">hourglass_empty</span>';
            submitBtn.disabled = true;
            errorMessage.classList.add('hidden');

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                errorMessage.textContent = 'Erro ao logar: ' + error.message;
                errorMessage.classList.remove('hidden');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            } else {
                // Sucesso: Redirecionar para registro.html
                window.location.href = '/registro.html';
            }
        });
    }

    // Verificar se já está logado
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            window.location.href = '/registro.html';
        }
    });
});
