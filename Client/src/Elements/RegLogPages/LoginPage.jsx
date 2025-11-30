import './RegLog.css';
import { useState } from 'react';

export default function LoginPage() {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    // const [userRole, setUserRole] = useState(null);
    // const [accessToken, setAccessToken] = useState(null);
    // const [refreshToken, setRefreshToken] = useState(null);
    // const [error, setError] = useState(null);
    // const [code, setCode] = useState('');

    async function submitLogin() {
    const formData = {
        Login: login,
        Password: password,
    };

    try {
        const response = await fetch('https://psbsmartedu.ru/Auth/Login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        });

        // if (!response.ok) {
        // throw new Error(`HTTP error: ${response.status}`);
        // }

        const data = await response.json();

        // if (!data.accessToken || !data.refreshToken) {
        // throw new Error("Сервер не вернул токены");
        // }

        // Сохраняем токены в куки
        // setCookie('login', login)
        // setCookie('access', data.accessToken);
        // setCookie('refresh', data.refreshToken);


        // Редирект или другие действия
        document.cookie = `login=${login}` 
        document.cookie = `role=${data.role}`
        document.cookie = `userId=${data.userId}`
        window.location.href = "/account";

    } catch (error) {
        console.error("Ошибка авторизации:", error);
        setError(error.message);
    }
    }

    return (
        <main className='LoginForm'>
            <article>
            <h1>Вход в систему</h1>
            <p>Ваш логин:</p>
            <input
                type="text"
                className='Login'
                value={login}
                onChange={(e) => setLogin(e.target.value)}
            />
            <p>Пароль:</p>
            <input
                type="password"
                className='Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <button className='whiteButton' type="button" onClick={submitLogin}>
                Подтвердить
            </button>

            <p style={{textAlign:'center', margin:'10px 0'}}>Нет аккаунта?</p>
            <a href="/register">Зарегистрироваться</a>
            </article>

        </main>
    );
}