import { useState, useEffect } from 'react';
import './Admin.css';

export default function AdminPanel() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState({});
    const [selectedRoles, setSelectedRoles] = useState({});

    // Функция для получения списка пользователей
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('https://psbsmartedu.ru/Admin/GetUsers?userId=1', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Ошибка: ${response.status}`);
            }

            const usersData = await response.json();
            setUsers(usersData);
            
            // Инициализируем selectedRoles текущими ролями пользователей
            const initialRoles = {};
            usersData.forEach(user => {
                initialRoles[user.id] = user.role;
            });
            setSelectedRoles(initialRoles);
        } catch (err) {
            console.error('Ошибка загрузки пользователей:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Функция для изменения роли пользователя
    const updateUserRole = async (userId, newRole) => {
        try {
            setSaving(prev => ({ ...prev, [userId]: true }));

            const response = await fetch(`https://psbsmartedu.ru/Admin/ChangeRole?userId=${userId}&adminId=${1}&role=${newRole}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Ошибка обновления: ${response.status}`);
            }

            // Обновляем локальное состояние
            setUsers(prevUsers => 
                prevUsers.map(user => 
                    user.id === userId ? { ...user, role: newRole } : user
                )
            );

            console.log(`Роль пользователя ${userId} изменена на ${newRole}`);
        } catch (err) {
            console.error('Ошибка обновления роли:', err);
            alert(`Ошибка обновления роли: ${err.message}`);
        } finally {
            setSaving(prev => ({ ...prev, [userId]: false }));
        }
    };

    // Обработчик изменения select
    const handleRoleChange = (userId, newRole) => {
        setSelectedRoles(prev => ({
            ...prev,
            [userId]: newRole
        }));
    };

    // Загружаем пользователей при монтировании компонента
    useEffect(() => {
        fetchUsers();
    }, []);

    // Функция для получения куки (если нужна авторизация)
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    };

    // Опции ролей
    const roleOptions = [
        { value: 'student', label: 'Студент' },
        { value: 'teacher', label: 'Преподаватель' },
        { value: 'admin', label: 'Админ' }
    ];

    if (loading) {
        return (
            <div className="admin-panel">
                <div className="loading">Загрузка пользователей...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-panel">
                <div className="error">Ошибка: {error}</div>
                <button onClick={fetchUsers}>Попробовать снова</button>
            </div>
        );
    }

    return (
        <div className="admin-panel">
            <header className="admin-header">
                <h1>Панель администратора</h1>
                <div className="admin-stats">
                    <span>Всего пользователей: {users.length}</span>
                    <button onClick={fetchUsers} className="refresh-btn">
                        Обновить
                    </button>
                </div>
            </header>

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Логин</th>
                            <th>Email</th>
                            <th>Текущая роль</th>
                            <th>Новая роль</th>
                            <th>Действия</th>
                            <th>Статус</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="user-row">
                                <td className="user-id">{user.id}</td>
                                <td className="user-login">{user.login || user.username}</td>
                                <td className="user-email">{user.email || 'Не указан'}</td>
                                <td className="current-role">
                                    <span className={`role-badge role-${user.role}`}>
                                        {user.role === 'student' && 'Студент'}
                                        {user.role === 'teacher' && 'Преподаватель'}
                                        {user.role === 'admin' && 'Админ'}
                                        {!['student', 'teacher', 'admin'].includes(user.role) && user.role}
                                    </span>
                                </td>
                                <td className="role-select">
                                    <select 
                                        value={selectedRoles[user.id] || user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        disabled={saving[user.id]}
                                    >
                                        {roleOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="actions">
                                    <button 
                                        onClick={() => updateUserRole(user.id, selectedRoles[user.id] || user.role)}
                                        disabled={saving[user.id] || (selectedRoles[user.id] === user.role)}
                                        className="save-btn"
                                    >
                                        {saving[user.id] ? 'Сохранение...' : 'Сохранить'}
                                    </button>
                                </td>
                                <td className="status">
                                    {saving[user.id] ? (
                                        <span className="saving">Сохранение...</span>
                                    ) : (
                                        <span className="saved">Готово</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {users.length === 0 && (
                    <div className="no-users">
                        Пользователи не найдены
                    </div>
                )}
            </div>
        </div>
    );
}