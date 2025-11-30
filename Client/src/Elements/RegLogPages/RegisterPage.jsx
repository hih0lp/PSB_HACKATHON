import './RegLog.css'
import { useState, useEffect } from 'react'

export default function RegisterPage(){
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [resumePassword, setResumePassword] = useState('');
    const [email, setEmail] = useState('');
    const [name, setName] = useState('')


    //useEffect(() => {
    //    const fetchToken = async () => {
    //    try {
    //        const response = await fetch('http://localhost:7237/registrate-user', {
    //        method: 'GET',
    //        headers: { 
    //            'Content-Type': 'application/json',
    //        },
    //        credentials: 'include' 
    //        });

    //        if (!response.ok) {
    //        throw new Error(`HTTP error! Status: ${response.status}`);
    //        }

    //        const data = await response.json();
            
    //        // // Предполагаем, что токен приходит в поле 'token'
    //        // // Если структура ответа другая - измените это место
    //        // const token = data.token || data.access_token;
            
    //        // if (!token) {
    //        // throw new Error('Token not found in response');
    //        // }

    //        // // Декодируем токен
    //        // const decoded = jwt_decode(token);
    //        // setTokenData(decoded);
    //        // console.log('Decoded token:', decoded);

    //    } catch (err) {
    //        console.error('Error:', err);
    //        setError(err.message);
    //    } finally {
    //        setLoading(false);
    //    }
    //    };

    //    fetchToken();
    //}, []);


function submitRegistration(){
    if (password === resumePassword) {
        const formData = {
            Name: name,
            Login: login,
            Password: password,
            Email: email
        }

        fetch('https://psbsmartedu.ru/Auth/Register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        })
        .then(response => {
            if (response.status === 400) {
                alert('Данный пользователь уже существует');
                throw new Error('User already exists');
            }
            if (response.status === 200) {
                // console.log('Success:', response);
                window.location.href='/';
            }
            throw new Error('Registration failed');
        })
        .then(data => {
            // console.log('Success:', data);
            // window.location.href='/login';
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }   
}

    return(
        <main className='LoginForm'>
            <article>
            <h1>Регистрация</h1>
            <p>Ваше Имя:</p>
            <input type="text" className='Name' value={name} onChange={(e) => setName(e.target.value)}/>
            <p>Логин:</p>
            <input type="text" className='Login' value={login} onChange={(e) => setLogin(e.target.value)} />
            <p>Почта:</p>
            <input type="text" className='Email' value={email} onChange={(e) => setEmail(e.target.value)} />
            <p>Пароль:</p>
            <input type="text" className='Password' value={password} onChange={(e) => setPassword(e.target.value)}/>
            <p>Повторите пароль:</p>
            <input type="text" className='Password' value={resumePassword} onChange={(e) => setResumePassword(e.target.value)}/>
            <button className='whiteButton'  onClick={()=>submitRegistration()}>Подтвердить</button>
            <p style={{textAlign:'center', margin:'10px 0'}}>Уже есть аккаунт?</p>
            <a href="/">Войти</a>
            </article>
        </main>
    )
}