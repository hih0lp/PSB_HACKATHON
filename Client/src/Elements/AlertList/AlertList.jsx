import './alertList.css'
import * as signalR from '@microsoft/signalr'
import { useState, useEffect } from 'react';

export default function AlertList({isAlertOpened, setIsAlertOpened}){
    const [notifications, setNotifications] = useState([]); // для списка в модалке
    const [alertNotifications, setAlertNotifications] = useState([]); // для всплывающих уведомлений
    const [connection, setConnection] = useState(null);

    useEffect(() => {
        let currentConnection = null;

        const startConnection = async () => {
            currentConnection = new signalR.HubConnectionBuilder()
                .withUrl('https://psbsmartedu.ru/notifications', {
                    skipNegotiation: true,
                    transport: signalR.HttpTransportType.WebSockets
                })
                .withAutomaticReconnect([0, 2000, 10000, 30000])
                .configureLogging(signalR.LogLevel.Information)
                .build();

            currentConnection.on("ReceiveNotification", (message, createdAt) => {
                // console.log('📨 Получено уведомление:', { message, createdAt });
                
                // Извлекаем текст уведомления
                const notificationText = message?.notificationMessage || message?.message || 'Новое уведомление';
                const newNotification = {
                    id: Date.now() + Math.random(),
                    notificationMessage: notificationText,
                    createdAt: new Date(createdAt),
                    rawMessage: message
                };

                // Добавляем в общий список (массив)
                setNotifications(prev => [...prev, newNotification]);
                
                // Добавляем во всплывающие уведомления (максимум 2)
                setAlertNotifications(prev => {
                    const newAlerts = [...prev, newNotification];
                    return newAlerts.slice(-2);
                });
            });

            // ... остальной код подключения
            try {
                await currentConnection.start();
                const userId = getCookie('login');
                if (!userId || typeof userId !== 'string' || userId.trim() === '') {
                    throw new Error('Invalid user ID: ' + userId);
                }
                await currentConnection.invoke("ClientRegister", userId);
                setConnection(currentConnection);
            } catch (err) {
                setTimeout(startConnection, 5000);
            }
        };

        startConnection();

        return () => {
            if (currentConnection) {
                currentConnection.stop();
            }
        };
    }, []);

    function deleteNotification(id){
        fetch(`http://localhost:5079/notifications/ ${id}`,{
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        })
        setNotifications(prev => prev.filter(item => item.id !== id));
        setAlertNotifications(prev => prev.filter(item => item.id !== id));
    }

    function filterDataOnDate(data) {
        const newData = {};
        if (Array.isArray(data)) {
            data.forEach(item => {
                const dateKey = new Date(item.createdAt).toDateString();
                if (!newData[dateKey]) {
                    newData[dateKey] = [];
                }
                newData[dateKey].push(item);
            });
            Object.keys(newData).forEach(dateKey => {
                newData[dateKey].sort((a, b) => {
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
            });
        }
        return newData;
    }

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const login = document.cookie.split('login=')[1].split(';')[0];


                const response = await fetch(`https://psbsmartedu.ru/notifications/user/${login}`, {
                    credentials: 'include' 
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                
                // Преобразуем данные в массив, если это необходимо
                const notificationsArray = Array.isArray(data) ? data : 
                                         data.message ? [data.message] : 
                                         data.notifications ? data.notifications : 
                                         [];
                
                const filteredData = filterDataOnDate(notificationsArray);
                // console.log('Загруженные уведомления:', filteredData);
                
                // Сохраняем отфильтрованные данные отдельно для отображения
                setNotifications(notificationsArray); // сохраняем как массив
                
            } catch (error) {
                console.error('Ошибка при загрузке уведомлений:', error.message);
            }
        };

        if (isAlertOpened) {
            fetchNotifications();
        }
    }, [isAlertOpened]);

    // Функция для группировки уведомлений по дате
    const getGroupedNotifications = () => {
        return filterDataOnDate(notifications);
    };

    const groupedNotifications = getGroupedNotifications();

    return(
        <>
        {/* Всплывающие уведомления */}
        {alertNotifications.length > 0 && Array.isArray(alertNotifications) && (
            <section className='notificationAlertContainer'>
                {alertNotifications.map((alert) => (
                    <div className='notificationAlert' key={alert.id}
                    onClick={alert.redirectUri != null ? () => window.location.href = '/' + alert.redirectUri : undefined} // Исправлено: alert вместо notification
                    >
                        <button 
                            className='removeALert' 
                            onClick={(e) => {
                                e.stopPropagation(); // Предотвращаем срабатывание родительского onClick
                                setAlertNotifications(prev => 
                                    prev.filter(item => item.id !== alert.id)
                                );
                            }}
                        >X</button>
                <svg viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24.4326 18.6405L23.1887 16.5757C22.9275 16.1154 22.6912 15.2448 22.6912 14.7348V11.5878C22.6912 8.66476 20.9747 6.13974 18.4994 4.95808C17.8526 3.81373 16.6585 3.10474 15.2903 3.10474C13.9345 3.10474 12.7155 3.83861 12.0687 4.99539C9.64323 6.20193 7.96403 8.70208 7.96403 11.5878V14.7348C7.96403 15.2448 7.7277 16.1154 7.46649 16.5632L6.21019 18.6405C5.71265 19.4739 5.60071 20.3943 5.91167 21.2401C6.21019 22.0735 6.91919 22.7203 7.83964 23.0313C10.2527 23.8522 12.7902 24.2503 15.3276 24.2503C17.8651 24.2503 20.4025 23.8522 22.8156 23.0437C23.6863 22.7576 24.358 22.0984 24.6814 21.2401C25.0048 20.3819 24.9177 19.4365 24.4326 18.6405Z" fill="#224D47"/>
                    <path d="M18.8227 24.6555C18.3003 26.0984 16.9196 27.1308 15.3026 27.1308C14.32 27.1308 13.3498 26.7327 12.6656 26.0237C12.2676 25.6506 11.9691 25.153 11.7949 24.6431C11.9566 24.6679 12.1183 24.6804 12.2925 24.7053C12.5785 24.7426 12.8771 24.7799 13.1756 24.8048C13.8846 24.867 14.606 24.9043 15.3275 24.9043C16.0365 24.9043 16.7455 24.867 17.442 24.8048C17.7032 24.7799 17.9644 24.7675 18.2132 24.7301C18.4122 24.7053 18.6113 24.6804 18.8227 24.6555Z" fill="#224D47"/>
                </svg>
                        <div onClick={() => setIsAlertOpened(true)}>
                            <h1>Новое уведомление</h1>
                            <p>{alert?.notificationMessage==''?'Новое уведомление':alert?.notificationMessage}</p> 
                        </div>
                    </div>
                ))}
                {alertNotifications.length >= 2 && (
                    <button className="hideAllNotifications" onClick={() => setAlertNotifications([])}>
                        Скрыть уведомления
                    </button>
                )}
            </section>
        )}

        {/* Модальное окно с уведомлениями */}
        <section className='alertModal' style={isAlertOpened ? {'opacity':'1', 'zIndex': '10'} : {'opacity':'0', 'zIndex': '-10'}}>
            <button className='offModal' onClick={() => setIsAlertOpened(false)}>X</button>
            <section className="AlertList">
                <h1>Уведомления</h1>
                <div className='alertHolder'>
                {Object.keys(groupedNotifications).length === 0 ? (
                    <p>Нет уведомлений</p>
                ) : (
                    Object.entries(groupedNotifications).map(([date, notificationsForDate]) => (
                        <div key={date}>
                            <p>{date}</p>
                            <ul>
                                {Array.isArray(notificationsForDate) && notificationsForDate.map((notification) => (
                                    <li
                                     // Исправлено: добавлен undefined вместо пустой строки
                                    key={notification.id || notification.notificationId}>
                                        <div onClick={notification.redirectUri != null ? () => window.location.href = '/' + notification.redirectUri : undefined}>
                                            <h2>{notification.notificationMessage || notification.message||'Новое уведомление!'}</h2>
                                            <p>{new Date(notification.createdAt).toLocaleString()}</p>
                                        </div>
                                        <button onClick={()=>deleteNotification(notification.id,)}>
                                        <svg width="22" height="23" viewBox="0 0 22 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3.63477 5.74915H18.1771M14.5415 5.74915L14.2956 5.01119C14.0572 4.29605 13.9379 3.93848 13.7169 3.67412C13.5216 3.44067 13.271 3.25997 12.9877 3.1486C12.667 3.02246 12.2902 3.02246 11.5363 3.02246H10.2755C9.52168 3.02246 9.14485 3.02246 8.82411 3.1486C8.54091 3.25997 8.2902 3.44067 8.09498 3.67412C7.8739 3.93848 7.75471 4.29605 7.51633 5.01119L7.27034 5.74915M16.3593 5.74915V15.0199C16.3593 16.547 16.3593 17.3105 16.0621 17.8938C15.8007 18.4069 15.3836 18.824 14.8705 19.0854C14.2872 19.3826 13.5237 19.3826 11.9966 19.3826H9.81525C8.28816 19.3826 7.52462 19.3826 6.94135 19.0854C6.42829 18.824 6.01116 18.4069 5.74975 17.8938C5.45256 17.3105 5.45256 16.547 5.45256 15.0199V5.74915M12.7237 9.38472V15.747M9.08813 9.38472V15.747" stroke="#224D47" stroke-width="1.34898" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                )}
                </div>
            </section>
        </section>
        </>
    )
}