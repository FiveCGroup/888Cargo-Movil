import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3102/api';

async function crearUsuarioPrueba() {
    try {
        console.log('👤 [Test] Creando usuario de prueba...');
        
        // Registrar usuario
        const registerResponse = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'test_user',
                email: 'test@888cargo.com',
                password: 'test123456'
            })
        });

        if (registerResponse.ok) {
            const registerData = await registerResponse.json();
            console.log('✅ Usuario registrado:', registerData.message);
        } else {
            console.log('⚠️ Usuario ya existe o error en registro');
        }

        // Login para obtener token
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@888cargo.com',
                password: 'test123456'
            })
        });

        if (!loginResponse.ok) {
            throw new Error('Error en login');
        }

        const loginData = await loginResponse.json();
        console.log('✅ Login exitoso');
        console.log('🔑 Token obtenido:', loginData.token.substring(0, 20) + '...');
        
        return loginData.token;

    } catch (error) {
        console.error('❌ Error:', error.message);
        return null;
    }
}

crearUsuarioPrueba().then(token => {
    if (token) {
        console.log('\n📋 Para usar en pruebas:');
        console.log(`Authorization: Bearer ${token}`);
    }
});